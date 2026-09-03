/**
 * Verification policy and runtime configuration.
 *
 * The thresholds are deliberately in one place: they are the product's promise
 * to its members ("everyone here has actually been doing this job"), so they
 * should be legible and changeable without hunting through the codebase.
 */

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export const POLICY = {
  /**
   * How long someone must have held their current role. The rule the network is
   * built on: three months rules out the "started last week" headline change,
   * which is the single most common way a directory like this fills with noise.
   */
  minTenureMonths: intFromEnv('CIRCLEIN_MIN_TENURE_MONTHS', 3),

  /**
   * How old the LinkedIn account itself must be. Not specified as a hard number
   * in the brief, so this is a judgement call: a year is long enough that
   * throwaway profiles created to get in do not qualify, and short enough that
   * genuine early-career applicants are not shut out. Tune with the env var.
   */
  minAccountAgeMonths: intFromEnv('CIRCLEIN_MIN_ACCOUNT_AGE_MONTHS', 12),

  /**
   * Below this, the automated match is not trusted to decide on its own and the
   * application goes to a human instead of being auto-rejected. Rejecting a real
   * member is more costly than asking someone to wait a day.
   */
  minMatchConfidence: 0.55,

  /** Applications per IP per hour. */
  rateLimitPerHour: intFromEnv('CIRCLEIN_RATE_LIMIT_PER_HOUR', 5),

  /** A WhatsApp group stops being useful past this; the next one opens. */
  whatsappGroupCapacity: intFromEnv('CIRCLEIN_WHATSAPP_CAPACITY', 200),
} as const

/**
 * Supabase's public pair.
 *
 * Plain names are the documented ones. NEXT_PUBLIC_* still work, because
 * that prefix is how Next.js inlines a value into the browser bundle and some
 * hosts are already set up that way — but nothing here relies on it. The
 * browser never reads these from `process.env`; a server component passes them
 * down as props, which is why the plain names work at all and why changing
 * them takes effect on the next request rather than the next build.
 */
export const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * The public pair, or null when this deployment has neither. Safe to send to
 * the browser: the anon key is public by design and bound by row level
 * security.
 */
export function publicSupabaseConfig(): { url: string; anonKey: string } | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY }
}
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/**
 * The site runs without a database — the directory and the application form
 * still render, and submitting explains that intake is not yet live. That keeps
 * the whole thing previewable before anyone has provisioned Supabase.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY)
}

export const ADMIN_TOKEN = process.env.CIRCLEIN_ADMIN_TOKEN ?? ''

export const SITE = {
  name: 'CircleIn',
  tagline: 'The room you should already be in.',
  description:
    'A verified network of people doing the same work in the same city. Every member is checked against their LinkedIn before they are let in.',
} as const
