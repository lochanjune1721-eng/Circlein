import { z } from 'zod'
import { CITY_BY_SLUG } from '@/lib/taxonomy/cities'
import { NICHE_BY_SLUG } from '@/lib/taxonomy/niches'

/**
 * Everything that crosses the network boundary is parsed here first. The
 * messages are written to be shown to a person, because they are.
 */

const linkedinUrl = z
  .string()
  .trim()
  .min(1, 'Add your LinkedIn profile.')
  .transform((value) => (value.startsWith('http') ? value : `https://${value}`))
  .refine((value) => {
    try {
      const url = new URL(value)
      return /(^|\.)linkedin\.com$/i.test(url.hostname) && /\/in\/[^/]+/i.test(url.pathname)
    } catch {
      return false
    }
  }, 'That should look like https://linkedin.com/in/your-name')

/**
 * Phone numbers arrive in every shape a keyboard allows. Strip the decoration,
 * keep a leading +, and require enough digits to be a real number.
 */
const whatsapp = z
  .string()
  .trim()
  .min(1, 'Add the WhatsApp number you want to be added on.')
  .transform((value) => {
    const digits = value.replace(/[^\d+]/g, '')
    return digits.startsWith('+') ? `+${digits.slice(1).replace(/\D/g, '')}` : `+${digits.replace(/\D/g, '')}`
  })
  .refine((value) => /^\+\d{8,15}$/.test(value), 'Include the country code, e.g. +91 98765 43210.')

export const applySchema = z.object({
  /**
   * Name and email are only read when nobody is signed in. With a LinkedIn
   * session the server takes both from the identity and ignores whatever the
   * form posted, so these cannot be used to apply as someone else.
   */
  fullName: z.string().trim().max(120).optional().default(''),
  email: z.string().trim().toLowerCase().max(200).optional().default(''),
  /** Optional: sign-in proves who you are, the URL is only for the tenure lookup. */
  linkedinUrl: linkedinUrl.optional().nullable(),
  whatsapp,
  citySlug: z.string().refine((s) => CITY_BY_SLUG.has(s), 'Pick a city from the list.'),
  nicheSlug: z.string().refine((s) => NICHE_BY_SLUG.has(s), 'Pick a niche from the list.'),
  rawTitle: z.string().trim().min(2, 'What is your job title?').max(160),
  company: z.string().trim().max(160).optional().nullable(),
  note: z.string().trim().max(600).optional().nullable(),
  declaredStartedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Use YYYY-MM.')
    .optional()
    .nullable()
    .transform((v) => (v ? (v.length === 7 ? `${v}-01` : v) : null)),
  /** Honeypot: a real person never fills this in. */
  website: z.string().max(0).optional(),
})

export type ApplyInput = z.infer<typeof applySchema>

/**
 * The extra fields required when there is no LinkedIn session. Applied on top
 * of `applySchema` by the route, so the signed-in path never has to satisfy
 * them.
 */
export const anonymousApplySchema = z.object({
  // The `error` argument covers a missing key too, so a field left out of the
  // request reads the same as one left blank in the form. Without it Zod says
  // "expected string, received undefined", which then renders under an input.
  fullName: z.string({ error: 'Add your name.' }).trim().min(2, 'Add your name.').max(120),
  email: z
    .string({ error: 'Add your email.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('That email does not look right.')),
  linkedinUrl: z
    .string({ error: 'Add your LinkedIn profile, or sign in with LinkedIn instead.' })
    .pipe(linkedinUrl),
})

/** Turn a Zod failure into field -> first message, for rendering next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
