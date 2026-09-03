import type { City, Slug } from './types'

/**
 * Metros exist so that a circle covers a real labour market rather than a
 * municipal boundary. Someone in Gurugram and someone in Noida commute into the
 * same rooms; they should meet each other. A city without a metro is its own.
 */
export interface Metro {
  slug: Slug
  name: string
  country: Slug
}

export const METROS: Metro[] = [
  { slug: 'delhi-ncr', name: 'Delhi NCR', country: 'india' },
  { slug: 'mumbai-metro', name: 'Mumbai Metropolitan Region', country: 'india' },
  { slug: 'bay-area', name: 'San Francisco Bay Area', country: 'united-states' },
  { slug: 'greater-nyc', name: 'New York Metro', country: 'united-states' },
  { slug: 'greater-seattle', name: 'Greater Seattle', country: 'united-states' },
  { slug: 'greater-boston', name: 'Greater Boston', country: 'united-states' },
  { slug: 'greater-la', name: 'Greater Los Angeles', country: 'united-states' },
  { slug: 'dfw', name: 'Dallas–Fort Worth', country: 'united-states' },
  { slug: 'research-triangle', name: 'Research Triangle', country: 'united-states' },
]

export const METRO_BY_SLUG = new Map(METROS.map((m) => [m.slug, m]))

/**
 * Cities. One row per real place — "Delhi" and "New Delhi" are the same circle,
 * so Delhi is an alias, not a second row. Every country in COUNTRIES has at
 * least one city so the directory never dead-ends.
 */
export const CITIES: City[] = [
  // ── India ────────────────────────────────────────────────────────────────
  { slug: 'bengaluru', name: 'Bengaluru', country: 'india', area: 'Karnataka', aliases: ['Bangalore', 'Bengalooru'] },
  { slug: 'mumbai', name: 'Mumbai', country: 'india', area: 'Maharashtra', metro: 'mumbai-metro', aliases: ['Bombay'] },
  { slug: 'navi-mumbai', name: 'Navi Mumbai', country: 'india', area: 'Maharashtra', metro: 'mumbai-metro', aliases: ['New Bombay'] },
  { slug: 'thane', name: 'Thane', country: 'india', area: 'Maharashtra', metro: 'mumbai-metro' },
  { slug: 'pune', name: 'Pune', country: 'india', area: 'Maharashtra', aliases: ['Poona'] },
  { slug: 'nagpur', name: 'Nagpur', country: 'india', area: 'Maharashtra' },
  { slug: 'nashik', name: 'Nashik', country: 'india', area: 'Maharashtra', aliases: ['Nasik'] },
  { slug: 'new-delhi', name: 'New Delhi', country: 'india', area: 'Delhi NCR', metro: 'delhi-ncr', aliases: ['Delhi', 'NCR'] },
  { slug: 'gurugram', name: 'Gurugram', country: 'india', area: 'Delhi NCR', metro: 'delhi-ncr', aliases: ['Gurgaon'] },
  { slug: 'noida', name: 'Noida', country: 'india', area: 'Delhi NCR', metro: 'delhi-ncr', aliases: ['Greater Noida'] },
  { slug: 'ghaziabad', name: 'Ghaziabad', country: 'india', area: 'Delhi NCR', metro: 'delhi-ncr' },
  { slug: 'faridabad', name: 'Faridabad', country: 'india', area: 'Delhi NCR', metro: 'delhi-ncr' },
  { slug: 'hyderabad', name: 'Hyderabad', country: 'india', area: 'Telangana', aliases: ['Cyberabad', 'Secunderabad'] },
  { slug: 'chennai', name: 'Chennai', country: 'india', area: 'Tamil Nadu', aliases: ['Madras'] },
  { slug: 'coimbatore', name: 'Coimbatore', country: 'india', area: 'Tamil Nadu', aliases: ['Kovai'] },
  { slug: 'kolkata', name: 'Kolkata', country: 'india', area: 'West Bengal', aliases: ['Calcutta'] },
  { slug: 'ahmedabad', name: 'Ahmedabad', country: 'india', area: 'Gujarat', aliases: ['Amdavad'] },
  { slug: 'surat', name: 'Surat', country: 'india', area: 'Gujarat' },
  { slug: 'vadodara', name: 'Vadodara', country: 'india', area: 'Gujarat', aliases: ['Baroda'] },
  { slug: 'kochi', name: 'Kochi', country: 'india', area: 'Kerala', aliases: ['Cochin', 'Ernakulam'] },
  { slug: 'thiruvananthapuram', name: 'Thiruvananthapuram', country: 'india', area: 'Kerala', aliases: ['Trivandrum'] },
  { slug: 'kozhikode', name: 'Kozhikode', country: 'india', area: 'Kerala', aliases: ['Calicut'] },
  { slug: 'jaipur', name: 'Jaipur', country: 'india', area: 'Rajasthan' },
  { slug: 'udaipur', name: 'Udaipur', country: 'india', area: 'Rajasthan' },
  { slug: 'lucknow', name: 'Lucknow', country: 'india', area: 'Uttar Pradesh' },
  { slug: 'kanpur', name: 'Kanpur', country: 'india', area: 'Uttar Pradesh' },
  { slug: 'varanasi', name: 'Varanasi', country: 'india', area: 'Uttar Pradesh', aliases: ['Banaras', 'Kashi'] },
  { slug: 'chandigarh', name: 'Chandigarh', country: 'india', area: 'Punjab & Chandigarh' },
  { slug: 'mohali', name: 'Mohali', country: 'india', area: 'Punjab & Chandigarh', aliases: ['SAS Nagar'] },
  { slug: 'amritsar', name: 'Amritsar', country: 'india', area: 'Punjab & Chandigarh' },
  { slug: 'panaji', name: 'Panaji', country: 'india', area: 'Goa', aliases: ['Panjim', 'Goa'] },

  // ── United States ────────────────────────────────────────────────────────
  { slug: 'san-francisco', name: 'San Francisco', country: 'united-states', area: 'California', metro: 'bay-area', aliases: ['SF', 'San Fran'] },
  { slug: 'san-jose', name: 'San Jose', country: 'united-states', area: 'California', metro: 'bay-area' },
  { slug: 'palo-alto', name: 'Palo Alto', country: 'united-states', area: 'California', metro: 'bay-area' },
  { slug: 'mountain-view', name: 'Mountain View', country: 'united-states', area: 'California', metro: 'bay-area' },
  { slug: 'menlo-park', name: 'Menlo Park', country: 'united-states', area: 'California', metro: 'bay-area' },
  { slug: 'sunnyvale', name: 'Sunnyvale', country: 'united-states', area: 'California', metro: 'bay-area' },
  { slug: 'los-angeles', name: 'Los Angeles', country: 'united-states', area: 'California', metro: 'greater-la', aliases: ['LA', 'Santa Monica'] },
  { slug: 'irvine', name: 'Irvine', country: 'united-states', area: 'California', metro: 'greater-la', aliases: ['Orange County'] },
  { slug: 'san-diego', name: 'San Diego', country: 'united-states', area: 'California' },
  { slug: 'new-york-city', name: 'New York City', country: 'united-states', area: 'New York', metro: 'greater-nyc', aliases: ['NYC', 'New York', 'Manhattan'] },
  { slug: 'brooklyn', name: 'Brooklyn', country: 'united-states', area: 'New York', metro: 'greater-nyc' },
  { slug: 'seattle', name: 'Seattle', country: 'united-states', area: 'Washington', metro: 'greater-seattle' },
  { slug: 'bellevue', name: 'Bellevue', country: 'united-states', area: 'Washington', metro: 'greater-seattle' },
  { slug: 'redmond', name: 'Redmond', country: 'united-states', area: 'Washington', metro: 'greater-seattle' },
  { slug: 'austin', name: 'Austin', country: 'united-states', area: 'Texas' },
  { slug: 'dallas', name: 'Dallas', country: 'united-states', area: 'Texas', metro: 'dfw', aliases: ['Fort Worth'] },
  { slug: 'plano', name: 'Plano', country: 'united-states', area: 'Texas', metro: 'dfw' },
  { slug: 'houston', name: 'Houston', country: 'united-states', area: 'Texas' },
  { slug: 'boston', name: 'Boston', country: 'united-states', area: 'Massachusetts', metro: 'greater-boston' },
  { slug: 'cambridge-ma', name: 'Cambridge', country: 'united-states', area: 'Massachusetts', metro: 'greater-boston', aliases: ['Cambridge MA', 'Kendall Square'] },
  { slug: 'chicago', name: 'Chicago', country: 'united-states', area: 'Illinois' },
  { slug: 'denver', name: 'Denver', country: 'united-states', area: 'Colorado' },
  { slug: 'boulder', name: 'Boulder', country: 'united-states', area: 'Colorado' },
  { slug: 'atlanta', name: 'Atlanta', country: 'united-states', area: 'Georgia' },
  { slug: 'philadelphia', name: 'Philadelphia', country: 'united-states', area: 'Pennsylvania', aliases: ['Philly'] },
  { slug: 'pittsburgh', name: 'Pittsburgh', country: 'united-states', area: 'Pennsylvania' },
  { slug: 'raleigh', name: 'Raleigh', country: 'united-states', area: 'North Carolina', metro: 'research-triangle' },
  { slug: 'durham', name: 'Durham', country: 'united-states', area: 'North Carolina', metro: 'research-triangle' },
  { slug: 'charlotte', name: 'Charlotte', country: 'united-states', area: 'North Carolina' },
  { slug: 'miami', name: 'Miami', country: 'united-states', area: 'Florida' },
  { slug: 'tampa', name: 'Tampa', country: 'united-states', area: 'Florida' },
  { slug: 'orlando', name: 'Orlando', country: 'united-states', area: 'Florida' },
  { slug: 'washington-dc', name: 'Washington, DC', country: 'united-states', area: 'District of Columbia', aliases: ['DC', 'Arlington', 'Alexandria'] },
  { slug: 'portland', name: 'Portland', country: 'united-states', area: 'Oregon' },
  { slug: 'phoenix', name: 'Phoenix', country: 'united-states', area: 'Arizona' },
  { slug: 'nashville', name: 'Nashville', country: 'united-states', area: 'Tennessee' },
  { slug: 'detroit', name: 'Detroit', country: 'united-states', area: 'Michigan' },
  { slug: 'minneapolis', name: 'Minneapolis', country: 'united-states', area: 'Minnesota', aliases: ['Twin Cities', 'St Paul'] },
  { slug: 'salt-lake-city', name: 'Salt Lake City', country: 'united-states', area: 'Utah', aliases: ['SLC'] },
  { slug: 'columbus', name: 'Columbus', country: 'united-states', area: 'Ohio' },
  { slug: 'indianapolis', name: 'Indianapolis', country: 'united-states', area: 'Indiana', aliases: ['Indy'] },
  { slug: 'las-vegas', name: 'Las Vegas', country: 'united-states', area: 'Nevada' },
  { slug: 'baltimore', name: 'Baltimore', country: 'united-states', area: 'Maryland' },
  { slug: 'new-orleans', name: 'New Orleans', country: 'united-states', area: 'Louisiana', aliases: ['NOLA'] },

  // ── Canada ───────────────────────────────────────────────────────────────
  { slug: 'toronto', name: 'Toronto', country: 'canada', area: 'Ontario', aliases: ['GTA'] },
  { slug: 'vancouver', name: 'Vancouver', country: 'canada', area: 'British Columbia' },
  { slug: 'montreal', name: 'Montreal', country: 'canada', area: 'Quebec', aliases: ['Montréal'] },
  { slug: 'calgary', name: 'Calgary', country: 'canada', area: 'Alberta' },
  { slug: 'ottawa', name: 'Ottawa', country: 'canada', area: 'Ontario' },
  { slug: 'waterloo', name: 'Waterloo', country: 'canada', area: 'Ontario', aliases: ['Kitchener-Waterloo'] },
  { slug: 'edmonton', name: 'Edmonton', country: 'canada', area: 'Alberta' },

  // ── Mexico ───────────────────────────────────────────────────────────────
  { slug: 'mexico-city', name: 'Mexico City', country: 'mexico', aliases: ['CDMX', 'Ciudad de México'] },
  { slug: 'guadalajara', name: 'Guadalajara', country: 'mexico' },
  { slug: 'monterrey', name: 'Monterrey', country: 'mexico' },

  // ── South America ────────────────────────────────────────────────────────
  { slug: 'sao-paulo', name: 'São Paulo', country: 'brazil', aliases: ['Sao Paulo', 'SP'] },
  { slug: 'rio-de-janeiro', name: 'Rio de Janeiro', country: 'brazil', aliases: ['Rio'] },
  { slug: 'belo-horizonte', name: 'Belo Horizonte', country: 'brazil' },
  { slug: 'curitiba', name: 'Curitiba', country: 'brazil' },
  { slug: 'buenos-aires', name: 'Buenos Aires', country: 'argentina' },
  { slug: 'cordoba', name: 'Córdoba', country: 'argentina', aliases: ['Cordoba'] },
  { slug: 'santiago', name: 'Santiago', country: 'chile' },
  { slug: 'bogota', name: 'Bogotá', country: 'colombia', aliases: ['Bogota'] },
  { slug: 'medellin', name: 'Medellín', country: 'colombia', aliases: ['Medellin'] },
  { slug: 'lima', name: 'Lima', country: 'peru' },
  { slug: 'montevideo', name: 'Montevideo', country: 'uruguay' },
  { slug: 'quito', name: 'Quito', country: 'ecuador' },
  { slug: 'guayaquil', name: 'Guayaquil', country: 'ecuador' },

  // ── United Kingdom & Ireland ─────────────────────────────────────────────
  { slug: 'london', name: 'London', country: 'united-kingdom', area: 'England' },
  { slug: 'manchester', name: 'Manchester', country: 'united-kingdom', area: 'England' },
  { slug: 'birmingham', name: 'Birmingham', country: 'united-kingdom', area: 'England' },
  { slug: 'bristol', name: 'Bristol', country: 'united-kingdom', area: 'England' },
  { slug: 'cambridge-uk', name: 'Cambridge', country: 'united-kingdom', area: 'England', aliases: ['Cambridge UK'] },
  { slug: 'oxford', name: 'Oxford', country: 'united-kingdom', area: 'England' },
  { slug: 'leeds', name: 'Leeds', country: 'united-kingdom', area: 'England' },
  { slug: 'liverpool', name: 'Liverpool', country: 'united-kingdom', area: 'England' },
  { slug: 'edinburgh', name: 'Edinburgh', country: 'united-kingdom', area: 'Scotland' },
  { slug: 'glasgow', name: 'Glasgow', country: 'united-kingdom', area: 'Scotland' },
  { slug: 'dublin', name: 'Dublin', country: 'ireland' },
  { slug: 'cork', name: 'Cork', country: 'ireland' },

  // ── Europe ───────────────────────────────────────────────────────────────
  { slug: 'berlin', name: 'Berlin', country: 'germany' },
  { slug: 'munich', name: 'Munich', country: 'germany', aliases: ['München'] },
  { slug: 'hamburg', name: 'Hamburg', country: 'germany' },
  { slug: 'frankfurt', name: 'Frankfurt', country: 'germany', aliases: ['Frankfurt am Main'] },
  { slug: 'stuttgart', name: 'Stuttgart', country: 'germany' },
  { slug: 'cologne', name: 'Cologne', country: 'germany', aliases: ['Köln'] },
  { slug: 'paris', name: 'Paris', country: 'france', aliases: ['Île-de-France'] },
  { slug: 'lyon', name: 'Lyon', country: 'france' },
  { slug: 'toulouse', name: 'Toulouse', country: 'france' },
  { slug: 'marseille', name: 'Marseille', country: 'france' },
  { slug: 'bordeaux', name: 'Bordeaux', country: 'france' },
  { slug: 'amsterdam', name: 'Amsterdam', country: 'netherlands' },
  { slug: 'rotterdam', name: 'Rotterdam', country: 'netherlands' },
  { slug: 'eindhoven', name: 'Eindhoven', country: 'netherlands' },
  { slug: 'utrecht', name: 'Utrecht', country: 'netherlands' },
  { slug: 'zurich', name: 'Zurich', country: 'switzerland', aliases: ['Zürich'] },
  { slug: 'geneva', name: 'Geneva', country: 'switzerland', aliases: ['Genève'] },
  { slug: 'lausanne', name: 'Lausanne', country: 'switzerland' },
  { slug: 'basel', name: 'Basel', country: 'switzerland' },
  { slug: 'madrid', name: 'Madrid', country: 'spain' },
  { slug: 'barcelona', name: 'Barcelona', country: 'spain' },
  { slug: 'valencia', name: 'Valencia', country: 'spain' },
  { slug: 'malaga', name: 'Malaga', country: 'spain', aliases: ['Málaga'] },
  { slug: 'lisbon', name: 'Lisbon', country: 'portugal', aliases: ['Lisboa'] },
  { slug: 'porto', name: 'Porto', country: 'portugal', aliases: ['Oporto'] },
  { slug: 'milan', name: 'Milan', country: 'italy', aliases: ['Milano'] },
  { slug: 'rome', name: 'Rome', country: 'italy', aliases: ['Roma'] },
  { slug: 'turin', name: 'Turin', country: 'italy', aliases: ['Torino'] },
  { slug: 'brussels', name: 'Brussels', country: 'belgium', aliases: ['Bruxelles'] },
  { slug: 'antwerp', name: 'Antwerp', country: 'belgium', aliases: ['Antwerpen'] },
  { slug: 'vienna', name: 'Vienna', country: 'austria', aliases: ['Wien'] },
  { slug: 'stockholm', name: 'Stockholm', country: 'sweden' },
  { slug: 'gothenburg', name: 'Gothenburg', country: 'sweden', aliases: ['Göteborg'] },
  { slug: 'malmo', name: 'Malmö', country: 'sweden', aliases: ['Malmo'] },
  { slug: 'oslo', name: 'Oslo', country: 'norway' },
  { slug: 'copenhagen', name: 'Copenhagen', country: 'denmark', aliases: ['København'] },
  { slug: 'aarhus', name: 'Aarhus', country: 'denmark' },
  { slug: 'helsinki', name: 'Helsinki', country: 'finland' },
  { slug: 'reykjavik', name: 'Reykjavík', country: 'iceland', aliases: ['Reykjavik'] },
  { slug: 'warsaw', name: 'Warsaw', country: 'poland', aliases: ['Warszawa'] },
  { slug: 'krakow', name: 'Krakow', country: 'poland', aliases: ['Kraków', 'Cracow'] },
  { slug: 'wroclaw', name: 'Wroclaw', country: 'poland', aliases: ['Wrocław'] },
  { slug: 'prague', name: 'Prague', country: 'czech-republic', aliases: ['Praha'] },
  { slug: 'brno', name: 'Brno', country: 'czech-republic' },
  { slug: 'budapest', name: 'Budapest', country: 'hungary' },
  { slug: 'bucharest', name: 'Bucharest', country: 'romania', aliases: ['București'] },
  { slug: 'cluj-napoca', name: 'Cluj-Napoca', country: 'romania', aliases: ['Cluj'] },
  { slug: 'athens', name: 'Athens', country: 'greece', aliases: ['Athina'] },
  { slug: 'thessaloniki', name: 'Thessaloniki', country: 'greece' },
  { slug: 'kyiv', name: 'Kyiv', country: 'ukraine', aliases: ['Kiev'] },
  { slug: 'lviv', name: 'Lviv', country: 'ukraine' },
  { slug: 'tallinn', name: 'Tallinn', country: 'estonia' },
  { slug: 'riga', name: 'Riga', country: 'latvia' },
  { slug: 'vilnius', name: 'Vilnius', country: 'lithuania' },

  // ── Asia ─────────────────────────────────────────────────────────────────
  { slug: 'tokyo', name: 'Tokyo', country: 'japan' },
  { slug: 'osaka', name: 'Osaka', country: 'japan' },
  { slug: 'kyoto', name: 'Kyoto', country: 'japan' },
  { slug: 'yokohama', name: 'Yokohama', country: 'japan' },
  { slug: 'nagoya', name: 'Nagoya', country: 'japan' },
  { slug: 'fukuoka', name: 'Fukuoka', country: 'japan' },
  { slug: 'sapporo', name: 'Sapporo', country: 'japan' },
  { slug: 'beijing', name: 'Beijing', country: 'china', aliases: ['Peking'] },
  { slug: 'shanghai', name: 'Shanghai', country: 'china' },
  { slug: 'shenzhen', name: 'Shenzhen', country: 'china' },
  { slug: 'guangzhou', name: 'Guangzhou', country: 'china', aliases: ['Canton'] },
  { slug: 'hangzhou', name: 'Hangzhou', country: 'china' },
  { slug: 'chengdu', name: 'Chengdu', country: 'china' },
  { slug: 'hong-kong', name: 'Hong Kong', country: 'china', aliases: ['HK', 'Hong Kong SAR'] },
  { slug: 'seoul', name: 'Seoul', country: 'south-korea' },
  { slug: 'busan', name: 'Busan', country: 'south-korea', aliases: ['Pusan'] },
  { slug: 'incheon', name: 'Incheon', country: 'south-korea' },
  { slug: 'daejeon', name: 'Daejeon', country: 'south-korea' },
  { slug: 'singapore', name: 'Singapore', country: 'singapore', aliases: ['SG'] },
  { slug: 'taipei', name: 'Taipei', country: 'taiwan' },
  { slug: 'hsinchu', name: 'Hsinchu', country: 'taiwan' },
  { slug: 'jakarta', name: 'Jakarta', country: 'indonesia' },
  { slug: 'denpasar', name: 'Denpasar', country: 'indonesia', aliases: ['Bali', 'Canggu', 'Ubud'] },
  { slug: 'bandung', name: 'Bandung', country: 'indonesia' },
  { slug: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'malaysia', aliases: ['KL'] },
  { slug: 'penang', name: 'Penang', country: 'malaysia', aliases: ['George Town'] },
  { slug: 'bangkok', name: 'Bangkok', country: 'thailand', aliases: ['Krung Thep'] },
  { slug: 'chiang-mai', name: 'Chiang Mai', country: 'thailand' },
  { slug: 'ho-chi-minh-city', name: 'Ho Chi Minh City', country: 'vietnam', aliases: ['Saigon', 'HCMC'] },
  { slug: 'hanoi', name: 'Hanoi', country: 'vietnam', aliases: ['Hà Nội'] },
  { slug: 'da-nang', name: 'Da Nang', country: 'vietnam', aliases: ['Đà Nẵng'] },
  { slug: 'manila', name: 'Manila', country: 'philippines', aliases: ['Metro Manila', 'Makati', 'BGC'] },
  { slug: 'cebu-city', name: 'Cebu City', country: 'philippines', aliases: ['Cebu'] },
  { slug: 'tel-aviv', name: 'Tel Aviv', country: 'israel', aliases: ['Tel Aviv-Yafo'] },
  { slug: 'jerusalem', name: 'Jerusalem', country: 'israel' },
  { slug: 'haifa', name: 'Haifa', country: 'israel' },
  { slug: 'dubai', name: 'Dubai', country: 'united-arab-emirates', aliases: ['DXB'] },
  { slug: 'abu-dhabi', name: 'Abu Dhabi', country: 'united-arab-emirates' },
  { slug: 'riyadh', name: 'Riyadh', country: 'saudi-arabia' },
  { slug: 'jeddah', name: 'Jeddah', country: 'saudi-arabia' },
  { slug: 'doha', name: 'Doha', country: 'qatar' },
  { slug: 'kuwait-city', name: 'Kuwait City', country: 'kuwait' },
  { slug: 'manama', name: 'Manama', country: 'bahrain' },
  { slug: 'muscat', name: 'Muscat', country: 'oman' },
  { slug: 'istanbul', name: 'Istanbul', country: 'turkey', aliases: ['İstanbul'] },
  { slug: 'ankara', name: 'Ankara', country: 'turkey' },
  { slug: 'izmir', name: 'Izmir', country: 'turkey', aliases: ['İzmir'] },

  // ── Oceania ──────────────────────────────────────────────────────────────
  { slug: 'sydney', name: 'Sydney', country: 'australia', area: 'New South Wales' },
  { slug: 'melbourne', name: 'Melbourne', country: 'australia', area: 'Victoria' },
  { slug: 'brisbane', name: 'Brisbane', country: 'australia', area: 'Queensland', aliases: ['Gold Coast'] },
  { slug: 'perth', name: 'Perth', country: 'australia', area: 'Western Australia' },
  { slug: 'adelaide', name: 'Adelaide', country: 'australia', area: 'South Australia' },
  { slug: 'canberra', name: 'Canberra', country: 'australia', area: 'ACT' },
  { slug: 'auckland', name: 'Auckland', country: 'new-zealand' },
  { slug: 'wellington', name: 'Wellington', country: 'new-zealand' },
  { slug: 'christchurch', name: 'Christchurch', country: 'new-zealand' },

  // ── Africa ───────────────────────────────────────────────────────────────
  { slug: 'cape-town', name: 'Cape Town', country: 'south-africa' },
  { slug: 'johannesburg', name: 'Johannesburg', country: 'south-africa', aliases: ['Joburg', 'Jozi', 'Sandton'] },
  { slug: 'pretoria', name: 'Pretoria', country: 'south-africa' },
  { slug: 'lagos', name: 'Lagos', country: 'nigeria', aliases: ['Yaba', 'Lekki'] },
  { slug: 'abuja', name: 'Abuja', country: 'nigeria' },
  { slug: 'nairobi', name: 'Nairobi', country: 'kenya' },
  { slug: 'cairo', name: 'Cairo', country: 'egypt' },
  { slug: 'alexandria', name: 'Alexandria', country: 'egypt' },
  { slug: 'accra', name: 'Accra', country: 'ghana' },
  { slug: 'casablanca', name: 'Casablanca', country: 'morocco' },
  { slug: 'rabat', name: 'Rabat', country: 'morocco' },
  { slug: 'kigali', name: 'Kigali', country: 'rwanda' },
  { slug: 'addis-ababa', name: 'Addis Ababa', country: 'ethiopia' },
  { slug: 'dar-es-salaam', name: 'Dar es Salaam', country: 'tanzania' },
]

export const CITY_BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]))

export function citiesInCountry(countrySlug: Slug): City[] {
  return CITIES.filter((c) => c.country === countrySlug)
}

/**
 * Every city a member of `citySlug` should be able to see, including the rest
 * of their metro. Someone in Noida gets all of Delhi NCR.
 */
export function citiesInSameMarket(citySlug: Slug): City[] {
  const city = CITY_BY_SLUG.get(citySlug)
  if (!city) return []
  if (!city.metro) return [city]
  return CITIES.filter((c) => c.metro === city.metro)
}
