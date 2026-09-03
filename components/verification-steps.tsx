import { POLICY } from '@/lib/config'

/**
 * The four things that happen between sending a request and being in the
 * group. Written plainly, because the whole value of the door is that people
 * understand what it checks.
 */
const STEPS = [
  {
    n: '01',
    title: 'You send a request',
    body: 'Your name, your LinkedIn, the job you do, and the city and niche you want to sit in. Two minutes, no account, no password.',
  },
  {
    n: '02',
    title: 'We read the profile',
    body: 'An automated check pulls your profile and looks at the two things that are hard to fake: how long the account has existed, and how long you have held the role you applied with.',
  },
  {
    n: '03',
    title: 'The numbers have to hold',
    body: `At least ${POLICY.minTenureMonths} months in the current role, and an account at least ${POLICY.minAccountAgeMonths} months old. These are arithmetic, not opinion — nothing talks its way past them.`,
  },
  {
    n: '04',
    title: 'Then a judgement call',
    body: 'The check reads your title and history the way a person would, and asks whether the work genuinely fits the circle you chose. Anything it is unsure about goes to a human rather than being guessed.',
  },
]

export function VerificationSteps({ className = '' }: { className?: string }) {
  return (
    <ol className={`grid gap-px overflow-hidden rounded-xl border border-ink-line bg-ink-line sm:grid-cols-2 ${className}`}>
      {STEPS.map((step, i) => (
        <li
          key={step.n}
          className="animate-rise stagger bg-ink-card p-7"
          style={{ ['--i' as string]: i }}
        >
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[12px] text-gold">{step.n}</span>
            <h3 className="font-display text-2xl text-bone">{step.title}</h3>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-bone-dim">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}
