/**
 * Sample events, to see the feature working before you have real ones.
 *
 *   npm run db:seed:events              # inserts them as drafts (invisible)
 *   npm run db:seed:events -- --publish # makes them publicly visible
 *
 * Drafts by default on purpose: these are made-up evenings, and an invented
 * event on a public page is a small lie told to anyone who reads it. Publish
 * them only for a demo, and delete them before real people arrive.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.')
  process.exit(1)
}

const publish = process.argv.includes('--publish')
const db = createClient(url, key, { auth: { persistSession: false } })

function daysFromNow(days: number, hour: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString()
}

const SAMPLES = [
  {
    slug: 'ai-bengaluru-first-thursday',
    title: 'First Thursday',
    summary: 'The AI circle in Bengaluru, in a room, for the first time.',
    description: `No talks, no badges, no pitch deck on a projector.

Thirty people who all work on AI in this city, in one room, for three hours. We put a bar tab behind it and get out of the way.

Bring the problem you are stuck on. Someone here has already hit it.`,
    city: 'bengaluru',
    niche: 'ai',
    starts_at: daysFromNow(18, 13),
    ends_at: daysFromNow(18, 16),
    timezone: 'Asia/Kolkata',
    venue_name: 'Venue shared with attendees',
    venue_area: 'Indiranagar',
    capacity: 30,
    cover_emoji: '🌆',
  },
  {
    slug: 'founders-table-mumbai',
    title: "The Founders' Table",
    summary: 'Twelve founders, one long table, no audience.',
    description: `A dinner, not a panel. Twelve people who have each started something, seated at one table.

The only rule is that nothing said at the table leaves it.`,
    city: 'mumbai',
    niche: 'entrepreneurship',
    starts_at: daysFromNow(25, 14),
    ends_at: daysFromNow(25, 17),
    timezone: 'Asia/Kolkata',
    venue_name: 'Venue shared with attendees',
    venue_area: 'Lower Parel',
    capacity: 12,
    cover_emoji: '🕯️',
  },
  {
    slug: 'design-london-crit',
    title: 'Crit Night',
    summary: 'Bring something unfinished. Leave with it improved.',
    description: `Six designers show work in progress for ten minutes each. Everyone else says what they actually think.

Unfinished work only — polished portfolios are not useful to anyone here.`,
    city: 'london',
    niche: 'product-design',
    starts_at: daysFromNow(11, 18),
    ends_at: daysFromNow(11, 21),
    timezone: 'Europe/London',
    venue_name: 'Venue shared with attendees',
    venue_area: 'Shoreditch',
    capacity: 24,
    cover_emoji: '✏️',
  },
  {
    slug: 'sf-cross-circle-mixer',
    title: 'Everyone, Once a Quarter',
    summary: 'Every San Francisco circle in one room for one evening.',
    description: `Most CircleIn evenings are one circle deep. This one is the opposite: engineers, investors, designers, growth people, founders — everyone we have verified in this city.

It is the night to meet the people you would never otherwise be in a room with.`,
    city: 'san-francisco',
    niche: null,
    starts_at: daysFromNow(32, 1),
    ends_at: daysFromNow(32, 4),
    timezone: 'America/Los_Angeles',
    venue_name: 'Venue shared with attendees',
    venue_area: 'Mission District',
    capacity: 80,
    cover_emoji: '🌉',
  },
]

async function main() {
  const rows = SAMPLES.map((event) => ({
    ...event,
    status: publish ? 'published' : 'draft',
    host_name: 'CircleIn',
    is_online: false,
  }))

  const { error } = await db.from('events').upsert(rows, { onConflict: 'slug' })
  if (error) {
    console.error(`Seeding events failed: ${error.message}`)
    process.exit(1)
  }

  console.log(`Seeded ${rows.length} sample events as ${publish ? 'PUBLISHED' : 'drafts'}.`)
  if (publish) {
    console.log('\nThese are invented events and are now publicly visible.')
    console.log('Delete them before real members arrive:')
    console.log(`  delete from events where slug in (${SAMPLES.map((s) => `'${s.slug}'`).join(', ')});`)
  } else {
    console.log('Re-run with --publish to make them visible.')
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
