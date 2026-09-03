import { CITIES } from './cities'
import { COUNTRY_BY_SLUG } from './countries'
import { NICHES } from './niches'
import { ROLES } from './roles'
import { canonicalise } from './normalize'
import type { City, Niche, Role } from './types'

export type SearchKind = 'niche' | 'city' | 'role'

export interface SearchHit {
  kind: SearchKind
  slug: string
  label: string
  /** Country name for cities, group for niches, family for roles. */
  context?: string
  score: number
}

/**
 * One typeahead over all three dimensions. Exact beats prefix beats substring,
 * and an alias hit scores just under a name hit so "Bangalore" finds Bengaluru
 * without outranking a city literally called that.
 */
export function searchTaxonomy(query: string, limit = 12): SearchHit[] {
  const q = canonicalise(query)
  if (q.length < 2) return []

  const hits: SearchHit[] = []

  const score = (name: string, aliases: string[] = []): number => {
    const n = canonicalise(name)
    if (n === q) return 100
    if (n.startsWith(q)) return 80 - Math.min(20, n.length - q.length)
    if (n.includes(q)) return 55
    for (const alias of aliases) {
      const a = canonicalise(alias)
      if (a === q) return 90
      if (a.startsWith(q)) return 70 - Math.min(20, a.length - q.length)
      if (a.includes(q)) return 45
    }
    return 0
  }

  for (const niche of NICHES as Niche[]) {
    const s = score(niche.name, niche.aliases)
    if (s > 0) hits.push({ kind: 'niche', slug: niche.slug, label: niche.name, context: 'Niche', score: s })
  }

  for (const city of CITIES as City[]) {
    const s = score(city.name, city.aliases)
    if (s > 0) {
      const country = COUNTRY_BY_SLUG.get(city.country)
      hits.push({
        kind: 'city',
        slug: city.slug,
        label: city.name,
        context: country ? `${country.emoji} ${country.name}` : undefined,
        score: s,
      })
    }
  }

  for (const role of ROLES as Role[]) {
    const s = score(role.name, role.aliases)
    if (s > 0) hits.push({ kind: 'role', slug: role.slug, label: role.name, context: 'Role', score: s })
  }

  return hits.sort((a, b) => b.score - a.score || a.label.length - b.label.length).slice(0, limit)
}
