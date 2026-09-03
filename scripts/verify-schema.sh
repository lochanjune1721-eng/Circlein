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
MIGRATION="$(cd "$(dirname "$0")/.." && pwd)/supabase/migrations/0001_init.sql"

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

# Roles Supabase provides that a bare Postgres does not.
q "-q -c 'create role anon nologin; create role authenticated nologin;'" >/dev/null

cp "$MIGRATION" "$ROOT/mig.sql"
q "-q -v ON_ERROR_STOP=1 -f $ROOT/mig.sql" >/dev/null
echo "  ok  migration applies"
q "-q -v ON_ERROR_STOP=1 -f $ROOT/mig.sql" >/dev/null
echo "  ok  migration is idempotent"

q "-q -v ON_ERROR_STOP=1" >/dev/null <<'SQL'
insert into niche_groups(slug,name,blurb) values ('technology','Technology','x');
insert into niches(slug,name,"group") values ('ai','AI','technology');
insert into countries(slug,name,code,region,emoji) values ('india','India','IN','asia','x');
insert into cities(slug,name,country) values ('new-delhi','New Delhi','india');
insert into applications(full_name,email,linkedin_url,whatsapp_e164,city,niche,raw_title,status_token,status)
values ('Test','a@b.com','https://linkedin.com/in/t','+911234567890','new-delhi','ai','AI Engineer','tok-1','approved');
insert into members(application_id,full_name,email,linkedin_url,whatsapp_e164,city,niche)
select id,full_name,email,linkedin_url,whatsapp_e164,city,niche from applications;
insert into circles(city,niche) values ('new-delhi','ai');
insert into circle_members(circle_id,member_id) select c.id,m.id from circles c, members m;
SQL

count=$(q "-tAc 'select member_count from circles'" | tr -d '[:space:]')
[ "$count" = "1" ] || { echo "  FAIL  circle member_count is '$count', expected 1"; exit 1; }
echo "  ok  member count maintained by trigger"

if q "-q -c \"insert into applications(full_name,email,linkedin_url,whatsapp_e164,city,niche,raw_title,status_token)
     values ('Dup','A@B.com','https://linkedin.com/in/x','+910000000000','new-delhi','ai','AI Engineer','tok-2')\"" >/dev/null 2>&1; then
  echo "  FAIL  a second live application for the same email was accepted"; exit 1
fi
echo "  ok  one live application per person"

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

echo
echo "Schema OK."
