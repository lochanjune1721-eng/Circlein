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

  // Anything that went wrong belongs on /signin — that is the page about
  // signing in, and it renders auth_error. Sending someone to the application
  // form instead just loses the thread.
  const failed = (reason: string) =>
    NextResponse.redirect(new URL(`/signin?auth_error=${encodeURIComponent(reason)}`, url.origin))

  if (oauthError) return failed(oauthError)
  if (!code) return failed('LinkedIn returned no authorisation code.')

  const supabase = await sessionClient()
  if (!supabase) return failed('This deployment has no SUPABASE_URL / SUPABASE_ANON_KEY.')

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return failed(error.message)

  if (next !== 'auto') return NextResponse.redirect(new URL(next, url.origin))

  const identity = data.user ? identityFromUser(data.user) : null
  const destination = identity ? await destinationForUser(identity.authUserId) : '/apply'
  return NextResponse.redirect(new URL(destination, url.origin))
}
