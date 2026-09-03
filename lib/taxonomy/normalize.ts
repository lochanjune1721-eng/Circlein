import { CITIES, CITY_BY_SLUG, METRO_BY_SLUG } from './cities'
import { COUNTRIES, COUNTRY_BY_SLUG } from './countries'
import { NICHES, NICHE_BY_SLUG } from './niches'
import { ROLE_BY_SLUG, ROLE_FAMILY_BY_SLUG, ROLES } from './roles'
import { SENIORITY } from './seniority'
import type { City, Country, Niche, Role, Slug } from './types'
import type { SeniorityLevel } from './seniority'

/**
 * Turning messy real-world strings into taxonomy rows.
 *
 * A LinkedIn headline reads "Sr. Backend Engineer II @ Acme (Bangalore)". The
 * database needs role=backend-engineer, seniority=senior, city=bengaluru. These
 * helpers do that, and report how confident they are so the verification step
 * can escalate a weak match to a human instead of guessing.
 */

export interface TitleMatch {
  role: Role | null
  seniority: SeniorityLevel | null
  /** 0–1. Anything below 0.5 should be confirmed by a person. */
  confidence: number
  /** The exact taxonomy string that matched, for audit trails. */
  matchedOn: string | null
}

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function canonicalise(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+#&/ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when `needle` appears in `haystack` on word boundaries. */
function containsPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack)
}

/**
 * Everything before an "@", "|", "-" or "at" is the title; the rest is usually
 * the company. Splitting first stops "Stripe" in "PM at Stripe" from colliding
 * with taxonomy terms.
 */
export function titlePart(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim()
  const separators = [' @ ', ' | ', ' at ', ' · ', ' — ', ' – ']
  let earliest = cleaned.length
  for (const sep of separators) {
    const idx = cleaned.toLowerCase().indexOf(sep)
    if (idx > 0 && idx < earliest) earliest = idx
  }
  return cleaned.slice(0, earliest).trim()
}

/** Filler words that carry no signal once seniority has been pulled out. */
const STOPWORDS = new Set(['of', 'the', 'and', '&', 'for', 'a', 'an', 'in', 'to', 'officer'])

/**
 * A bare function word, used only when no role phrase matched at all. Kept
 * deliberately small and matched exactly — guessing broadly here would quietly
 * mis-file people, which is worse than admitting we do not know.
 */
const FUNCTION_FALLBACK: Record<string, string> = {
  engineering: 'engineering-manager',
  technology: 'engineering-manager',
  product: 'product-manager',
  design: 'product-designer',
  marketing: 'marketing-manager',
  growth: 'growth-manager',
  sales: 'account-executive',
  finance: 'financial-analyst',
  operations: 'operations-manager',
  people: 'hr-generalist',
  talent: 'recruiter',
  legal: 'corporate-counsel',
  security: 'security-engineer',
  data: 'data-scientist',
  research: 'research-scientist',
  strategy: 'management-consultant',
  executive: 'chief-executive',
  operating: 'operations-manager',
  financial: 'financial-analyst',
  revenue: 'account-executive',
  'information security': 'security-engineer',
  partnerships: 'partnerships-manager',
  communications: 'communications-manager',
  'customer success': 'customer-success-manager',
  'business development': 'business-development-manager',
  'human resources': 'hr-generalist',
}

/** Remove the matched seniority terms and filler from an already-canonical title. */
function stripSeniority(title: string, seniority: SeniorityLevel | null): string {
  let out = title
  if (seniority) {
    for (const pattern of [...seniority.patterns].sort((a, b) => b.length - a.length)) {
      const needle = canonicalise(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      out = out.replace(new RegExp(`(^|[^a-z0-9])${needle}([^a-z0-9]|$)`, 'g'), ' ')
    }
  }
  return out
    .split(' ')
    .filter((w) => w && !STOPWORDS.has(w))
    .join(' ')
    .trim()
}

/**
 * Split a raw job title into role + seniority.
 *
 * Both are matched longest-phrase-first so "Senior Staff" beats "Senior" and
 * "Machine Learning Engineer" beats "Engineer".
 */
export function normalizeTitle(rawTitle: string): TitleMatch {
  const title = canonicalise(titlePart(rawTitle))
  if (!title) return { role: null, seniority: null, confidence: 0, matchedOn: null }

  // ── Role, longest phrase first ─────────────────────────────────────────
  // "Machine Learning Engineer" must beat "Engineer", and "Growth Marketing
  // Manager" must beat "Marketing Manager".
  const roleCandidates: { role: Role; phrase: string }[] = []
  for (const role of ROLES) {
    for (const phrase of [role.name, ...(role.aliases ?? [])]) {
      const needle = canonicalise(phrase)
      if (containsPhrase(title, needle)) roleCandidates.push({ role, phrase })
    }
  }
  roleCandidates.sort((a, b) => canonicalise(b.phrase).length - canonicalise(a.phrase).length)
  const best = roleCandidates[0]
  const rolePhrase = best ? canonicalise(best.phrase) : ''

  // ── Seniority ──────────────────────────────────────────────────────────
  // A seniority word already inside the matched role is part of the job title,
  // not a level: a "Product Manager" is not seniority Manager, and an
  // "Engineering Manager" is not either. Only words outside the role count.
  const seniorityCandidates: { level: SeniorityLevel; pattern: string }[] = []
  for (const level of SENIORITY) {
    for (const pattern of level.patterns) {
      const needle = canonicalise(pattern)
      if (!containsPhrase(title, needle)) continue
      if (rolePhrase && containsPhrase(rolePhrase, needle)) continue
      seniorityCandidates.push({ level, pattern: needle })
    }
  }
  seniorityCandidates.sort((a, b) => b.pattern.length - a.pattern.length)
  const seniority = seniorityCandidates[0]?.level ?? null

  if (!best) {
    // Executive titles name a function, not a job: "VP of Engineering" has no
    // role phrase in it at all. Strip the seniority and the filler, and see if
    // what remains is a bare function word we can map.
    const remainder = stripSeniority(title, seniority)
    const fallback = FUNCTION_FALLBACK[remainder]
    if (fallback) {
      const role = ROLE_BY_SLUG.get(fallback) ?? null
      return { role, seniority, confidence: role ? 0.6 : 0, matchedOn: remainder }
    }
    // A recognised seniority alone is weak but not nothing — "Senior Manager"
    // tells us the level even when the function is unclear.
    return { role: null, seniority, confidence: seniority ? 0.2 : 0, matchedOn: null }
  }

  // Confidence rises with how much of the title the match explains, so a bare
  // "Engineer" inside a long unfamiliar title stays low.
  const coverage = rolePhrase.length / title.length
  const exact = canonicalise(best.role.name) === title
  const confidence = exact ? 1 : Math.min(0.95, 0.45 + coverage * 0.5)

  return { role: best.role, seniority, confidence, matchedOn: best.phrase }
}

/** Niches this role most plausibly belongs to, best first. */
export function suggestNiches(roleSlug: Slug): Niche[] {
  const role = ROLE_BY_SLUG.get(roleSlug)
  if (!role) return []
  const family = ROLE_FAMILY_BY_SLUG.get(role.family)
  if (!family) return []
  return family.niches
    .map((slug) => NICHE_BY_SLUG.get(slug))
    .filter((n): n is Niche => Boolean(n))
}

/** Generic name-or-alias lookup shared by the resolvers below. */
function resolveByName<T extends { slug: string; name: string; aliases?: string[] }>(
  raw: string,
  rows: T[],
  bySlug: Map<string, T>,
): T | null {
  const needle = canonicalise(raw)
  if (!needle) return null
  const direct = bySlug.get(needle) ?? bySlug.get(needle.replace(/ /g, '-'))
  if (direct) return direct
  for (const row of rows) {
    if (canonicalise(row.name) === needle) return row
    for (const alias of row.aliases ?? []) {
      if (canonicalise(alias) === needle) return row
    }
  }
  return null
}

export function resolveCity(raw: string): City | null {
  return resolveByName(raw, CITIES, CITY_BY_SLUG)
}

/**
 * Every city whose name or alias matches. City names repeat across countries —
 * Cambridge is in both Massachusetts and England — so callers that know the
 * country must be able to pick, rather than take whichever row came first.
 */
export function resolveCities(raw: string): City[] {
  const needle = canonicalise(raw)
  if (!needle) return []
  const bySlug = CITY_BY_SLUG.get(needle) ?? CITY_BY_SLUG.get(needle.replace(/ /g, '-'))
  const matches = CITIES.filter(
    (c) =>
      canonicalise(c.name) === needle ||
      (c.aliases ?? []).some((a) => canonicalise(a) === needle),
  )
  if (bySlug && !matches.includes(bySlug)) matches.unshift(bySlug)
  return matches
}

export function resolveCountry(raw: string): Country | null {
  return resolveByName(raw, COUNTRIES, COUNTRY_BY_SLUG)
}

export function resolveNiche(raw: string): Niche | null {
  return resolveByName(raw, NICHES, NICHE_BY_SLUG)
}

/**
 * Parse a LinkedIn-style location string ("Bengaluru, Karnataka, India",
 * "Greater London, United Kingdom") into a city and country.
 *
 * LinkedIn writes location most-specific-first, so each comma-separated part is
 * tried as a city and the trailing part as a country. Metro names resolve too,
 * which is how "Delhi NCR" and "San Francisco Bay Area" land correctly.
 */
export function resolveLocation(raw: string): { city: City | null; country: Country | null } {
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return { city: null, country: null }

  let country: Country | null = null
  for (let i = parts.length - 1; i >= 0; i--) {
    const found = resolveCountry(parts[i] as string)
    if (found) {
      country = found
      break
    }
  }

  let city: City | null = null
  // Bound to a const so the closure below keeps the narrowing.
  const resolvedCountry = country
  for (const part of parts) {
    const candidates = resolveCities(part)
    if (candidates.length === 0) continue
    const inCountry = resolvedCountry
      ? candidates.find((c) => c.country === resolvedCountry.slug)
      : undefined
    // With no country resolved, any single match is safe to take; an ambiguous
    // name with no country to disambiguate it is left unresolved on purpose.
    const chosen =
      inCountry ?? (resolvedCountry ? undefined : candidates.length === 1 ? candidates[0] : undefined)
    if (chosen) {
      city = chosen
      break
    }
  }

  // Fall back to a metro name — "Bay Area" is not a city but points at one.
  if (!city) {
    for (const part of parts) {
      const needle = canonicalise(part)
      for (const metro of METRO_BY_SLUG.values()) {
        if (canonicalise(metro.name).includes(needle) && needle.length > 3) {
          city = CITIES.find((c) => c.metro === metro.slug) ?? null
          break
        }
      }
      if (city) break
    }
  }

  if (city && !country) country = COUNTRY_BY_SLUG.get(city.country) ?? null
  return { city, country }
}
