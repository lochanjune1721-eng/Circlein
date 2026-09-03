import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 font-display text-[clamp(2.25rem,6vw,4rem)] leading-tight text-bone">
        No circle here.
      </h1>
      <p className="mt-5 max-w-md text-[16px] leading-relaxed text-bone-dim">
        That city or niche is not one we carry. The directory has every room we do.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/directory" className="btn-primary">
          Browse the directory
        </Link>
        <Link href="/" className="btn-ghost">
          Back to the start
        </Link>
      </div>
    </div>
  )
}
