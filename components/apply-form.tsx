'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Combobox, type Option } from './combobox'

/**
 * The request flow.
 *
 * Four short steps rather than one long form: picking a city out of 234 and a
 * niche out of 138 deserves its own moment, and splitting them means the
 * verification questions arrive after the person is already invested.
 */

interface Props {
  cities: Option[]
  niches: Option[]
  minTenureMonths: number
  minAccountAgeMonths: number
  /** False when the deployment has no database yet; the form explains instead of failing. */
  intakeOpen: boolean
}

type Status = 'pending' | 'verifying' | 'needs_review' | 'approved' | 'rejected' | 'withdrawn'

interface SubmitResponse {
  ok: boolean
  statusToken?: string
  status?: Status
  error?: string
  fields?: Record<string, string>
}

const STEPS = ['Where', 'What', 'Your work', 'You'] as const

export function ApplyForm({ cities, niches, minTenureMonths, minAccountAgeMonths, intakeOpen }: Props) {
  const [step, setStep] = useState(0)
  const [citySlug, setCitySlug] = useState<string | null>(null)
  const [nicheSlug, setNicheSlug] = useState<string | null>(null)
  const [rawTitle, setRawTitle] = useState('')
  const [company, setCompany] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [note, setNote] = useState('')
  const [website, setWebsite] = useState('') // honeypot

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const cityLabel = useMemo(() => cities.find((c) => c.value === citySlug)?.label, [cities, citySlug])
  const nicheLabel = useMemo(() => niches.find((n) => n.value === nicheSlug)?.label, [niches, nicheSlug])

  const canContinue = [
    Boolean(citySlug),
    Boolean(nicheSlug),
    rawTitle.trim().length >= 2,
    fullName.trim().length >= 2 && email.includes('@') && linkedinUrl.length > 4 && whatsapp.length > 6,
  ]

  async function submit() {
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})
    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          linkedinUrl,
          whatsapp,
          citySlug,
          nicheSlug,
          rawTitle,
          company: company || null,
          note: note || null,
          declaredStartedAt: startedAt || null,
          website,
        }),
      })
      const data = (await response.json()) as SubmitResponse
      if (!response.ok || !data.ok) {
        setFieldErrors(data.fields ?? {})
        setFormError(data.error ?? 'Something went wrong. Try again in a moment.')
        // Send them back to the step that owns the first bad field.
        if (data.fields) {
          const keys = Object.keys(data.fields)
          if (keys.some((k) => k === 'citySlug')) setStep(0)
          else if (keys.some((k) => k === 'nicheSlug')) setStep(1)
          else if (keys.some((k) => ['rawTitle', 'company', 'declaredStartedAt'].includes(k))) setStep(2)
          else setStep(3)
        }
        return
      }
      setResult(data)
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result?.ok) {
    return <Outcome status={result.status ?? 'pending'} statusToken={result.statusToken} minTenureMonths={minTenureMonths} />
  }

  return (
    <div>
      {/* Progress */}
      <ol className="mb-10 flex flex-wrap gap-x-2 gap-y-2 text-[12px]" aria-label="Progress">
        {STEPS.map((name, i) => (
          <li key={name} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`rounded-full border px-3 py-1 transition-colors ${
                i === step
                  ? 'border-gold bg-gold text-ink'
                  : i < step
                    ? 'border-ink-soft text-bone-dim hover:border-gold/60 hover:text-gold'
                    : 'border-ink-line text-bone-faint'
              }`}
            >
              <span className="font-mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="ml-2">{name}</span>
            </button>
            {i < STEPS.length - 1 ? <span className="text-ink-soft" aria-hidden="true">—</span> : null}
          </li>
        ))}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (step < 3) {
            if (canContinue[step]) setStep(step + 1)
            return
          }
          if (canContinue[3]) void submit()
        }}
        noValidate
      >
        {/* Honeypot: visually hidden, never announced, never filled by a person. */}
        <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {step === 0 ? (
          <StepShell
            n="01"
            title="Which city do you work in?"
            body="Pick the city you are actually in most weeks. Cities that share a commute share a circle — Gurugram, Noida and New Delhi are one room."
          >
            <Combobox
              label="City"
              options={cities}
              value={citySlug}
              onChange={setCitySlug}
              placeholder="Bengaluru, London, São Paulo…"
              error={fieldErrors.citySlug}
              emptyMessage="We do not have that city yet. Try the nearest major one."
            />
          </StepShell>
        ) : null}

        {step === 1 ? (
          <StepShell
            n="02"
            title="What do you actually work on?"
            body="Not your job title — the field. This is what decides who you end up in a group with."
          >
            <Combobox
              label="Niche"
              options={niches}
              value={nicheSlug}
              onChange={setNicheSlug}
              placeholder="AI, Venture Capital, Product Design…"
              error={fieldErrors.nicheSlug}
            />
            {cityLabel ? (
              <p className="mt-6 text-[14px] text-bone-dim">
                You are applying to{' '}
                <span className="text-bone">
                  {nicheLabel ?? '…'} · {cityLabel}
                </span>
                .
              </p>
            ) : null}
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell
            n="03"
            title="Your current role"
            body={`Write your title exactly as it appears on LinkedIn — that is what we check it against. You need at least ${minTenureMonths} months in it.`}
          >
            <div className="space-y-5">
              <Field
                label="Job title"
                id="rawTitle"
                value={rawTitle}
                onChange={setRawTitle}
                placeholder="Senior Machine Learning Engineer"
                error={fieldErrors.rawTitle}
                autoComplete="organization-title"
              />
              <Field
                label="Company"
                id="company"
                value={company}
                onChange={setCompany}
                placeholder="Where you do it"
                optional
                error={fieldErrors.company}
                autoComplete="organization"
              />
              <Field
                label="When did you start this role?"
                id="startedAt"
                value={startedAt}
                onChange={setStartedAt}
                placeholder="2024-03"
                optional
                hint="Month and year. Only used if we cannot read the dates from your profile."
                error={fieldErrors.declaredStartedAt}
                inputMode="numeric"
              />
            </div>
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            n="04"
            title="And you"
            body={`Your LinkedIn is how we verify you. The account needs to be at least ${minAccountAgeMonths} months old. Your number is only used to add you to the group.`}
          >
            <div className="space-y-5">
              <Field
                label="Full name"
                id="fullName"
                value={fullName}
                onChange={setFullName}
                placeholder="As it appears on your profile"
                error={fieldErrors.fullName}
                autoComplete="name"
              />
              <Field
                label="Email"
                id="email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@work.com"
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Field
                label="LinkedIn profile"
                id="linkedinUrl"
                value={linkedinUrl}
                onChange={setLinkedinUrl}
                placeholder="linkedin.com/in/your-name"
                error={fieldErrors.linkedinUrl}
                autoComplete="url"
              />
              <Field
                label="WhatsApp number"
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="+91 98765 43210"
                hint="With country code. This is how you get added to the group."
                error={fieldErrors.whatsapp}
                autoComplete="tel"
              />
              <div>
                <label htmlFor="note" className="label">
                  Anything else? <span className="text-bone-faint">Optional</span>
                </label>
                <textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="field resize-none"
                  placeholder="What you are working on, or who you would like to meet."
                  maxLength={600}
                />
              </div>
            </div>

            <dl className="mt-8 grid gap-3 rounded-lg border border-ink-line bg-ink-raised p-5 text-[14px] sm:grid-cols-2">
              <div>
                <dt className="text-bone-faint">Circle</dt>
                <dd className="mt-0.5 text-bone">
                  {nicheLabel ?? '—'} · {cityLabel ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-bone-faint">Role</dt>
                <dd className="mt-0.5 text-bone">{rawTitle || '—'}</dd>
              </div>
            </dl>
          </StepShell>
        ) : null}

        {formError ? (
          <p role="alert" className="mt-6 rounded-lg border border-flag/40 bg-flag/10 px-4 py-3 text-[14px] text-flag">
            {formError}
          </p>
        ) : null}

        {!intakeOpen ? (
          <p className="mt-6 rounded-lg border border-ink-line bg-ink-raised px-4 py-3 text-[14px] text-bone-dim">
            Intake is not connected on this deployment yet, so submitting will not record anything.
            Everything else here is live.
          </p>
        ) : null}

        <div className="mt-10 flex items-center gap-3">
          {step > 0 ? (
            <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : null}

          <button type="submit" className="btn-primary" disabled={!canContinue[step] || submitting}>
            {submitting ? 'Checking your profile…' : step === 3 ? 'Send request' : 'Continue'}
          </button>

          {step === 3 ? (
            <span className="text-[13px] text-bone-faint">Takes a few seconds.</span>
          ) : null}
        </div>
      </form>
    </div>
  )
}

function StepShell({
  n,
  title,
  body,
  children,
}: {
  n: string
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="animate-rise">
      <p className="font-mono text-[12px] text-gold">{n}</p>
      <h2 className="mt-3 font-display text-3xl leading-tight text-bone sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-bone-dim">{body}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  hint,
  optional,
  autoComplete,
  inputMode,
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  error?: string
  hint?: string
  optional?: boolean
  autoComplete?: string
  inputMode?: 'numeric' | 'text' | 'tel' | 'email'
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {optional ? <span className="text-bone-faint">Optional</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={`field ${error ? 'border-flag/70' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-2 text-[13px] text-bone-faint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-err`} className="mt-2 text-[13px] text-flag">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** What the applicant sees the moment the check finishes. */
function Outcome({
  status,
  statusToken,
  minTenureMonths,
}: {
  status: Status
  statusToken?: string
  minTenureMonths: number
}) {
  const statusHref = statusToken ? `/status?token=${encodeURIComponent(statusToken)}` : '/status'

  if (status === 'approved') {
    return (
      <div className="animate-rise text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-verified/50 bg-verified/10 text-2xl text-verified">
          ✓
        </div>
        <p className="eyebrow mt-8">Verified</p>
        <h2 className="mt-4 font-display text-4xl leading-tight text-bone sm:text-5xl">
          You&apos;re in.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-bone-dim">
          Your profile checked out. You will be added to your circle&apos;s WhatsApp group
          shortly — keep an eye on the number you gave us.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={statusHref} className="btn-primary">
            See your place in the queue
          </Link>
          <Link href="/directory" className="btn-ghost">
            Browse other circles
          </Link>
        </div>
        <p className="mt-6 text-[13px] text-bone-faint">
          Save that link — it is the only way back to your application.
        </p>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="animate-rise text-center">
        <p className="eyebrow">Not this time</p>
        <h2 className="mt-4 font-display text-4xl leading-tight text-bone sm:text-5xl">
          Not yet — but soon.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-bone-dim">
          CircleIn asks for at least {minTenureMonths} months in the role you applied with. Come back
          once you have passed that and you are welcome to apply again.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={statusHref} className="btn-ghost">
            See the full reasoning
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
        <span className="h-2.5 w-2.5 animate-sweep rounded-full bg-gold" aria-hidden="true" />
      </div>
      <p className="eyebrow mt-8">With a person</p>
      <h2 className="mt-4 font-display text-4xl leading-tight text-bone sm:text-5xl">
        Almost there.
      </h2>
      <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-bone-dim">
        The numbers checked out, but one detail needs a human eye before we let you in. That
        usually takes under a day, and you will hear either way.
      </p>
      <div className="mt-8">
        <Link href={statusHref} className="btn-primary">
          Track your request
        </Link>
      </div>
      <p className="mt-6 text-[13px] text-bone-faint">
        Save that link — it is the only way back to your application.
      </p>
    </div>
  )
}
