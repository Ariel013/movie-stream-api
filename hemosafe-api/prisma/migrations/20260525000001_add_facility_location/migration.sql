-- Add PostGIS geography column to facilities
-- Prisma cannot manage geography types natively, so this is handled via raw migration.

ALTER TABLE "facilities"
  ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326);

-- Spatial index for ST_DWithin / KNN queries
CREATE INDEX IF NOT EXISTS "facilities_location_gist_idx"
  ON "facilities" USING GIST ("location");
