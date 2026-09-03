/**
 * The four things that happen between sending a request and being in the
 * group. Written plainly, because the whole value of the door is that people
 * understand what it checks.
 */
const STEPS = [
  {
    n: '01',
    title: 'You ask',
    body: 'Continue with LinkedIn so we know it is you, then six quick things: your city, your company, your role, and the number to reach you on.',
  },
  {
    n: '02',
    title: 'We verify',
    body: 'Every request is checked against the profile behind it before anyone is let in. That is the whole reason a CircleIn room is worth being in.',
  },
  {
    n: '03',
    title: 'We find your room',
    body: 'Your city and your work decide which circle fits — a small group of people who already do what you do, where you do it.',
  },
  {
    n: '04',
    title: 'You are added',
    body: 'On WhatsApp, on the number you gave us. Then it is just people talking, which was the point.',
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
