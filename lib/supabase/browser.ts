'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client, used only to start the LinkedIn redirect.
 * Holds the anon key, which is public by design and bound by row level
 * security.
 */
let cached: SupabaseClient | null = null

export function browserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!cached) cached = createBrowserClient(url, key)
  return cached
}
