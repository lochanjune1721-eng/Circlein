# CircleIn

A verified, city-scoped professional network. You do not browse it — you request an
invite, an automated check reads your LinkedIn, and if you genuinely do the job you
say you do, you are placed in a small WhatsApp group of people doing that same work
in your city.

The premise is the inverse of a big professional network: the smallest useful group,
with a door on it.

---

## What this is

| | |
|---|---|
| **Stack** | Next.js 15 (App Router), React 19, TypeScript, Tailwind, Supabase (Postgres) |
| **Verification** | Deterministic date rules, then a Claude judge that can only ever be *more* cautious |
| **Taxonomy** | 138 niches · 65 countries · 234 cities · 284 roles · 23 seniority levels |
| **Public surface** | Circles and counts. Never a member's name, email or number |

```
Country → City → Niche          the circle
Role + Seniority                who you are inside it
```

---

## Running it

```bash
npm install
cp .env.example .env.local     # every value is optional to start
npm run dev
```

The site runs with **no configuration at all**. The directory, the taxonomy, the
application flow and the verification engine all work — the profile source falls
back to deterministic mock data, and submitting says intake is not connected rather
than failing. Fill in `.env.local` to make it real.

### With a database

```bash
# 1. Apply the schema (Supabase SQL editor, or psql against your project)
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql

# 2. Push the taxonomy into it
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run db:seed
```

### Checks

```bash
npm run check              # taxonomy + verification rules + typecheck
npm run taxonomy:check     # slug/label uniqueness, referential integrity, parser cases
npm run verify:smoke       # the three-month boundary, metro matching
./scripts/verify-schema.sh # applies the migration to a throwaway Postgres and probes RLS
```

`taxonomy:check` is not decoration — it is what stops the taxonomy rotting. It fails
the build if two labels ever come to mean the same row, if a country loses its last
city (a dead end in the directory), or if the title parser regresses on a pinned case.

---

## Verification

The whole product rests on the door, so the order of operations matters and the
asymmetry is deliberate.

**1. Fetch the profile.** `lib/verification/provider.ts`

LinkedIn has no public API that returns a stranger's profile, and scraping it
breaches their terms. So CircleIn does not scrape. `ProfileProvider` is an interface
with three implementations — `mock` (deterministic fake data, the default),
`http` (a licensed vendor endpoint, mapped into our shape), and `manual` (the
applicant's own declaration, always routed to a human). Which one ran is recorded on
every check. Everything downstream is identical either way.

**2. The arithmetic rules.** `lib/verification/rules.ts`

Plain code on plain dates, no model involved:

- **≥ 3 months in the current role.** The rule the network is built on. A headline
  changes in a second; three months of a job does not.
- **≥ 12 months of account age.** A profile created to get through this door will not
  be old enough to. Not specified in the brief — a judgement call, documented in
  `lib/config.ts` and tunable by env var.

A failure here rejects outright. Nothing downstream overrides it.

**3. The judge.** `lib/verification/judge.ts`

Claude reads the profile against the claim and returns a structured verdict — does
this person hold this role, does the niche fit, how confident, what gave it pause.
It exists because titles are not standardised: "Member of Technical Staff", "SDE II"
and "Software Engineer" are one job.

It **cannot approve anyone the rules did not already clear.** It can only withhold.
If the API key is missing or the call fails, the application goes to a human — never
approved by default.

**4. Anything uncertain goes to a person.** `/admin`

Turning away a real practitioner costs more than making them wait a day, so every
ambiguous path lands on `needs_review` rather than a guess. The review queue shows
the reviewer exactly what the machine saw.

Every check is written to `verification_checks` with its reasons, so a decision can
always be explained or appealed.

---

## The taxonomy

`lib/taxonomy/` — the source of truth; the database holds a seeded copy so joins and
counts work in SQL.

**Every label means one thing.** Where a term appeared under two headings —
Business Development in both Business and Sales, Biotechnology in both Science and
Healthcare — it lives in one and carries the other reading as an alias. The
uniqueness check enforces this.

**Seniority is its own dimension.** There is no "Senior Backend Engineer" row.
`normalizeTitle()` splits a raw title into role + seniority, which is what lets a
search for backend engineers find someone at every stage of their career:

| Input | Role | Seniority |
|---|---|---|
| `Sr. Machine Learning Engineer @ Acme` | `machine-learning-engineer` | `senior` |
| `VP of Engineering` | `engineering-manager` | `vp` |
| `Product Manager, Payments` | `product-manager` | — |
| `Chief Technology Officer` | `engineering-manager` | `c-level` |

That third row is the subtle one: "Manager" inside *Product Manager* is part of the
job title, not a rung on a ladder. Getting it wrong would file every PM as
seniority=Manager.

**Cities roll up into markets.** Someone in Noida and someone in Gurugram commute
into the same rooms, so `citiesInSameMarket()` puts them in one Delhi NCR circle.
Aliases resolve the names people actually use — Bangalore, Gurgaon, Bombay, Saigon.

Every country has at least one city, checked in CI, so the directory never dead-ends.

---

## Security

- **Two Supabase clients.** The anon client is bound by RLS and can read the taxonomy
  and circle counts. The service client bypasses RLS and is `import 'server-only'`,
  so reaching it from the browser is a build error.
- **Grants are explicit.** Supabase grants `anon` blanket SELECT on new tables, which
  would leave RLS as the only thing between a visitor and the applications table.
  The migration revokes that and hands back read access to exactly the nine tables
  the public site needs — verified by `scripts/verify-schema.sh`.
- **No member is ever listed publicly.** The directory shows circles and counts. There
  is no page a stranger can scrape for names or numbers.
- **Applicants use an opaque token**, not an account, to check their own status.
- **IPs are hashed** for rate limiting and never stored in the clear.
- **Admin is a shared secret** compared in constant time. Honest for one operator;
  swap it for Supabase Auth with an admin role before a second person needs in.

---

## Layout

```
app/
  page.tsx                       landing
  apply/                         the request flow
  status/                        applicant-facing status, by token
  how-it-works/                  what the door checks, in full
  directory/                     country → city → niche
  circles/[city]/[niche]/        a circle
  admin/                         review queue
  api/                           apply · status · search · admin/review
lib/
  taxonomy/                      niches, countries, cities, roles, seniority,
                                 normalisation, search
  verification/                  provider · rules · judge · orchestration
  applications.ts                submit → verify → admit → queue for WhatsApp
  supabase/                      clients and row types
supabase/migrations/             schema, RLS, grants, directory view
scripts/                         taxonomy check · rules smoke test · schema check · seed
```

---

## Known gaps

Honest about what is not built:

- **WhatsApp invites are queued, not sent.** `whatsapp_queue` holds the state machine
  and `/status` reports it, but nothing calls the WhatsApp Business API yet. The
  hand-off point is `admitMember()` in `lib/applications.ts`.
- **No transactional email.** An applicant learns their outcome from the status link;
  nothing is sent to them.
- **Rate limiting counts rows** rather than using a sliding window in Redis. Fine at
  this scale, not at ten thousand applications an hour.
- **The mock provider is the default.** It produces a spread of tenures and account
  ages so the whole decision tree is exercisable, but it is not real data. Configure
  a licensed provider before going live.
