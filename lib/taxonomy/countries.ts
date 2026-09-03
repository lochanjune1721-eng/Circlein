import type { Country, Region } from './types'

export const REGIONS: { slug: Region; name: string }[] = [
  { slug: 'north-america', name: 'North America' },
  { slug: 'south-america', name: 'South America' },
  { slug: 'europe', name: 'Europe' },
  { slug: 'asia', name: 'Asia' },
  { slug: 'oceania', name: 'Oceania' },
  { slug: 'africa', name: 'Africa' },
]

export const COUNTRIES: Country[] = [
  // North America
  { slug: 'united-states', name: 'United States', code: 'US', region: 'north-america', emoji: '🇺🇸', aliases: ['USA', 'U.S.', 'America', 'United States of America'] },
  { slug: 'canada', name: 'Canada', code: 'CA', region: 'north-america', emoji: '🇨🇦' },
  { slug: 'mexico', name: 'Mexico', code: 'MX', region: 'north-america', emoji: '🇲🇽', aliases: ['México'] },

  // South America
  { slug: 'brazil', name: 'Brazil', code: 'BR', region: 'south-america', emoji: '🇧🇷', aliases: ['Brasil'] },
  { slug: 'argentina', name: 'Argentina', code: 'AR', region: 'south-america', emoji: '🇦🇷' },
  { slug: 'chile', name: 'Chile', code: 'CL', region: 'south-america', emoji: '🇨🇱' },
  { slug: 'colombia', name: 'Colombia', code: 'CO', region: 'south-america', emoji: '🇨🇴' },
  { slug: 'peru', name: 'Peru', code: 'PE', region: 'south-america', emoji: '🇵🇪', aliases: ['Perú'] },
  { slug: 'uruguay', name: 'Uruguay', code: 'UY', region: 'south-america', emoji: '🇺🇾' },
  { slug: 'ecuador', name: 'Ecuador', code: 'EC', region: 'south-america', emoji: '🇪🇨' },

  // Europe
  { slug: 'united-kingdom', name: 'United Kingdom', code: 'GB', region: 'europe', emoji: '🇬🇧', aliases: ['UK', 'Britain', 'Great Britain', 'England'] },
  { slug: 'ireland', name: 'Ireland', code: 'IE', region: 'europe', emoji: '🇮🇪' },
  { slug: 'france', name: 'France', code: 'FR', region: 'europe', emoji: '🇫🇷' },
  { slug: 'germany', name: 'Germany', code: 'DE', region: 'europe', emoji: '🇩🇪', aliases: ['Deutschland'] },
  { slug: 'spain', name: 'Spain', code: 'ES', region: 'europe', emoji: '🇪🇸', aliases: ['España'] },
  { slug: 'portugal', name: 'Portugal', code: 'PT', region: 'europe', emoji: '🇵🇹' },
  { slug: 'italy', name: 'Italy', code: 'IT', region: 'europe', emoji: '🇮🇹', aliases: ['Italia'] },
  { slug: 'netherlands', name: 'Netherlands', code: 'NL', region: 'europe', emoji: '🇳🇱', aliases: ['Holland', 'The Netherlands'] },
  { slug: 'belgium', name: 'Belgium', code: 'BE', region: 'europe', emoji: '🇧🇪' },
  { slug: 'switzerland', name: 'Switzerland', code: 'CH', region: 'europe', emoji: '🇨🇭' },
  { slug: 'austria', name: 'Austria', code: 'AT', region: 'europe', emoji: '🇦🇹' },
  { slug: 'sweden', name: 'Sweden', code: 'SE', region: 'europe', emoji: '🇸🇪' },
  { slug: 'norway', name: 'Norway', code: 'NO', region: 'europe', emoji: '🇳🇴' },
  { slug: 'denmark', name: 'Denmark', code: 'DK', region: 'europe', emoji: '🇩🇰' },
  { slug: 'finland', name: 'Finland', code: 'FI', region: 'europe', emoji: '🇫🇮' },
  { slug: 'iceland', name: 'Iceland', code: 'IS', region: 'europe', emoji: '🇮🇸' },
  { slug: 'poland', name: 'Poland', code: 'PL', region: 'europe', emoji: '🇵🇱', aliases: ['Polska'] },
  { slug: 'czech-republic', name: 'Czech Republic', code: 'CZ', region: 'europe', emoji: '🇨🇿', aliases: ['Czechia'] },
  { slug: 'hungary', name: 'Hungary', code: 'HU', region: 'europe', emoji: '🇭🇺' },
  { slug: 'romania', name: 'Romania', code: 'RO', region: 'europe', emoji: '🇷🇴' },
  { slug: 'greece', name: 'Greece', code: 'GR', region: 'europe', emoji: '🇬🇷' },
  { slug: 'ukraine', name: 'Ukraine', code: 'UA', region: 'europe', emoji: '🇺🇦' },
  { slug: 'estonia', name: 'Estonia', code: 'EE', region: 'europe', emoji: '🇪🇪' },
  { slug: 'latvia', name: 'Latvia', code: 'LV', region: 'europe', emoji: '🇱🇻' },
  { slug: 'lithuania', name: 'Lithuania', code: 'LT', region: 'europe', emoji: '🇱🇹' },

  // Asia
  { slug: 'india', name: 'India', code: 'IN', region: 'asia', emoji: '🇮🇳', aliases: ['Bharat'] },
  { slug: 'china', name: 'China', code: 'CN', region: 'asia', emoji: '🇨🇳', aliases: ['PRC', "People's Republic of China"] },
  { slug: 'japan', name: 'Japan', code: 'JP', region: 'asia', emoji: '🇯🇵' },
  { slug: 'south-korea', name: 'South Korea', code: 'KR', region: 'asia', emoji: '🇰🇷', aliases: ['Korea', 'Republic of Korea'] },
  { slug: 'singapore', name: 'Singapore', code: 'SG', region: 'asia', emoji: '🇸🇬' },
  { slug: 'indonesia', name: 'Indonesia', code: 'ID', region: 'asia', emoji: '🇮🇩' },
  { slug: 'malaysia', name: 'Malaysia', code: 'MY', region: 'asia', emoji: '🇲🇾' },
  { slug: 'thailand', name: 'Thailand', code: 'TH', region: 'asia', emoji: '🇹🇭' },
  { slug: 'vietnam', name: 'Vietnam', code: 'VN', region: 'asia', emoji: '🇻🇳', aliases: ['Viet Nam'] },
  { slug: 'philippines', name: 'Philippines', code: 'PH', region: 'asia', emoji: '🇵🇭', aliases: ['The Philippines'] },
  { slug: 'taiwan', name: 'Taiwan', code: 'TW', region: 'asia', emoji: '🇹🇼' },
  { slug: 'israel', name: 'Israel', code: 'IL', region: 'asia', emoji: '🇮🇱' },
  { slug: 'united-arab-emirates', name: 'United Arab Emirates', code: 'AE', region: 'asia', emoji: '🇦🇪', aliases: ['UAE', 'Emirates'] },
  { slug: 'saudi-arabia', name: 'Saudi Arabia', code: 'SA', region: 'asia', emoji: '🇸🇦', aliases: ['KSA'] },
  { slug: 'qatar', name: 'Qatar', code: 'QA', region: 'asia', emoji: '🇶🇦' },
  { slug: 'kuwait', name: 'Kuwait', code: 'KW', region: 'asia', emoji: '🇰🇼' },
  { slug: 'bahrain', name: 'Bahrain', code: 'BH', region: 'asia', emoji: '🇧🇭' },
  { slug: 'oman', name: 'Oman', code: 'OM', region: 'asia', emoji: '🇴🇲' },
  { slug: 'turkey', name: 'Turkey', code: 'TR', region: 'asia', emoji: '🇹🇷', aliases: ['Türkiye'] },

  // Oceania
  { slug: 'australia', name: 'Australia', code: 'AU', region: 'oceania', emoji: '🇦🇺' },
  { slug: 'new-zealand', name: 'New Zealand', code: 'NZ', region: 'oceania', emoji: '🇳🇿', aliases: ['Aotearoa'] },

  // Africa
  { slug: 'south-africa', name: 'South Africa', code: 'ZA', region: 'africa', emoji: '🇿🇦' },
  { slug: 'nigeria', name: 'Nigeria', code: 'NG', region: 'africa', emoji: '🇳🇬' },
  { slug: 'kenya', name: 'Kenya', code: 'KE', region: 'africa', emoji: '🇰🇪' },
  { slug: 'egypt', name: 'Egypt', code: 'EG', region: 'africa', emoji: '🇪🇬' },
  { slug: 'ghana', name: 'Ghana', code: 'GH', region: 'africa', emoji: '🇬🇭' },
  { slug: 'morocco', name: 'Morocco', code: 'MA', region: 'africa', emoji: '🇲🇦' },
  { slug: 'rwanda', name: 'Rwanda', code: 'RW', region: 'africa', emoji: '🇷🇼' },
  { slug: 'ethiopia', name: 'Ethiopia', code: 'ET', region: 'africa', emoji: '🇪🇹' },
  { slug: 'tanzania', name: 'Tanzania', code: 'TZ', region: 'africa', emoji: '🇹🇿' },
]

export const COUNTRY_BY_SLUG = new Map(COUNTRIES.map((c) => [c.slug, c]))

export const COUNTRIES_BY_REGION = REGIONS.map((r) => ({
  ...r,
  countries: COUNTRIES.filter((c) => c.region === r.slug),
}))
