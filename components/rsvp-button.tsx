'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { RsvpState } from '@/lib/supabase/types'

/**
 * Take or release a place. The going-versus-waitlist decision belongs to the
 * server, so this only reports what came back.
 */
export function RsvpButton({
  slug,
  initialState,
  full,
}: {
  slug: string
  initialState: RsvpState | null
  full: boolean
}) {
  const router = useRouter()
  const [state, setState] = useState<RsvpState | null>(initialState)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const attending = state === 'going' || state === 'waitlist'

  async function send(action: 'rsvp' | 'cancel') {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, action }),
      })
      const data = (await res.json()) as { ok: boolean; state?: RsvpState; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'That did not work. Try again.')
        return
      }
      setState(data.state === 'cancelled' ? null : (data.state ?? null))
      // Refresh so the count on the page matches the room.
      router.refresh()
    } catch {
      setError('We could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {attending ? (
        <div className="rounded-xl border border-verified/40 bg-verified/[0.07] p-5">
          <p className="font-display text-xl text-bone">
            {state === 'waitlist' ? 'You are on the waitlist.' : 'You have a place.'}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-bone-dim">
            {state === 'waitlist'
              ? 'We will let you know if someone drops out.'
              : 'Details go out in your circle’s WhatsApp group closer to the day.'}
          </p>
          <button
            type="button"
            onClick={() => void send('cancel')}
            disabled={busy}
            className="mt-4 text-[13px] text-bone-faint underline underline-offset-4 transition-colors hover:text-bone"
          >
            {busy ? 'Updating…' : "Can't make it any more"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void send('rsvp')}
          disabled={busy}
          className="btn-primary w-full"
        >
          {busy ? 'Saving your place…' : full ? 'Join the waitlist' : 'Take a place'}
        </button>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-flag">
          {error}
        </p>
      ) : null}
    </div>
  )
}
