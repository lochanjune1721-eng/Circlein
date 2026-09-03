-- CircleIn — events
--
-- A circle is a group chat; an event is the room it eventually meets in. Events
-- are organised by CircleIn and scoped the same way members are: one city, and
-- either one niche or open to the whole city.
--
-- Unlike everything else here, published events are public. They are how people
-- who are not yet members find out this exists, so the listing is readable by
-- anonymous visitors. Who is attending is not.

do $$ begin
  create type event_status as enum ('draft', 'published', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rsvp_state as enum ('going', 'waitlist', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists events (
  id      uuid primary key default gen_random_uuid(),
  slug    text not null unique,
  title   text not null,
  -- One line for the listing card.
  summary text not null,
  -- Long form for the event page. Plain text; rendered as paragraphs.
  description text,

  city  text not null references cities (slug) on delete restrict,
  -- Null means the event is open to every niche in that city, which is what a
  -- launch night or a cross-discipline mixer actually is.
  niche text references niches (slug) on delete restrict,

  starts_at timestamptz not null,
  ends_at   timestamptz,
  -- IANA zone, so the page can render local time rather than the viewer's.
  timezone  text not null default 'UTC',

  is_online  boolean not null default false,
  venue_name text,
  venue_area text,

  -- Null means no cap.
  capacity   int,
  rsvp_count int not null default 0,

  status      event_status not null default 'draft',
  host_name   text not null default 'CircleIn',
  cover_emoji text not null default '🕯️',

  created_at timestamptz not null default now(),

  constraint events_end_after_start check (ends_at is null or ends_at > starts_at),
  constraint events_capacity_positive check (capacity is null or capacity > 0)
);

create index if not exists events_upcoming_idx on events (starts_at) where status = 'published';
create index if not exists events_city_idx     on events (city, starts_at);
create index if not exists events_circle_idx   on events (city, niche, starts_at);

-- Only members RSVP. There is no guest list for people who have not been
-- verified — that is the whole point of the door.
create table if not exists event_rsvps (
  event_id  uuid not null references events (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  state     rsvp_state not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index if not exists event_rsvps_member_idx on event_rsvps (member_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Attendance counter, and the waitlist.
--
-- Kept in a trigger so the count cannot drift from the rows, and so "is this
-- full?" is one column read on a listing page rather than a count per event.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function bump_event_rsvp_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.state = 'going' then
      update events set rsvp_count = rsvp_count + 1 where id = new.event_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.state = 'going' then
      update events set rsvp_count = greatest(0, rsvp_count - 1) where id = old.event_id;
    end if;
  elsif tg_op = 'UPDATE' and old.state is distinct from new.state then
    if old.state = 'going' and new.state <> 'going' then
      update events set rsvp_count = greatest(0, rsvp_count - 1) where id = new.event_id;
    elsif old.state <> 'going' and new.state = 'going' then
      update events set rsvp_count = rsvp_count + 1 where id = new.event_id;
    end if;
  end if;
  return null;
end $$;

drop trigger if exists event_rsvps_count on event_rsvps;
create trigger event_rsvps_count
  after insert or update or delete on event_rsvps
  for each row execute function bump_event_rsvp_count();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row level security
-- ─────────────────────────────────────────────────────────────────────────────

alter table events      enable row level security;
alter table event_rsvps enable row level security;

-- Published events are public on purpose: they are the shop window.
drop policy if exists events_public_read on events;
create policy events_public_read on events
  for select to anon, authenticated
  using (status = 'published');

-- A member sees their own RSVPs and nobody else's. There is no policy that
-- exposes a guest list, so one member cannot enumerate the others.
drop policy if exists event_rsvps_own_read on event_rsvps;
create policy event_rsvps_own_read on event_rsvps
  for select to authenticated
  using (
    exists (
      select 1 from members m
      where m.id = event_rsvps.member_id
        and m.auth_user_id = (select auth.uid())
    )
  );

revoke all on table public.events      from anon, authenticated;
revoke all on table public.event_rsvps from anon, authenticated;

grant select on table public.events to anon, authenticated;
grant select on table public.event_rsvps to authenticated;

-- Writes go through the server with the service role: it has to decide going
-- versus waitlist against the capacity, which a client cannot be trusted to do.

-- ─────────────────────────────────────────────────────────────────────────────
-- Listing view: an event plus its taxonomy labels, without a join in every page.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view event_directory
with (security_invoker = true) as
select
  e.id,
  e.slug,
  e.title,
  e.summary,
  e.starts_at,
  e.ends_at,
  e.timezone,
  e.is_online,
  e.venue_name,
  e.venue_area,
  e.capacity,
  e.rsvp_count,
  e.host_name,
  e.cover_emoji,
  e.status,
  e.city,
  ci.name    as city_name,
  ci.country,
  co.name    as country_name,
  co.emoji   as country_emoji,
  e.niche,
  n.name     as niche_name
from events e
join cities    ci on ci.slug = e.city
join countries co on co.slug = ci.country
left join niches n on n.slug = e.niche
where e.status = 'published';

revoke all on table public.event_directory from anon, authenticated;
grant select on table public.event_directory to anon, authenticated;
