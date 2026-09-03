'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Combobox, type Option } from './combobox'

/**
 * The whole application, on one page.
 *
 * Seven fields, one submit. An earlier version split this across four steps;
 * that only made sense while it was also collecting a niche and a start date.
 * Now that the niche is derived from the role, there is nothing left to
 * paginate.
 */

interface Props {
  cities: Option[]
  roles: Option[]
  /** False when the deployment has no database yet; the form says so rather than failing. */
  intakeOpen: boolean
}

type Status = 'pending' | 'verifying' | 'needs_review' | 'approved' | 'rejected' | 'withdrawn'

interface SubmitResponse {
  ok: boolean
  statusToken?: string
  status?: Status
  error?: string
  fields?: Record<string, string>
  alreadyApplied?: boolean
}

export function ApplyForm({ cities, roles, intakeOpen }: Props) {
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [citySlug, setCitySlug] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [roleSlug, setRoleSlug] = useState<string | null>(null)
  const [website, setWebsite] = useState('') // honeypot

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const ready =
    fullName.trim().length >= 2 &&
    whatsapp.replace(/\D/g, '').length >= 8 &&
    linkedinUrl.trim().length > 4 &&
    Boolean(citySlug) &&
    company.trim().length >= 1 &&
    Boolean(roleSlug)

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
          whatsapp,
          linkedinUrl,
          portfolioUrl: portfolioUrl || null,
          citySlug,
          company,
          roleSlug,
          website,
        }),
      })
      const data = (await response.json()) as SubmitResponse
      if (!response.ok || !data.ok) {
        setFieldErrors(data.fields ?? {})
        setFormError(data.error ?? 'Something went wrong. Try again in a moment.')
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
    return (
      <Outcome statusToken={result.statusToken} alreadyApplied={result.alreadyApplied ?? false} />
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (ready) void submit()
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

      <div className="space-y-6">
        <Field
          label="Your name"
          id="fullName"
          value={fullName}
          onChange={setFullName}
          placeholder="As it appears on LinkedIn"
          error={fieldErrors.fullName}
          autoComplete="name"
        />

        <Field
          label="WhatsApp number"
          id="whatsapp"
          type="tel"
          value={whatsapp}
          onChange={setWhatsapp}
          placeholder="+91 98765 43210"
          hint="With the country code. This is how you get added to the group."
          error={fieldErrors.whatsapp}
          autoComplete="tel"
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
          label="Portfolio or site"
          id="portfolioUrl"
          value={portfolioUrl}
          onChange={setPortfolioUrl}
          placeholder="yoursite.com or github.com/you"
          optional
          error={fieldErrors.portfolioUrl}
          autoComplete="url"
        />

        <Combobox
          label="City"
          options={cities}
          value={citySlug}
          onChange={setCitySlug}
          placeholder="Bengaluru, London, São Paulo…"
          description="Where you work most weeks. Cities that share a commute share a circle."
          error={fieldErrors.citySlug}
          emptyMessage="We do not have that city yet. Try the nearest major one."
        />

        <Field
          label="Company"
          id="company"
          value={company}
          onChange={setCompany}
          placeholder="Where you work"
          error={fieldErrors.company}
          autoComplete="organization"
        />

        <Combobox
          label="Role"
          options={roles}
          value={roleSlug}
          onChange={setRoleSlug}
          placeholder="Backend Engineer, Product Manager, Founder…"
          description="Search by title — this decides which circle you land in."
          error={fieldErrors.roleSlug}
          emptyMessage="Nothing matches. Try the closest title."
        />
      </div>

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

      <div className="mt-9 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary" disabled={!ready || submitting}>
          {submitting ? 'Checking your profile…' : 'Send request'}
        </button>
        <span className="text-[13px] text-bone-faint">Takes a few seconds.</span>
      </div>
    </form>
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
        // A phone keyboard that autocapitalises and autocorrects turns
        // "linkedin.com/in/me" into "Linkedin.com/in/me" before you finish
        // typing it, so URL and email fields opt out of both.
        inputMode={type === 'tel' ? 'tel' : autoComplete === 'url' ? 'url' : undefined}
        autoCapitalize={autoComplete === 'url' ? 'none' : undefined}
        autoCorrect={autoComplete === 'url' ? 'off' : undefined}
        spellCheck={autoComplete === 'url' ? false : undefined}
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

/**
 * What the applicant sees once their request is in.
 *
 * Deliberately the same whatever the automated check decided. The verdict and
 * its reasoning are recorded for whoever reviews applications; an applicant is
 * told that their request is being verified and nothing about how. Publishing
 * the criteria would only teach people how to meet them on paper.
 *
 * Note what it does not promise: "once you are in" keeps the group placement
 * conditional, so nobody who is later turned down was told otherwise.
 */
function Outcome({
  statusToken,
  alreadyApplied,
}: {
  statusToken?: string
  alreadyApplied: boolean
}) {
  const statusHref = statusToken ? `/status?token=${encodeURIComponent(statusToken)}` : '/status'

  if (alreadyApplied) {
    return (
      <div className="animate-rise text-center">
        <p className="eyebrow">Already with us</p>
        <h2 className="mt-4 font-display text-4xl leading-tight text-bone sm:text-5xl">
          You have already asked.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-bone-dim">
          There is a request against your LinkedIn already. Here is where it stands.
        </p>
        <div className="mt-8">
          <Link href={statusHref} className="btn-primary">
            See your request
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

      <p className="eyebrow mt-8">Request received</p>
      <h2 className="mt-4 font-display text-4xl leading-tight text-bone sm:text-5xl">
        That&apos;s everything we need.
      </h2>
      <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-bone-dim">
        We will verify your request and, once you are in, add you to the group that fits you
        best — on the number you gave us.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={statusHref} className="btn-primary">
          Track your request
        </Link>
        <Link href="/directory" className="btn-ghost">
          Browse the circles
        </Link>
      </div>

      <p className="mt-6 text-[13px] text-bone-faint">
        Save that link — it is how you check back.
      </p>
    </div>
  )
}
