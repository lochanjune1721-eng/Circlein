import { POLICY } from '@/lib/config'
import { CITY_BY_SLUG, citiesInSameMarket } from '@/lib/taxonomy/cities'
import { NICHE_BY_SLUG } from '@/lib/taxonomy/niches'
import { canonicalise, normalizeTitle, resolveLocation, suggestNiches } from '@/lib/taxonomy/normalize'
import type { VerificationReason } from '@/lib/supabase/types'
import type { ApplicationClaim, LinkedInProfile, RuleOutcome } from './types'

/**
 * Whole months between two dates. Deliberately floor-based: someone two weeks
 * into their fourth month has done three months, not four.
 */
export function monthsBetween(from: string | Date, to: string | Date = new Date()): number {
  const a = typeof from === 'string' ? new Date(from) : from
  const b = typeof to === 'string' ? new Date(to) : to
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
  if (b.getUTCDate() < a.getUTCDate()) months -= 1
  return Math.max(0, months)
}

/** The position the applicant is applying on the strength of. */
export function currentPosition(profile: LinkedInProfile) {
  const current = profile.positions.filter((p) => p.isCurrent)
  if (current.length === 0) return null
  // Someone with two concurrent roles is judged on the longest-held one.
  return current.reduce((longest, p) => (p.startedAt < longest.startedAt ? p : longest))
}

function reason(rule: string, label: string, passed: boolean, detail: string): VerificationReason {
  return { rule, label, passed, detail }
}

/**
 * The deterministic half of verification.
 *
 * These are the rules the network's promise rests on, so they are plain code
 * with plain arithmetic — no model involved, no room for a persuasive profile
 * to talk its way past a date. The AI judge runs afterwards and can only ever
 * make the decision *more* cautious, never less.
 */
export function applyRules(claim: ApplicationClaim, profile: LinkedInProfile): RuleOutcome {
  const reasons: VerificationReason[] = []
  const unknowns: string[] = []
  let hardFailure = false

  // ── Account age ────────────────────────────────────────────────────────
  let accountAgeMonths: number | null = null
  if (profile.accountCreatedAt) {
    accountAgeMonths = monthsBetween(profile.accountCreatedAt)
    const passed = accountAgeMonths >= POLICY.minAccountAgeMonths
    if (!passed) hardFailure = true
    reasons.push(
      reason(
        'account_age',
        'LinkedIn account age',
        passed,
        `Account is about ${accountAgeMonths} month${accountAgeMonths === 1 ? '' : 's'} old; ${POLICY.minAccountAgeMonths} required.`,
      ),
    )
  } else {
    unknowns.push('account_age')
    reasons.push(
      reason('account_age', 'LinkedIn account age', false, 'Could not establish when the account was created.'),
    )
  }

  // ── Tenure in the current role: the three-month rule ───────────────────
  const position = currentPosition(profile)
  let tenureMonths: number | null = null
  if (position) {
    tenureMonths = monthsBetween(position.startedAt)
    const passed = tenureMonths >= POLICY.minTenureMonths
    if (!passed) hardFailure = true
    reasons.push(
      reason(
        'tenure',
        'Time in current role',
        passed,
        `${tenureMonths} month${tenureMonths === 1 ? '' : 's'} at ${position.company || 'the listed employer'}; ${POLICY.minTenureMonths} required.`,
      ),
    )
  } else {
    hardFailure = true
    reasons.push(reason('tenure', 'Time in current role', false, 'No current position found on the profile.'))
  }

  // ── Does the profile title match what they claim to do? ────────────────
  const profileTitle = position?.title || profile.headline || ''
  const titleMatch = normalizeTitle(profileTitle)
  const claimMatch = normalizeTitle(claim.rawTitle)
  const matchedRole = titleMatch.role?.slug ?? claimMatch.role?.slug ?? claim.roleSlug ?? null
  const matchedSeniority = titleMatch.seniority?.slug ?? claimMatch.seniority?.slug ?? claim.senioritySlug ?? null
  const matchConfidence = titleMatch.confidence

  const claimedRole = claim.roleSlug ?? claimMatch.role?.slug ?? null
  const rolesAgree = Boolean(claimedRole && titleMatch.role?.slug === claimedRole)
  reasons.push(
    reason(
      'role_match',
      'Role matches the profile',
      rolesAgree,
      rolesAgree
        ? `Profile title "${profileTitle}" resolves to the role applied for.`
        : `Profile title "${profileTitle || 'unknown'}" did not clearly resolve to the role applied for.`,
    ),
  )
  if (!rolesAgree) unknowns.push('role_match')

  // ── Does the niche fit the role? ───────────────────────────────────────
  const niche = NICHE_BY_SLUG.get(claim.nicheSlug)
  const plausible = matchedRole ? suggestNiches(matchedRole).map((n) => n.slug) : []
  const nicheFits = Boolean(niche && (plausible.length === 0 || plausible.includes(claim.nicheSlug)))
  reasons.push(
    reason(
      'niche_fit',
      'Niche fits the role',
      nicheFits,
      niche
        ? nicheFits
          ? `${niche.name} is a normal home for this role.`
          : `${niche.name} is an unusual pairing with this role — worth a human glance.`
        : 'Unknown niche.',
    ),
  )
  if (!nicheFits) unknowns.push('niche_fit')

  // ── Does the location match the city applied for? ──────────────────────
  const claimedCity = CITY_BY_SLUG.get(claim.citySlug)
  let matchedCity: string | null = null
  if (profile.location) {
    const resolved = resolveLocation(profile.location)
    matchedCity = resolved.city?.slug ?? null
    // The same metro counts: someone living in Noida applying to Delhi NCR is
    // in the right room.
    const market = citiesInSameMarket(claim.citySlug).map((c) => c.slug)
    const cityAgrees = Boolean(matchedCity && market.includes(matchedCity))
    reasons.push(
      reason(
        'city_match',
        'City matches the profile',
        cityAgrees,
        cityAgrees
          ? `Profile location "${profile.location}" is in the ${claimedCity?.name ?? claim.citySlug} market.`
          : `Profile location "${profile.location}" does not obviously match ${claimedCity?.name ?? claim.citySlug}.`,
      ),
    )
    if (!cityAgrees) unknowns.push('city_match')
  } else {
    unknowns.push('city_match')
    reasons.push(reason('city_match', 'City matches the profile', false, 'Profile does not publish a location.'))
  }

  // ── Is this the same person? ───────────────────────────────────────────
  if (profile.fullName) {
    const a = canonicalise(profile.fullName)
    const b = canonicalise(claim.fullName)
    // Compare on name parts, so "Priya S. Nair" and "Priya Nair" agree.
    const partsA = new Set(a.split(' ').filter((w) => w.length > 1))
    const partsB = b.split(' ').filter((w) => w.length > 1)
    const overlap = partsB.filter((w) => partsA.has(w)).length
    const nameAgrees = overlap >= Math.min(2, partsB.length)
    reasons.push(
      reason(
        'name_match',
        'Name matches the profile',
        nameAgrees,
        nameAgrees ? `Profile name matches "${claim.fullName}".` : `Profile is under a different name.`,
      ),
    )
    if (!nameAgrees) unknowns.push('name_match')
  } else {
    unknowns.push('name_match')
    reasons.push(reason('name_match', 'Name matches the profile', false, 'Profile did not return a name.'))
  }

  // ── Where the data came from ───────────────────────────────────────────
  if (profile.selfReported) {
    unknowns.push('independent_source')
    reasons.push(
      reason(
        'independent_source',
        'Independently sourced',
        false,
        'Details were supplied by the applicant, not an independent source, so a person should confirm them.',
      ),
    )
  }

  return {
    reasons,
    accountAgeMonths,
    tenureMonths,
    matchedRole,
    matchedSeniority,
    matchedCity,
    matchConfidence,
    hardFailure,
    unknowns,
  }
}
