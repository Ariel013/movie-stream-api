#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# PgBouncer entrypoint — generate userlist.txt from PostgreSQL SCRAM hashes
# then exec the real pgbouncer process.
# ─────────────────────────────────────────────────────────────────────────────

set -e

USERLIST=/etc/pgbouncer/userlist.txt

echo "Fetching SCRAM hashes from PostgreSQL..."

# Wait for PostgreSQL to be ready (up to 30s)
i=0
until pg_isready -h "${PGHOST:-postgres}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" >/dev/null 2>&1; do
  i=$((i+1))
  if [ $i -ge 30 ]; then
    echo "ERROR: PostgreSQL not ready after 30s — aborting"
    exit 1
  fi
  sleep 1
done

# Generate userlist from pg_shadow
psql -h "${PGHOST:-postgres}" \
     -U "${PGUSER:-postgres}" \
     -d "${PGDATABASE:-hemosafe_prod}" \
     -t -A -c \
     "SELECT concat('\"', usename, '\" \"', passwd, '\"') FROM pg_shadow WHERE usename IN ('hemosafe_app', 'hemosafe_ro', 'pgbouncer')" \
     > "${USERLIST}"

echo "userlist.txt generated with $(wc -l < ${USERLIST}) entries"

exec "$@"
