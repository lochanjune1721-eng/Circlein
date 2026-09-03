import { NextResponse } from 'next/server'
import { destinationForUser } from '@/lib/auth-destination'
import { identityFromUser, sessionClient } from '@/lib/supabase/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Where LinkedIn sends the member back to.
 *
 * Exchanges the one-time code for a session and writes the cookies, then
 * returns them to wherever they were headed. Errors land on /apply with a
 * readable message rather than a blank page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error_description') ?? url.searchParams.get('error')

  // `next` is attacker-controllable, so only same-origin paths are honoured.
  // The sentinel "auto" means "work out where this person belongs", which can
  // only be answered once the session exists.
  const requested = url.searchParams.get('next') ?? 'auto'
  const next =
    requested !== 'auto' && requested.startsWith('/') && !requested.startsWith('//')
      ? requested
      : 'auto'

  if (oauthError) {
    return NextResponse.redirect(new URL(`/apply?auth_error=${encodeURIComponent(oauthError)}`, url.origin))
  }
  if (!code) {
    return NextResponse.redirect(new URL('/apply?auth_error=No%20code%20returned', url.origin))
  }

  const supabase = await sessionClient()
  if (!supabase) {
    return NextResponse.redirect(new URL('/apply?auth_error=Sign-in%20is%20not%20configured', url.origin))
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      new URL(`/apply?auth_error=${encodeURIComponent(error.message)}`, url.origin),
    )
  }

  if (next !== 'auto') return NextResponse.redirect(new URL(next, url.origin))

  const identity = data.user ? identityFromUser(data.user) : null
  const destination = identity ? await destinationForUser(identity.authUserId) : '/apply'
  return NextResponse.redirect(new URL(destination, url.origin))
}
