-- ─────────────────────────────────────────────────────────────────────────────
-- HEMOSAFE — PostgreSQL initialization
-- Runs once when the container is first created
-- ─────────────────────────────────────────────────────────────────────────────

-- PostGIS extension (required for geospatial queries)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Ensure scram-sha-256 password encryption
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Create replication user (used by replica container)
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'REPLICA_PASSWORD_PLACEHOLDER';

-- Row-level security baseline — enforced at application layer via Prisma
-- (Prisma doesn't support RLS natively; enforce at service layer instead)
