import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RsvpButton } from '@/components/rsvp-button'
import { SignInPrompt } from '@/components/sign-in-prompt'
import { publicSupabaseConfig } from '@/lib/config'
import {
  eventBySlug,
  eventDescription,
  isFull,
  listEvents,
  memberForUser,
  rsvpStateFor,
  spacesLeft,
} from '@/lib/events'
import { formatEventDate, formatEventTime } from '@/lib/format'
import { currentIdentity } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = await eventBySlug(slug)
  if (!event) return { title: 'Event not found' }
  return { title: event.title, description: event.summary }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await eventBySlug(slug)
  if (!event) notFound()

  const [description, identity] = await Promise.all([eventDescription(slug), currentIdentity()])

  // Membership, not just a session, is what unlocks the RSVP.
  const member = identity ? await memberForUser(identity.authUserId) : null
  const state = member ? await rsvpStateFor(event.id, member.id) : null

  const left = spacesLeft(event)
  const full = isFull(event)
  const past = new Date(event.starts_at) < new Date()

  const alsoOn = (await listEvents({ citySlug: event.city, limit: 4 })).filter(
    (e) => e.slug !== event.slug,
  )

  return (
    <div className="shell pb-24 pt-16">
      <nav aria-label="Breadcrumb" className="text-[13px] text-bone-faint [&_a]:inline-block [&_a]:py-1.5">
        <Link href="/events" className="hover:text-bone">
          Events
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-bone-dim">{event.city_name}</span>
      </nav>

      <div className="mt-8 grid gap-14 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <span aria-hidden="true" className="text-4xl">
            {event.cover_emoji}
          </span>

          <p className="eyebrow mt-6">
            {event.niche_name ? `${event.niche_name} · ${event.city_name}` : `All of ${event.city_name}`}
          </p>

          <h1 className="mt-4 max-w-3xl text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.03] text-bone">
            {event.title}
          </h1>

          <p className="mt-6 max-w-prose text-[17px] leading-relaxed text-bone-dim">{event.summary}</p>

          {description ? (
            <div className="mt-8 max-w-prose space-y-4 text-[16px] leading-relaxed text-bone-dim">
              {description
                .split(/\n{2,}/)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>
          ) : null}

          {event.niche ? (
            <p className="mt-10 text-[14px] text-bone-faint">
              Organised for the{' '}
              <Link
                href={`/circles/${event.city}/${event.niche}`}
                className="text-gold hover:text-gold-bright"
              >
                {event.niche_name} · {event.city_name}
              </Link>{' '}
              circle.
            </p>
          ) : null}

          {alsoOn.length > 0 ? (
            <div className="mt-14">
              <h2 className="eyebrow">Also on in {event.city_name}</h2>
              <ul className="mt-5 space-y-2">
                {alsoOn.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={`/events/${other.slug}`}
                      className="flex items-baseline justify-between gap-4 rounded-lg border border-ink-line bg-ink-card px-4 py-3 text-[14px] transition-colors hover:border-gold/50"
                    >
                      <span className="text-bone-dim">{other.title}</span>
                      <span className="shrink-0 text-[12px] text-bone-faint">
                        {formatEventDate(other.starts_at, other.timezone)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <dl className="space-y-4 text-[14px]">
              <div>
                <dt className="text-bone-faint">When</dt>
                <dd className="mt-1 text-bone">
                  {formatEventDate(event.starts_at, event.timezone)}
                  <span className="block text-bone-dim">
                    {formatEventTime(event.starts_at, event.timezone)}
                    {event.ends_at ? ` – ${formatEventTime(event.ends_at, event.timezone)}` : ''}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-bone-faint">Where</dt>
                <dd className="mt-1 text-bone">
                  {event.is_online ? 'Online' : (event.venue_name ?? 'Venue shared with attendees')}
                  {!event.is_online && event.venue_area ? (
                    <span className="block text-bone-dim">{event.venue_area}</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-bone-faint">Hosted by</dt>
                <dd className="mt-1 text-bone">{event.host_name}</dd>
              </div>
              <div>
                <dt className="text-bone-faint">Room</dt>
                <dd className="mt-1 text-bone">
                  {event.capacity === null
                    ? `${event.rsvp_count} going`
                    : `${event.rsvp_count} of ${event.capacity} places taken`}
                  {left !== null && left > 0 && left <= 12 ? (
                    <span className="block text-gold">{left} left</span>
                  ) : null}
                  {full ? <span className="block text-flag">Full — waitlist open</span> : null}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              {past ? (
                <p className="text-[14px] text-bone-faint">This one has already happened.</p>
              ) : member ? (
                <RsvpButton slug={event.slug} initialState={state} full={full} />
              ) : identity ? (
                <div className="rounded-lg border border-ink-line bg-ink-raised p-4">
                  <p className="text-[14px] text-bone">Verified members only.</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-bone-dim">
                    You are signed in, but your circle membership has not come through yet.
                  </p>
                  <Link href="/status" className="mt-3 inline-block text-[13px] text-gold hover:text-gold-bright">
                    Check your request →
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          {!identity && !past ? (
            <SignInPrompt
              className="mt-4"
              title="Sign in to take a place."
              body="Places are held for verified members. Signing in with LinkedIn is the first step."
              supabase={publicSupabaseConfig()}
            />
          ) : null}
        </aside>
      </div>
    </div>
  )
}
