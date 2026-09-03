/**
 * Exercises the verification rules against the boundary cases that matter.
 * Not a substitute for a test suite, but it keeps the three-month rule honest.
 */
import { applyRules } from '../lib/verification/rules'
import { mockProvider } from '../lib/verification/provider'
import type { ApplicationClaim } from '../lib/verification/types'

const claim: ApplicationClaim = {
  fullName: 'Priya Nair',
  linkedinUrl: 'https://www.linkedin.com/in/priya-nair-demo/',
  rawTitle: 'Senior Machine Learning Engineer',
  company: 'Acme',
  citySlug: 'bengaluru',
  nicheSlug: 'machine-learning',
  roleSlug: 'machine-learning-engineer',
  senioritySlug: 'senior',
}

async function main() {
  const res = await mockProvider.fetch(claim)
  if (!res.ok || !res.profile) throw new Error(res.error)
  const profile = { ...res.profile, location: 'Bengaluru, Karnataka, India' }

  const out = applyRules(claim, profile)
  console.log(`tenure ${out.tenureMonths}mo, account ${out.accountAgeMonths}mo, hardFailure=${out.hardFailure}`)
  for (const r of out.reasons) console.log(`  ${r.passed ? 'PASS' : 'FAIL'}  ${r.label}: ${r.detail}`)

  console.log('\nThe three-month boundary:')
  const failures: string[] = []
  for (const [months, shouldFail] of [[0, true], [2, true], [3, false], [4, false]] as const) {
    const d = new Date()
    d.setUTCMonth(d.getUTCMonth() - months)
    const first = profile.positions[0]
    if (!first) throw new Error('mock profile has no positions')
    const p = { ...profile, positions: [{ ...first, startedAt: d.toISOString().slice(0, 10) }] }
    const o = applyRules(claim, p)
    const tenureFailed = o.reasons.some((r) => r.rule === 'tenure' && !r.passed)
    const ok = tenureFailed === shouldFail
    console.log(`  started ${months}mo ago -> tenure=${o.tenureMonths}, rejected=${tenureFailed} ${ok ? '' : '  <-- WRONG'}`)
    if (!ok) failures.push(`${months} months: expected rejected=${shouldFail}`)
  }

  console.log('\nCity in the same metro still counts:')
  const ncr: ApplicationClaim = { ...claim, citySlug: 'new-delhi' }
  const noidaProfile = { ...profile, location: 'Noida, Uttar Pradesh, India' }
  const o = applyRules(ncr, noidaProfile)
  const cityReason = o.reasons.find((r) => r.rule === 'city_match')
  console.log(`  ${cityReason?.passed ? 'PASS' : 'FAIL'}  ${cityReason?.detail}`)
  if (!cityReason?.passed) failures.push('Noida should match the Delhi NCR market')

  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`)
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }
  console.log('\nVerification rules OK.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
