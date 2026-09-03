import Link from 'next/link'
import { POLICY } from '@/lib/config'
import { Wordmark } from './wordmark'

const COLUMNS = [
  {
    title: 'Network',
    links: [
      { href: '/directory', label: 'Browse circles' },
      { href: '/events', label: 'Events' },
      { href: '/directory/niches', label: 'All niches' },
      { href: '/apply', label: 'Request an invite' },
      { href: '/signin', label: 'Sign in' },
      { href: '/status', label: 'Check your status' },
    ],
  },
  {
    title: 'How it works',
    links: [
      { href: '/how-it-works', label: 'Verification' },
      { href: '/how-it-works#taxonomy', label: 'How we sort people' },
      { href: '/how-it-works#whatsapp', label: 'The group' },
      { href: '/how-it-works#privacy', label: 'What we store' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-line">
      <div className="shell grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-bone-faint">
            A verified network of people doing the same work in the same city. Every member is
            checked before they are let in — at least {POLICY.minTenureMonths} months in the role,
            every time.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="eyebrow">{column.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-bone-dim transition-colors hover:text-bone"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rule">
        <div className="shell flex flex-col gap-2 py-6 text-[13px] text-bone-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CircleIn</p>
          <p>Membership by verification, not by connection count.</p>
        </div>
      </div>
    </footer>
  )
}
