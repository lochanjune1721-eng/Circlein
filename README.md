# CircleIn

A verified, city-scoped professional network. You do not browse it — you fill in one
short form, and if you genuinely do the job you say you do, you are placed in a small
WhatsApp group of people doing that same work in your city.

The premise is the inverse of a big professional network: the smallest useful group,
with a door on it.

---

## What this is

| | |
|---|---|
| **Stack** | Next.js 15 (App Router), React 19, TypeScript, Tailwind, Supabase (Postgres) |
| **Applying** | One form, seven fields. The niche is derived from the role |
| **Identity** | LinkedIn sign-in (OpenID Connect) via Supabase Auth — available, not required |
| **Verification** | Deterministic date rules, then a Claude judge that can only ever be *more* cautious |
| **Taxonomy** | 138 niches · 65 countries · 234 cities · 284 roles · 23 seniority levels |
| **Events** | Evenings organised by CircleIn, RSVP gated on verified membership |
| **Public surface** | Circles, counts and published events. Never a member's name, email or number |

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
# 1. Apply the schema, in order (Supabase SQL editor, or psql)
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
psql "$DATABASE_URL" -f supabase/migrations/0002_linkedin_identity.sql
psql "$DATABASE_URL" -f supabase/migrations/0003_events.sql

# 2. Push the taxonomy into it
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run db:seed

# 3. Optional: sample events, to see that feature working
npm run db:seed:events              # inserted as drafts, invisible to visitors
npm run db:seed:events -- --publish # makes them public — they are invented, so
                                    # delete them before real members arrive
```

### Turning on LinkedIn sign-in

No credentials go in this app — they live in Supabase.

1. **LinkedIn developer portal:** create an app and add the **Sign In with LinkedIn
   using OpenID Connect** product. Set the redirect URL to
   `https://<project>.supabase.co/auth/v1/callback` (locally,
   `http://localhost:54321/auth/v1/callback`).
2. **Supabase dashboard:** Authentication → Providers → **LinkedIn (OIDC)**, enable
   it, paste the Client ID and Secret.

That is the whole setup. The app requests `openid profile email` and uses Supabase's
`linkedin_oidc` provider — note the suffix: plain `linkedin` was LinkedIn's older
OAuth product and no longer works.

### Deploying to Vercel

Next.js runs on Vercel with no adapter and no build configuration — import the repo,
pick the `main` branch, and the framework is detected. The only real work is the
environment variables.

**Project Settings → Environment Variables**, applied to every environment:

| Variable | Value | Needed |
|---|---|---|
| `SUPABASE_URL` | `https://<project>.supabase.co` | yes — no sign-in without it |
| `SUPABASE_ANON_KEY` | the anon key | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role key | yes — nothing is written without it |
| `CIRCLEIN_ADMIN_TOKEN` | `openssl rand -base64 32` | yes, for `/admin` |
| `ANTHROPIC_API_KEY` | your key | optional — without it everything goes to human review |
| `LINKEDIN_PROVIDER` | `manual` | **set this before real people apply** |

Every one of these is read on each request, so changing one takes effect on reload
rather than needing a rebuild. The policy thresholds (`CIRCLEIN_MIN_TENURE_MONTHS` and
friends) have defaults in `lib/config.ts` and only need setting to change them.

`LINKEDIN_PROVIDER` is the one that matters: it defaults to `mock`, which invents
plausible employment dates so the flow is demoable. Set it to `manual` in production —
that uses the applicant's declared dates and sends every application to a human.

**After the first deploy**, take the Vercel URL to Supabase → Authentication → URL
Configuration and set it as the Site URL, and add `<url>/auth/callback` to Redirect
URLs. Sign-in cannot complete until that entry exists.

The Cloudflare files (`wrangler.jsonc`, `open-next.config.ts`) stay in the repo and are
simply unused on Vercel.

### Deploying to Cloudflare

The app runs on Cloudflare Workers through the OpenNext adapter. Verified working:
every route, the middleware, and the `node:crypto` calls the status tokens, IP
hashing and admin auth depend on.

```bash
npm run preview   # build for Workers and run it locally in workerd
npm run deploy    # build and ship it
```

**Environment variables split in two, and getting this wrong is the usual first
failure:**

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are **inlined into
  the client bundle at build time.** They must be set when the build runs — in
  Workers Builds that means *build* environment variables, not runtime ones. Set them
  only at runtime and LinkedIn sign-in silently will not work in the browser.
- Everything else is read at runtime from `process.env`. Set them as secrets:

  ```bash
  wrangler secret put SUPABASE_SERVICE_ROLE_KEY
  wrangler secret put ANTHROPIC_API_KEY
  wrangler secret put CIRCLEIN_ADMIN_TOKEN
  ```

  This works because `wrangler.jsonc` pins `compatibility_date` to 2026-01-01 —
  before 2025-04-01, Cloudflare variables never reach `process.env` at all.

Local Worker preview reads secrets from `.dev.vars`, not `.env.local`. Copy
`.dev.vars.example` and fill it in.

**Connecting the repo to Workers Builds:** build command
`npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy`.

**Add your domain last.** After the first deploy, put the Worker's URL into
LinkedIn's Authorized redirect URLs and Supabase's Site URL / Redirect URLs, or the
OAuth round trip will bounce.

One known cost of the minimal setup: `open-next.config.ts` configures no incremental
cache, so the `revalidate = 300` directory pages re-render per isolate instead of
being served from a shared cache. Fine at low traffic; wire up an R2 bucket when it
is not. The file says exactly how.

### Is it configured?

`GET /api/health` reports what a deployment actually has, as booleans — never values:

```json
{ "signInAvailable": false,
  "supabaseServiceRole": false,
  "tenureSource": "mock",
  "hint": "Sign-in is unavailable because this build has no NEXT_PUBLIC_..." }
```

`signInAvailable: false` means this deployment has no `SUPABASE_URL` /
`SUPABASE_ANON_KEY`. That is about the app's own environment and says nothing about
the LinkedIn provider in Supabase — sign-in never gets far enough to ask.

The browser never reads those from `process.env`; a server component passes them down
as props. So the plain names work, no `NEXT_PUBLIC_` prefix is needed, and setting
them takes effect on the next request rather than the next build.

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

**1. Identity, when it is offered.** `lib/supabase/auth.ts`

Signing in is available at `/signin` but no longer gates applying — the form takes a
LinkedIn URL instead, and records a verified identity against the application only
when someone happens to be signed in.

When they are, identity stops being a claim. LinkedIn asserts the
name and the email and hands over a stable member id, which becomes the real key for
a person — one LinkedIn account, one live application, enforced by a partial unique
index rather than by hoping.

**What sign-in does not give you.** LinkedIn's OpenID Connect product returns exactly
`sub`, `name`, `given_name`, `family_name`, `picture`, `locale`, `email` and
`email_verified`. There is no scope for work history, a headline, the vanity profile
URL, or the account creation date — LinkedIn stopped publishing those to third
parties. So sign-in cannot answer the three-month question, and pretending otherwise
would be the single most tempting lie in this codebase. Which leads to:

**2. Fetch the dates.** `lib/verification/provider.ts`

Scraping LinkedIn breaches their terms, so CircleIn does not scrape. `ProfileProvider`
is an interface with three implementations — `mock` (deterministic fake data, the
default), `http` (a licensed vendor endpoint, mapped into our shape), and `manual`
(the applicant's own declaration, which is always routed to a human). Which one ran
is recorded on every check.

**3. The arithmetic rules.** `lib/verification/rules.ts`

Plain code on plain dates, no model involved:

- **≥ 3 months in the current role.** The rule the network is built on. A headline
  changes in a second; three months of a job does not.
- **≥ 12 months of account age.** A profile created to get through this door will not
  be old enough to. Not specified in the brief — a judgement call, documented in
  `lib/config.ts` and tunable by env var.

A failure here rejects outright. Nothing downstream overrides it.

**4. The judge.** `lib/verification/judge.ts`

Claude reads the profile against the claim and returns a structured verdict — does
this person hold this role, does the niche fit, how confident, what gave it pause.
It exists because titles are not standardised: "Member of Technical Staff", "SDE II"
and "Software Engineer" are one job.

It **cannot approve anyone the rules did not already clear.** It can only withhold.
If the API key is missing or the call fails, the application goes to a human — never
approved by default.

**5. Anything uncertain goes to a person.** `/admin`

Turning away a real practitioner costs more than making them wait a day, so every
ambiguous path lands on `needs_review` rather than a guess. The review queue shows
the reviewer exactly what the machine saw.

Every check is written to `verification_checks` with its reasons, so a decision can
always be explained or appealed.

---

## Events

A circle is a group chat; an event is the room it eventually meets in. Events are
scoped exactly like members — one city, and either one niche or open to the whole
city. Leaving the niche off is what makes an event cross-disciplinary, and those
events appear in every circle's list for that city.

- **Published events are public.** They are how someone who is not a member finds out
  this exists, so anonymous visitors can read the listing. Drafts are not visible to
  anyone, which is why the seed script inserts drafts by default.
- **RSVPs are for verified members**, not merely for people who signed in. Signing in
  with LinkedIn is not membership; the RSVP checks for a `members` row.
- **There is no guest list.** RLS lets a member read their own RSVP and nothing else,
  so one member cannot enumerate the others.
- **Going versus waitlist is decided on the server.** A client that decides whether a
  room is full is a client that can decide it is not. Capacity is enforced in
  `lib/events.ts`, and the count is maintained by a trigger so it cannot drift from
  the rows.

Times render in the event's own timezone. Someone in London reading about a Bengaluru
evening wants to know when to turn up in Bengaluru.

## The taxonomy

`lib/taxonomy/` — the source of truth; the database holds a seeded copy so joins and
counts work in SQL.

**Every label means one thing.** Where a term appeared under two headings —
Business Development in both Business and Sales, Biotechnology in both Science and
Healthcare — it lives in one and carries the other reading as an alias. The
uniqueness check enforces this.

**The form asks for a role, not a niche.** `nicheForRole()` derives the circle, because
the taxonomy already knows where a role belongs and asking twice is asking twice. Role
families group by *kind of work*, which is coarser than a niche — every scientist would
have landed in Physics and every media role in Film — so 129 roles carry their own
`niche`. The taxonomy check fails the build if any role resolves to nothing, or names a
niche that does not exist.

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
- **Signing in routes by who you are.** `lib/auth-destination.ts` resolves the
  landing page after the OAuth round trip: a verified member reaches their circle, an
  applicant reaches their status, a newcomer reaches the form. Sign-in is an entry
  point in its own right at `/signin`, not only a step inside applying.
- **A member reads their own row, and the database enforces it.** RLS policies key on
  `auth.uid()`, so `/status` needs no token once you are signed in. The opaque token
  remains for applications made before signing in.
- **Identity is read from the session cookie, never the request body.** Posting
  someone else's LinkedIn id to `/api/apply` achieves nothing.
- **`whatsapp_groups` is granted column by column.** A table-level `GRANT SELECT`
  covers every column and a later column-level `REVOKE` does not subtract from it —
  so `invite_url` is withheld by listing the columns members may read. Otherwise a
  member could hand out access to a room they are only queued for.
- **IPs are hashed** for rate limiting and never stored in the clear.
- **Admin is a shared secret** compared in constant time. Honest for one operator;
  swap it for Supabase Auth with an admin role before a second person needs in.

---

## Layout

```
app/
  page.tsx                       landing
  apply/                         the request form — one page, seven fields
  signin/                        the way back in for an existing member
  auth/callback/                 OAuth code exchange, routed by who signed in
  auth/signout/
  events/                        listing, and one page per event with RSVP
  status/                        applicant-facing status, by token
  how-it-works/                  what the door checks, in full
  directory/                     country → city → niche
  circles/[city]/[niche]/        a circle
  admin/                         review queue
  api/                           apply · status · search · events/rsvp · admin/review
middleware.ts                    refreshes the Supabase session on every request
wrangler.jsonc                   Cloudflare Worker config
open-next.config.ts              the Next-to-Workers adapter
lib/
  supabase/auth.ts               session client and the LinkedIn identity
  events.ts                      listing, capacity, RSVP and waitlist
  taxonomy/                      niches, countries, cities, roles, seniority,
                                 normalisation, search
  verification/                  provider · rules · judge · orchestration
  applications.ts                submit → verify → admit → queue for WhatsApp
  supabase/                      clients and row types
supabase/migrations/             schema, RLS, grants, directory view
scripts/                         taxonomy check · rules smoke test · schema check ·
                                 taxonomy seed · sample events seed
```

---

## Known gaps

Honest about what is not built:

- **WhatsApp invites are queued, not sent.** `whatsapp_queue` holds the state machine
  and `/status` reports it, but nothing calls the WhatsApp Business API yet. The
  hand-off point is `admitMember()` in `lib/applications.ts`.
- **No transactional email.** An applicant learns their outcome from the status link;
  nothing is sent to them. Event RSVPs are not confirmed by email either.
- **Events are created in SQL, not in a UI.** There is no admin screen for writing an
  event — insert a row, or adapt `scripts/seed-events.ts`. The read side, RSVPs and
  capacity are all built.
- **Rate limiting counts rows** rather than using a sliding window in Redis. Fine at
  this scale, not at ten thousand applications an hour.
- **The mock provider is the default.** It produces a spread of tenures and account
  ages so the whole decision tree is exercisable, but it is not real data. Configure
  a licensed provider before going live.
- **Tenure still is not verifiable from LinkedIn alone.** Sign-in fixed identity, not
  employment dates. Until a licensed data source is wired up, `LINKEDIN_PROVIDER=manual`
  is the honest production setting: it takes the applicant's declared start date and
  sends every application to a human, which is slower but does not pretend.
