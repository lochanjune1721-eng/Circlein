import Link from 'next/link'
import { WhereAmI } from '@/components/where-am-i'

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 font-display text-[clamp(2.25rem,6vw,4rem)] leading-tight text-bone">
        Nothing at this address.
      </h1>
      <p className="mt-5 max-w-md text-[16px] leading-relaxed text-bone-dim">
        The page you asked for does not exist.
      </p>

      <WhereAmI />

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/apply" className="btn-primary">
          Request an invite
        </Link>
        <Link href="/directory" className="btn-ghost">
          Browse the directory
        </Link>
      </div>
    </div>
  )
}
