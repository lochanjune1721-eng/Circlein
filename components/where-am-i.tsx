'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Shows the URL that produced a 404.
 *
 * A "page not found" with no page named is a dead end for whoever hit it and
 * useless to whoever has to fix it. This prints the address that was actually
 * requested, and recognises the case where somebody arrived mid sign-in —
 * which is the one time a 404 here means something specific and fixable.
 */
export function WhereAmI() {
  const [href, setHref] = useState<string | null>(null)
  const [fromAuth, setFromAuth] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    setHref(url.pathname + url.search + url.hash)
    // Landing here with OAuth debris in the URL means the sign-in round trip
    // ended on the wrong address rather than at /apply.
    const q = url.search + url.hash
    setFromAuth(/code=|access_token=|error=|state=/.test(q))
  }, [])

  if (!href) return null

  return (
    <div className="mx-auto mt-10 max-w-xl">
      <div className="rounded-xl border border-ink-line bg-ink-card p-5 text-left">
        <p className="eyebrow">You were sent to</p>
        <p className="mt-2 break-all font-mono text-[13px] text-bone">{href}</p>
      </div>

      {fromAuth ? (
        <div className="mt-4 rounded-xl border border-flag/40 bg-flag/[0.07] p-5 text-left">
          <p className="text-[14px] text-bone">That looks like a sign-in that came back to the wrong address.</p>
          <p className="mt-2 text-[13px] leading-relaxed text-bone-dim">
            Sign-in should return to <span className="font-mono">/auth/callback</span>. Landing
            anywhere else means Supabase sent it to the project&apos;s Site URL instead — which
            happens when the callback is missing from Redirect URLs.
          </p>
          <Link href="/apply" className="mt-4 inline-block text-[13px] text-gold hover:text-gold-bright">
            Try again →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
