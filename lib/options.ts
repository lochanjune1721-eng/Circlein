import type { Option } from '@/components/combobox'
import { CITIES, METRO_BY_SLUG } from '@/lib/taxonomy/cities'
import { COUNTRY_BY_SLUG } from '@/lib/taxonomy/countries'
import { NICHE_GROUPS } from '@/lib/taxonomy/niches'
import { ROLE_FAMILIES } from '@/lib/taxonomy/roles'

/**
 * Taxonomy shaped for the pickers. Built on the server and passed down, so the
 * client never ships the full taxonomy modules — just the labels and the
 * alias terms the search needs.
 */

export function cityOptions(): Option[] {
  return CITIES.map((city) => {
    const country = COUNTRY_BY_SLUG.get(city.country)
    const metro = city.metro ? METRO_BY_SLUG.get(city.metro) : undefined
    return {
      value: city.slug,
      label: city.name,
      hint: country ? `${country.emoji} ${country.name}` : undefined,
      terms: [
        city.name,
        ...(city.aliases ?? []),
        city.area ?? '',
        country?.name ?? '',
        ...(country?.aliases ?? []),
        metro?.name ?? '',
      ].filter(Boolean),
    }
  }).sort((a, b) => a.label.localeCompare(b.label))
}

export function nicheOptions(): Option[] {
  return NICHE_GROUPS.flatMap((group) =>
    group.niches.map((niche) => ({
      value: niche.slug,
      label: niche.name,
      hint: group.name,
      section: group.name,
      terms: [niche.name, ...(niche.aliases ?? []), group.name],
    })),
  )
}

/**
 * Roles for the application form. The form asks for a role rather than a
 * niche — one fewer decision for the applicant, and the niche is derived from
 * whichever they pick.
 */
export function roleOptions(): Option[] {
  return ROLE_FAMILIES.flatMap((family) =>
    family.roles.map((role) => ({
      value: role.slug,
      label: role.name,
      hint: family.name,
      section: family.name,
      terms: [role.name, ...(role.aliases ?? []), family.name],
    })),
  )
}
