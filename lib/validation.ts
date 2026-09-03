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
  fullName: z.string().trim().min(2, 'Add your name.').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('That email does not look right.')).and(z.string().max(200)),
  linkedinUrl,
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

/** Turn a Zod failure into field -> first message, for rendering next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
