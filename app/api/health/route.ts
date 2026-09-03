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
    // The two NEXT_PUBLIC_* values. These are inlined at build time, so on a
    // hosted deployment they must have been present when the build ran —
    // adding them afterwards needs a rebuild.
    supabasePublicKeys: publicKeys,
    signInAvailable: publicKeys,

    // Server-side. Read at runtime, so these take effect without a rebuild.
    supabaseServiceRole: isServiceRoleConfigured(),
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    adminToken: Boolean(ADMIN_TOKEN),

    tenureSource: (process.env.LINKEDIN_PROVIDER ?? 'mock').toLowerCase(),

    hint: publicKeys
      ? 'Sign-in is available. If LinkedIn still fails, the remaining setup is in Supabase and the LinkedIn app.'
      : 'Sign-in is unavailable because this build has no NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Set both, then rebuild — they are baked in at build time.',
  })
}
