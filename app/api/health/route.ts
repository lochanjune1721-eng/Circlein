import { NextResponse } from 'next/server'
import {
  ADMIN_TOKEN,
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * What this deployment is actually configured with.
 *
 * Reports presence, never values — the point is to answer "why is sign-in
 * greyed out" without anyone having to guess, and without a secret ever
 * leaving the server. Every field is a boolean or a fixed keyword.
 */
export async function GET() {
  const publicKeys = isSupabaseConfigured()

  return NextResponse.json({
    // Supabase's public pair. Read on each request and handed to the browser
    // as props, so setting them takes effect on the next request — no rebuild.
    supabasePublicKeys: publicKeys,
    signInAvailable: publicKeys,

    supabaseServiceRole: isServiceRoleConfigured(),
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    adminToken: Boolean(ADMIN_TOKEN),

    tenureSource: (process.env.LINKEDIN_PROVIDER ?? 'mock').toLowerCase(),

    hint: publicKeys
      ? 'Sign-in is available. If LinkedIn still fails, the remaining setup is in Supabase and the LinkedIn app.'
      : 'Sign-in is unavailable because this deployment has no SUPABASE_URL / SUPABASE_ANON_KEY. Set both and reload — no rebuild needed.',
  })
}
