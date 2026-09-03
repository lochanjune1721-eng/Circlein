import { NextResponse } from 'next/server'
import { sessionClient } from '@/lib/supabase/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Where LinkedIn sends people back to.
 *
 * Exchanges the one-time code for a session, then sends them to the form. That
 * is the whole job. An earlier version worked out a "best" destination per
 * person — member, applicant, newcomer — which added a branch that could land
 * someone on a page that did not exist, right after signing in. Signing in
 * means one thing here: you are about to fill in the form.
 *
 * middleware.ts deliberately does not run on this path: the PKCE verifier
 * arrives in a cookie, and a getUser() call before the exchange can clear it.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error_description') ?? url.searchParams.get('error')

  const failed = (reason: string) =>
    NextResponse.redirect(`${url.origin}/apply?auth_error=${encodeURIComponent(reason)}`)

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return failed(error.message)

  return NextResponse.redirect(`${url.origin}/apply`)
}
