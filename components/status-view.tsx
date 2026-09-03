'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface Application {
  status: 'pending' | 'verifying' | 'needs_review' | 'approved' | 'rejected' | 'withdrawn'
  fullName: string
  citySlug: string
  nicheSlug: string
  roleSlug: string | null
  senioritySlug: string | null
  submittedAt: string
  decidedAt: string | null
  whatsapp: { state: string; groupName: string | null } | null
}

/**
 * What each state looks like to the applicant.
 *
 * Everything still being worked on reads the same, on purpose — an applicant
 * has no use for the difference between "queued" and "with a reviewer", and
 * spelling it out would describe the process. The reasoning is in the admin
 * queue, not here.
 */
const HEADLINE: Record<
  Application['status'],
  { eyebrow: string; title: string; body: string }
> = {
  pending: {
    eyebrow: 'With us',
    title: 'We have your request.',
    body: 'We will verify it and let you know. It usually takes under a day.',
  },
  verifying: {
    eyebrow: 'With us',
    title: 'We have your request.',
    body: 'We will verify it and let you know. It usually takes under a day.',
  },
  needs_review: {
    eyebrow: 'With us',
    title: 'We have your request.',
    body: 'We will verify it and let you know. It usually takes under a day.',
  },
  approved: {
    eyebrow: 'You are in',
    title: 'Welcome to CircleIn.',
    body: 'We are adding you to the group that fits you best — watch the number you gave us.',
  },
  rejected: {
    eyebrow: 'Closed',
    title: 'We could not place you this time.',
    body: 'Things change — you are welcome to ask again later.',
  },
  withdrawn: {
    eyebrow: 'Withdrawn',
    title: 'This request was withdrawn.',
    body: 'Ask again whenever you like.',
  },
}

const WHATSAPP_COPY: Record<string, string> = {
  queued: 'You are queued for your circle’s WhatsApp group and will be added shortly.',
  invited: 'Your invite has gone out — check WhatsApp on the number you gave us.',
  joined: 'You are in the group.',
  failed: 'We could not add you automatically. Someone will reach out.',
}

export function StatusView({
  initialToken,
  initialApplication = null,
  signedIn = false,
}: {
  initialToken: string
  /** Resolved server-side from the session, so a signed-in member sees it immediately. */
  initialApplication?: Application | null
  signedIn?: boolean
}) {
  const [token, setToken] = useState(initialToken)
  const [application, setApplication] = useState<Application | null>(initialApplication)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (value: string) => {
    if (!value) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/status?token=${encodeURIComponent(value)}`)
      const data = (await res.json()) as { ok: boolean; application?: Application; error?: string }
      if (!res.ok || !data.ok || !data.application) {
        setApplication(null)
        setError(data.error ?? 'We could not find that application.')
        return
      }
      setApplication(data.application)
    } catch {
      setError('We could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Nothing to fetch when the session already produced the application.
    if (initialToken && !initialApplication) void load(initialToken)
  }, [initialToken, initialApplication, load])

  // A signed-in member with an application never needs the token box.
  const showLookup = !signedIn || !application

  return (
    <div>
      {showLookup ? (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void load(token)
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="token" className="sr-only">
          Your status link
        </label>
        <input
          id="token"
          className="field flex-1"
          placeholder="Paste your status link or token"
          value={token}
          onChange={(e) => {
            // Accept a whole URL as well as a bare token — people paste links.
            const raw = e.target.value.trim()
            const match = raw.match(/[?&]token=([^&\s]+)/)
            setToken(match?.[1] ? decodeURIComponent(match[1]) : raw)
          }}
        />
        <button type="submit" className="btn-primary" disabled={loading || token.length < 8}>
          {loading ? 'Looking…' : 'Check'}
        </button>
      </form>
      ) : null}

      {signedIn && !application ? (
        <p className="mt-6 text-[14px] text-bone-dim">
          No application found on this account yet.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 rounded-lg border border-flag/40 bg-flag/10 px-4 py-3 text-[14px] text-flag">
          {error}
        </p>
      ) : null}

      {application ? (
        <div className="mt-12 animate-rise">
          <p className="eyebrow">{HEADLINE[application.status].eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-bone sm:text-5xl">
            {HEADLINE[application.status].title}
          </h2>

          <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
            {HEADLINE[application.status].body}
          </p>

          {application.whatsapp ? (
            <div className="mt-8 rounded-xl border border-verified/40 bg-verified/[0.07] p-6">
              <p className="eyebrow !text-verified">Your group</p>
              <p className="mt-3 font-display text-2xl text-bone">
                {application.whatsapp.groupName ?? 'Being assigned'}
              </p>
              <p className="mt-2 text-[14px] text-bone-dim">
                {WHATSAPP_COPY[application.whatsapp.state] ?? WHATSAPP_COPY.queued}
              </p>
            </div>
          ) : null}

          <dl className="mt-10 grid gap-4 text-[14px] sm:grid-cols-3">
            <div>
              <dt className="text-bone-faint">Requested</dt>
              <dd className="mt-1 text-bone">
                {new Date(application.submittedAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-bone-faint">Circle</dt>
              <dd className="mt-1 text-bone">
                <Link
                  href={`/circles/${application.citySlug}/${application.nicheSlug}`}
                  className="hover:text-gold"
                >
                  {application.nicheSlug} · {application.citySlug}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-bone-faint">Name on the request</dt>
              <dd className="mt-1 text-bone">{application.fullName}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  )
}
