-- AlterTable
ALTER TABLE "reservations" ALTER COLUMN "expires_at" SET DEFAULT (NOW() + INTERVAL '24 hours');
