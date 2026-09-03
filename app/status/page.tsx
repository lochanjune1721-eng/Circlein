import type { Metadata } from 'next'
import { StatusView } from '@/components/status-view'
import { statusForUser } from '@/lib/applications'
import { currentIdentity } from '@/lib/supabase/auth'

export const metadata: Metadata = {
  title: 'Check your status',
  description: 'Look up a CircleIn application with the link you were given.',
}

export const dynamic = 'force-dynamic'

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const identity = await currentIdentity()

  // Signed in? Then there is nothing to paste — the session already says who
  // this is, and RLS makes sure it can only be their own row.
  const own = identity ? await statusForUser(identity.authUserId) : null

  return (
    <div className="shell max-w-3xl pb-24 pt-16">
      <p className="eyebrow">Your request</p>
      <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-bone">
        Where things stand.
      </h1>
      <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
        {identity
          ? `Signed in as ${identity.fullName}.`
          : 'Paste the link you were given after applying, or sign in with LinkedIn and we will find it.'}
      </p>

      <div className="mt-12">
        <StatusView initialToken={token ?? ''} initialApplication={own} signedIn={Boolean(identity)} />
      </div>
    </div>
  )
}
