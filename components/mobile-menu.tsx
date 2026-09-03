'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface MenuLink {
  href: string
  label: string
}

/**
 * The phone header cannot hold four nav items, a sign-in link and a call to
 * action — they wrap into each other and the whole bar turns to soup. So on
 * small screens the links live behind this, and the bar keeps only the mark
 * and the one thing anybody came to press.
 */
export function MobileMenu({ links, signedIn }: { links: MenuLink[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  // The panel is portalled to <body>. It has to be: the header sets
  // backdrop-blur, and a backdrop-filter makes an element the containing block
  // for its position:fixed descendants — so a panel rendered inside the header
  // is trapped in a 64px-tall box and collapses to nothing.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // A menu that stays open behind a new page is a bug people report as "the
  // site is stuck", so close it whenever the page is navigated away from.
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('pagehide', close)
    return () => window.removeEventListener('pagehide', close)
  }, [open])

  // Stop the page scrolling underneath the open panel.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-line
                   text-bone transition-colors hover:border-ink-soft md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          {open ? (
            <>
              <path d="M4 4l10 10" />
              <path d="M14 4L4 14" />
            </>
          ) : (
            <>
              <path d="M2.5 5h13" />
              <path d="M2.5 9h13" />
              <path d="M2.5 13h13" />
            </>
          )}
        </svg>
      </button>

      {open && mounted
        ? createPortal(
            <div
              id="mobile-menu"
              className="fixed inset-x-0 bottom-0 top-16 z-[60] overflow-y-auto border-t border-ink-line bg-ink md:hidden"
            >
              <nav className="shell flex flex-col gap-1 py-6" aria-label="Main">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2 py-3.5 font-display text-2xl text-bone transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-5 border-t border-ink-line px-2 pt-6">
                  {signedIn ? (
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="py-3 text-[15px] text-bone-dim transition-colors hover:text-bone"
                      >
                        Sign out
                      </button>
                    </form>
                  ) : (
                    <>
                      <Link
                        href="/auth/start"
                        prefetch={false}
                        onClick={() => setOpen(false)}
                        className="btn-primary w-full"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                        </svg>
                        Sign in with LinkedIn
                      </Link>
                      <p className="mt-3 text-[13px] leading-relaxed text-bone-faint">
                        One tap. We use it to confirm you are who you say you are.
                      </p>
                    </>
                  )}
                </div>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
