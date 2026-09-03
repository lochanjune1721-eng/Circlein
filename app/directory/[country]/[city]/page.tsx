import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { memberCounts } from '@/lib/circles'
import { CITY_BY_SLUG, METRO_BY_SLUG, citiesInSameMarket } from '@/lib/taxonomy/cities'
import { COUNTRY_BY_SLUG } from '@/lib/taxonomy/countries'
import { NICHE_GROUPS } from '@/lib/taxonomy/niches'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; city: string }>
}): Promise<Metadata> {
  const { city: slug } = await params
  const city = CITY_BY_SLUG.get(slug)
  if (!city) return { title: 'Not found' }
  return {
    title: `${city.name} circles`,
    description: `Every CircleIn circle in ${city.name}, by niche.`,
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ country: string; city: string }>
}) {
  const { country: countrySlug, city: citySlug } = await params
  const city = CITY_BY_SLUG.get(citySlug)
  const country = COUNTRY_BY_SLUG.get(countrySlug)
  if (!city || !country || city.country !== country.slug) notFound()

  const { byCircle } = await memberCounts()
  const metro = city.metro ? METRO_BY_SLUG.get(city.metro) : undefined
  const market = citiesInSameMarket(city.slug).filter((c) => c.slug !== city.slug)

  return (
    <div className="shell pb-24 pt-16">
      <nav aria-label="Breadcrumb" className="text-[13px] text-bone-faint [&_a]:inline-block [&_a]:py-1.5">
        <Link href="/directory" className="hover:text-bone">
          Directory
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/directory/${country.slug}`} className="hover:text-bone">
          {country.name}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-bone-dim">{city.name}</span>
      </nav>

      <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight text-bone">
        {city.name}
      </h1>

      {metro ? (
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-bone-dim">
          Part of the {metro.name} market
          {market.length > 0 ? (
            <>
              , so these circles also include {market.map((c) => c.name).join(', ')}.
            </>
          ) : (
            '.'
          )}
        </p>
      ) : (
        <p className="mt-4 text-[15px] text-bone-dim">
          {city.area ? `${city.area}, ` : ''}
          {country.name}
        </p>
      )}

      <div className="mt-14 space-y-12">
        {NICHE_GROUPS.map((group) => (
          <section key={group.slug}>
            <h2 className="eyebrow">{group.name}</h2>
            <p className="mt-2 max-w-prose text-[13px] text-bone-faint">{group.blurb}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.niches.map((niche, i) => {
                const members = byCircle.get(`${city.slug}/${niche.slug}`) ?? 0
                return (
                  <Link
                    key={niche.slug}
                    href={`/circles/${city.slug}/${niche.slug}`}
                    className="group card animate-rise stagger flex items-center justify-between gap-3 p-4
                               transition-colors hover:border-gold/50"
                    style={{ ['--i' as string]: Math.min(i, 10) }}
                  >
                    <span className="text-[14px] text-bone-dim transition-colors group-hover:text-gold">
                      {niche.name}
                    </span>
                    <span className="shrink-0 text-[12px] text-bone-faint">
                      {members > 0 ? members : '—'}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
