import Link from 'next/link'
import { LinkedInButton } from './linkedin-button'

/**
 * The standing invitation to sign in.
 *
 * Used wherever signing in unlocks the next thing — RSVPing to an event,
 * checking a request, applying to a circle — so the prompt always arrives
 * attached to a reason rather than as a nag.
 */
export function SignInPrompt({
  title,
  body,
  next = 'auto',
  available,
  className = '',
}: {
  title: string
  body: string
  next?: string
  /** False when LinkedIn sign-in is not configured on this deployment. */
  available: boolean
  className?: string
}) {
  return (
    <div className={`card p-6 ${className}`}>
      <p className="eyebrow">Members only</p>
      <h2 className="mt-3 font-display text-2xl text-bone">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-bone-dim">{body}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {available ? (
          <LinkedInButton next={next} label="Sign in with LinkedIn" className="btn-primary !px-5 !py-2.5 text-[13px]" />
        ) : null}
        <Link href="/apply" className="btn-ghost !px-5 !py-2.5 text-[13px]">
          Request an invite
        </Link>
      </div>
    </div>
  )
}
