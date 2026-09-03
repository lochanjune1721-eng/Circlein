/**
 * Push the taxonomy in lib/taxonomy into Supabase. Idempotent — run it again
 * after editing the taxonomy and it upserts.
 *
 *   npm run db:seed
 */
import { CITIES, METROS } from '../lib/taxonomy/cities'
import { COUNTRIES } from '../lib/taxonomy/countries'
import { NICHES, NICHE_GROUPS } from '../lib/taxonomy/niches'
import { ROLES, ROLE_FAMILIES } from '../lib/taxonomy/roles'
import { SENIORITY } from '../lib/taxonomy/seniority'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

async function upsert(table: string, rows: Record<string, unknown>[]) {
  // Chunked so a large table does not exceed the request size limit.
  const size = 200
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size)
    const { error } = await db.from(table).upsert(chunk, { onConflict: 'slug' })
    if (error) throw new Error(`${table}: ${error.message}`)
  }
  console.log(`  ${table.padEnd(18)} ${rows.length}`)
}

async function main() {
  console.log('Seeding taxonomy…')

  // Order matters: children reference parents.
  await upsert(
    'niche_groups',
    NICHE_GROUPS.map((g, i) => ({ slug: g.slug, name: g.name, blurb: g.blurb, sort: i })),
  )
  await upsert(
    'niches',
    NICHES.map((n) => ({ slug: n.slug, name: n.name, group: n.group, aliases: n.aliases ?? [] })),
  )
  await upsert(
    'countries',
    COUNTRIES.map((c) => ({
      slug: c.slug, name: c.name, code: c.code, region: c.region, emoji: c.emoji, aliases: c.aliases ?? [],
    })),
  )
  await upsert('metros', METROS.map((m) => ({ slug: m.slug, name: m.name, country: m.country })))
  await upsert(
    'cities',
    CITIES.map((c) => ({
      slug: c.slug, name: c.name, country: c.country, area: c.area ?? null,
      metro: c.metro ?? null, aliases: c.aliases ?? [],
    })),
  )
  await upsert(
    'role_families',
    ROLE_FAMILIES.map((f) => ({ slug: f.slug, name: f.name, niches: f.niches })),
  )
  await upsert(
    'roles',
    ROLES.map((r) => ({ slug: r.slug, name: r.name, family: r.family, aliases: r.aliases ?? [] })),
  )
  await upsert(
    'seniority_levels',
    SENIORITY.map((s) => ({ slug: s.slug, name: s.name, rank: s.rank })),
  )

  console.log('Done.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
