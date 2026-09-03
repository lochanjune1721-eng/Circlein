'use client'

import { useCallback, useEffect, useState } from 'react'

interface Reason {
  rule: string
  label: string
  passed: boolean
  detail: string
}

interface Item {
  application: {
    id: string
    full_name: string
    email: string
    linkedin_url: string
    city: string
    niche: string
    role: string | null
    seniority: string | null
    company: string | null
    raw_title: string
    note: string | null
    submitted_at: string
    status: string
  }
  latestCheck: {
    provider: string
    account_age_months: number | null
    tenure_months: number | null
    headline: string | null
    profile_location: string | null
    match_confidence: number | null
    verdict: string
    reasons: Reason[]
    model: string | null
  } | null
}

/**
 * The review desk. Everything the automated check was not confident enough to
 * decide alone, with the evidence it saw, so a person can decide in seconds.
 *
 * The admin token is held in component state only — never written to storage,
 * so closing the tab ends the session.
 */
export function AdminConsole() {
  const [token, setToken] = useState('')
  const [authed, setAuthed] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(
    async (value: string) => {
      setBusy(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/review', {
          headers: { Authorization: `Bearer ${value}` },
        })
        const data = (await res.json()) as { ok: boolean; items?: Item[]; error?: string }
        if (!res.ok || !data.ok) {
          setAuthed(false)
          setError(data.error ?? 'Not authorised.')
          return
        }
        setAuthed(true)
        setItems(data.items ?? [])
      } catch {
        setError('Could not reach the server.')
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!authed) return
    const timer = setInterval(() => void load(token), 60_000)
    return () => clearInterval(timer)
  }, [authed, token, load])

  async function decide(id: string, decision: 'approved' | 'rejected') {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ applicationId: id, decision, note: notes[id] ?? '' }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!data.ok) {
        setError(data.error ?? 'Could not record that decision.')
        return
      }
      setItems((current) => current.filter((i) => i.application.id !== id))
    } finally {
      setBusy(false)
    }
  }

  if (!authed) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void load(token)
        }}
        className="max-w-md"
      >
        <label htmlFor="admin-token" className="label">
          Admin token
        </label>
        <input
          id="admin-token"
          type="password"
          className="field"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
        />
        {error ? (
          <p role="alert" className="mt-3 text-[13px] text-flag">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-primary mt-5" disabled={busy || token.length < 8}>
          {busy ? 'Checking…' : 'Open the queue'}
        </button>
      </form>
    )
  }

  if (items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-3xl text-bone">Nothing waiting.</p>
        <p className="mt-3 text-[14px] text-bone-dim">
          Every application has been decided. New ones land here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-[14px] text-bone-dim">
        {items.length} waiting on a person.
      </p>

      {items.map((item) => {
        const app = item.application
        const check = item.latestCheck
        return (
          <article key={app.id} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-bone">{app.full_name}</h2>
                <p className="mt-1 text-[14px] text-bone-dim">
                  {app.raw_title}
                  {app.company ? ` · ${app.company}` : ''}
                </p>
                <p className="mt-1 text-[13px] text-bone-faint">
                  Applying to {app.niche} · {app.city}
                </p>
              </div>
              <a
                href={app.linkedin_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-ghost !px-4 !py-2 text-[13px]"
              >
                Open LinkedIn ↗
              </a>
            </div>

            {check ? (
              <dl className="mt-5 grid gap-3 rounded-lg border border-ink-line bg-ink-raised p-4 text-[13px] sm:grid-cols-4">
                <div>
                  <dt className="text-bone-faint">Tenure</dt>
                  <dd className="mt-0.5 text-bone">{check.tenure_months ?? '—'} mo</dd>
                </div>
                <div>
                  <dt className="text-bone-faint">Account age</dt>
                  <dd className="mt-0.5 text-bone">{check.account_age_months ?? '—'} mo</dd>
                </div>
                <div>
                  <dt className="text-bone-faint">Match</dt>
                  <dd className="mt-0.5 text-bone">
                    {check.match_confidence != null
                      ? `${Math.round(Number(check.match_confidence) * 100)}%`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-bone-faint">Source</dt>
                  <dd className="mt-0.5 text-bone">{check.provider}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-5 text-[13px] text-flag">No automated check recorded.</p>
            )}

            {check?.reasons?.length ? (
              <ul className="mt-4 space-y-1.5">
                {check.reasons.map((reason, i) => (
                  <li key={`${reason.rule}-${i}`} className="flex gap-2.5 text-[13px]">
                    <span
                      aria-hidden="true"
                      className={reason.passed ? 'text-verified' : 'text-flag'}
                    >
                      {reason.passed ? '✓' : '!'}
                    </span>
                    <span className="text-bone-dim">
                      <span className="text-bone">{reason.label}.</span> {reason.detail}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {app.note ? (
              <p className="mt-4 border-l-2 border-ink-soft pl-4 text-[13px] italic text-bone-dim">
                {app.note}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <input
                className="field flex-1 !py-2 text-[13px]"
                placeholder="Note (shown to the applicant)"
                value={notes[app.id] ?? ''}
                onChange={(e) => setNotes((n) => ({ ...n, [app.id]: e.target.value }))}
                aria-label={`Decision note for ${app.full_name}`}
              />
              <button
                type="button"
                className="btn-primary !px-5 !py-2 text-[13px]"
                disabled={busy}
                onClick={() => void decide(app.id, 'approved')}
              >
                Let them in
              </button>
              <button
                type="button"
                className="btn-ghost !px-5 !py-2 text-[13px]"
                disabled={busy}
                onClick={() => void decide(app.id, 'rejected')}
              >
                Decline
              </button>
            </div>
          </article>
        )
      })}

      {error ? (
        <p role="alert" className="text-[13px] text-flag">
          {error}
        </p>
      ) : null}
    </div>
  )
}
