import { NextResponse } from 'next/server'
import { searchTaxonomy } from '@/lib/taxonomy/search'

export const runtime = 'nodejs'

/** Typeahead across niches, cities and roles. Pure data, no database needed. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const q = params.get('q') ?? ''
  const limit = Math.min(25, Number.parseInt(params.get('limit') ?? '12', 10) || 12)
  return NextResponse.json({ hits: searchTaxonomy(q, limit) })
}
