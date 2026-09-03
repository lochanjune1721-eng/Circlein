/**
 * Taxonomy integrity check. Run with `npm run taxonomy:check`.
 *
 * The whole product rests on these three dimensions being clean, so this
 * asserts the invariants that would otherwise rot silently: unique slugs, no
 * label meaning two things, no orphaned foreign keys, no dead ends in the
 * directory.
 */
import { CITIES, METROS, citiesInCountry } from '../lib/taxonomy/cities'
import { COUNTRIES, COUNTRY_BY_SLUG } from '../lib/taxonomy/countries'
import { NICHES, NICHE_GROUPS } from '../lib/taxonomy/niches'
import { ROLES, ROLE_FAMILIES } from '../lib/taxonomy/roles'
import { SENIORITY } from '../lib/taxonomy/seniority'
import { canonicalise, normalizeTitle, resolveLocation } from '../lib/taxonomy/normalize'
import { NICHE_BY_SLUG } from '../lib/taxonomy/niches'

const problems: string[] = []

function uniqueSlugs(label: string, rows: { slug: string }[]) {
  const seen = new Set<string>()
  for (const row of rows) {
    if (seen.has(row.slug)) problems.push(`${label}: duplicate slug "${row.slug}"`)
    seen.add(row.slug)
  }
}

function slugFormat(label: string, rows: { slug: string }[]) {
  for (const row of rows) {
    if (!/^[a-z0-9-]+$/.test(row.slug)) problems.push(`${label}: slug "${row.slug}" is not URL-safe`)
  }
}

uniqueSlugs('niches', NICHES)
uniqueSlugs('niche groups', NICHE_GROUPS)
uniqueSlugs('countries', COUNTRIES)
uniqueSlugs('cities', CITIES)
uniqueSlugs('metros', METROS)
uniqueSlugs('roles', ROLES)
uniqueSlugs('role families', ROLE_FAMILIES)
uniqueSlugs('seniority', SENIORITY)

slugFormat('niches', NICHES)
slugFormat('countries', COUNTRIES)
slugFormat('cities', CITIES)
slugFormat('roles', ROLES)

// No label may mean two different rows within one dimension — that is exactly
// the duplicate/synonym mess the taxonomy exists to prevent.
function uniqueLabels(label: string, rows: { slug: string; name: string; aliases?: string[] }[]) {
  const seen = new Map<string, string>()
  for (const row of rows) {
    for (const term of [row.name, ...(row.aliases ?? [])]) {
      const key = canonicalise(term)
      const existing = seen.get(key)
      if (existing && existing !== row.slug) {
        problems.push(`${label}: "${term}" maps to both "${existing}" and "${row.slug}"`)
      }
      seen.set(key, row.slug)
    }
  }
}

uniqueLabels('niches', NICHES)
uniqueLabels('countries', COUNTRIES)
uniqueLabels('roles', ROLES)

// Cities may repeat a name across countries (Cambridge), so only check within.
for (const country of COUNTRIES) {
  uniqueLabels(`cities in ${country.slug}`, citiesInCountry(country.slug))
}

// Referential integrity.
for (const city of CITIES) {
  if (!COUNTRY_BY_SLUG.has(city.country)) problems.push(`city "${city.slug}" references unknown country "${city.country}"`)
  if (city.metro && !METROS.some((m) => m.slug === city.metro)) {
    problems.push(`city "${city.slug}" references unknown metro "${city.metro}"`)
  }
}
for (const niche of NICHES) {
  if (!NICHE_GROUPS.some((g) => g.slug === niche.group)) problems.push(`niche "${niche.slug}" references unknown group "${niche.group}"`)
}
for (const family of ROLE_FAMILIES) {
  for (const nicheSlug of family.niches) {
    if (!NICHE_BY_SLUG.has(nicheSlug)) problems.push(`role family "${family.slug}" references unknown niche "${nicheSlug}"`)
  }
  for (const role of family.roles) {
    if (role.family !== family.slug) problems.push(`role "${role.slug}" declares family "${role.family}" but sits under "${family.slug}"`)
  }
}

// Every country must be reachable in the directory.
for (const country of COUNTRIES) {
  if (citiesInCountry(country.slug).length === 0) problems.push(`country "${country.slug}" has no cities — dead end in the directory`)
}

// Behavioural checks on the normaliser, which the verification step depends on.
const titleCases: [string, string, string | null][] = [
  ['Senior Backend Engineer', 'backend-engineer', 'senior'],
  ['Sr. Machine Learning Engineer @ Acme', 'machine-learning-engineer', 'senior'],
  ['VP of Engineering', 'engineering-manager', 'vp'],
  ['Staff Product Designer', 'product-designer', 'staff'],
  ['Co-Founder & CEO', 'founder', 'c-level'],
  ['Growth Marketing Manager', 'growth-manager', null],
  ['Data Scientist', 'data-scientist', null],
  ['Head of Growth', 'growth-manager', 'head'],
  ['Product Manager, Payments', 'product-manager', null],
  ['Chief Technology Officer', 'engineering-manager', 'c-level'],
  ['Founder', 'founder', null],
  ['Engineering Manager', 'engineering-manager', null],
  ['Senior Engineering Manager', 'engineering-manager', 'senior'],
  ['Lead Data Engineer', 'data-engineer', 'lead'],
  ['Associate Product Manager', 'product-manager', 'associate'],
]
for (const [raw, expectedRole, expectedSeniority] of titleCases) {
  const match = normalizeTitle(raw)
  if (match.role?.slug !== expectedRole) {
    problems.push(`normalizeTitle("${raw}") gave role "${match.role?.slug ?? 'none'}", expected "${expectedRole}"`)
  }
  if ((match.seniority?.slug ?? null) !== expectedSeniority) {
    problems.push(`normalizeTitle("${raw}") gave seniority "${match.seniority?.slug ?? 'none'}", expected "${expectedSeniority ?? 'none'}"`)
  }
}

const locationCases: [string, string, string][] = [
  ['Bengaluru, Karnataka, India', 'bengaluru', 'india'],
  ['Bangalore, India', 'bengaluru', 'india'],
  ['Gurgaon, Haryana, India', 'gurugram', 'india'],
  ['San Francisco, California, United States', 'san-francisco', 'united-states'],
  ['London, England, United Kingdom', 'london', 'united-kingdom'],
  ['Cambridge, Massachusetts, United States', 'cambridge-ma', 'united-states'],
  ['Cambridge, England, United Kingdom', 'cambridge-uk', 'united-kingdom'],
]
for (const [raw, expectedCity, expectedCountry] of locationCases) {
  const { city, country } = resolveLocation(raw)
  if (city?.slug !== expectedCity) problems.push(`resolveLocation("${raw}") gave city "${city?.slug ?? 'none'}", expected "${expectedCity}"`)
  if (country?.slug !== expectedCountry) problems.push(`resolveLocation("${raw}") gave country "${country?.slug ?? 'none'}", expected "${expectedCountry}"`)
}

console.log(
  [
    `niche groups   ${NICHE_GROUPS.length}`,
    `niches         ${NICHES.length}`,
    `countries      ${COUNTRIES.length}`,
    `metros         ${METROS.length}`,
    `cities         ${CITIES.length}`,
    `role families  ${ROLE_FAMILIES.length}`,
    `roles          ${ROLES.length}`,
    `seniority      ${SENIORITY.length}`,
  ].join('\n'),
)

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log('\nTaxonomy OK.')
