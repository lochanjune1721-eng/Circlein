import Link from 'next/link'
import { currentIdentity } from '@/lib/supabase/auth'
import { Wordmark } from './wordmark'

const NAV = [
  { href: '/directory', label: 'Directory' },
  { href: '/events', label: 'Events' },
  { href: '/how-it-works', label: 'How it works' },
]

export async function SiteHeader() {
  const identity = await currentIdentity()

  return (
    <header className="sticky top-0 z-40 border-b border-ink-line/70 bg-ink/85 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="CircleIn home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14px] text-bone-dim transition-colors hover:text-bone"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/status" className="text-[14px] text-bone-dim transition-colors hover:text-bone">
            {identity ? 'Your request' : 'Check status'}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/directory" className="text-[14px] text-bone-dim transition-colors hover:text-bone md:hidden">
            Directory
          </Link>

          {identity ? (
            <>
              <span className="hidden text-[13px] text-bone-dim sm:inline">
                {identity.givenName ?? identity.fullName}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-[13px] text-bone-faint transition-colors hover:text-bone"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/apply" className="btn-primary !px-5 !py-2 text-[13px]">
              Request an invite
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
