import { NextResponse } from 'next/server'
import { destinationForUser } from '@/lib/auth-destination'
import { identityFromUser, sessionClient } from '@/lib/supabase/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Where LinkedIn sends people back to.
 *
 * Exchanges the one-time code for a session, writes the cookies, and forwards
 * them on. Note that middleware.ts deliberately does not run on this path: the
 * PKCE verifier arrives in a cookie, and a getUser() call before the exchange
 * can clear it.
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

  const failed = (reason: string) =>
    NextResponse.redirect(`${url.origin}/signin?auth_error=${encodeURIComponent(reason)}`)

  if (oauthError) return failed(oauthError)

  // No code and no error means Supabase never sent one — almost always because
  // this callback URL is not in the project's Redirect URLs allow-list, so
  // Supabase bounced to the Site URL instead of here with a code.
  if (!code) {
    return failed(
      'No sign-in code arrived. Add this exact URL to Supabase → Authentication → URL Configuration → Redirect URLs: ' +
        `${url.origin}/auth/callback`,
    )
  }

  const supabase = await sessionClient()
  if (!supabase) return failed('This deployment has no SUPABASE_URL / SUPABASE_ANON_KEY.')

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return failed(error.message)

  // A successful exchange that somehow produced no user would otherwise send
  // someone back to a sign-in screen with no explanation, right after they
  // signed in — the single most confusing outcome there is. Say so instead.
  const identity = data.user ? identityFromUser(data.user) : null
  if (!identity) {
    return failed('Signed in, but no profile came back from LinkedIn. Try once more.')
  }

  const destination = next !== 'auto' ? next : await destinationForUser(identity.authUserId)
  return NextResponse.redirect(`${url.origin}${destination}`)
}
