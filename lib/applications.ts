import 'server-only'
import { randomBytes, createHash } from 'node:crypto'
import { POLICY } from '@/lib/config'
import { serviceClient } from '@/lib/supabase/server'
import type { ApplicationRow, ApplicationStatus, VerificationReason } from '@/lib/supabase/types'
import { CITY_BY_SLUG } from '@/lib/taxonomy/cities'
import { NICHE_BY_SLUG } from '@/lib/taxonomy/niches'
import { nicheForRole } from '@/lib/taxonomy/normalize'
import { ROLE_BY_SLUG } from '@/lib/taxonomy/roles'
import { verifyApplication } from '@/lib/verification/run'
import type { ApplicationClaim, VerifiedIdentity } from '@/lib/verification/types'
import type { LinkedInIdentity } from '@/lib/supabase/auth'

/**
 * The application lifecycle, from submitted request to a place in a WhatsApp
 * group. Everything here runs server-side with the service role.
 */

export interface SubmitInput {
  fullName: string
  whatsapp: string
  linkedinUrl: string
  portfolioUrl?: string | null
  citySlug: string
  company: string
  /** The niche is derived from this rather than asked for separately. */
  roleSlug: string
  ip?: string | null
  userAgent?: string | null
  /** The signed-in LinkedIn identity, if they happened to be signed in. */
  identity?: LinkedInIdentity | null
}

export interface SubmitResult {
  ok: boolean
  statusToken?: string
  status?: ApplicationStatus
  error?: string
  /** True when this LinkedIn account already had a live application. */
  alreadyApplied?: boolean
}

export function newStatusToken(): string {
  return randomBytes(24).toString('base64url')
}

/** IPs are hashed, never stored raw — they exist only for rate limiting. */
function hashIp(ip: string): string {
  return createHash('sha256').update(`circlein:${ip}`).digest('hex').slice(0, 32)
}

export interface StatusView {
  status: ApplicationStatus
  fullName: string
  citySlug: string
  nicheSlug: string
  roleSlug: string | null
  senioritySlug: string | null
  submittedAt: string
  decidedAt: string | null
  decisionNote: string | null
  reasons: VerificationReason[]
  whatsapp: {
    state: string
    groupName: string | null
  } | null
}

/**
 * Record a new application and kick off verification.
 *
 * Verification is awaited rather than backgrounded: it takes a couple of
 * seconds, and a person who has just filled in a form would rather watch it
 * happen than refresh a page. If it throws, the application stays `pending` and
 * a human picks it up — a failure here never silently loses someone.
 */
export async function submitApplication(input: SubmitInput): Promise<SubmitResult> {
  const db = serviceClient()
  if (!db) {
    return { ok: false, error: 'Applications are not open yet — the database is not configured.' }
  }

  if (!CITY_BY_SLUG.has(input.citySlug)) return { ok: false, error: 'Unknown city.' }

  const role = ROLE_BY_SLUG.get(input.roleSlug)
  if (!role) return { ok: false, error: 'Unknown role.' }

  // The circle a person joins is city x niche, and the niche comes from their
  // role. Every role resolves to one — asserted in the taxonomy check.
  const niche = nicheForRole(role.slug)
  if (!niche || !NICHE_BY_SLUG.has(niche.slug)) {
    return { ok: false, error: 'That role has no circle yet.' }
  }
  const nicheSlug = niche.slug

  const ipHash = input.ip ? hashIp(input.ip) : null

  // One LinkedIn profile, one live application. Checked up front so a repeat
  // applicant gets their existing status back rather than a constraint error.
  const { data: existing } = await db
    .from('applications')
    .select('status_token, status')
    .eq('linkedin_url', input.linkedinUrl)
    .in('status', ['pending', 'verifying', 'needs_review', 'approved'])
    .maybeSingle<{ status_token: string; status: ApplicationStatus }>()
  if (existing) {
    return {
      ok: true,
      statusToken: existing.status_token,
      status: existing.status,
      alreadyApplied: true,
    }
  }

  if (ipHash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await db
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('submitted_at', since)
    if ((count ?? 0) >= POLICY.rateLimitPerHour) {
      return { ok: false, error: 'That is a lot of applications from one place. Try again in an hour.' }
    }
  }

  const statusToken = newStatusToken()

  const { data: inserted, error: insertError } = await db
    .from('applications')
    .insert({
      status: 'verifying' satisfies ApplicationStatus,
      // LinkedIn's spelling of someone's name outranks the form's.
      full_name: input.identity?.fullName ?? input.fullName,
      email: input.identity?.email?.toLowerCase() ?? null,
      linkedin_url: input.linkedinUrl,
      portfolio_url: input.portfolioUrl ?? null,
      auth_user_id: input.identity?.authUserId ?? null,
      linkedin_sub: input.identity?.sub ?? null,
      linkedin_name: input.identity?.fullName ?? null,
      linkedin_email: input.identity?.email ?? null,
      linkedin_email_verified: input.identity?.emailVerified ?? false,
      linkedin_picture: input.identity?.picture ?? null,
      whatsapp_e164: input.whatsapp,
      city: input.citySlug,
      niche: nicheSlug,
      role: role.slug,
      seniority: null,
      company: input.company,
      raw_title: role.name,
      note: null,
      status_token: statusToken,
      ip_hash: ipHash,
      user_agent: input.userAgent ?? null,
    })
    .select()
    .single<ApplicationRow>()

  if (insertError || !inserted) {
    // The partial unique indexes make a duplicate a normal outcome, not a bug.
    if (insertError?.code === '23505') {
      return { ok: false, error: 'There is already a live application for that email or LinkedIn profile.' }
    }
    return { ok: false, error: insertError?.message ?? 'Could not record the application.' }
  }

  const verifiedIdentity: VerifiedIdentity | null = input.identity
    ? {
        sub: input.identity.sub,
        fullName: input.identity.fullName,
        email: input.identity.email,
        emailVerified: input.identity.emailVerified,
        picture: input.identity.picture,
      }
    : null

  const claim: ApplicationClaim = {
    fullName: input.identity?.fullName ?? input.fullName,
    linkedinUrl: input.linkedinUrl,
    identity: verifiedIdentity,
    rawTitle: role.name,
    company: input.company,
    citySlug: input.citySlug,
    nicheSlug,
    roleSlug: role.slug,
    senioritySlug: null,
    declaredStartedAt: null,
  }

  try {
    const status = await runVerification(inserted.id, claim)
    return { ok: true, statusToken, status }
  } catch (err) {
    console.error('[circlein] verification threw:', err instanceof Error ? err.message : err)
    await db.from('applications').update({ status: 'needs_review' }).eq('id', inserted.id)
    return { ok: true, statusToken, status: 'needs_review' }
  }
}

/** Run the check, write the audit row, and apply the decision. */
export async function runVerification(
  applicationId: string,
  claim: ApplicationClaim,
): Promise<ApplicationStatus> {
  const db = serviceClient()
  if (!db) throw new Error('Supabase service role is not configured.')

  const outcome = await verifyApplication(claim)

  await db.from('verification_checks').insert({
    application_id: applicationId,
    provider: outcome.provider,
    account_age_months: outcome.accountAgeMonths,
    tenure_months: outcome.tenureMonths,
    headline: outcome.headline,
    profile_location: outcome.profileLocation,
    matched_role: outcome.matchedRole,
    matched_seniority: outcome.matchedSeniority,
    matched_city: outcome.matchedCity,
    match_confidence: outcome.matchConfidence,
    verdict: outcome.verdict,
    reasons: outcome.reasons,
    raw_profile: outcome.rawProfile,
    model: outcome.model,
  })

  const status: ApplicationStatus =
    outcome.decision === 'approved'
      ? 'approved'
      : outcome.decision === 'rejected'
        ? 'rejected'
        : 'needs_review'

  await db
    .from('applications')
    .update({
      status,
      decided_at: new Date().toISOString(),
      decision_note: outcome.decisionNote,
      role: outcome.matchedRole ?? claim.roleSlug ?? null,
      seniority: outcome.matchedSeniority ?? claim.senioritySlug ?? null,
    })
    .eq('id', applicationId)

  if (status === 'approved') {
    await admitMember(applicationId, outcome.headline)
  }

  return status
}

/**
 * Turn an approved application into a member: create the person, make sure
 * their circle exists, put them in it, and queue them for its WhatsApp group.
 */
export async function admitMember(applicationId: string, headline: string | null): Promise<void> {
  const db = serviceClient()
  if (!db) throw new Error('Supabase service role is not configured.')

  const { data: app } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single<ApplicationRow>()
  if (!app) throw new Error('Application not found.')

  const { data: member, error: memberError } = await db
    .from('members')
    .upsert(
      {
        application_id: app.id,
        full_name: app.full_name,
        email: app.email,
        linkedin_url: app.linkedin_url,
        whatsapp_e164: app.whatsapp_e164,
        city: app.city,
        niche: app.niche,
        role: app.role,
        seniority: app.seniority,
        company: app.company,
        headline,
        auth_user_id: app.auth_user_id,
        linkedin_sub: app.linkedin_sub,
        linkedin_picture: app.linkedin_picture,
        portfolio_url: app.portfolio_url,
      },
      { onConflict: 'application_id' },
    )
    .select('id')
    .single<{ id: string }>()

  if (memberError || !member) throw new Error(memberError?.message ?? 'Could not create the member.')

  // The circle is created lazily, so the directory only lists rooms that exist.
  const { data: circle, error: circleError } = await db
    .from('circles')
    .upsert({ city: app.city, niche: app.niche }, { onConflict: 'city,niche' })
    .select('id')
    .single<{ id: string }>()
  if (circleError || !circle) throw new Error(circleError?.message ?? 'Could not create the circle.')

  await db.from('circle_members').upsert(
    { circle_id: circle.id, member_id: member.id },
    { onConflict: 'circle_id,member_id' },
  )

  const group = await openGroupForCircle(circle.id, app.city, app.niche)

  await db.from('whatsapp_queue').upsert(
    { member_id: member.id, group_id: group?.id ?? null, state: 'queued' },
    { onConflict: 'member_id' },
  )
}

/**
 * The circle's open WhatsApp group, opening a fresh one if the last is full.
 * Capacity matters: a room of 200 is a network, a room of 2,000 is a feed.
 */
async function openGroupForCircle(
  circleId: string,
  citySlug: string,
  nicheSlug: string,
): Promise<{ id: string } | null> {
  const db = serviceClient()
  if (!db) return null

  const { data: existing } = await db
    .from('whatsapp_groups')
    .select('id, member_count, capacity')
    .eq('circle_id', circleId)
    .eq('is_open', true)
    .order('created_at', { ascending: true })
    .limit(1)

  const current = existing?.[0] as { id: string; member_count: number; capacity: number } | undefined
  if (current && current.member_count < current.capacity) return { id: current.id }

  if (current) await db.from('whatsapp_groups').update({ is_open: false }).eq('id', current.id)

  const city = CITY_BY_SLUG.get(citySlug)
  const niche = NICHE_BY_SLUG.get(nicheSlug)
  const index = current ? 2 : 1
  const name = `${niche?.name ?? nicheSlug} · ${city?.name ?? citySlug}${index > 1 ? ` ${index}` : ''}`

  const { data: created } = await db
    .from('whatsapp_groups')
    .insert({ circle_id: circleId, name, capacity: POLICY.whatsappGroupCapacity })
    .select('id')
    .single<{ id: string }>()

  return created ?? null
}

/** What an applicant may see about their own application, given their token. */
export async function statusByToken(token: string): Promise<StatusView | null> {
  const db = serviceClient()
  if (!db) return null

  const { data: app } = await db
    .from('applications')
    .select('*')
    .eq('status_token', token)
    .single<ApplicationRow>()
  if (!app) return null
  return statusForApplication(app)
}

/**
 * The same view, found by session rather than by token.
 *
 * Row level security would already confine a signed-in member to their own
 * row; the explicit `auth_user_id` filter here means the query is correct on
 * its own terms too, rather than relying on the policy to save it.
 */
export async function statusForUser(authUserId: string): Promise<StatusView | null> {
  const db = serviceClient()
  if (!db) return null

  const { data: rows } = await db
    .from('applications')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('submitted_at', { ascending: false })
    .limit(1)

  const app = (rows ?? [])[0] as ApplicationRow | undefined
  if (!app) return null
  return statusForApplication(app)
}

async function statusForApplication(app: ApplicationRow): Promise<StatusView | null> {
  const db = serviceClient()
  if (!db) return null

  const { data: checks } = await db
    .from('verification_checks')
    .select('reasons')
    .eq('application_id', app.id)
    .order('created_at', { ascending: false })
    .limit(1)

  let whatsapp: StatusView['whatsapp'] = null
  if (app.status === 'approved') {
    const { data: member } = await db
      .from('members')
      .select('id')
      .eq('application_id', app.id)
      .single<{ id: string }>()
    if (member) {
      const { data: queued } = await db
        .from('whatsapp_queue')
        .select('state, whatsapp_groups(name)')
        .eq('member_id', member.id)
        .single<{ state: string; whatsapp_groups: { name: string } | null }>()
      if (queued) whatsapp = { state: queued.state, groupName: queued.whatsapp_groups?.name ?? null }
    }
  }

  const reasons = (checks?.[0] as { reasons?: VerificationReason[] } | undefined)?.reasons ?? []

  return {
    status: app.status,
    fullName: app.full_name,
    citySlug: app.city,
    nicheSlug: app.niche,
    roleSlug: app.role,
    senioritySlug: app.seniority,
    submittedAt: app.submitted_at,
    decidedAt: app.decided_at,
    decisionNote: app.decision_note,
    reasons,
    whatsapp,
  }
}
