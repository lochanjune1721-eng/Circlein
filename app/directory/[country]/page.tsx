import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { memberCounts } from '@/lib/circles'
import { METRO_BY_SLUG, citiesInCountry } from '@/lib/taxonomy/cities'
import { COUNTRIES, COUNTRY_BY_SLUG } from '@/lib/taxonomy/countries'

export const revalidate = 300

export function generateStaticParams() {
  return COUNTRIES.map((country) => ({ country: country.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>
}): Promise<Metadata> {
  const { country: slug } = await params
  const country = COUNTRY_BY_SLUG.get(slug)
  if (!country) return { title: 'Not found' }
  return {
    title: `${country.name} directory`,
    description: `Cities in ${country.name} with CircleIn circles.`,
  }
}

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params
  const country = COUNTRY_BY_SLUG.get(slug)
  if (!country) notFound()

  const cities = citiesInCountry(country.slug)
  const { byCity } = await memberCounts()

  // Group by state/province, falling back to a single unnamed group for
  // countries where an admin level would be noise.
  const areas = new Map<string, typeof cities>()
  for (const city of cities) {
    const key = city.area ?? (city.metro ? (METRO_BY_SLUG.get(city.metro)?.name ?? '') : '')
    const bucket = areas.get(key) ?? []
    bucket.push(city)
    areas.set(key, bucket)
  }

  return (
    <div className="shell pb-24 pt-16">
      <nav aria-label="Breadcrumb" className="text-[13px] text-bone-faint">
        <Link href="/directory" className="hover:text-bone">
          Directory
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-bone-dim">{country.name}</span>
      </nav>

      <h1 className="mt-6 flex items-center gap-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight text-bone">
        <span aria-hidden="true">{country.emoji}</span>
        {country.name}
      </h1>
      <p className="mt-4 text-[16px] text-bone-dim">
        {cities.length} {cities.length === 1 ? 'city' : 'cities'}. Pick one to see its circles.
      </p>

      <div className="mt-14 space-y-12">
        {[...areas.entries()].map(([area, list]) => (
          <section key={area || 'all'}>
            {area ? <h2 className="eyebrow">{area}</h2> : null}
            <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${area ? 'mt-5' : ''}`}>
              {list.map((city, i) => {
                const members = byCity.get(city.slug) ?? 0
                return (
                  <Link
                    key={city.slug}
                    href={`/directory/${country.slug}/${city.slug}`}
                    className="group card animate-rise stagger flex items-center justify-between gap-4 p-5
                               transition-colors hover:border-gold/50"
                    style={{ ['--i' as string]: Math.min(i, 12) }}
                  >
                    <span>
                      <span className="text-[15px] text-bone transition-colors group-hover:text-gold">
                        {city.name}
                      </span>
                      {city.aliases?.[0] ? (
                        <span className="block text-[12px] text-bone-faint">
                          also {city.aliases[0]}
                        </span>
                      ) : null}
                    </span>
                    {members > 0 ? (
                      <span className="shrink-0 text-[12px] text-gold">{members}</span>
                    ) : null}
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
