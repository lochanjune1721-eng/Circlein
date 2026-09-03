import Link from 'next/link'
import { formatEventDate, formatEventTime, relativeDay } from '@/lib/format'
import { isFull, spacesLeft } from '@/lib/events'
import type { EventDirectoryRow } from '@/lib/supabase/types'

export function EventCard({ event, index = 0 }: { event: EventDirectoryRow; index?: number }) {
  const left = spacesLeft(event)
  const full = isFull(event)

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group card animate-rise stagger flex flex-col p-6 transition-colors hover:border-gold/50"
      style={{ ['--i' as string]: Math.min(index, 10) }}
    >
      <div className="flex items-start justify-between gap-4">
        <span aria-hidden="true" className="text-2xl">
          {event.cover_emoji}
        </span>
        <span className="shrink-0 text-[12px] text-bone-faint">{relativeDay(event.starts_at)}</span>
      </div>

      <h3 className="mt-4 font-display text-2xl leading-snug text-bone transition-colors group-hover:text-gold">
        {event.title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-bone-dim">{event.summary}</p>

      <div className="flex-1" aria-hidden="true" />

      <dl className="mt-5 space-y-1.5 border-t border-ink-line pt-4 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-bone-faint">When</dt>
          <dd className="text-right text-bone-dim">
            {formatEventDate(event.starts_at, event.timezone)}
            <span className="block text-bone-faint">
              {formatEventTime(event.starts_at, event.timezone)}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-bone-faint">Where</dt>
          <dd className="text-right text-bone-dim">
            {event.is_online ? 'Online' : (event.venue_area ?? event.city_name)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-bone-faint">Who</dt>
          <dd className="text-right text-bone-dim">
            {event.niche_name ? `${event.niche_name} · ${event.city_name}` : `All of ${event.city_name}`}
          </dd>
        </div>
      </dl>

      <p className="mt-4 min-h-[18px] text-[12px]">
        {full ? (
          <span className="text-flag">Full — waitlist open</span>
        ) : left !== null && left <= 12 ? (
          <span className="text-gold">{left} places left</span>
        ) : null}
      </p>
    </Link>
  )
}
