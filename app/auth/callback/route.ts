import { NextResponse } from 'next/server'
import { sessionClient } from '@/lib/supabase/auth'

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
  const requested = url.searchParams.get('next') ?? '/apply'
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/apply'

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      new URL(`/apply?auth_error=${encodeURIComponent(error.message)}`, url.origin),
    )
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
