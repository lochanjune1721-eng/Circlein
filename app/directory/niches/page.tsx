import type { Metadata } from 'next'
import Link from 'next/link'
import { memberCounts } from '@/lib/circles'
import { NICHE_GROUPS } from '@/lib/taxonomy/niches'
import { ROLE_FAMILIES } from '@/lib/taxonomy/roles'

export const metadata: Metadata = {
  title: 'Niches',
  description: 'Every niche CircleIn organises people by, and the roles that sit under each.',
}

export const revalidate = 300

export default async function NichesPage() {
  const { byNiche } = await memberCounts()

  // Which role families point at a niche — useful for someone unsure where
  // their job sits.
  const rolesByNiche = new Map<string, string[]>()
  for (const family of ROLE_FAMILIES) {
    for (const nicheSlug of family.niches) {
      const list = rolesByNiche.get(nicheSlug) ?? []
      for (const role of family.roles.slice(0, 4)) list.push(role.name)
      rolesByNiche.set(nicheSlug, list)
    }
  }

  return (
    <div className="shell pb-24 pt-16">
      <nav aria-label="Breadcrumb" className="text-[13px] text-bone-faint [&_a]:inline-block [&_a]:py-1.5">
        <Link href="/directory" className="hover:text-bone">
          Directory
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-bone-dim">Niches</span>
      </nav>

      <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-bone">
        Every niche, once.
      </h1>
      <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
        No label appears in two places. Where a term could belong to two families — Business
        Development, Biotechnology — it lives in one and is findable from the other by alias.
      </p>

      <div className="mt-16 space-y-14">
        {NICHE_GROUPS.map((group) => (
          <section key={group.slug}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-3xl text-bone">{group.name}</h2>
              <span className="text-[12px] text-bone-faint">{group.niches.length} niches</span>
            </div>
            <p className="mt-2 max-w-prose text-[14px] text-bone-dim">{group.blurb}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.niches.map((niche, i) => {
                const members = byNiche.get(niche.slug) ?? 0
                const sample = rolesByNiche.get(niche.slug)?.slice(0, 3) ?? []
                return (
                  <div
                    key={niche.slug}
                    className="card animate-rise stagger p-5"
                    style={{ ['--i' as string]: Math.min(i, 10) }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[15px] text-bone">{niche.name}</h3>
                      {members > 0 ? (
                        <span className="shrink-0 text-[12px] text-gold">{members}</span>
                      ) : null}
                    </div>
                    {sample.length > 0 ? (
                      <p className="mt-2 text-[12px] leading-relaxed text-bone-faint">
                        {sample.join(' · ')}
                      </p>
                    ) : null}
                    {niche.aliases?.length ? (
                      <p className="mt-2 text-[12px] text-bone-faint">
                        also: {niche.aliases.slice(0, 3).join(', ')}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
