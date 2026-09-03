import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { CITY_BY_SLUG } from '@/lib/taxonomy/cities'
import { NICHE_BY_SLUG } from '@/lib/taxonomy/niches'
import { ROLE_BY_SLUG } from '@/lib/taxonomy/roles'
import type { ApplicationClaim, JudgeResult, LinkedInProfile } from './types'
import { currentPosition, monthsBetween } from './rules'

/**
 * The judgement half of verification.
 *
 * The arithmetic rules have already run and can reject on their own. This step
 * answers the question arithmetic cannot: reading the profile as a person
 * would, is this plausibly someone who does that job? It can lower confidence
 * and add concerns; it can never overturn a hard rule failure.
 */

const MODEL = process.env.CIRCLEIN_JUDGE_MODEL ?? 'claude-opus-5'

const VerdictSchema = z.object({
  holdsClaimedRole: z
    .boolean()
    .describe('True if the profile evidence supports that this person currently holds the role they applied with.'),
  nicheFits: z
    .boolean()
    .describe('True if the niche they chose is a fair description of the work this profile describes.'),
  confidence: z
    .number()
    .describe('How confident you are in the two judgements above, from 0 to 1.'),
  summary: z
    .string()
    .describe('One sentence a human reviewer can read to understand your call.'),
  concerns: z
    .array(z.string())
    .describe('Specific things that gave you pause. Empty if none.'),
})

const SYSTEM_PROMPT = `You screen applications to CircleIn, a private professional network where every member is verified before being let in. Members are grouped by city and by what they actually work on, so a wrong admission pollutes a room that other people rely on.

You are given a person's own claim and the profile data we retrieved for them. Judge only what the evidence supports.

How to weigh things:
- The job title on the profile is the primary evidence. A title that plainly describes the claimed role is strong support.
- Titles vary by company and country. "SDE II", "Member of Technical Staff" and "Software Engineer" are the same job. Do not fail someone for house style.
- A niche is a fair fit if the work described plausibly falls under it, not only if it is the single best label. Someone who builds recommendation systems fits both Machine Learning and Software Engineering.
- Be sceptical of a headline that claims seniority or a function the position history does not support, of aspirational headlines ("aspiring", "learning", "looking for opportunities"), and of a profile whose only evidence is the claim itself.
- Absence of evidence is not evidence of fraud. If the profile is simply thin, say you are not confident rather than asserting the person is lying.

Report your confidence honestly. Low confidence sends the application to a human, which is the correct outcome when the evidence is genuinely unclear — it is much worse to reject a real practitioner than to make one wait a day.`

function describeProfile(profile: LinkedInProfile): string {
  const position = currentPosition(profile)
  const lines = [
    `Profile URL: ${profile.profileUrl}`,
    `Name on profile: ${profile.fullName ?? 'not published'}`,
    `Headline: ${profile.headline ?? 'not published'}`,
    `Location on profile: ${profile.location ?? 'not published'}`,
    `Account created: ${profile.accountCreatedAt ?? 'unknown'}`,
    `Data source: ${profile.provider}${profile.selfReported ? ' (self-reported by the applicant)' : ''}`,
    '',
    'Positions, most recent first:',
  ]
  if (profile.positions.length === 0) {
    lines.push('  (none listed)')
  }
  for (const p of profile.positions) {
    const months = monthsBetween(p.startedAt, p.endedAt ?? new Date())
    const until = p.isCurrent ? 'present' : (p.endedAt ?? 'unknown')
    const marker = position && p === position ? ' <- current role being applied on' : ''
    lines.push(`  - ${p.title || 'untitled'} at ${p.company || 'unknown'} (${p.startedAt} to ${until}, ${months} months)${marker}`)
  }
  return lines.join('\n')
}

function describeClaim(claim: ApplicationClaim): string {
  const city = CITY_BY_SLUG.get(claim.citySlug)
  const niche = NICHE_BY_SLUG.get(claim.nicheSlug)
  const role = claim.roleSlug ? ROLE_BY_SLUG.get(claim.roleSlug) : null
  return [
    `Name: ${claim.fullName}`,
    `Job title as written by the applicant: ${claim.rawTitle}`,
    `Company: ${claim.company ?? 'not given'}`,
    `Role they selected: ${role?.name ?? 'not selected'}`,
    `Niche they selected: ${niche?.name ?? claim.nicheSlug}`,
    `City they selected: ${city?.name ?? claim.citySlug}`,
  ].join('\n')
}

export function isJudgeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/**
 * Returns null when no API key is configured — the caller then falls back to
 * the deterministic rules alone and routes anything uncertain to a human,
 * rather than pretending a judgement was made.
 */
export async function judgeApplication(
  claim: ApplicationClaim,
  profile: LinkedInProfile,
): Promise<JudgeResult | null> {
  if (!isJudgeConfigured()) return null

  const client = new Anthropic()

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      // A screening call, not a research task: low effort keeps it quick and
      // cheap, and the work genuinely is a short judgement on short evidence.
      output_config: { effort: 'low', format: zodOutputFormat(VerdictSchema) },
      messages: [
        {
          role: 'user',
          content: `The applicant claims:\n\n${describeClaim(claim)}\n\nThe profile we retrieved:\n\n${describeProfile(profile)}\n\nJudge whether the evidence supports the claim.`,
        },
      ],
    })

    const parsed = response.parsed_output
    if (!parsed) return null

    return {
      holdsClaimedRole: parsed.holdsClaimedRole,
      nicheFits: parsed.nicheFits,
      // Clamp: a model returning 1.4 should not outvote the policy.
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      summary: parsed.summary,
      concerns: parsed.concerns,
      model: response.model ?? MODEL,
    }
  } catch (err) {
    // A judge failure must never approve or reject anyone by accident. Return
    // null and let the caller route the application to a human.
    console.error('[circlein] judge failed:', err instanceof Error ? err.message : err)
    return null
  }
}
