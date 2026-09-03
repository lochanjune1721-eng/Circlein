-- CircleIn — LinkedIn sign-in
--
-- People now arrive through "Sign in with LinkedIn" rather than by pasting a
-- profile URL, so identity stops being a claim and becomes a fact: LinkedIn
-- itself asserts the name, the email and a stable member id.
--
-- What LinkedIn's OpenID Connect product returns is exactly: sub, name,
-- given_name, family_name, picture, locale, email, email_verified. It does NOT
-- return work history, a headline, the vanity profile URL, or the account
-- creation date. So sign-in replaces the identity checks outright, and the
-- tenure rule still needs the profile source in lib/verification/provider.ts.

-- ─────────────────────────────────────────────────────────────────────────────
-- Applications
-- ─────────────────────────────────────────────────────────────────────────────

alter table applications
  add column if not exists auth_user_id  uuid references auth.users (id) on delete set null,
  add column if not exists linkedin_sub  text,
  add column if not exists linkedin_name text,
  add column if not exists linkedin_email text,
  add column if not exists linkedin_email_verified boolean not null default false,
  add column if not exists linkedin_picture text;

-- The profile URL is no longer how we identify anyone — LinkedIn does not
-- hand it out. It is now optional, and kept only so the tenure lookup has
-- something to query.
alter table applications alter column linkedin_url drop not null;

-- The old uniqueness rule keyed on that URL. The LinkedIn member id is the
-- honest key: one LinkedIn account, one live application.
drop index if exists applications_linkedin_live_idx;

create unique index if not exists applications_linkedin_sub_live_idx
  on applications (linkedin_sub)
  where linkedin_sub is not null
    and status in ('pending', 'verifying', 'needs_review', 'approved');

create index if not exists applications_auth_user_idx on applications (auth_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Members
-- ─────────────────────────────────────────────────────────────────────────────

alter table members
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null,
  add column if not exists linkedin_sub text,
  add column if not exists linkedin_picture text;

alter table members alter column linkedin_url drop not null;

create unique index if not exists members_linkedin_sub_idx
  on members (linkedin_sub)
  where linkedin_sub is not null;

create index if not exists members_auth_user_idx on members (auth_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row level security: a signed-in member reads their own row, and only theirs.
--
-- This is the point of signing in. Before, an applicant checked their status
-- with an opaque token because there was nobody to authenticate. Now the
-- session identifies them, so the database can enforce it directly instead of
-- the server having to remember to filter.
--
-- Note there is no INSERT or UPDATE policy anywhere: applications are written
-- by the server with the service role, after verification has run. A member
-- cannot create or edit their own application row.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists applications_own_read on applications;
create policy applications_own_read on applications
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

drop policy if exists members_own_read on members;
create policy members_own_read on members
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

-- Their own place in the WhatsApp queue, so the status page can show it
-- without the server holding a service-role key open for a page view.
drop policy if exists whatsapp_queue_own_read on whatsapp_queue;
create policy whatsapp_queue_own_read on whatsapp_queue
  for select to authenticated
  using (
    exists (
      select 1 from members m
      where m.id = whatsapp_queue.member_id
        and m.auth_user_id = (select auth.uid())
    )
  );

-- The group they were placed in — its name, not its invite link.
drop policy if exists whatsapp_groups_own_read on whatsapp_groups;
create policy whatsapp_groups_own_read on whatsapp_groups
  for select to authenticated
  using (
    exists (
      select 1
      from whatsapp_queue q
      join members m on m.id = q.member_id
      where q.group_id = whatsapp_groups.id
        and m.auth_user_id = (select auth.uid())
    )
  );

-- Those four tables were revoked from `authenticated` in 0001. The policies
-- above are worthless without the table-level grant, so hand back SELECT and
-- let RLS do the narrowing. `anon` is deliberately not included: an
-- unauthenticated visitor still sees nothing.
grant select on table public.applications   to authenticated;
grant select on table public.members        to authenticated;
grant select on table public.whatsapp_queue to authenticated;

-- whatsapp_groups is granted column by column, on purpose.
--
-- A table-level GRANT SELECT covers every column, and a later column-level
-- REVOKE does not subtract from it — so listing the readable columns is the
-- only way to withhold one. The column being withheld is `invite_url`: a
-- member who could read it could hand out access to a room they are merely
-- queued for. The server sends invites itself.
revoke select on table public.whatsapp_groups from authenticated;
grant select (id, circle_id, name, capacity, member_count, is_open, created_at)
  on table public.whatsapp_groups to authenticated;
