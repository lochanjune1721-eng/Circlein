import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/config'

/**
 * Session-aware Supabase client.
 *
 * Distinct from the clients in `server.ts`: those are stateless and act as
 * either `anon` or the service role. This one carries the signed-in member's
 * session from cookies, so `auth.uid()` resolves inside RLS and a member can
 * read their own row and nothing else.
 */
export async function sessionClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null
  const store = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return store.getAll()
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options)
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // middleware refreshes the session, so this is safe to swallow.
        }
      },
    },
  })
}

/**
 * The LinkedIn identity behind a signed-in session.
 *
 * These are the only claims LinkedIn's OpenID Connect product returns. There is
 * deliberately no headline, no positions and no account creation date here,
 * because LinkedIn does not give them out — see `lib/verification/provider.ts`
 * for how tenure is established instead.
 */
export interface LinkedInIdentity {
  authUserId: string
  /** Stable LinkedIn member id (the OIDC `sub`). The real primary key for a person. */
  sub: string
  fullName: string
  givenName: string | null
  familyName: string | null
  email: string | null
  emailVerified: boolean
  picture: string | null
  locale: string | null
}

/** Read the LinkedIn identity from the session, or null if nobody is signed in. */
export async function currentIdentity(): Promise<LinkedInIdentity | null> {
  const db = await sessionClient()
  if (!db) return null

  // getUser() revalidates the JWT with the auth server. getSession() would
  // trust a cookie the browser could have tampered with.
  const { data, error } = await db.auth.getUser()
  if (error || !data.user) return null
  return identityFromUser(data.user)
}

export function identityFromUser(user: User): LinkedInIdentity | null {
  const linkedin = user.identities?.find((i) => i.provider === 'linkedin_oidc')
  const claims = (linkedin?.identity_data ?? user.user_metadata ?? {}) as Record<string, unknown>

  const str = (key: string): string | null => {
    const value = claims[key]
    return typeof value === 'string' && value.length > 0 ? value : null
  }

  const sub = str('sub') ?? linkedin?.id ?? null
  if (!sub) return null

  const given = str('given_name')
  const family = str('family_name')
  const fullName = str('name') ?? [given, family].filter(Boolean).join(' ') ?? ''

  return {
    authUserId: user.id,
    sub,
    fullName: fullName || 'Unknown',
    givenName: given,
    familyName: family,
    email: str('email') ?? user.email ?? null,
    // LinkedIn only releases an email once the member has confirmed it, but
    // treat the claim as authoritative rather than assuming.
    emailVerified: claims.email_verified === true,
    picture: str('picture'),
    locale: str('locale'),
  }
}
