'use client'

import { useState } from 'react'
import { browserClient } from '@/lib/supabase/browser'

/**
 * Starts the LinkedIn redirect. Supabase's provider key is `linkedin_oidc` —
 * the older `linkedin` provider was LinkedIn's deprecated OAuth product and no
 * longer works.
 *
 * `next` defaults to "auto", which lets the callback route by who signed in: a
 * verified member lands on their circle, someone mid-application on its status,
 * and a newcomer on the form. Pass a path only when the destination is genuinely
 * fixed — an event page bringing someone back to that event, say.
 */
export function LinkedInButton({
  supabaseUrl,
  supabaseAnonKey,
  next = 'auto',
  label = 'Continue with LinkedIn',
  className = 'btn-primary',
}: {
  /** Passed down from a server component — see lib/supabase/browser.ts. */
  supabaseUrl: string
  supabaseAnonKey: string
  next?: string
  label?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    const supabase = browserClient(supabaseUrl, supabaseAnonKey)
    if (!supabase) {
      setError(
        'Sign-in cannot start: this deployment has no SUPABASE_URL / SUPABASE_ANON_KEY.',
      )
      return
    }
    setBusy(true)
    setError(null)

    // "auto" is the default and the callback assumes it, so leave it off the
    // URL entirely. Supabase matches redirect targets against an allow-list,
    // and a bare /auth/callback matches a plain entry — a query string may not.
    const callback =
      next && next !== 'auto'
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `${window.location.origin}/auth/callback`

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: callback,
        // The three scopes LinkedIn's OpenID Connect product offers. There is
        // no scope that returns work history — see the README.
        scopes: 'openid profile email',
      },
    })

    if (authError) {
      setError(authError.message)
      setBusy(false)
    }
    // On success the browser is already navigating away.
  }

  return (
    <div>
      <button type="button" onClick={() => void signIn()} disabled={busy} className={className}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
        {busy ? 'Taking you to LinkedIn…' : label}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-flag">
          {error}
        </p>
      ) : null}
    </div>
  )
}
