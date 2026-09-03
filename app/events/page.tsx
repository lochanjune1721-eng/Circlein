import type { Metadata } from 'next'
import Link from 'next/link'
import { EventCard } from '@/components/event-card'
import { SignInPrompt } from '@/components/sign-in-prompt'
import { isSupabaseConfigured } from '@/lib/config'
import { listEvents } from '@/lib/events'
import { currentIdentity } from '@/lib/supabase/auth'
import { CITY_BY_SLUG } from '@/lib/taxonomy/cities'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Evenings organised by CircleIn — small rooms of people doing the same work in the same city.',
}

export const dynamic = 'force-dynamic'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>
}) {
  const { city: citySlug } = await searchParams
  const city = citySlug ? CITY_BY_SLUG.get(citySlug) : undefined

  const events = await listEvents({ citySlug: city?.slug, limit: 60 })
  const identity = await currentIdentity()

  // Cities that actually have something on, for the filter row.
  const all = city ? await listEvents({ limit: 200 }) : events
  const cities = [...new Map(all.map((e) => [e.city, { slug: e.city, name: e.city_name }])).values()].sort(
    (a, b) => a.name.localeCompare(b.name),
  )

  return (
    <div className="shell pb-24 pt-16">
      <p className="eyebrow">Events</p>
      <h1 className="mt-5 max-w-3xl text-balance font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.03] text-bone">
        The group chat, in a room.
      </h1>
      <p className="mt-6 max-w-prose text-[16px] leading-relaxed text-bone-dim">
        CircleIn organises small evenings for its circles — twelve to forty people who already do
        the same work in the same city, so nobody has to explain what they do twice. Members RSVP;
        everyone else is welcome to see what is coming.
      </p>

      {cities.length > 1 ? (
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Filter by city">
          <Link
            href="/events"
            className={`chip transition-colors ${!city ? 'border-gold/60 !text-gold' : 'hover:border-gold/50'}`}
          >
            Everywhere
          </Link>
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/events?city=${c.slug}`}
              className={`chip transition-colors ${
                city?.slug === c.slug ? 'border-gold/60 !text-gold' : 'hover:border-gold/50'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {events.length > 0 ? (
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-xl border border-ink-line bg-ink-card p-10 text-center">
          <p className="font-display text-3xl text-bone">
            {city ? `Nothing in ${city.name} yet.` : 'Nothing on the calendar yet.'}
          </p>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-bone-dim">
            Events open where circles are full enough to fill a room. Get verified into yours and
            you will be the first to hear.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/apply" className="btn-primary">
              Request an invite
            </Link>
            {city ? (
              <Link href="/events" className="btn-ghost">
                See every city
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {!identity ? (
        <SignInPrompt
          className="mt-12"
          title="RSVPs are for verified members."
          body="Sign in with LinkedIn to take a place. If you are not a member yet, requesting an invite takes about two minutes."
          next="/events"
          available={isSupabaseConfigured()}
        />
      ) : null}
    </div>
  )
}
