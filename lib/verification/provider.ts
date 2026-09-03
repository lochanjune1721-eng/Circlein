import type { LinkedInProfile, ProfileFetchResult, ApplicationClaim } from './types'

/**
 * Where profile data comes from.
 *
 * A note on what is and is not possible here, because it shapes the whole
 * design: LinkedIn has no public API that returns a stranger's profile, and
 * scraping it breaches their terms of service. So CircleIn does not scrape.
 * Instead this is a provider interface, and the operator plugs in whichever
 * lawful source they have a relationship with — a licensed data vendor, or
 * LinkedIn's own partner APIs.
 *
 * Three implementations ship:
 *   `mock`   — deterministic fake data, so the flow is demoable with no vendor.
 *   `http`   — a configurable vendor endpoint, mapped into our shape.
 *   `manual` — the applicant's own declaration, always routed to a human.
 *
 * Everything downstream — rules, AI judge, decision — is identical whichever
 * one is in use, and every check records which provider produced its data.
 */
export interface ProfileProvider {
  name: string
  fetch(claim: ApplicationClaim): Promise<ProfileFetchResult>
}

/** LinkedIn vanity name from a profile URL, or null if the URL is not one. */
export function linkedinHandle(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    if (!/(^|\.)linkedin\.com$/i.test(parsed.hostname)) return null
    const match = parsed.pathname.match(/\/in\/([^/]+)\/?/i)
    return match?.[1] ? decodeURIComponent(match[1]).toLowerCase() : null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual provider — the applicant's own declaration.
// ─────────────────────────────────────────────────────────────────────────────

export const manualProvider: ProfileProvider = {
  name: 'manual',
  async fetch(claim) {
    if (!claim.declaredStartedAt) {
      return { ok: false, error: 'No start date declared and no profile source configured.' }
    }
    const profile: LinkedInProfile = {
      profileUrl: claim.linkedinUrl,
      fullName: claim.fullName,
      headline: claim.rawTitle,
      location: null,
      accountCreatedAt: claim.declaredAccountCreatedAt ?? null,
      positions: [
        {
          title: claim.rawTitle,
          company: claim.company ?? 'Undisclosed',
          startedAt: claim.declaredStartedAt,
          endedAt: null,
          isCurrent: true,
        },
      ],
      provider: 'manual',
      selfReported: true,
    }
    return { ok: true, profile }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP provider — a vendor endpoint, described entirely by environment.
// ─────────────────────────────────────────────────────────────────────────────

interface VendorPosition {
  title?: string
  job_title?: string
  company?: string
  company_name?: string
  starts_at?: string | { year?: number; month?: number; day?: number }
  start_date?: string
  ends_at?: string | { year?: number; month?: number; day?: number } | null
  end_date?: string | null
  location?: string
}

interface VendorPayload {
  full_name?: string
  name?: string
  headline?: string
  occupation?: string
  location?: string
  city?: string
  country_full_name?: string
  profile_created_at?: string
  created_at?: string
  member_since?: string
  experiences?: VendorPosition[]
  positions?: VendorPosition[]
}

/** Vendors variously return "2021-06-01" or {year, month, day}. Accept both. */
function toIsoDate(value: VendorPosition['starts_at']): string | null {
  if (!value) return null
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
  }
  const { year, month = 1, day = 1 } = value
  if (!year) return null
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10)
}

export function mapVendorPayload(payload: VendorPayload, url: string): LinkedInProfile {
  const rawPositions = payload.experiences ?? payload.positions ?? []
  const positions = rawPositions
    .map((p) => {
      const startedAt = toIsoDate(p.starts_at) ?? toIsoDate(p.start_date)
      const endedAt = toIsoDate(p.ends_at ?? undefined) ?? toIsoDate(p.end_date ?? undefined)
      if (!startedAt) return null
      return {
        title: p.title ?? p.job_title ?? '',
        company: p.company ?? p.company_name ?? '',
        startedAt,
        endedAt,
        isCurrent: !endedAt,
        location: p.location,
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    // Most recent first, so "current role" is unambiguous.
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))

  return {
    profileUrl: url,
    fullName: payload.full_name ?? payload.name ?? null,
    headline: payload.headline ?? payload.occupation ?? null,
    location:
      payload.location ??
      [payload.city, payload.country_full_name].filter(Boolean).join(', ') ??
      null,
    accountCreatedAt:
      toIsoDate(payload.profile_created_at) ??
      toIsoDate(payload.created_at) ??
      toIsoDate(payload.member_since),
    positions,
    provider: 'http',
    selfReported: false,
  }
}

export const httpProvider: ProfileProvider = {
  name: 'http',
  async fetch(claim) {
    const endpoint = process.env.LINKEDIN_PROVIDER_URL
    const apiKey = process.env.LINKEDIN_PROVIDER_KEY
    if (!endpoint) return { ok: false, error: 'LINKEDIN_PROVIDER_URL is not set.' }

    const url = new URL(endpoint)
    url.searchParams.set('url', claim.linkedinUrl)

    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        // A verification run must not hang the request that triggered it.
        signal: AbortSignal.timeout(20_000),
      })
      if (!res.ok) return { ok: false, error: `Profile provider returned ${res.status}.` }
      const payload = (await res.json()) as VendorPayload
      return { ok: true, profile: mapVendorPayload(payload, claim.linkedinUrl) }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Profile fetch failed.' }
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock provider — deterministic, so the same URL always yields the same
// profile and the demo behaves predictably.
// ─────────────────────────────────────────────────────────────────────────────

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function monthsAgo(months: number): string {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() - months)
  d.setUTCDate(1)
  return d.toISOString().slice(0, 10)
}

export const mockProvider: ProfileProvider = {
  name: 'mock',
  async fetch(claim) {
    const handle = linkedinHandle(claim.linkedinUrl)
    if (!handle) return { ok: false, error: 'That does not look like a LinkedIn profile URL.' }

    const seed = hash(handle)
    // Spread across the interesting cases: most pass, some are too new in role,
    // some have a young account — so the whole decision tree is exercisable.
    const tenure = [2, 5, 9, 14, 26, 41, 63][seed % 7] as number
    const accountAge = [7, 18, 34, 52, 96, 140][seed % 6] as number

    const profile: LinkedInProfile = {
      profileUrl: claim.linkedinUrl,
      fullName: claim.fullName,
      headline: claim.rawTitle,
      location: null,
      accountCreatedAt: monthsAgo(Math.max(accountAge, tenure)),
      positions: [
        {
          title: claim.rawTitle,
          company: claim.company ?? 'Undisclosed',
          startedAt: monthsAgo(tenure),
          endedAt: null,
          isCurrent: true,
        },
      ],
      provider: 'mock',
      selfReported: false,
    }
    return { ok: true, profile }
  },
}

/**
 * Pick the provider for this deployment. Explicit env wins; otherwise use the
 * vendor endpoint if one is configured, and fall back to mock so the app is
 * always runnable.
 */
export function activeProvider(): ProfileProvider {
  const configured = (process.env.LINKEDIN_PROVIDER ?? '').toLowerCase()
  if (configured === 'http') return httpProvider
  if (configured === 'manual') return manualProvider
  if (configured === 'mock') return mockProvider
  return process.env.LINKEDIN_PROVIDER_URL ? httpProvider : mockProvider
}
