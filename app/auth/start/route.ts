import { NextResponse } from 'next/server'
import { sessionClient } from '@/lib/supabase/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One hop to LinkedIn.
 *
 * Sign-in used to be a page with a button on it, which made every entry point
 * two clicks: one to reach the page, one to press the thing. This is a plain
 * link target instead — hit it and you are on LinkedIn.
 *
 * The OAuth call happens here rather than in the browser so the PKCE verifier
 * is written straight to a cookie the callback can read, with no client-side
 * Supabase involved at all.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  const supabase = await sessionClient()
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}/apply?auth_error=${encodeURIComponent('This deployment has no SUPABASE_URL / SUPABASE_ANON_KEY.')}`,
    )
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: `${origin}/auth/callback`,
      // We do the redirecting; the SDK just builds the URL and stores the
      // verifier. Scopes are left to Supabase's linkedin_oidc defaults.
      skipBrowserRedirect: true,
    },
  })

  if (error || !data?.url) {
    return NextResponse.redirect(
      `${origin}/apply?auth_error=${encodeURIComponent(error?.message ?? 'Could not start sign-in.')}`,
    )
  }

  return NextResponse.redirect(data.url)
}
