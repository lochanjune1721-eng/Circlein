import Link from 'next/link'
import { currentIdentity } from '@/lib/supabase/auth'
import { MobileMenu, type MenuLink } from './mobile-menu'
import { Wordmark } from './wordmark'

const NAV: MenuLink[] = [
  { href: '/directory', label: 'Directory' },
  { href: '/events', label: 'Events' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/status', label: 'Check status' },
]

export async function SiteHeader() {
  const identity = await currentIdentity()

  return (
    <header className="sticky top-0 z-50 border-b border-ink-line/70 bg-ink/95 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-3">
        <Link href="/" className="shrink-0" aria-label="CircleIn home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[14px] text-bone-dim transition-colors hover:text-bone"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {identity ? (
            <>
              <span className="hidden whitespace-nowrap text-[13px] text-bone-dim lg:inline">
                {identity.givenName ?? identity.fullName}
              </span>
              <form action="/auth/signout" method="post" className="hidden md:block">
                <button
                  type="submit"
                  className="whitespace-nowrap text-[13px] text-bone-faint transition-colors hover:text-bone"
                >
                  Sign out
                </button>
              </form>
              <Link
                href="/apply"
                className="btn-primary whitespace-nowrap !px-4 !py-2 text-[13px] sm:!px-5"
              >
                Your request
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/start"
                prefetch={false}
                className="hidden whitespace-nowrap text-[13px] text-bone-dim transition-colors hover:text-bone md:inline"
              >
                Sign in
              </Link>
              {/* The label shortens rather than wrapping — a two-line button in
                  a 64px bar is what broke this on phones. */}
              <Link
                href="/auth/start"
                prefetch={false}
                className="btn-primary whitespace-nowrap !px-4 !py-2 text-[13px] sm:!px-5"
              >
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Request an invite</span>
              </Link>
            </>
          )}

          <MobileMenu links={NAV} signedIn={Boolean(identity)} />
        </div>
      </div>
    </header>
  )
}
