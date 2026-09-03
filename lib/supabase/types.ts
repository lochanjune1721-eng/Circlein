/**
 * Hand-written database types.
 *
 * Kept by hand rather than generated so the shape stays readable and reviewable
 * alongside the migration; regenerate with `supabase gen types` if you prefer.
 */

export type ApplicationStatus =
  | 'pending'
  | 'verifying'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn'

export type VerificationVerdict = 'pass' | 'fail' | 'inconclusive'

export type WhatsAppState = 'queued' | 'invited' | 'joined' | 'failed'

export interface ApplicationRow {
  id: string
  status: ApplicationStatus
  full_name: string
  email: string
  linkedin_url: string
  whatsapp_e164: string
  city: string
  niche: string
  role: string | null
  seniority: string | null
  company: string | null
  raw_title: string
  note: string | null
  status_token: string
  submitted_at: string
  decided_at: string | null
  decision_note: string | null
  ip_hash: string | null
  user_agent: string | null
}

export interface VerificationCheckRow {
  id: string
  application_id: string
  provider: string
  fetched_at: string
  account_age_months: number | null
  tenure_months: number | null
  headline: string | null
  profile_location: string | null
  matched_role: string | null
  matched_seniority: string | null
  matched_city: string | null
  match_confidence: number | null
  verdict: VerificationVerdict
  reasons: VerificationReason[]
  raw_profile: unknown
  model: string | null
  created_at: string
}

export interface VerificationReason {
  rule: string
  label: string
  passed: boolean
  detail: string
}

export interface MemberRow {
  id: string
  application_id: string
  full_name: string
  email: string
  linkedin_url: string
  whatsapp_e164: string
  city: string
  niche: string
  role: string | null
  seniority: string | null
  company: string | null
  headline: string | null
  verified_at: string
  is_active: boolean
  created_at: string
}

export interface CircleRow {
  id: string
  city: string
  niche: string
  member_count: number
  created_at: string
}

export interface CircleDirectoryRow {
  id: string
  city: string
  city_name: string
  country: string
  country_name: string
  country_emoji: string
  metro: string | null
  niche: string
  niche_name: string
  niche_group: string
  member_count: number
  created_at: string
}

export interface WhatsAppGroupRow {
  id: string
  circle_id: string
  name: string
  invite_url: string | null
  capacity: number
  member_count: number
  is_open: boolean
  created_at: string
}

export interface WhatsAppQueueRow {
  id: string
  member_id: string
  group_id: string | null
  state: WhatsAppState
  queued_at: string
  invited_at: string | null
  joined_at: string | null
  note: string | null
}
