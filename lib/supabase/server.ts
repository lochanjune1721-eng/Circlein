import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY,
  SUPABASE_URL,
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from '@/lib/config'

/**
 * Two clients, and the difference matters.
 *
 * `publicClient` uses the anon key and is bound by row level security — it can
 * read the taxonomy and circle counts, nothing else. `serviceClient` uses the
 * service role key, bypasses RLS entirely, and must never be constructed
 * anywhere that could reach the browser. The `server-only` import above turns
 * any such mistake into a build error.
 */

let cachedPublic: SupabaseClient | null = null
let cachedService: SupabaseClient | null = null

export function publicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!cachedPublic) {
    cachedPublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cachedPublic
}

export function serviceClient(): SupabaseClient | null {
  if (!isServiceRoleConfigured()) return null
  if (!cachedService) {
    cachedService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cachedService
}

/** For code paths that genuinely cannot proceed without a database. */
export function requireServiceClient(): SupabaseClient {
  const client = serviceClient()
  if (!client) {
    throw new Error(
      'Supabase service role is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  return client
}
