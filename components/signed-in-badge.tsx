import Image from 'next/image'
import type { LinkedInIdentity } from '@/lib/supabase/auth'

/**
 * Who LinkedIn says you are. Shown wherever the applicant needs to see that
 * their identity is already settled and not something they are asserting.
 */
export function SignedInBadge({ identity }: { identity: LinkedInIdentity }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-verified/35 bg-verified/[0.06] p-4">
      {identity.picture ? (
        // Remote avatars from LinkedIn's CDN; unoptimized avoids having to
        // allowlist a host that can change.
        <Image
          src={identity.picture}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-soft font-display text-lg text-bone"
        >
          {identity.fullName.slice(0, 1)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] text-bone">{identity.fullName}</p>
        {identity.email ? (
          <p className="truncate text-[13px] text-bone-dim">{identity.email}</p>
        ) : null}
      </div>

      <span className="shrink-0 text-[12px] text-verified">
        {identity.emailVerified ? 'Verified by LinkedIn' : 'Signed in'}
      </span>
    </div>
  )
}
