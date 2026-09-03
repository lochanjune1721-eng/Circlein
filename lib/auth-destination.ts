import 'server-only'
import { serviceClient } from '@/lib/supabase/server'

/**
 * Where someone should land after signing in.
 *
 * Sign-in means different things depending on who is signing in, and sending
 * everyone to the application form was wrong for two of the three cases:
 *
 *   a verified member      → their circle and WhatsApp group
 *   someone mid-application → the status of that request
 *   everyone else          → the application form
 *
 * Resolved on the server after the session exists, because until then we do
 * not know which of the three they are.
 */
export async function destinationForUser(authUserId: string): Promise<string> {
  const db = serviceClient()
  // With no database we cannot tell them apart, and the application form is
  // the only page that works without one.
  if (!db) return '/apply'

  const { data: member } = await db
    .from('members')
    .select('id')
    .eq('auth_user_id', authUserId)
    .eq('is_active', true)
    .maybeSingle<{ id: string }>()
  if (member) return '/status'

  const { data: application } = await db
    .from('applications')
    .select('id')
    .eq('auth_user_id', authUserId)
    .in('status', ['pending', 'verifying', 'needs_review', 'approved'])
    .maybeSingle<{ id: string }>()
  if (application) return '/status'

  return '/apply'
}
