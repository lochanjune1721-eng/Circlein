import 'server-only'
import { POLICY } from '@/lib/config'
import type { VerificationReason } from '@/lib/supabase/types'
import { judgeApplication } from './judge'
import { activeProvider } from './provider'
import { applyRules, currentPosition } from './rules'
import type { ApplicationClaim, VerificationOutcome } from './types'

/**
 * Run one application through verification end to end.
 *
 * The order is deliberate and the asymmetry is the point:
 *
 *   1. Fetch the profile. No profile, no decision — that goes to a human.
 *   2. Run the arithmetic rules. A hard failure (too new in the role, account
 *      too young) rejects outright; nothing downstream can overturn it.
 *   3. Ask the model to read the evidence. It can only withhold approval, never
 *      grant one the rules did not already support.
 *   4. Anything left unresolved goes to a human rather than being guessed.
 *
 * Rejecting a real practitioner costs more than making one wait, so every
 * uncertain path lands on `needs_review`.
 */
export async function verifyApplication(claim: ApplicationClaim): Promise<VerificationOutcome> {
  const provider = activeProvider(claim)
  const fetched = await provider.fetch(claim)

  if (!fetched.ok || !fetched.profile) {
    return {
      verdict: 'inconclusive',
      decision: 'needs_review',
      reasons: [
        {
          rule: 'profile_fetch',
          label: 'Profile retrieved',
          passed: false,
          detail: fetched.error ?? 'Could not retrieve the profile.',
        },
      ],
      accountAgeMonths: null,
      tenureMonths: null,
      matchedRole: null,
      matchedSeniority: null,
      matchedCity: null,
      matchConfidence: 0,
      headline: null,
      profileLocation: null,
      provider: provider.name,
      model: null,
      rawProfile: null,
      decisionNote: 'We could not read the profile automatically, so a person will look at this.',
    }
  }

  const profile = fetched.profile
  const rules = applyRules(claim, profile)
  const reasons: VerificationReason[] = [
    { rule: 'profile_fetch', label: 'Profile retrieved', passed: true, detail: `Read via the ${provider.name} source.` },
    ...rules.reasons,
  ]

  const position = currentPosition(profile)
  const base = {
    accountAgeMonths: rules.accountAgeMonths,
    tenureMonths: rules.tenureMonths,
    matchedRole: rules.matchedRole,
    matchedSeniority: rules.matchedSeniority,
    matchedCity: rules.matchedCity,
    matchConfidence: rules.matchConfidence,
    headline: profile.headline ?? position?.title ?? null,
    profileLocation: profile.location,
    provider: provider.name,
    rawProfile: profile,
  }

  // ── Hard rules decide on their own ─────────────────────────────────────
  if (rules.hardFailure) {
    const failed = reasons.filter((r) => !r.passed && (r.rule === 'tenure' || r.rule === 'account_age'))
    const tenureFailed = failed.some((r) => r.rule === 'tenure')
    const note = tenureFailed
      ? `CircleIn asks for at least ${POLICY.minTenureMonths} months in the role you are applying with. Once you pass that, apply again and you are welcome.`
      : `CircleIn asks for a LinkedIn account at least ${POLICY.minAccountAgeMonths} months old.`
    return { ...base, verdict: 'fail', decision: 'rejected', reasons, model: null, decisionNote: note }
  }

  // ── The model reads the evidence ───────────────────────────────────────
  const judgement = await judgeApplication(claim, profile)

  if (!judgement) {
    reasons.push({
      rule: 'ai_review',
      label: 'Reviewed against the profile',
      passed: false,
      detail: 'Automated review was unavailable, so this needs a person.',
    })
    return {
      ...base,
      verdict: 'inconclusive',
      decision: 'needs_review',
      reasons,
      model: null,
      decisionNote: 'Everything checked out on the numbers; a person is doing the final read.',
    }
  }

  const judgePassed = judgement.holdsClaimedRole && judgement.nicheFits
  reasons.push({
    rule: 'ai_review',
    label: 'Reviewed against the profile',
    passed: judgePassed,
    detail: judgement.summary,
  })
  for (const concern of judgement.concerns) {
    reasons.push({ rule: 'ai_concern', label: 'Flagged for attention', passed: false, detail: concern })
  }

  const withModel = { ...base, model: judgement.model, reasons }

  // A confident "this is not the job they claim" is still not an auto-reject:
  // the cost of turning away a real practitioner is higher than a day's wait.
  if (!judgement.holdsClaimedRole) {
    return {
      ...withModel,
      verdict: 'inconclusive',
      decision: 'needs_review',
      decisionNote: 'The profile did not clearly show the role applied for, so a person is taking a look.',
    }
  }

  const confidentEnough =
    judgement.confidence >= POLICY.minMatchConfidence && rules.unknowns.length === 0 && judgePassed

  if (!confidentEnough) {
    return {
      ...withModel,
      verdict: 'inconclusive',
      decision: 'needs_review',
      decisionNote: 'Nearly there — one detail needs a human eye before you are in.',
    }
  }

  return {
    ...withModel,
    verdict: 'pass',
    decision: 'approved',
    decisionNote: 'Verified. You are in.',
  }
}
