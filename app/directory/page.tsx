import type { Metadata } from 'next'
import Link from 'next/link'
import { memberCounts } from '@/lib/circles'
import { citiesInCountry } from '@/lib/taxonomy/cities'
import { COUNTRIES_BY_REGION } from '@/lib/taxonomy/countries'
import { NICHES } from '@/lib/taxonomy/niches'

export const metadata: Metadata = {
  title: 'Directory',
  description: 'Browse CircleIn by country, city and niche.',
}

export const revalidate = 300

export default async function DirectoryPage() {
  const { byCountry, total } = await memberCounts()

  return (
    <div className="shell pb-24 pt-16">
      <p className="eyebrow">Directory</p>
      <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.03] text-bone">
        Country, then city, then the work.
      </h1>
      <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-bone-dim">
        Circles are how CircleIn is organised: one room per city per niche.
        {total > 0 ? ` ${total} verified members so far.` : ' Rooms open as members are verified into them.'}{' '}
        <Link href="/directory/niches" className="text-gold hover:text-gold-bright">
          Browse by niche instead →
        </Link>
      </p>

      <div className="mt-16 space-y-16">
        {COUNTRIES_BY_REGION.map((region) => (
          <section key={region.slug}>
            <h2 className="eyebrow">{region.name}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {region.countries.map((country, i) => {
                const cities = citiesInCountry(country.slug)
                const members = byCountry.get(country.slug) ?? 0
                return (
                  <Link
                    key={country.slug}
                    href={`/directory/${country.slug}`}
                    className="group card animate-rise stagger flex items-center justify-between gap-4 p-5
                               transition-colors hover:border-gold/50"
                    style={{ ['--i' as string]: Math.min(i, 12) }}
                  >
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" className="text-lg">
                        {country.emoji}
                      </span>
                      <span className="text-[15px] text-bone transition-colors group-hover:text-gold">
                        {country.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] text-bone-faint">
                      {members > 0 ? `${members} member${members === 1 ? '' : 's'}` : `${cities.length} cities`}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-16 text-[14px] text-bone-faint">
        {NICHES.length} niches across {COUNTRIES_BY_REGION.reduce((n, r) => n + r.countries.length, 0)}{' '}
        countries.
      </p>
    </div>
  )
}
