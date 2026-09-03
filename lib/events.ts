import 'server-only'
import { publicClient, serviceClient } from '@/lib/supabase/server'
import type { EventDirectoryRow, RsvpState } from '@/lib/supabase/types'

/**
 * Events organised by CircleIn.
 *
 * Reads go through the anon key and the `event_directory` view, which only ever
 * exposes published events. With no database configured these return empty and
 * the pages show an empty state — the site stays browsable.
 */

export interface EventFilter {
  citySlug?: string
  nicheSlug?: string
  /** Include events whose start time has passed. */
  includePast?: boolean
  limit?: number
}

export async function listEvents(filter: EventFilter = {}): Promise<EventDirectoryRow[]> {
  const db = publicClient()
  if (!db) return []

  let query = db.from('event_directory').select('*')

  if (filter.citySlug) query = query.eq('city', filter.citySlug)
  if (filter.nicheSlug) {
    // A city-wide event (niche is null) belongs in every circle's list — the
    // whole point of leaving the niche off is that everyone is invited.
    query = query.or(`niche.eq.${filter.nicheSlug},niche.is.null`)
  }
  if (!filter.includePast) query = query.gte('starts_at', new Date().toISOString())

  query = query.order('starts_at', { ascending: true }).limit(filter.limit ?? 50)

  const { data, error } = await query
  if (error) {
    console.error('[circlein] event list failed:', error.message)
    return []
  }
  return (data ?? []) as EventDirectoryRow[]
}

export async function eventBySlug(slug: string): Promise<EventDirectoryRow | null> {
  const db = publicClient()
  if (!db) return null
  const { data } = await db.from('event_directory').select('*').eq('slug', slug).maybeSingle()
  return (data as EventDirectoryRow | null) ?? null
}

/** Full text for the event page, which the listing view deliberately omits. */
export async function eventDescription(slug: string): Promise<string | null> {
  const db = publicClient()
  if (!db) return null
  const { data } = await db
    .from('events')
    .select('description')
    .eq('slug', slug)
    .maybeSingle<{ description: string | null }>()
  return data?.description ?? null
}

export function isFull(event: Pick<EventDirectoryRow, 'capacity' | 'rsvp_count'>): boolean {
  return event.capacity !== null && event.rsvp_count >= event.capacity
}

export function spacesLeft(
  event: Pick<EventDirectoryRow, 'capacity' | 'rsvp_count'>,
): number | null {
  if (event.capacity === null) return null
  return Math.max(0, event.capacity - event.rsvp_count)
}

// ─────────────────────────────────────────────────────────────────────────────
// RSVPs
// ─────────────────────────────────────────────────────────────────────────────

export interface RsvpResult {
  ok: boolean
  state?: RsvpState
  error?: string
  /** Set when the person is signed in but is not a verified member yet. */
  needsMembership?: boolean
}

/** The member row behind a signed-in auth user, if they have been admitted. */
export async function memberForUser(authUserId: string): Promise<{ id: string } | null> {
  const db = serviceClient()
  if (!db) return null
  const { data } = await db
    .from('members')
    .select('id')
    .eq('auth_user_id', authUserId)
    .eq('is_active', true)
    .maybeSingle<{ id: string }>()
  return data ?? null
}

export async function rsvpStateFor(eventId: string, memberId: string): Promise<RsvpState | null> {
  const db = serviceClient()
  if (!db) return null
  const { data } = await db
    .from('event_rsvps')
    .select('state')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle<{ state: RsvpState }>()
  return data?.state ?? null
}

/**
 * Take a place at an event, or join the waitlist if it is full.
 *
 * The going-versus-waitlist decision is made here rather than in the browser,
 * because a client deciding whether a room is full is a client that can decide
 * it is not.
 */
export async function rsvp(eventSlug: string, authUserId: string): Promise<RsvpResult> {
  const db = serviceClient()
  if (!db) return { ok: false, error: 'Events are not connected on this deployment.' }

  const member = await memberForUser(authUserId)
  if (!member) {
    return {
      ok: false,
      needsMembership: true,
      error: 'Events are for verified members. Request an invite first.',
    }
  }

  const { data: event } = await db
    .from('events')
    .select('id, capacity, rsvp_count, status, starts_at')
    .eq('slug', eventSlug)
    .maybeSingle<{
      id: string
      capacity: number | null
      rsvp_count: number
      status: string
      starts_at: string
    }>()

  if (!event || event.status !== 'published') return { ok: false, error: 'No such event.' }
  if (new Date(event.starts_at) < new Date()) return { ok: false, error: 'That event has already happened.' }

  const existing = await rsvpStateFor(event.id, member.id)
  if (existing === 'going' || existing === 'waitlist') return { ok: true, state: existing }

  const full = event.capacity !== null && event.rsvp_count >= event.capacity
  const state: RsvpState = full ? 'waitlist' : 'going'

  const { error } = await db
    .from('event_rsvps')
    .upsert({ event_id: event.id, member_id: member.id, state }, { onConflict: 'event_id,member_id' })

  if (error) return { ok: false, error: error.message }
  return { ok: true, state }
}

export async function cancelRsvp(eventSlug: string, authUserId: string): Promise<RsvpResult> {
  const db = serviceClient()
  if (!db) return { ok: false, error: 'Events are not connected on this deployment.' }

  const member = await memberForUser(authUserId)
  if (!member) return { ok: false, needsMembership: true, error: 'Not a member.' }

  const { data: event } = await db
    .from('events')
    .select('id')
    .eq('slug', eventSlug)
    .maybeSingle<{ id: string }>()
  if (!event) return { ok: false, error: 'No such event.' }

  // Deleted rather than marked cancelled, so the seat genuinely frees up and
  // the trigger's count reflects the room.
  const { error } = await db
    .from('event_rsvps')
    .delete()
    .eq('event_id', event.id)
    .eq('member_id', member.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true, state: 'cancelled' }
}
