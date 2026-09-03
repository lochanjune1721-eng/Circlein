/**
 * CircleIn taxonomy primitives.
 *
 * Three clean dimensions — niche, city, country — plus two refinements that
 * sharpen a member's identity without multiplying categories: `role` (the
 * specific job title) and `seniority`. A member is always exactly one point in
 * this space:
 *
 *   Country -> City -> Niche  (the circle)
 *   Role + Seniority          (who they are inside it)
 */

/** A stable, URL-safe identifier. Never change one once it ships. */
export type Slug = string

export interface NicheGroup {
  slug: Slug
  name: string
  /** One line explaining what this group covers, used in the directory UI. */
  blurb: string
  niches: Niche[]
}

export interface Niche {
  slug: Slug
  name: string
  group: Slug
  /** Alternate spellings and common shorthand, used for search and dedupe. */
  aliases?: string[]
}

export type Region =
  | 'north-america'
  | 'south-america'
  | 'europe'
  | 'asia'
  | 'oceania'
  | 'africa'

export interface Country {
  slug: Slug
  name: string
  /** ISO 3166-1 alpha-2. */
  code: string
  region: Region
  emoji: string
  aliases?: string[]
}

export interface City {
  slug: Slug
  name: string
  /** Country slug. */
  country: Slug
  /**
   * The state, province or metro this city belongs to. Purely for grouping in
   * the directory — a member picks a city, never an admin area.
   */
  area?: string
  /**
   * Cities that share a labour market roll up to one metro so that, e.g.,
   * Gurugram and Noida members see each other in the Delhi NCR circle.
   */
  metro?: Slug
  aliases?: string[]
}

export interface RoleFamily {
  slug: Slug
  name: string
  /** Niches this family most commonly maps to, best match first. */
  niches: Slug[]
  roles: Role[]
}

export interface Role {
  slug: Slug
  name: string
  family: Slug
  aliases?: string[]
}

export interface Seniority {
  slug: Slug
  name: string
  /**
   * Sort order from most junior to most senior. Tracks that sit outside the
   * ladder (Founder, Partner, Owner) share the top band.
   */
  rank: number
}
