import type { Metadata } from 'next'
import { ApplyForm } from '@/components/apply-form'
import { LinkedInButton } from '@/components/linkedin-button'
import { SignedInBadge } from '@/components/signed-in-badge'
import { POLICY, isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/config'
import { cityOptions, nicheOptions } from '@/lib/options'
import { currentIdentity } from '@/lib/supabase/auth'

export const metadata: Metadata = {
  title: 'Request an invite',
  description:
    'Sign in with LinkedIn to request a place in CircleIn. Every application is verified before anyone is let in.',
}

export const dynamic = 'force-dynamic'

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>
}) {
  const { auth_error: authError } = await searchParams
  const identity = await currentIdentity()
  const signInAvailable = isSupabaseConfigured()

  return (
    <div className="shell grid gap-16 pb-24 pt-16 lg:grid-cols-[1fr_320px]">
      <div className="max-w-2xl">
        <p className="eyebrow">Request an invite</p>
        <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-bone">
          {identity ? 'Four questions, then we check.' : 'Start with LinkedIn.'}
        </h1>
        <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
          {identity
            ? 'Your identity is already settled. Tell us where you work and what you do, and the check runs — usually before you have closed the tab.'
            : 'Signing in with LinkedIn is how we know you are who you say you are. No password to make, nothing to type twice.'}
        </p>

        {authError ? (
          <p
            role="alert"
            className="mt-8 rounded-lg border border-flag/40 bg-flag/10 px-4 py-3 text-[14px] text-flag"
          >
            LinkedIn sign-in did not complete: {authError}
          </p>
        ) : null}

        {identity ? (
          <>
            <div className="mt-10">
              <SignedInBadge identity={identity} />
            </div>

            <div className="mt-14">
              <ApplyForm
                cities={cityOptions()}
                niches={nicheOptions()}
                minTenureMonths={POLICY.minTenureMonths}
                minAccountAgeMonths={POLICY.minAccountAgeMonths}
                intakeOpen={isServiceRoleConfigured()}
                identity={{
                  fullName: identity.fullName,
                  email: identity.email,
                  emailVerified: identity.emailVerified,
                }}
                signInAvailable={signInAvailable}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mt-10">
              {signInAvailable ? (
                <LinkedInButton next="/apply" />
              ) : (
                <p className="rounded-lg border border-ink-line bg-ink-raised px-4 py-3 text-[14px] text-bone-dim">
                  LinkedIn sign-in is not configured on this deployment, so the form below asks for
                  your details directly. In production this page is sign-in only.
                </p>
              )}
            </div>

            <div className="mt-10 max-w-prose space-y-4 text-[15px] leading-relaxed text-bone-dim">
              <p className="text-bone">What signing in does, and does not, tell us.</p>
              <p>
                LinkedIn confirms your name and your email address, and gives us a stable member id
                so one account cannot hold two applications. That settles who you are.
              </p>
              <p>
                It does not hand over your work history — LinkedIn publishes no such thing to
                third-party apps. So the {POLICY.minTenureMonths}-month rule is checked separately,
                and we ask for your profile link and start date to do it.
              </p>
              <p className="text-bone-faint">
                We never post anything, and we never read your connections or messages.
              </p>
            </div>

            {signInAvailable ? null : (
              <div className="mt-14">
                <ApplyForm
                  cities={cityOptions()}
                  niches={nicheOptions()}
                  minTenureMonths={POLICY.minTenureMonths}
                  minAccountAgeMonths={POLICY.minAccountAgeMonths}
                  intakeOpen={isServiceRoleConfigured()}
                  identity={null}
                  signInAvailable={signInAvailable}
                />
              </div>
            )}
          </>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <p className="eyebrow">What gets checked</p>
          <ul className="mt-5 space-y-4 text-[14px] leading-relaxed text-bone-dim">
            <li>
              <span className="text-bone">Who you are.</span> Confirmed by LinkedIn when you sign
              in — not something you type in and we hope is true.
            </li>
            <li>
              <span className="text-bone">Time in the role.</span> At least {POLICY.minTenureMonths}{' '}
              months in the job you apply with. This one is arithmetic — nothing overrides it.
            </li>
            <li>
              <span className="text-bone">The work matches.</span> Your title and history are read
              against the circle you picked.
            </li>
            <li>
              <span className="text-bone">A person, if unsure.</span> Anything ambiguous goes to a
              human rather than being guessed.
            </li>
          </ul>
        </div>

        <div className="card mt-4 p-6">
          <p className="eyebrow">Then what</p>
          <p className="mt-4 text-[14px] leading-relaxed text-bone-dim">
            Verified members are placed in their circle&apos;s WhatsApp group and added shortly
            after. Groups are capped at {POLICY.whatsappGroupCapacity} so they stay worth being in.
          </p>
        </div>
      </aside>
    </div>
  )
}
