import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LinkedInButton } from '@/components/linkedin-button'
import { POLICY, isSupabaseConfigured } from '@/lib/config'
import { destinationForUser } from '@/lib/auth-destination'
import { currentIdentity } from '@/lib/supabase/auth'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to CircleIn with LinkedIn.',
}

export const dynamic = 'force-dynamic'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; auth_error?: string }>
}) {
  const { next, auth_error: authError } = await searchParams
  const identity = await currentIdentity()

  // Already signed in? Then this page has nothing to offer — send them on.
  if (identity) redirect(await destinationForUser(identity.authUserId))

  const available = isSupabaseConfigured()
  // Only same-origin paths are passed through to the OAuth round trip.
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : 'auto'

  return (
    <div className="shell max-w-xl pb-24 pt-24">
      <p className="eyebrow">Members</p>
      <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.05] text-bone">
        Welcome back.
      </h1>
      <p className="mt-5 text-[16px] leading-relaxed text-bone-dim">
        CircleIn has no passwords. Signing in with LinkedIn is how we know it is you — the same
        check that let you in the first time.
      </p>

      {authError ? (
        <p
          role="alert"
          className="mt-8 rounded-lg border border-flag/40 bg-flag/10 px-4 py-3 text-[14px] text-flag"
        >
          LinkedIn sign-in did not complete: {authError}
        </p>
      ) : null}

      <div className="mt-10">
        {available ? (
          <LinkedInButton next={target} label="Sign in with LinkedIn" />
        ) : (
          <div className="rounded-lg border border-flag/40 bg-flag/[0.07] px-4 py-4 text-[14px] text-bone-dim">
            <p className="text-bone">This build has no Supabase keys, so sign-in cannot start.</p>
            <p className="mt-2 leading-relaxed">
              It needs <span className="font-mono text-[13px]">NEXT_PUBLIC_SUPABASE_URL</span> and{' '}
              <span className="font-mono text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>. Both are
              baked in when the app is built, so setting them afterwards does nothing until you
              deploy again.
            </p>
            <p className="mt-2 leading-relaxed text-bone-faint">
              Nothing to do with your LinkedIn provider in Supabase — that is checked later, once
              sign-in can actually start. See <span className="font-mono text-[13px]">/api/health</span>.
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 border-t border-ink-line pt-8">
        <h2 className="font-display text-2xl text-bone">Not a member yet?</h2>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-bone-dim">
          There is no public sign-up. Request an invite, and if you have been doing your job for at
          least {POLICY.minTenureMonths} months, you are welcome.
        </p>
        <Link href="/apply" className="btn-ghost mt-5">
          Request an invite
        </Link>
      </div>

      <p className="mt-10 text-[13px] leading-relaxed text-bone-faint">
        Applied before you had an account? Your status link still works —{' '}
        <Link href="/status" className="text-gold hover:text-gold-bright">
          look it up here
        </Link>
        .
      </p>
    </div>
  )
}
