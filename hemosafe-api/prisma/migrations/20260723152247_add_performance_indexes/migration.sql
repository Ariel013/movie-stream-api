-- Performance indexes for hot query paths (blood bag FEFO lookups, reservation
-- expiry cron running every minute, audit log pagination, notification unread
-- counts). Additive only — no data is modified or dropped.
--
-- NOTE: hand-written (not from `prisma migrate dev`) because the "facilities"
-- table has a PostGIS `location geography(Point,4326)` column managed outside
-- Prisma's schema (see migration 20260525000001_add_facility_location). Since
-- that column isn't declared in schema.prisma, `prisma migrate dev` diffs it
-- as drift and proposes DROPPING it (and its GIST index) — which would destroy
-- real facility geolocation data. Do not run `prisma migrate dev` on this
-- project without reviewing the generated SQL first for exactly this reason.

CREATE INDEX IF NOT EXISTS "blood_bags_blood_bank_id_status_expires_at_idx"
  ON "blood_bags"("blood_bank_id", "status", "expires_at");

CREATE INDEX IF NOT EXISTS "blood_bags_blood_type_id_status_expires_at_idx"
  ON "blood_bags"("blood_type_id", "status", "expires_at");

CREATE INDEX IF NOT EXISTS "blood_bags_status_expires_at_idx"
  ON "blood_bags"("status", "expires_at");

CREATE INDEX IF NOT EXISTS "blood_bags_donor_id_idx"
  ON "blood_bags"("donor_id");

CREATE INDEX IF NOT EXISTS "reservations_status_expires_at_idx"
  ON "reservations"("status", "expires_at");

CREATE INDEX IF NOT EXISTS "reservations_hospital_id_idx"
  ON "reservations"("hospital_id");

CREATE INDEX IF NOT EXISTS "reservations_blood_bank_id_idx"
  ON "reservations"("blood_bank_id");

CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx"
  ON "notifications"("user_id", "is_read");

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
  ON "audit_logs"("created_at");

CREATE INDEX IF NOT EXISTS "patients_hospital_id_idx"
  ON "patients"("hospital_id");

CREATE INDEX IF NOT EXISTS "stock_movements_blood_bag_id_created_at_idx"
  ON "stock_movements"("blood_bag_id", "created_at");
