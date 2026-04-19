#!/usr/bin/env bash

set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is not installed or not available in PATH."
  exit 1
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set. Define it in .env or your shell environment."
  exit 1
fi

if ! compgen -G "drizzle/*.sql" >/dev/null; then
  echo "No SQL migration files found in drizzle/."
  exit 0
fi

for migration_file in drizzle/*.sql; do
  echo "Applying ${migration_file}"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${migration_file}"
done

echo "SQL migrations applied successfully."
