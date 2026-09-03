import 'server-only'
import { publicClient } from '@/lib/supabase/server'
import type { CircleDirectoryRow } from '@/lib/supabase/types'

/**
 * Circle counts for the directory.
 *
 * These read through the anon key and the `circle_directory` view, which
 * exposes taxonomy labels and member counts and nothing else — no names, no
 * contact details. With no database configured the pages still render; they
 * just show the taxonomy without counts.
 */

export async function directoryRows(): Promise<CircleDirectoryRow[]> {
  const db = publicClient()
  if (!db) return []
  const { data, error } = await db.from('circle_directory').select('*')
  if (error) {
    console.error('[circlein] directory read failed:', error.message)
    return []
  }
  return (data ?? []) as CircleDirectoryRow[]
}

export async function memberCounts(): Promise<{
  byCity: Map<string, number>
  byCountry: Map<string, number>
  byNiche: Map<string, number>
  byCircle: Map<string, number>
  total: number
}> {
  const rows = await directoryRows()
  const byCity = new Map<string, number>()
  const byCountry = new Map<string, number>()
  const byNiche = new Map<string, number>()
  const byCircle = new Map<string, number>()
  let total = 0

  for (const row of rows) {
    const n = row.member_count
    total += n
    byCity.set(row.city, (byCity.get(row.city) ?? 0) + n)
    byCountry.set(row.country, (byCountry.get(row.country) ?? 0) + n)
    byNiche.set(row.niche, (byNiche.get(row.niche) ?? 0) + n)
    byCircle.set(`${row.city}/${row.niche}`, n)
  }

  return { byCity, byCountry, byNiche, byCircle, total }
}

export async function circleSize(citySlug: string, nicheSlug: string): Promise<number> {
  const { byCircle } = await memberCounts()
  return byCircle.get(`${citySlug}/${nicheSlug}`) ?? 0
}
