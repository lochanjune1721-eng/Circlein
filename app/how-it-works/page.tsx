import type { Metadata } from 'next'
import Link from 'next/link'
import { POLICY } from '@/lib/config'
import { VerificationSteps } from '@/components/verification-steps'

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'What CircleIn checks before letting someone in, how members are sorted, and what is stored.',
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="rule scroll-mt-24">
      <div className="shell grid gap-10 py-16 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-4 font-display text-3xl leading-tight text-bone sm:text-4xl">{title}</h2>
        </div>
        <div className="max-w-prose space-y-5 text-[16px] leading-relaxed text-bone-dim">{children}</div>
      </div>
    </section>
  )
}

export default function HowItWorksPage() {
  return (
    <>
      <div className="shell pb-14 pt-20">
        <p className="eyebrow">How it works</p>
        <h1 className="mt-5 max-w-3xl text-balance font-display text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.02] text-bone">
          What the door actually checks.
        </h1>
        <p className="mt-6 max-w-prose text-[17px] leading-relaxed text-bone-dim">
          A network is only worth joining if you trust who else got in. So here is the whole
          process, including the parts that are judgement calls and the parts that are not.
        </p>
        <VerificationSteps className="mt-12" />
      </div>

      <Section id="rules" eyebrow="The hard rules" title="Two numbers decide before anything else does.">
        <p>
          <strong className="text-bone">At least {POLICY.minTenureMonths} months in the role.</strong>{' '}
          This is the rule the whole network rests on. A headline can change in a second; three
          months of a job cannot. It also means nobody gets in on a title they took on last week.
        </p>
        <p>
          <strong className="text-bone">
            An account at least {POLICY.minAccountAgeMonths} months old.
          </strong>{' '}
          A profile created to get through this door will not be old enough to. A year is long
          enough to rule those out without shutting out people early in their careers.
        </p>
        <p>
          Both are plain arithmetic on dates. No model is involved and nothing overrides them — if
          the dates do not clear, the answer is no, with a note telling you when to come back.
        </p>
      </Section>

      <Section id="judgement" eyebrow="The judgement" title="Then something has to read it like a person.">
        <p>
          Titles are not standardised. &ldquo;Member of Technical Staff&rdquo;, &ldquo;SDE II&rdquo;
          and &ldquo;Software Engineer&rdquo; are the same job; &ldquo;Growth Manager&rdquo; and
          &ldquo;Growth Marketing Manager&rdquo; are not quite. So after the arithmetic, the profile
          is read against the circle you asked for.
        </p>
        <p>
          That step can only ever make the decision <em>more</em> cautious. It cannot approve
          someone the rules did not already clear, and when it is not confident, the application
          goes to a person instead of being guessed at.
        </p>
        <p className="text-bone">
          Turning away someone real costs more than making them wait a day. Every uncertain case is
          resolved in that direction.
        </p>
      </Section>

      <Section id="taxonomy" eyebrow="The taxonomy" title="Country, city, niche — and nothing mushy.">
        <p>
          Members are placed on three clean dimensions rather than in one giant bucket. Cities roll
          up into the market people actually work in, so Gurugram, Noida and New Delhi are one room.
          Niches are deduplicated: every label means one thing and appears exactly once.
        </p>
        <p>
          Role and seniority are kept apart. You are a Backend Engineer who happens to be Senior,
          which means a search for backend engineers finds you at every stage of your career instead
          of splitting you into eight separate categories.
        </p>
        <p>
          <Link href="/directory" className="text-gold hover:text-gold-bright">
            Browse the directory →
          </Link>
        </p>
      </Section>

      <Section id="whatsapp" eyebrow="The group" title="Where the network actually happens.">
        <p>
          Once you are verified you are placed in your circle&apos;s WhatsApp group and added
          shortly after — a real group of people doing your job in your city, not a feed.
        </p>
        <p>
          Groups are capped at {POLICY.whatsappGroupCapacity}. When one fills, the next opens rather
          than letting the room grow until nobody speaks. Your status page tells you which group you
          are queued for.
        </p>
      </Section>

      <Section id="privacy" eyebrow="Privacy" title="What is stored, and what is never shown.">
        <p>
          We keep what the check needs: your name, email, LinkedIn URL, WhatsApp number, the role
          and circle you applied to, and the result of the check with its reasons — so a decision
          can always be explained or appealed.
        </p>
        <p>
          None of that is public. The directory shows circles and counts, never people. Phone
          numbers and emails are readable only by the server. IP addresses are hashed, used for rate
          limiting, and never stored in the clear.
        </p>
      </Section>

      <section className="rule">
        <div className="shell py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-balance font-display text-4xl leading-tight text-bone sm:text-5xl">
            That is the whole process.
          </h2>
          <div className="mt-8">
            <Link href="/apply" className="btn-primary">
              Request an invite
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
