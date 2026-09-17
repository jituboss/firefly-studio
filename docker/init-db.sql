-- Runs once, on an empty data directory.

-- Extensions required by the Firefly Studio schema.
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- The bundled Firefly III (`--profile firefly`) shares this server rather than
-- running a Postgres of its own. It gets a separate database and a separate
-- role, so the two applications cannot see each other's tables; Firefly runs
-- its own migrations into it on first boot.
--
-- Guarded so the file stays safe to re-run by hand against an existing volume,
-- which is what an upgrade from the two-server layout needs.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'firefly') THEN
    CREATE ROLE firefly LOGIN PASSWORD 'firefly';
  END IF;
END
$$;

SELECT 'CREATE DATABASE firefly OWNER firefly'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'firefly')\gexec
