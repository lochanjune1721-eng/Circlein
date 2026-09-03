import type { Metadata } from 'next'
import { StatusView } from '@/components/status-view'

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

  return (
    <div className="shell max-w-3xl pb-24 pt-16">
      <p className="eyebrow">Your request</p>
      <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-bone">
        Where things stand.
      </h1>
      <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
        Paste the link you were given after applying. It is the only credential — we do not ask you
        to make an account for this.
      </p>

      <div className="mt-12">
        <StatusView initialToken={token ?? ''} />
      </div>
    </div>
  )
}
