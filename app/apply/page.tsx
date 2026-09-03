import type { Metadata } from 'next'
import Link from 'next/link'
import { ApplyForm } from '@/components/apply-form'
import { LinkedInButton } from '@/components/linkedin-button'
import { SignedInBadge } from '@/components/signed-in-badge'
import { isServiceRoleConfigured, publicSupabaseConfig } from '@/lib/config'
import { cityOptions, roleOptions } from '@/lib/options'
import { currentIdentity } from '@/lib/supabase/auth'

export const metadata: Metadata = {
  title: 'Request an invite',
  description: 'Request a place in CircleIn.',
}

export const dynamic = 'force-dynamic'

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>
}) {
  const { auth_error: authError } = await searchParams
  const identity = await currentIdentity()
  const supabase = publicSupabaseConfig()

  // Signing in comes first: it is how we know who is asking. Only once that is
  // settled does the form appear.
  if (!identity) {
    return (
      <div className="shell max-w-xl pb-24 pt-24">
        <p className="eyebrow">Request an invite</p>
        <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-bone">
          Start with LinkedIn.
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-bone-dim">
          Continue with LinkedIn so we know it is really you, and we will bring you straight back
          here. No password to make, nothing to type twice.
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
          {supabase ? (
            <LinkedInButton
              supabaseUrl={supabase.url}
              supabaseAnonKey={supabase.anonKey}
              label="Continue with LinkedIn"
            />
          ) : (
            <div className="rounded-lg border border-flag/40 bg-flag/[0.07] px-4 py-4 text-[14px] text-bone-dim">
              <p className="text-bone">This deployment has no Supabase keys, so sign-in cannot start.</p>
              <p className="mt-2 leading-relaxed">
                Set <span className="font-mono text-[13px]">SUPABASE_URL</span> and{' '}
                <span className="font-mono text-[13px]">SUPABASE_ANON_KEY</span>, then reload.
              </p>
            </div>
          )}
        </div>

        <p className="mt-8 text-[13px] leading-relaxed text-bone-faint">
          We never post anything, and we never read your connections or messages.
        </p>

        <p className="mt-10 text-[13px] leading-relaxed text-bone-faint">
          Already applied?{' '}
          <Link href="/status" className="text-gold hover:text-gold-bright">
            Check where it stands
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="shell grid gap-16 pb-24 pt-16 lg:grid-cols-[1fr_300px]">
      <div className="max-w-xl">
        <p className="eyebrow">Request an invite</p>
        <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-bone">
          Tell us where you fit.
        </h1>
        <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
          Six quick things, and you are done.
        </p>

        <div className="mt-10">
          <SignedInBadge identity={identity} />
        </div>

        <div className="mt-12">
          <ApplyForm
            cities={cityOptions()}
            roles={roleOptions()}
            intakeOpen={isServiceRoleConfigured()}
          />
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <p className="eyebrow">What happens next</p>
          <ol className="mt-5 space-y-4 text-[14px] leading-relaxed text-bone-dim">
            <li>
              <span className="text-bone">We verify your request.</span> It usually takes under a
              day, and you will hear either way.
            </li>
            <li>
              <span className="text-bone">We find your room.</span> Your city and your work decide
              which circle fits you best.
            </li>
            <li>
              <span className="text-bone">You are added on WhatsApp.</span> On the number you give
              us, once you are in.
            </li>
          </ol>
        </div>

        <div className="card mt-4 p-6">
          <p className="eyebrow">Members only</p>
          <p className="mt-4 text-[14px] leading-relaxed text-bone-dim">
            We never publish who is in a circle. You will meet them in the group, not on a page a
            stranger can read.
          </p>
        </div>
      </aside>
    </div>
  )
}
