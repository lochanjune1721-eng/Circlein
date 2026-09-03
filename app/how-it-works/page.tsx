import type { Metadata } from 'next'
import Link from 'next/link'
import { POLICY } from '@/lib/config'
import { VerificationSteps } from '@/components/verification-steps'

export const metadata: Metadata = {
  title: 'How it works',
  description: 'How CircleIn decides who gets in, how members are sorted, and what is stored.',
}

/**
 * This page says what the door is for, not what it measures.
 *
 * An earlier version published the exact thresholds. That was a mistake: the
 * criteria are the one thing worth keeping to ourselves, because anyone who
 * knows them can write a profile that clears them. What people actually want
 * to know is that everyone in the room was checked — and that is said plainly.
 */
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
          Everyone here was checked.
        </h1>
        <p className="mt-6 max-w-prose text-[17px] leading-relaxed text-bone-dim">
          A network is only worth joining if you trust who else got in. So nobody joins CircleIn by
          signing up — every request is verified against the person behind it first.
        </p>
        <VerificationSteps className="mt-12" />
      </div>

      <Section id="door" eyebrow="The door" title="Why there is one at all.">
        <p>
          Anyone can write anything about themselves. That is why the big networks fill up with
          people you have never met, congratulating each other on jobs nobody checked.
        </p>
        <p>
          CircleIn checks. When someone in your circle says they run growth at a Series B, that was
          verified against a real profile with real dates on it before they were let in.
        </p>
        <p className="text-bone">
          We do not publish what we look for. Criteria you can read are criteria you can write a
          profile to satisfy, and then the room is worth less to everyone already in it.
        </p>
      </Section>

      <Section id="judgement" eyebrow="Judgement" title="A person reads anything unclear.">
        <p>
          Job titles are not standardised — the same work goes by five names depending on the
          company. So a request that is not clear-cut is read by a person rather than decided
          automatically.
        </p>
        <p className="text-bone">
          Turning away someone real costs more than making them wait a day. Every uncertain case is
          resolved in that direction.
        </p>
      </Section>

      <Section id="taxonomy" eyebrow="Your circle" title="One city, one kind of work.">
        <p>
          A circle is the smallest useful group: people doing your job, in your city. Cities that
          share a commute share a room — Gurugram, Noida and New Delhi are one circle, because they
          are one Tuesday evening.
        </p>
        <p>
          You tell us your city and your role; we work out the rest. There is no niche to choose and
          no taxonomy to learn.
        </p>
        <p>
          <Link href="/directory" className="text-gold hover:text-gold-bright">
            Browse the directory →
          </Link>
        </p>
      </Section>

      <Section id="whatsapp" eyebrow="The group" title="Where the network actually happens.">
        <p>
          Once you are in, you are added to your circle&apos;s WhatsApp group — a real group of
          people doing your job in your city, not a feed.
        </p>
        <p>
          Groups are capped at {POLICY.whatsappGroupCapacity}. When one fills, the next opens rather
          than letting the room grow until nobody speaks.
        </p>
      </Section>

      <Section id="privacy" eyebrow="Privacy" title="What is stored, and what is never shown.">
        <p>
          We keep what the check needs and what it takes to reach you: your name, your LinkedIn, your
          number, your company and role, and the circle you belong in.
        </p>
        <p>
          None of it is public. The directory shows circles and counts, never people. Numbers are
          readable only by the server, and IP addresses are hashed rather than stored.
        </p>
        <p className="text-bone">
          We never post to your LinkedIn, and we never read your connections or messages.
        </p>
      </Section>

      <section className="rule">
        <div className="shell py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-balance font-display text-4xl leading-tight text-bone sm:text-5xl">
            Ask for an invite.
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
