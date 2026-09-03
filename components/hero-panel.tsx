import { POLICY } from '@/lib/config'

/**
 * An illustration of the check, not a record of anyone.
 *
 * The hero's right-hand column was dead space, and the most useful thing to put
 * there is the moment the product turns on: a request resolving into a verdict.
 * The name is a placeholder and the card says so, because a fake profile
 * presented as a real member would be a lie told in the most prominent place on
 * the site.
 */

const CHECKS: { label: string; detail: string; state: 'pass' | 'pending' }[] = [
  { label: 'LinkedIn account age', detail: '6 years', state: 'pass' },
  { label: 'Time in current role', detail: `19 months · ${POLICY.minTenureMonths} required`, state: 'pass' },
  { label: 'Role matches the profile', detail: 'Machine Learning Engineer', state: 'pass' },
  { label: 'City matches the profile', detail: 'Bengaluru, Karnataka', state: 'pass' },
]

export function HeroPanel() {
  return (
    <figure className="relative animate-rise" style={{ ['--i' as string]: 2 }}>
      <div
        className="pointer-events-none absolute -inset-6 rounded-[28px] opacity-60 blur-2xl"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(216,166,87,0.16), transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-2xl border border-ink-line bg-ink-card">
        <div className="flex items-center justify-between gap-4 border-b border-ink-line px-6 py-4">
          <span className="eyebrow">Request #4021</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-verified/40 bg-verified/10 px-3 py-1 text-[11px] text-verified">
            <span className="h-1.5 w-1.5 rounded-full bg-verified" aria-hidden="true" />
            Verified
          </span>
        </div>

        <div className="px-6 py-5">
          <p className="font-display text-2xl text-bone">A. Raghavan</p>
          <p className="mt-1 text-[13px] text-bone-dim">Senior Machine Learning Engineer</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink-line bg-ink-raised px-3 py-1 text-[12px] text-bone-dim">
            Machine Learning · Bengaluru
          </p>
        </div>

        <ul className="border-t border-ink-line">
          {CHECKS.map((check, i) => (
            <li
              key={check.label}
              className="flex items-center justify-between gap-4 border-b border-ink-line/60 px-6 py-3.5 last:border-b-0"
              style={{ ['--i' as string]: i + 3 }}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-verified/15 text-[11px] text-verified"
                >
                  ✓
                </span>
                <span className="text-[13px] text-bone">{check.label}</span>
              </span>
              <span className="shrink-0 text-[12px] text-bone-faint">{check.detail}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-ink-line bg-ink-raised/60 px-6 py-4">
          <p className="text-[12px] leading-relaxed text-bone-faint">
            Added to <span className="text-bone-dim">Machine Learning · Bengaluru</span> on WhatsApp.
          </p>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-[12px] text-bone-faint">
        An illustration of the check — not a real member.
      </figcaption>
    </figure>
  )
}
