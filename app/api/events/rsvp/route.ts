import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cancelRsvp, rsvp } from '@/lib/events'
import { currentIdentity } from '@/lib/supabase/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  slug: z.string().min(1).max(120),
  action: z.enum(['rsvp', 'cancel']),
})

export async function POST(request: Request) {
  // Who is RSVPing comes from the session, never the body.
  const identity = await currentIdentity()
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: 'Sign in with LinkedIn to take a place.' },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected JSON.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 422 })
  }

  const result =
    parsed.data.action === 'rsvp'
      ? await rsvp(parsed.data.slug, identity.authUserId)
      : await cancelRsvp(parsed.data.slug, identity.authUserId)

  if (!result.ok) {
    return NextResponse.json(result, { status: result.needsMembership ? 403 : 400 })
  }
  return NextResponse.json(result)
}
