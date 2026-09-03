import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { POLICY } from '@/lib/config'
import { circleSize } from '@/lib/circles'
import { CITY_BY_SLUG, METRO_BY_SLUG, citiesInSameMarket } from '@/lib/taxonomy/cities'
import { COUNTRY_BY_SLUG } from '@/lib/taxonomy/countries'
import { NICHE_BY_SLUG, NICHE_GROUP_BY_SLUG } from '@/lib/taxonomy/niches'
import { ROLE_FAMILIES } from '@/lib/taxonomy/roles'
import { SENIORITY_ORDERED } from '@/lib/taxonomy/seniority'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; niche: string }>
}): Promise<Metadata> {
  const { city: citySlug, niche: nicheSlug } = await params
  const city = CITY_BY_SLUG.get(citySlug)
  const niche = NICHE_BY_SLUG.get(nicheSlug)
  if (!city || !niche) return { title: 'Not found' }
  return {
    title: `${niche.name} in ${city.name}`,
    description: `The CircleIn circle for ${niche.name} people in ${city.name}. Verified members only.`,
  }
}

export default async function CirclePage({
  params,
}: {
  params: Promise<{ city: string; niche: string }>
}) {
  const { city: citySlug, niche: nicheSlug } = await params
  const city = CITY_BY_SLUG.get(citySlug)
  const niche = NICHE_BY_SLUG.get(nicheSlug)
  if (!city || !niche) notFound()

  const country = COUNTRY_BY_SLUG.get(city.country)
  const group = NICHE_GROUP_BY_SLUG.get(niche.group)
  const metro = city.metro ? METRO_BY_SLUG.get(city.metro) : undefined
  const market = citiesInSameMarket(city.slug)
  const members = await circleSize(city.slug, niche.slug)

  // Roles that commonly sit in this niche — concrete enough that someone can
  // tell at a glance whether this is their room.
  const roles = ROLE_FAMILIES.filter((f) => f.niches.includes(niche.slug))
    .flatMap((f) => f.roles)
    .slice(0, 14)

  const groupsNeeded = Math.max(1, Math.ceil(members / POLICY.whatsappGroupCapacity))

  return (
    <div className="shell pb-24 pt-16">
      <nav aria-label="Breadcrumb" className="text-[13px] text-bone-faint">
        <Link href="/directory" className="hover:text-bone">
          Directory
        </Link>
        {country ? (
          <>
            <span aria-hidden="true"> / </span>
            <Link href={`/directory/${country.slug}`} className="hover:text-bone">
              {country.name}
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href={`/directory/${country.slug}/${city.slug}`} className="hover:text-bone">
              {city.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden="true"> / </span>
        <span className="text-bone-dim">{niche.name}</span>
      </nav>

      <div className="mt-8 grid gap-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow">{group?.name ?? 'Circle'}</p>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.02] text-bone">
            {niche.name}
            <span className="block text-bone-dim">in {city.name}</span>
          </h1>

          <p className="mt-6 max-w-prose text-[16px] leading-relaxed text-bone-dim">
            {members > 0 ? (
              <>
                <span className="text-bone">
                  {members} verified {members === 1 ? 'member' : 'members'}
                </span>{' '}
                across {groupsNeeded} {groupsNeeded === 1 ? 'group' : 'groups'}. Everyone here has
                been doing this work for at least {POLICY.minTenureMonths} months, checked against
                their LinkedIn.
              </>
            ) : (
              <>
                This circle has not opened yet. It opens the moment its first member is verified in —
                which could be you.
              </>
            )}
          </p>

          {metro && market.length > 1 ? (
            <p className="mt-4 max-w-prose text-[14px] leading-relaxed text-bone-faint">
              Covers the whole {metro.name}: {market.map((c) => c.name).join(', ')}.
            </p>
          ) : null}

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/apply" className="btn-primary">
              Request an invite
            </Link>
            {country ? (
              <Link href={`/directory/${country.slug}/${city.slug}`} className="btn-ghost">
                Other circles in {city.name}
              </Link>
            ) : null}
          </div>

          {roles.length > 0 ? (
            <div className="mt-14">
              <h2 className="eyebrow">Who is usually in here</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {roles.map((role) => (
                  <li key={role.slug} className="chip">
                    {role.name}
                  </li>
                ))}
              </ul>
              <p className="mt-4 max-w-prose text-[13px] leading-relaxed text-bone-faint">
                At any level — seniority is tracked separately, so{' '}
                {SENIORITY_ORDERED.slice(4, 10)
                  .map((s) => s.name)
                  .join(', ')}{' '}
                and everyone else share the room.
              </p>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="eyebrow">This circle</p>
            <dl className="mt-5 space-y-4 text-[14px]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-bone-faint">City</dt>
                <dd className="text-bone">
                  {country?.emoji} {city.name}
                </dd>
              </div>
              {city.area ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-bone-faint">Region</dt>
                  <dd className="text-bone">{city.area}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-bone-faint">Niche</dt>
                <dd className="text-bone">{niche.name}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-bone-faint">Members</dt>
                <dd className="text-bone">{members > 0 ? members : 'Opening'}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-bone-faint">Group cap</dt>
                <dd className="text-bone">{POLICY.whatsappGroupCapacity}</dd>
              </div>
            </dl>
          </div>

          {niche.aliases?.length ? (
            <div className="card mt-4 p-6">
              <p className="eyebrow">Also called</p>
              <p className="mt-3 text-[14px] leading-relaxed text-bone-dim">
                {niche.aliases.join(', ')}
              </p>
            </div>
          ) : null}

          <div className="card mt-4 p-6">
            <p className="eyebrow">Members only</p>
            <p className="mt-3 text-[14px] leading-relaxed text-bone-dim">
              We never list who is in a circle. You will meet them in the group, not on a page a
              stranger can scrape.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
