import type { Metadata } from 'next'
import { AdminConsole } from '@/components/admin-console'

export const metadata: Metadata = {
  title: 'Review queue',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return (
    <div className="shell max-w-4xl pb-24 pt-16">
      <p className="eyebrow">Internal</p>
      <h1 className="mt-5 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-bone">
        Review queue
      </h1>
      <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-bone-dim">
        Applications the automated check would not decide on its own, with the evidence it saw.
      </p>
      <div className="mt-12">
        <AdminConsole />
      </div>
    </div>
  )
}
