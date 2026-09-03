import type { Metadata } from 'next'
import { ApplyForm } from '@/components/apply-form'
import { SignedInBadge } from '@/components/signed-in-badge'
import { POLICY, isServiceRoleConfigured } from '@/lib/config'
import { cityOptions, roleOptions } from '@/lib/options'
import { currentIdentity } from '@/lib/supabase/auth'

export const metadata: Metadata = {
  title: 'Request an invite',
  description:
    'Request a place in CircleIn. One form, then your LinkedIn is checked before anyone is let in.',
}

export const dynamic = 'force-dynamic'

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>
}) {
  const { auth_error: authError } = await searchParams
  // Signing in is no longer required to apply. If someone is signed in anyway,
  // the verified identity still gets recorded against their application.
  const identity = await currentIdentity()

  return (
    <div className="shell grid gap-16 pb-24 pt-16 lg:grid-cols-[1fr_320px]">
      <div className="max-w-xl">
        <p className="eyebrow">Request an invite</p>
        <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-bone">
          Seven questions, then we check.
        </h1>
        <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
          No account, no password. Fill this in and an automated check reads your LinkedIn —
          usually it comes back before you have closed the tab.
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
          <div className="mt-10">
            <SignedInBadge identity={identity} />
          </div>
        ) : null}

        <div className="mt-12">
          <ApplyForm
            cities={cityOptions()}
            roles={roleOptions()}
            minTenureMonths={POLICY.minTenureMonths}
            intakeOpen={isServiceRoleConfigured()}
          />
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <p className="eyebrow">What gets checked</p>
          <ul className="mt-5 space-y-4 text-[14px] leading-relaxed text-bone-dim">
            <li>
              <span className="text-bone">Time in the role.</span> At least {POLICY.minTenureMonths}{' '}
              months in the job you apply with. This one is arithmetic — nothing overrides it.
            </li>
            <li>
              <span className="text-bone">Account age.</span> Your LinkedIn account needs to be at
              least {POLICY.minAccountAgeMonths} months old.
            </li>
            <li>
              <span className="text-bone">The work matches.</span> Your profile is read against the
              role you picked.
            </li>
            <li>
              <span className="text-bone">A person, if unsure.</span> Anything ambiguous goes to a
              human rather than being guessed.
            </li>
          </ul>
        </div>

        <div className="card mt-4 p-6">
          <p className="eyebrow">Your circle</p>
          <p className="mt-4 text-[14px] leading-relaxed text-bone-dim">
            Your city and role decide which room you land in — we work the rest out from there, so
            there is nothing else to pick.
          </p>
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
