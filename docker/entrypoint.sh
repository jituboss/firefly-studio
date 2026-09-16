#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS_ON_BOOT:-true}" = "true" ]; then
  echo "[entrypoint] applying database migrations…"
  # Guarded by a Postgres advisory lock, so parallel replicas are safe.
  node dist/migrate.cjs || {
    echo "[entrypoint] migration failed" >&2
    exit 1
  }
fi

echo "[entrypoint] starting Firefly Studio"
exec "$@"
