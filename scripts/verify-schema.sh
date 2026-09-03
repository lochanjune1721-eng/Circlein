#!/usr/bin/env bash
# Apply the migration to a throwaway Postgres and assert the things that would
# be expensive to get wrong: it applies twice cleanly, the member counter is
# maintained by trigger, one person cannot hold two live applications, and an
# anonymous visitor can read the directory but never an applicant's details.
#
#   ./scripts/verify-schema.sh
#
# Needs a local PostgreSQL 15+ (`postgres` system user) and psql.
set -euo pipefail

ROOT="${PGVERIFY_ROOT:-/tmp/circlein-schema-check}"
PORT="${PGVERIFY_PORT:-5433}"
BIN="${PGVERIFY_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
MIGRATIONS="$(cd "$(dirname "$0")/.." && pwd)/supabase/migrations"

if [ ! -x "$BIN/initdb" ]; then
  echo "No PostgreSQL server binaries found. Set PGVERIFY_BIN." >&2
  exit 1
fi

run_as_pg() { su postgres -s /bin/bash -c "$1"; }
q() { run_as_pg "psql -h $ROOT/sock -p $PORT -U postgres $*"; }

cleanup() {
  run_as_pg "$BIN/pg_ctl -D $ROOT/data stop -m immediate" >/dev/null 2>&1 || true
  rm -rf "$ROOT"
}
trap cleanup EXIT

rm -rf "$ROOT"
mkdir -p "$ROOT/data" "$ROOT/sock"
chown -R postgres "$ROOT"

run_as_pg "$BIN/initdb -D $ROOT/data -U postgres --auth=trust" >/dev/null
run_as_pg "$BIN/pg_ctl -D $ROOT/data -o '-k $ROOT/sock -p $PORT -c listen_addresses=' -l $ROOT/pg.log start" >/dev/null
sleep 2

# Roles and the auth schema Supabase provides that a bare Postgres does not.
q "-q -v ON_ERROR_STOP=1" >/dev/null <<'SQL'
create role anon nologin;
create role authenticated nologin;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid());
-- Supabase resolves the signed-in user from the request's JWT claims. The same
-- shape here lets the policies be exercised by setting request.jwt.claims.
create or replace function auth.uid() returns uuid
  language sql stable
  as $fn$ select nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid $fn$;
grant usage on schema auth to anon, authenticated;
SQL

for m in "$MIGRATIONS"/*.sql; do
  cp "$m" "$ROOT/$(basename "$m")"
done

apply_all() {
  for m in "$ROOT"/0*.sql; do
    q "-q -v ON_ERROR_STOP=1 -f $m" >/dev/null
  done
}

apply_all
echo "  ok  migrations apply"
apply_all
echo "  ok  migrations are idempotent"

q "-q -v ON_ERROR_STOP=1" >/dev/null <<'SQL'
insert into niche_groups(slug,name,blurb) values ('technology','Technology','x');
insert into niches(slug,name,"group") values ('ai','AI','technology');
insert into countries(slug,name,code,region,emoji) values ('india','India','IN','asia','x');
insert into cities(slug,name,country) values ('new-delhi','New Delhi','india');
insert into auth.users(id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into applications(full_name,email,linkedin_url,whatsapp_e164,city,niche,raw_title,status_token,status,
                         auth_user_id,linkedin_sub,linkedin_email_verified)
values
 ('Alice','a@b.com','https://linkedin.com/in/a','+911234567890','new-delhi','ai','AI Engineer','tok-1','approved',
  '11111111-1111-1111-1111-111111111111','li-alice',true),
 ('Bob','b@b.com','https://linkedin.com/in/b','+911234567891','new-delhi','ai','AI Engineer','tok-2','approved',
  '22222222-2222-2222-2222-222222222222','li-bob',true);

insert into members(application_id,full_name,email,linkedin_url,whatsapp_e164,city,niche,auth_user_id,linkedin_sub)
select id,full_name,email,linkedin_url,whatsapp_e164,city,niche,auth_user_id,linkedin_sub from applications;
insert into circles(city,niche) values ('new-delhi','ai');
insert into circle_members(circle_id,member_id) select c.id,m.id from circles c, members m;
insert into whatsapp_groups(circle_id,name,invite_url) select id,'AI · New Delhi','https://chat.example/secret' from circles;
insert into whatsapp_queue(member_id,group_id) select m.id,g.id from members m, whatsapp_groups g;
SQL

count=$(q "-tAc 'select member_count from circles'" | tr -d '[:space:]')
[ "$count" = "2" ] || { echo "  FAIL  circle member_count is '$count', expected 2"; exit 1; }
echo "  ok  member count maintained by trigger"

if q "-q -c \"insert into applications(full_name,email,linkedin_url,whatsapp_e164,city,niche,raw_title,status_token)
     values ('Dup','A@B.com','https://linkedin.com/in/x','+910000000000','new-delhi','ai','AI Engineer','tok-9')\"" >/dev/null 2>&1; then
  echo "  FAIL  a second live application for the same email was accepted"; exit 1
fi
echo "  ok  one live application per email"

if q "-q -c \"insert into applications(full_name,email,linkedin_url,whatsapp_e164,city,niche,raw_title,status_token,linkedin_sub)
     values ('Alice Again','alice2@b.com','https://linkedin.com/in/a2','+910000000001','new-delhi','ai','AI Engineer','tok-10','li-alice')\"" >/dev/null 2>&1; then
  echo "  FAIL  a second live application for the same LinkedIn account was accepted"; exit 1
fi
echo "  ok  one live application per LinkedIn account"

for t in cities circles circle_directory; do
  q "-tAc \"set role anon; select count(*) from $t\"" >/dev/null 2>&1 \
    || { echo "  FAIL  anon cannot read $t, but the directory needs it"; exit 1; }
done
echo "  ok  anon can read the directory"

for t in applications members verification_checks whatsapp_queue whatsapp_groups circle_members; do
  if q "-tAc \"set role anon; select count(*) from $t\"" >/dev/null 2>&1; then
    echo "  FAIL  anon can read $t"; exit 1
  fi
done
echo "  ok  anon cannot read applicant or member data"

# A signed-in member sees their own row and nobody else's. This is the whole
# point of the sign-in: the database enforces it, not the application code.
as_alice() {
  q "-tAc \"set role authenticated;
      set request.jwt.claims = '{\\\"sub\\\":\\\"11111111-1111-1111-1111-111111111111\\\"}';
      $1\"" 2>&1 | tail -1 | tr -d '[:space:]'
}

seen=$(as_alice "select count(*) from applications")
[ "$seen" = "1" ] || { echo "  FAIL  a signed-in member sees $seen applications, expected exactly their own"; exit 1; }

name=$(as_alice "select full_name from applications")
[ "$name" = "Alice" ] || { echo "  FAIL  a signed-in member read '$name' instead of their own row"; exit 1; }
echo "  ok  a signed-in member reads only their own application"

seen=$(as_alice "select count(*) from members")
[ "$seen" = "1" ] || { echo "  FAIL  a signed-in member sees $seen member rows, expected 1"; exit 1; }

seen=$(as_alice "select count(*) from whatsapp_queue")
[ "$seen" = "1" ] || { echo "  FAIL  a signed-in member sees $seen queue rows, expected 1"; exit 1; }
echo "  ok  a signed-in member reads only their own place in the queue"

if as_alice "select invite_url from whatsapp_groups" | grep -qv "permissiondenied"; then
  out=$(as_alice "select invite_url from whatsapp_groups")
  case "$out" in
    *permissiondenied*) ;;
    *) echo "  FAIL  a member could read a WhatsApp invite link: $out"; exit 1 ;;
  esac
fi
echo "  ok  members cannot read WhatsApp invite links"

echo
echo "Schema OK."
