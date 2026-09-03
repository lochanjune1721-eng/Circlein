import { z } from 'zod'
import { CITY_BY_SLUG } from '@/lib/taxonomy/cities'
import { ROLE_BY_SLUG } from '@/lib/taxonomy/roles'

/**
 * Everything that crosses the network boundary is parsed here first. The
 * messages are written to be shown to a person, because they are.
 */

const linkedinUrl = z
  .string({ error: 'Add your LinkedIn profile.' })
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

/** Any http(s) URL. Portfolios live on every host there is. */
const portfolioUrl = z
  .string()
  .trim()
  .transform((value) => (value.startsWith('http') ? value : `https://${value}`))
  .refine((value) => {
    try {
      const url = new URL(value)
      return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.')
    } catch {
      return false
    }
  }, 'That does not look like a link.')

/**
 * Phone numbers arrive in every shape a keyboard allows. Strip the decoration,
 * keep a leading +, and require enough digits to be a real number.
 */
const whatsapp = z
  .string({ error: 'Add the number to add you on.' })
  .trim()
  .min(1, 'Add the number to add you on.')
  .transform((value) => {
    const digits = value.replace(/[^\d+]/g, '')
    return digits.startsWith('+') ? `+${digits.slice(1).replace(/\D/g, '')}` : `+${digits.replace(/\D/g, '')}`
  })
  .refine((value) => /^\+\d{8,15}$/.test(value), 'Include the country code, e.g. +91 98765 43210.')

/**
 * The whole form, asked on one page.
 *
 * Notably absent: email, and any choice of niche. Everything reaches a member
 * through WhatsApp, and the niche is derived from the role they pick — the
 * taxonomy already knows which niches a role belongs to, so asking would be
 * asking the same question twice.
 */
export const applySchema = z.object({
  fullName: z.string({ error: 'Add your name.' }).trim().min(2, 'Add your name.').max(120),
  whatsapp,
  linkedinUrl,
  portfolioUrl: z.union([portfolioUrl, z.literal('')]).optional().nullable(),
  citySlug: z
    .string({ error: 'Pick your city.' })
    .refine((s) => CITY_BY_SLUG.has(s), 'Pick a city from the list.'),
  company: z.string({ error: 'Where do you work?' }).trim().min(1, 'Where do you work?').max(160),
  roleSlug: z
    .string({ error: 'Pick your role.' })
    .refine((s) => ROLE_BY_SLUG.has(s), 'Pick a role from the list.'),
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
