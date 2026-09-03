import type { VerificationReason, VerificationVerdict } from '@/lib/supabase/types'

/** A single job on someone's profile. */
export interface ProfilePosition {
  title: string
  company: string
  /** ISO date. LinkedIn only exposes month precision, so day is usually 01. */
  startedAt: string
  endedAt: string | null
  isCurrent: boolean
  location?: string
}

/**
 * The subset of a LinkedIn profile the verification policy actually needs.
 * Providers map their own payloads into this shape, so swapping data source
 * never touches the rules.
 */
export interface LinkedInProfile {
  profileUrl: string
  fullName: string | null
  headline: string | null
  location: string | null
  /**
   * When the account was created. Rarely published directly; providers that
   * cannot determine it should leave it null rather than guess, and the rules
   * will treat that as unknown instead of as a pass.
   */
  accountCreatedAt: string | null
  positions: ProfilePosition[]
  /** Where this came from, recorded on every check for auditability. */
  provider: string
  /** True when the data came from the applicant rather than an independent source. */
  selfReported: boolean
}

export interface ProfileFetchResult {
  ok: boolean
  profile?: LinkedInProfile
  error?: string
}

/** What the applicant says about themselves. */
export interface ApplicationClaim {
  fullName: string
  linkedinUrl: string
  rawTitle: string
  company?: string | null
  citySlug: string
  nicheSlug: string
  roleSlug?: string | null
  senioritySlug?: string | null
  /** Applicant-declared start date, used when no provider can supply one. */
  declaredStartedAt?: string | null
  declaredAccountCreatedAt?: string | null
}

export interface RuleOutcome {
  reasons: VerificationReason[]
  accountAgeMonths: number | null
  tenureMonths: number | null
  matchedRole: string | null
  matchedSeniority: string | null
  matchedCity: string | null
  matchConfidence: number
  /** A hard failure means reject outright — no amount of AI judgement overrides it. */
  hardFailure: boolean
  /** Something could not be established either way. */
  unknowns: string[]
}

export interface JudgeResult {
  /** Does the evidence show this person really holds the job they claim? */
  holdsClaimedRole: boolean
  /** Is the niche they picked a fair description of their work? */
  nicheFits: boolean
  confidence: number
  summary: string
  concerns: string[]
  model: string | null
}

export interface VerificationOutcome {
  verdict: VerificationVerdict
  /** What should happen to the application as a result. */
  decision: 'approved' | 'rejected' | 'needs_review'
  reasons: VerificationReason[]
  accountAgeMonths: number | null
  tenureMonths: number | null
  matchedRole: string | null
  matchedSeniority: string | null
  matchedCity: string | null
  matchConfidence: number
  headline: string | null
  profileLocation: string | null
  provider: string
  model: string | null
  rawProfile: LinkedInProfile | null
  decisionNote: string
}
