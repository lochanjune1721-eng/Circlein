-- CircleIn — initial schema
--
-- Three dimensions (country -> city -> niche) define a circle. A person applies
-- to one, an automated check reads their LinkedIn, and on approval they become
-- a member of that circle and are queued for its WhatsApp group.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Taxonomy. Seeded from lib/taxonomy via `npm run db:seed`; these tables are
-- the database's copy of that source of truth so that foreign keys, joins and
-- counts work in SQL.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists niche_groups (
  slug   text primary key,
  name   text not null,
  blurb  text not null,
  sort   int  not null default 0
);

create table if not exists niches (
  slug    text primary key,
  name    text not null,
  "group" text not null references niche_groups (slug) on delete restrict,
  aliases text[] not null default '{}'
);
create index if not exists niches_group_idx on niches ("group");

create table if not exists countries (
  slug   text primary key,
  name   text not null,
  code   char(2) not null unique,
  region text not null,
  emoji  text not null,
  aliases text[] not null default '{}'
);

create table if not exists metros (
  slug    text primary key,
  name    text not null,
  country text not null references countries (slug) on delete restrict
);

create table if not exists cities (
  slug    text primary key,
  name    text not null,
  country text not null references countries (slug) on delete restrict,
  area    text,
  metro   text references metros (slug) on delete set null,
  aliases text[] not null default '{}'
);
create index if not exists cities_country_idx on cities (country);
create index if not exists cities_metro_idx   on cities (metro);

create table if not exists role_families (
  slug   text primary key,
  name   text not null,
  niches text[] not null default '{}'
);

create table if not exists roles (
  slug    text primary key,
  name    text not null,
  family  text not null references role_families (slug) on delete restrict,
  aliases text[] not null default '{}'
);
create index if not exists roles_family_idx on roles (family);

create table if not exists seniority_levels (
  slug text primary key,
  name text not null,
  rank int  not null
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Circles: one per (city, niche). Created on demand when the first member of a
-- city/niche pair is approved, so the directory only ever shows real rooms.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists circles (
  id           uuid primary key default gen_random_uuid(),
  city         text not null references cities (slug) on delete restrict,
  niche        text not null references niches (slug) on delete restrict,
  member_count int  not null default 0,
  created_at   timestamptz not null default now(),
  unique (city, niche)
);
create index if not exists circles_city_idx  on circles (city);
create index if not exists circles_niche_idx on circles (niche);

-- A circle's WhatsApp room. Capped, because a group that grows without limit
-- stops being the thing people joined for; when one fills, the next opens.
create table if not exists whatsapp_groups (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references circles (id) on delete cascade,
  name         text not null,
  invite_url   text,
  capacity     int  not null default 200,
  member_count int  not null default 0,
  is_open      boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists whatsapp_groups_circle_idx on whatsapp_groups (circle_id, is_open);

-- ─────────────────────────────────────────────────────────────────────────────
-- Applications. Every join request lands here first — nobody is a member until
-- verification has run and passed.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type application_status as enum (
    'pending',        -- submitted, not yet looked at
    'verifying',      -- automated check in flight
    'needs_review',   -- automated check was not confident enough to decide
    'approved',       -- verified; member row created
    'rejected',       -- failed a hard rule
    'withdrawn'
  );
exception when duplicate_object then null; end $$;

create table if not exists applications (
  id            uuid primary key default gen_random_uuid(),
  status        application_status not null default 'pending',

  -- Identity as claimed by the applicant.
  full_name     text not null,
  email         text not null,
  linkedin_url  text not null,
  whatsapp_e164 text not null,

  -- Where they sit in the taxonomy, as claimed.
  city          text not null references cities (slug) on delete restrict,
  niche         text not null references niches (slug) on delete restrict,
  role          text references roles (slug) on delete set null,
  seniority     text references seniority_levels (slug) on delete set null,
  company       text,
  raw_title     text not null,
  note          text,

  -- Opaque token the applicant uses to check their own status without an
  -- account. Never exposed in listings.
  status_token  text not null unique,

  submitted_at  timestamptz not null default now(),
  decided_at    timestamptz,
  decision_note text,

  ip_hash       text,
  user_agent    text
);

-- One live application per person. A rejected or withdrawn application does not
-- block a later, better one, so the uniqueness only covers open + approved.
create unique index if not exists applications_email_live_idx
  on applications (lower(email))
  where status in ('pending', 'verifying', 'needs_review', 'approved');

create unique index if not exists applications_linkedin_live_idx
  on applications (lower(linkedin_url))
  where status in ('pending', 'verifying', 'needs_review', 'approved');

create index if not exists applications_status_idx on applications (status, submitted_at desc);
create index if not exists applications_circle_idx on applications (city, niche);

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification. Every check that runs is written down — the automated verdict
-- has to be auditable, and a person reviewing an edge case needs to see exactly
-- what the machine saw.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type verification_verdict as enum ('pass', 'fail', 'inconclusive');
exception when duplicate_object then null; end $$;

create table if not exists verification_checks (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,

  -- Which provider supplied the profile data, and what it cost us to get it.
  provider       text not null,
  fetched_at     timestamptz not null default now(),

  -- The three signals the policy turns on.
  account_age_months  int,
  tenure_months       int,
  headline            text,
  profile_location    text,

  -- What the taxonomy made of the raw profile.
  matched_role       text references roles (slug) on delete set null,
  matched_seniority  text references seniority_levels (slug) on delete set null,
  matched_city       text references cities (slug) on delete set null,
  match_confidence   numeric(3, 2),

  verdict        verification_verdict not null,
  -- Human-readable reasons, one per rule evaluated.
  reasons        jsonb not null default '[]'::jsonb,
  -- Raw provider payload, kept for appeals and for tuning the rules.
  raw_profile    jsonb,

  model          text,
  created_at     timestamptz not null default now()
);
create index if not exists verification_checks_app_idx on verification_checks (application_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Members. Created only from an approved application.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists members (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references applications (id) on delete restrict,

  full_name    text not null,
  email        text not null,
  linkedin_url text not null,
  whatsapp_e164 text not null,

  city       text not null references cities (slug) on delete restrict,
  niche      text not null references niches (slug) on delete restrict,
  role       text references roles (slug) on delete set null,
  seniority  text references seniority_levels (slug) on delete set null,
  company    text,
  headline   text,

  verified_at timestamptz not null default now(),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists members_email_idx on members (lower(email));
create index if not exists members_circle_idx on members (city, niche) where is_active;

create table if not exists circle_members (
  circle_id uuid not null references circles (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, member_id)
);

-- Where a new member sits in the WhatsApp queue, and whether they have been
-- added yet. The site promises "you will be added shortly"; this is the row
-- that promise is kept from.
do $$ begin
  create type whatsapp_state as enum ('queued', 'invited', 'joined', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists whatsapp_queue (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references members (id) on delete cascade,
  group_id   uuid references whatsapp_groups (id) on delete set null,
  state      whatsapp_state not null default 'queued',
  queued_at  timestamptz not null default now(),
  invited_at timestamptz,
  joined_at  timestamptz,
  note       text,
  unique (member_id)
);
create index if not exists whatsapp_queue_state_idx on whatsapp_queue (state, queued_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Counters. Kept correct by trigger rather than recomputed on every page view.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function bump_circle_member_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update circles set member_count = member_count + 1 where id = new.circle_id;
  elsif tg_op = 'DELETE' then
    update circles set member_count = greatest(0, member_count - 1) where id = old.circle_id;
  end if;
  return null;
end $$;

drop trigger if exists circle_members_count on circle_members;
create trigger circle_members_count
  after insert or delete on circle_members
  for each row execute function bump_circle_member_count();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row level security.
--
-- The public site reads the taxonomy and aggregate circle counts, and nothing
-- else. Applications, members, phone numbers and verification payloads are only
-- reachable with the service role, which lives on the server. There is no
-- policy that lets an anonymous visitor read another person's data.
-- ─────────────────────────────────────────────────────────────────────────────

alter table niche_groups      enable row level security;
alter table niches            enable row level security;
alter table countries         enable row level security;
alter table metros            enable row level security;
alter table cities            enable row level security;
alter table role_families     enable row level security;
alter table roles             enable row level security;
alter table seniority_levels  enable row level security;
alter table circles           enable row level security;
alter table whatsapp_groups   enable row level security;
alter table applications      enable row level security;
alter table verification_checks enable row level security;
alter table members           enable row level security;
alter table circle_members    enable row level security;
alter table whatsapp_queue    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'niche_groups','niches','countries','metros','cities',
    'role_families','roles','seniority_levels','circles'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_public_read', t);
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;

-- Everything else: no anon policy at all, so RLS denies by default. Server-side
-- code uses the service role key, which bypasses RLS.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table privileges, stated explicitly.
--
-- Supabase grants anon and authenticated blanket SELECT on new tables in
-- `public`, leaving RLS as the only thing between an anonymous visitor and the
-- applications table. RLS does hold that line — but a single missing policy
-- would then be a data leak rather than a broken page. So the grants are
-- written out here too: revoke everything, then hand back read access to
-- exactly the nine tables the public site needs.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  public_tables constant text[] := array[
    'niche_groups','niches','countries','metros','cities',
    'role_families','roles','seniority_levels','circles'
  ];
  private_tables constant text[] := array[
    'applications','verification_checks','members','circle_members',
    'whatsapp_groups','whatsapp_queue'
  ];
  t text;
begin
  foreach t in array public_tables || private_tables loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;

  foreach t in array public_tables loop
    execute format('grant select on table public.%I to anon, authenticated', t);
  end loop;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Directory view: what the public site is allowed to know about a circle.
-- Counts and taxonomy labels only — never a name, an email or a phone number.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view circle_directory
with (security_invoker = true) as
select
  c.id,
  c.city,
  ci.name       as city_name,
  ci.country,
  co.name       as country_name,
  co.emoji      as country_emoji,
  ci.metro,
  c.niche,
  n.name        as niche_name,
  n."group"     as niche_group,
  c.member_count,
  c.created_at
from circles c
join cities    ci on ci.slug = c.city
join countries co on co.slug = ci.country
join niches    n  on n.slug  = c.niche;

-- The view is granted here rather than with the tables above, because it does
-- not exist until this point in the file.
revoke all on table public.circle_directory from anon, authenticated;
grant select on table public.circle_directory to anon, authenticated;
