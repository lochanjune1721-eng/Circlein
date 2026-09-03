import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { ADMIN_TOKEN } from '@/lib/config'
import { serviceClient } from '@/lib/supabase/server'
import type { ApplicationRow, VerificationCheckRow } from '@/lib/supabase/types'

/**
 * The review desk: applications the automated check would not decide alone.
 *
 * Access is a single shared secret in an env var. That is honest for the stage
 * this is at — one operator, one deployment — and the comparison below is
 * constant-time so the secret cannot be guessed a character at a time. Swap it
 * for Supabase Auth with an admin role before more than one person needs in.
 */
export function isAdmin(request: Request): boolean {
  if (!ADMIN_TOKEN) return false
  const header = request.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : header
  const a = Buffer.from(provided)
  const b = Buffer.from(ADMIN_TOKEN)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export interface ReviewItem {
  application: ApplicationRow
  latestCheck: VerificationCheckRow | null
}

export async function pendingReviews(limit = 50): Promise<ReviewItem[]> {
  const db = serviceClient()
  if (!db) return []

  const { data: apps } = await db
    .from('applications')
    .select('*')
    .in('status', ['needs_review', 'pending'])
    .order('submitted_at', { ascending: true })
    .limit(limit)

  const rows = (apps ?? []) as ApplicationRow[]
  if (rows.length === 0) return []

  const { data: checks } = await db
    .from('verification_checks')
    .select('*')
    .in('application_id', rows.map((a) => a.id))
    .order('created_at', { ascending: false })

  const latest = new Map<string, VerificationCheckRow>()
  for (const check of (checks ?? []) as VerificationCheckRow[]) {
    if (!latest.has(check.application_id)) latest.set(check.application_id, check)
  }

  return rows.map((application) => ({
    application,
    latestCheck: latest.get(application.id) ?? null,
  }))
}

/** A human overrides the automated outcome, either way. */
export async function decide(
  applicationId: string,
  decision: 'approved' | 'rejected',
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = serviceClient()
  if (!db) return { ok: false, error: 'Database is not configured.' }

  const { error } = await db
    .from('applications')
    .update({ status: decision, decided_at: new Date().toISOString(), decision_note: note })
    .eq('id', applicationId)
  if (error) return { ok: false, error: error.message }

  if (decision === 'approved') {
    const { admitMember } = await import('@/lib/applications')
    const { data: check } = await db
      .from('verification_checks')
      .select('headline')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })
      .limit(1)
    const headline = (check?.[0] as { headline: string | null } | undefined)?.headline ?? null
    await admitMember(applicationId, headline)
  }

  return { ok: true }
}
