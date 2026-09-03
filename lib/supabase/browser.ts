'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client, used only to start the LinkedIn redirect.
 *
 * The url and key are passed in rather than read from `process.env`, because
 * only NEXT_PUBLIC_-prefixed variables reach the browser that way. Handing them
 * down from a server component instead means the environment variables can be
 * named anything, and that changing them takes effect on the next request
 * rather than requiring a rebuild.
 *
 * The anon key is public by design — it ships to every visitor either way, and
 * row level security is what constrains it.
 */
let cached: SupabaseClient | null = null
let cachedFor = ''

export function browserClient(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null
  const key = `${url}|${anonKey}`
  if (!cached || cachedFor !== key) {
    cached = createBrowserClient(url, anonKey)
    cachedFor = key
  }
  return cached
}
