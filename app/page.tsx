import Link from 'next/link'
import { EventCard } from '@/components/event-card'
import { LinkedInButton } from '@/components/linkedin-button'
import { POLICY, publicSupabaseConfig } from '@/lib/config'
import { listEvents } from '@/lib/events'
import { currentIdentity } from '@/lib/supabase/auth'
import { CITIES, CITY_BY_SLUG } from '@/lib/taxonomy/cities'
import { COUNTRY_BY_SLUG } from '@/lib/taxonomy/countries'
import { NICHES, NICHE_GROUPS } from '@/lib/taxonomy/niches'
import { ROLES } from '@/lib/taxonomy/roles'
import { HeroPanel } from '@/components/hero-panel'
import { VerificationSteps } from '@/components/verification-steps'

/**
 * The landing page has one job: make it obvious in five seconds what this is,
 * why the door is locked, and that the room behind it is worth the wait.
 */

/**
 * Rendered per request, not prerendered.
 *
 * This page reads the session and the Supabase config to decide whether to
 * offer sign-in. Without this, Next prerenders it — and it *would* prerender,
 * because with no config `sessionClient()` returns before it ever touches
 * cookies, so nothing marks the page dynamic. The result is a build with the
 * "sign-in unavailable" branch frozen into the HTML, which then ignores the
 * environment variables forever.
 */
export const dynamic = 'force-dynamic'

const SAMPLE_CIRCLES: { city: string; niche: string }[] = [
  { city: 'bengaluru', niche: 'ai' },
  { city: 'san-francisco', niche: 'venture-capital' },
  { city: 'mumbai', niche: 'product-management' },
  { city: 'london', niche: 'machine-learning' },
  { city: 'new-delhi', niche: 'startups' },
  { city: 'singapore', niche: 'fintech' },
  { city: 'berlin', niche: 'product-design' },
  { city: 'pune', niche: 'software-engineering' },
  { city: 'dubai', niche: 'real-estate-investing' },
  { city: 'tokyo', niche: 'entrepreneurship' },
  { city: 'new-york-city', niche: 'private-equity' },
  { city: 'hyderabad', niche: 'data-science' },
]

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl text-bone sm:text-5xl">{value}</div>
      <div className="mt-1.5 text-[13px] text-bone-faint">{label}</div>
    </div>
  )
}

export default async function HomePage() {
  const [events, identity] = await Promise.all([listEvents({ limit: 3 }), currentIdentity()])
  const supabase = publicSupabaseConfig()
  const nicheCount = NICHES.length
  const cityCount = CITIES.length
  const roleCount = ROLES.length

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70"
          style={{
            background:
              'radial-gradient(60% 100% at 50% 0%, rgba(216,166,87,0.14), transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="shell relative pb-20 pt-20 sm:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
          <p className="eyebrow animate-fade">By verification only</p>

          <h1 className="mt-5 max-w-4xl text-balance font-display text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.98] tracking-tight text-bone animate-rise">
            The room you should
            <br />
            already be <em className="text-gold not-italic">in</em>.
          </h1>

          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-bone-dim animate-rise stagger" style={{ ['--i' as string]: 1 }}>
            CircleIn puts you in a small group of people doing your job, in your city. Not
            recruiters. Not your cousin&apos;s startup. The twelve people you would actually want to
            have coffee with on a Thursday.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3 animate-rise stagger" style={{ ['--i' as string]: 2 }}>
            {identity ? (
              <Link href="/apply" className="btn-primary">
                Finish your request
              </Link>
            ) : supabase ? (
              <LinkedInButton
                supabaseUrl={supabase.url}
                supabaseAnonKey={supabase.anonKey}
                label="Sign in with LinkedIn"
              />
            ) : (
              <Link href="/apply" className="btn-primary">
                Request an invite
              </Link>
            )}
            <Link href="/directory" className="btn-ghost">
              See the circles
            </Link>
          </div>

          <p className="mt-5 text-[13px] text-bone-faint animate-fade stagger" style={{ ['--i' as string]: 3 }}>
            {identity
              ? `Signed in as ${identity.fullName}.`
              : 'Signing in is how we know you are you. It takes one tap and no password.'}
          </p>
            </div>

            <div className="hidden lg:block">
              <HeroPanel />
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 border-t border-ink-line pt-10 sm:grid-cols-4">
            <StatBlock value={String(nicheCount)} label="Niches, not job boards" />
            <StatBlock value={String(cityCount)} label="Cities with real rooms" />
            <StatBlock value={String(roleCount)} label="Specific roles mapped" />
            <StatBlock value="0" label="Ways to buy your way in" />
          </div>
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────────────────── */}
      <section className="rule">
        <div className="shell grid gap-12 py-20 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Why this exists</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-bone sm:text-5xl">
              A network of ten thousand
              <br />
              is a network of nobody.
            </h2>
          </div>
          <div className="max-w-prose space-y-5 text-[16px] leading-relaxed text-bone-dim">
            <p>
              The big professional networks optimised for connections. The result is a feed of
              people you have never met, congratulating each other on jobs you cannot verify, in
              cities you do not live in.
            </p>
            <p>
              CircleIn optimises for the opposite thing: the smallest useful group. One city, one
              kind of work, everyone checked. When someone in your circle says they run growth at a
              Series B, that has been verified against a profile with real dates on it.
            </p>
            <p className="text-bone">
              You do not browse CircleIn. You get let into it, and then you talk to people.
            </p>
          </div>
        </div>
      </section>

      {/* ── How verification works ───────────────────────────────────────── */}
      <section className="rule bg-ink-raised/40">
        <div className="shell py-20">
          <p className="eyebrow">The door</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-bone sm:text-5xl">
            You request. We check. Then you are in the group.
          </h2>
          <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
            There is no public sign-up. You continue with LinkedIn so we know it is you, tell us
            what you do and where, and every request is verified against the profile behind it
            before anyone is let in.
          </p>

          <VerificationSteps className="mt-14" />
        </div>
      </section>

      {/* ── The taxonomy ─────────────────────────────────────────────────── */}
      <section className="rule">
        <div className="shell py-20">
          <p className="eyebrow">How we sort people</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-bone sm:text-5xl">
            Three dimensions. No duplicates.
          </h2>
          <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
            &ldquo;Engineer&rdquo; and &ldquo;Marketing&rdquo; are not categories, they are shrugs.
            Every member sits at one point in a structured space, so a search means something.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                n: '01',
                title: 'Country → City',
                body: `${cityCount} cities, grouped by the market people actually commute into. Gurugram and Noida share a room with New Delhi, because they share a Tuesday evening.`,
              },
              {
                n: '02',
                title: 'Niche',
                body: `${nicheCount} niches across ${NICHE_GROUPS.length} families. AI is not Software Engineering, and Growth is not Marketing. Each label means one thing and appears once.`,
              },
              {
                n: '03',
                title: 'Role + Seniority',
                body: `${roleCount} specific roles, held separately from ${'seniority'}. You are a Backend Engineer who is Senior — never a permanently separate species called "Senior Backend Engineer".`,
              },
            ].map((item, i) => (
              <article
                key={item.n}
                className="card animate-rise stagger p-7"
                style={{ ['--i' as string]: i }}
              >
                <div className="font-mono text-[12px] text-gold">{item.n}</div>
                <h3 className="mt-4 font-display text-2xl text-bone">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-bone-dim">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-ink-line bg-ink-card p-7">
            <p className="eyebrow">What that buys you</p>
            <ul className="mt-4 grid gap-x-10 gap-y-2.5 text-[15px] text-bone-dim sm:grid-cols-2">
              {[
                'Senior AI engineers in Bengaluru',
                'Growth people in San Francisco',
                'Product managers in Mumbai',
                'Founders in Tokyo',
                'VC partners in New York',
                'Backend engineers in Pune',
              ].map((example) => (
                <li key={example} className="flex items-baseline gap-2.5">
                  <span aria-hidden="true" className="text-gold">
                    ·
                  </span>
                  {example}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Sample circles ───────────────────────────────────────────────── */}
      <section className="rule">
        <div className="shell py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">A few rooms</p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-bone sm:text-5xl">
                Find yours.
              </h2>
            </div>
            <Link href="/directory" className="text-[14px] text-gold hover:text-gold-bright">
              Browse the full directory →
            </Link>
          </div>

          <div className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_CIRCLES.map((sample, i) => {
              const city = CITY_BY_SLUG.get(sample.city)
              const niche = NICHES.find((n) => n.slug === sample.niche)
              const country = city ? COUNTRY_BY_SLUG.get(city.country) : undefined
              if (!city || !niche) return null
              return (
                <Link
                  key={`${sample.city}-${sample.niche}`}
                  href={`/circles/${city.slug}/${niche.slug}`}
                  className="group card animate-rise stagger p-5 transition-colors hover:border-gold/50"
                  style={{ ['--i' as string]: i }}
                >
                  <div className="flex items-center gap-2 text-[13px] text-bone-faint">
                    <span aria-hidden="true">{country?.emoji}</span>
                    {city.name}
                  </div>
                  <div className="mt-2 font-display text-2xl text-bone transition-colors group-hover:text-gold">
                    {niche.name}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Events ───────────────────────────────────────────────────────── */}
      <section className="rule bg-ink-raised/40">
        <div className="shell py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Events by CircleIn</p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-bone sm:text-5xl">
                Eventually, everyone
                <br />
                is in the same room.
              </h2>
            </div>
            <Link href="/events" className="text-[14px] text-gold hover:text-gold-bright">
              See what is on →
            </Link>
          </div>

          <p className="mt-6 max-w-prose text-[16px] leading-relaxed text-bone-dim">
            A group chat is a start. CircleIn organises small evenings for its circles — twelve to
            forty people who already do the same work in the same city, so nobody spends the first
            hour explaining what they do.
          </p>

          {events.length > 0 ? (
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {events.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          ) : (
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                { n: '01', title: 'Small on purpose', body: 'Capped so everyone can actually talk. When one fills, another opens rather than the room growing until nobody speaks.' },
                { n: '02', title: 'One circle at a time', body: 'A room of AI engineers in Bengaluru, or product designers in Berlin. Sometimes a whole city, when the point is to cross over.' },
                { n: '03', title: 'Members only', body: 'Everyone in the room has been through the same door, so an introduction is worth something.' },
              ].map((item, i) => (
                <article key={item.n} className="card animate-rise stagger p-7" style={{ ['--i' as string]: i }}>
                  <div className="font-mono text-[12px] text-gold">{item.n}</div>
                  <h3 className="mt-4 font-display text-2xl text-bone">{item.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-bone-dim">{item.body}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Closing ──────────────────────────────────────────────────────── */}
      <section className="rule">
        <div className="shell py-24 text-center">
          <h2 className="mx-auto max-w-3xl text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] text-bone">
            If you do the work, there is a seat.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[16px] leading-relaxed text-bone-dim">
            Requests are checked in the order they arrive. You will hear back with a decision and,
            if you are in, a place in your circle&apos;s WhatsApp group.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {identity ? (
              <Link href="/apply" className="btn-primary">
                Finish your request
              </Link>
            ) : supabase ? (
              <LinkedInButton
                supabaseUrl={supabase.url}
                supabaseAnonKey={supabase.anonKey}
                label="Sign in with LinkedIn"
              />
            ) : (
              <Link href="/apply" className="btn-primary">
                Request an invite
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
