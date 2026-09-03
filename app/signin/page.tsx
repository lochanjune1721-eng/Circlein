import { redirect } from 'next/navigation'
import { currentIdentity } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

/**
 * Kept only so existing links and bookmarks still work. There is no sign-in
 * page any more — signing in is one hop, not a page with a button on it.
 */
export default async function SignInPage() {
  const identity = await currentIdentity()
  redirect(identity ? '/apply' : '/auth/start')
}
