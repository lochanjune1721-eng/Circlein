-- CircleIn — one-step application form
--
-- The form now asks for seven things on one page: name, phone, LinkedIn,
-- portfolio (optional), city, company, role. Email is no longer collected —
-- everything reaches a member through WhatsApp — so identity falls back to the
-- LinkedIn URL, as it was before sign-in existed.
--
-- Sign-in is not removed, only un-gated: auth_user_id and the LinkedIn claims
-- stay, and fill in whenever somebody happens to be signed in.

alter table applications alter column email drop not null;
alter table members      alter column email drop not null;

alter table applications add column if not exists portfolio_url text;
alter table members      add column if not exists portfolio_url text;

-- Email is optional now, so it can no longer be the thing that stops one person
-- holding two live applications. The LinkedIn URL takes that job back.
drop index if exists applications_email_live_idx;

create unique index if not exists applications_email_live_idx
  on applications (lower(email))
  where email is not null
    and status in ('pending', 'verifying', 'needs_review', 'approved');

create unique index if not exists applications_linkedin_url_live_idx
  on applications (lower(linkedin_url))
  where linkedin_url is not null
    and status in ('pending', 'verifying', 'needs_review', 'approved');

-- One phone number, one live application. Without email this is the second
-- thing worth de-duplicating on, and it is the number a group invite goes to.
create unique index if not exists applications_whatsapp_live_idx
  on applications (whatsapp_e164)
  where status in ('pending', 'verifying', 'needs_review', 'approved');

-- members_email_idx was a plain unique index over lower(email); with email
-- optional it has to skip nulls or a second member without one would collide.
drop index if exists members_email_idx;
create unique index if not exists members_email_idx
  on members (lower(email))
  where email is not null;
