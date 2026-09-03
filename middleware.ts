import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase session cookie on every request.
 *
 * Server Components cannot write cookies, so without this an expiring session
 * would silently stop working — the documented failure mode is random logouts
 * partway through the application flow.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, options)
      },
    },
  })

  // Touching getUser() is what performs the refresh. Do not remove it.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, image files — and /auth.
     *
     * /auth is excluded deliberately, not for speed. The callback arrives with
     * a PKCE code verifier in a cookie and no session yet. This middleware
     * calls getUser() on every matched request, and that call, finding no valid
     * session, can clear the sb-* cookies — the verifier among them — before
     * the route handler ever gets to exchange the code. The exchange then fails
     * and the person is bounced back to a sign-in screen having just signed in.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
