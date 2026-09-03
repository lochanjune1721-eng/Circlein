import type { Metadata } from 'next'
import { ApplyForm } from '@/components/apply-form'
import { POLICY, isServiceRoleConfigured } from '@/lib/config'
import { cityOptions, nicheOptions } from '@/lib/options'

export const metadata: Metadata = {
  title: 'Request an invite',
  description:
    'Send a request to join CircleIn. Every application is checked against your LinkedIn before anyone is let in.',
}

export default function ApplyPage() {
  return (
    <div className="shell grid gap-16 pb-24 pt-16 lg:grid-cols-[1fr_320px]">
      <div className="max-w-2xl">
        <p className="eyebrow">Request an invite</p>
        <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-bone">
          Four questions, then we check.
        </h1>
        <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
          No account, no password. Answer these and an automated check reads your LinkedIn — usually
          it comes back before you have closed the tab.
        </p>

        <div className="mt-14">
          <ApplyForm
            cities={cityOptions()}
            niches={nicheOptions()}
            minTenureMonths={POLICY.minTenureMonths}
            minAccountAgeMonths={POLICY.minAccountAgeMonths}
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
