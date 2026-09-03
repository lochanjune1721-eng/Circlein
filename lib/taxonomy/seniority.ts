import type { Seniority } from './types'

/**
 * Seniority is its own dimension. "Senior Backend Engineer" is stored as
 * role=backend-engineer + seniority=senior, never as its own role — otherwise
 * you end up with eight rows meaning the same job.
 *
 * `patterns` are matched against a raw job title, longest first, by
 * `normalizeTitle()`. Order inside the array does not matter.
 */
export interface SeniorityLevel extends Seniority {
  patterns: string[]
}

export const SENIORITY: SeniorityLevel[] = [
  { slug: 'intern', name: 'Intern', rank: 10, patterns: ['intern', 'internship', 'summer analyst'] },
  { slug: 'apprentice', name: 'Apprentice', rank: 20, patterns: ['apprentice', 'apprenticeship'] },
  { slug: 'trainee', name: 'Trainee', rank: 30, patterns: ['trainee', 'graduate trainee', 'management trainee'] },
  { slug: 'entry-level', name: 'Entry Level', rank: 40, patterns: ['entry level', 'entry-level', 'graduate', 'fresher'] },
  { slug: 'junior', name: 'Junior', rank: 50, patterns: ['junior', 'jr', 'jr.'] },
  { slug: 'associate', name: 'Associate', rank: 60, patterns: ['associate', 'asst', 'assistant'] },
  { slug: 'mid-level', name: 'Mid-Level', rank: 70, patterns: ['mid level', 'mid-level', 'intermediate', 'ii', 'iii'] },
  { slug: 'senior', name: 'Senior', rank: 80, patterns: ['senior', 'sr', 'sr.', 'snr'] },
  { slug: 'staff', name: 'Staff', rank: 90, patterns: ['staff'] },
  { slug: 'senior-staff', name: 'Senior Staff', rank: 100, patterns: ['senior staff', 'sr staff'] },
  { slug: 'principal', name: 'Principal', rank: 110, patterns: ['principal', 'distinguished', 'fellow'] },
  { slug: 'lead', name: 'Lead', rank: 120, patterns: ['lead', 'tech lead', 'team lead', 'leader'] },
  { slug: 'manager', name: 'Manager', rank: 130, patterns: ['manager', 'mgr'] },
  { slug: 'senior-manager', name: 'Senior Manager', rank: 140, patterns: ['senior manager', 'sr manager'] },
  { slug: 'head', name: 'Head of', rank: 150, patterns: ['head of', 'head'] },
  { slug: 'director', name: 'Director', rank: 160, patterns: ['director'] },
  { slug: 'senior-director', name: 'Senior Director', rank: 170, patterns: ['senior director', 'sr director'] },
  { slug: 'vp', name: 'VP', rank: 180, patterns: ['vp', 'vice president', 'v.p.'] },
  { slug: 'svp', name: 'SVP', rank: 190, patterns: ['svp', 'senior vice president', 'evp', 'executive vice president'] },
  { slug: 'c-level', name: 'C-Level', rank: 200, patterns: ['chief', 'cto', 'ceo', 'cfo', 'coo', 'cmo', 'cpo', 'cro', 'ciso', 'cdo', 'chro', 'president', 'managing director'] },
  { slug: 'partner', name: 'Partner', rank: 200, patterns: ['partner', 'managing partner', 'general partner'] },
  { slug: 'founder', name: 'Founder', rank: 200, patterns: ['founder', 'co-founder', 'cofounder', 'founding'] },
  { slug: 'owner', name: 'Owner', rank: 200, patterns: ['owner', 'proprietor', 'principal owner'] },
]

export const SENIORITY_BY_SLUG = new Map(SENIORITY.map((s) => [s.slug, s]))

/** Display order: the ladder bottom-to-top, then the off-ladder tracks. */
export const SENIORITY_ORDERED = [...SENIORITY].sort((a, b) => a.rank - b.rank)
