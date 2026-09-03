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

  console.log('\nSigning in with LinkedIn settles identity:')
  const signedIn: ApplicationClaim = {
    ...claim,
    fullName: 'P. Nair',
    identity: {
      sub: 'li-abc123',
      fullName: 'Priya Nair',
      email: 'priya@example.com',
      emailVerified: true,
      picture: null,
    },
  }
  const withId = applyRules(signedIn, profile)
  const idReason = withId.reasons.find((r) => r.rule === 'identity')
  console.log(`  ${idReason?.passed ? 'PASS' : 'FAIL'}  ${idReason?.detail}`)
  if (!idReason?.passed) failures.push('a signed-in identity should pass the identity rule')
  if (withId.reasons.some((r) => r.rule === 'name_match')) {
    failures.push('name matching should be skipped once identity is verified')
  } else {
    console.log('  PASS  name matching skipped — identity already proven')
  }
  if (withId.unknowns.includes('identity')) failures.push('a signed-in application should not be unknown-identity')

  console.log('\nWithout signing in, identity is an open question:')
  const anonymous = applyRules({ ...claim, identity: null }, profile)
  const anonIdentity = anonymous.reasons.find((r) => r.rule === 'identity')
  console.log(`  ${anonIdentity?.passed ? 'PASS' : 'open'}  ${anonIdentity?.detail}`)
  if (anonIdentity?.passed) failures.push('an application with no sign-in should not pass the identity rule')
  if (!anonymous.unknowns.includes('identity')) {
    failures.push('an application with no sign-in should be flagged for review')
  }

  console.log('\nSelf-reported dates always reach a person:')
  const declared = applyRules(signedIn, { ...profile, selfReported: true, provider: 'manual' })
  if (!declared.unknowns.includes('independent_source')) {
    failures.push('self-reported dates should never auto-approve')
  } else {
    console.log('  PASS  flagged as not independently sourced')
  }

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
