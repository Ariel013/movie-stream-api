-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HOSPITAL', 'BLOOD_BANK');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('HOSPITAL', 'BLOOD_BANK');

-- CreateEnum
CREATE TYPE "AboGroup" AS ENUM ('A', 'B', 'AB', 'O');

-- CreateEnum
CREATE TYPE "RhFactor" AS ENUM ('+', '-');

-- CreateEnum
CREATE TYPE "BagStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'DISTRIBUTED', 'EXPIRED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('RECEIVED', 'RESERVED', 'RELEASED', 'DISTRIBUTED', 'EXPIRED', 'DISCARDED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('INITIATED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOW_STOCK', 'RESERVATION_CONFIRMED', 'RESERVATION_EXPIRED', 'BAG_EXPIRING_SOON', 'TRANSFER_RECEIVED', 'PRESCRIPTION_FILLED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SyncOperationType" AS ENUM ('POST', 'PUT', 'PATCH', 'DELETE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_types" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "abo_group" "AboGroup" NOT NULL,
    "rh_factor" "RhFactor" NOT NULL,
    "label" VARCHAR(4) NOT NULL,
    "compatible_donor" TEXT[],

    CONSTRAINT "blood_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" "FacilityType" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "address" TEXT NOT NULL,
    "region_id" UUID NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "facility_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "mfa_secret" VARCHAR(64),
    "refresh_token" TEXT,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donors" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "national_id" VARCHAR(30) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "dob" DATE NOT NULL,
    "blood_type_id" UUID NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "is_eligible" BOOLEAN NOT NULL DEFAULT true,
    "ineligibility_reason" TEXT,
    "last_donation_at" TIMESTAMPTZ,
    "donation_count" INTEGER NOT NULL DEFAULT 0,
    "registered_bank_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_screenings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "donor_id" UUID NOT NULL,
    "screened_by" UUID,
    "screened_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hemoglobin_g_dl" DECIMAL(4,1),
    "blood_pressure" VARCHAR(10),
    "weight_kg" DECIMAL(5,1),
    "temperature_c" DECIMAL(4,1),
    "is_passed" BOOLEAN NOT NULL,
    "notes" TEXT,

    CONSTRAINT "health_screenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_bags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(50) NOT NULL,
    "blood_type_id" UUID NOT NULL,
    "donor_id" UUID,
    "screening_id" UUID,
    "blood_bank_id" UUID NOT NULL,
    "volume_ml" SMALLINT NOT NULL,
    "collected_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "status" "BagStatus" NOT NULL DEFAULT 'AVAILABLE',
    "discarded_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "blood_bags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "hospital_id" UUID NOT NULL,
    "national_id" VARCHAR(30),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "dob" DATE,
    "blood_type_id" UUID,
    "medical_record_no" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patient_id" UUID NOT NULL,
    "physician_id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "blood_type_id" UUID NOT NULL,
    "quantity" SMALLINT NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'ROUTINE',
    "clinical_notes" TEXT,
    "is_fulfilled" BOOLEAN NOT NULL DEFAULT false,
    "fulfilled_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(20) NOT NULL,
    "hospital_id" UUID NOT NULL,
    "blood_bank_id" UUID NOT NULL,
    "prescription_id" UUID,
    "requested_by" UUID NOT NULL,
    "blood_type_id" UUID NOT NULL,
    "quantity" SMALLINT NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'ROUTINE',
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    "confirmed_at" TIMESTAMPTZ,
    "dispatched_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_bags" (
    "reservation_id" UUID NOT NULL,
    "blood_bag_id" UUID NOT NULL,
    "allocated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_bags_pkey" PRIMARY KEY ("reservation_id","blood_bag_id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "blood_bag_id" UUID NOT NULL,
    "movement_type" "MovementType" NOT NULL,
    "from_status" "BagStatus" NOT NULL,
    "to_status" "BagStatus" NOT NULL,
    "performed_by" UUID,
    "reservation_id" UUID,
    "transfer_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(20) NOT NULL,
    "from_bank_id" UUID NOT NULL,
    "to_bank_id" UUID NOT NULL,
    "initiated_by" UUID NOT NULL,
    "received_by" UUID,
    "status" "TransferStatus" NOT NULL DEFAULT 'INITIATED',
    "reason" TEXT,
    "initiated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "in_transit_at" TIMESTAMPTZ,
    "received_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_bags" (
    "transfer_id" UUID NOT NULL,
    "blood_bag_id" UUID NOT NULL,

    CONSTRAINT "transfer_bags_pkey" PRIMARY KEY ("transfer_id","blood_bag_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "role" "UserRole",
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(60) NOT NULL,
    "entity_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "facility_id" UUID,
    "operation_id" UUID NOT NULL,
    "method" "SyncOperationType" NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "retries" SMALLINT NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "blood_types_label_key" ON "blood_types"("label");

-- CreateIndex
CREATE UNIQUE INDEX "blood_types_abo_group_rh_factor_key" ON "blood_types"("abo_group", "rh_factor");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_code_key" ON "facilities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "donors_national_id_key" ON "donors"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "blood_bags_code_key" ON "blood_bags"("code");

-- CreateIndex
CREATE UNIQUE INDEX "patients_national_id_key" ON "patients"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_code_key" ON "reservations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_code_key" ON "transfers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sync_queue_operation_id_key" ON "sync_queue"("operation_id");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_blood_type_id_fkey" FOREIGN KEY ("blood_type_id") REFERENCES "blood_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_registered_bank_id_fkey" FOREIGN KEY ("registered_bank_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_screenings" ADD CONSTRAINT "health_screenings_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_screenings" ADD CONSTRAINT "health_screenings_screened_by_fkey" FOREIGN KEY ("screened_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_bags" ADD CONSTRAINT "blood_bags_blood_type_id_fkey" FOREIGN KEY ("blood_type_id") REFERENCES "blood_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_bags" ADD CONSTRAINT "blood_bags_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_bags" ADD CONSTRAINT "blood_bags_screening_id_fkey" FOREIGN KEY ("screening_id") REFERENCES "health_screenings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_bags" ADD CONSTRAINT "blood_bags_blood_bank_id_fkey" FOREIGN KEY ("blood_bank_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_blood_type_id_fkey" FOREIGN KEY ("blood_type_id") REFERENCES "blood_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_physician_id_fkey" FOREIGN KEY ("physician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_blood_type_id_fkey" FOREIGN KEY ("blood_type_id") REFERENCES "blood_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_blood_bank_id_fkey" FOREIGN KEY ("blood_bank_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_blood_type_id_fkey" FOREIGN KEY ("blood_type_id") REFERENCES "blood_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_bags" ADD CONSTRAINT "reservation_bags_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_bags" ADD CONSTRAINT "reservation_bags_blood_bag_id_fkey" FOREIGN KEY ("blood_bag_id") REFERENCES "blood_bags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_blood_bag_id_fkey" FOREIGN KEY ("blood_bag_id") REFERENCES "blood_bags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_bank_id_fkey" FOREIGN KEY ("from_bank_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_bank_id_fkey" FOREIGN KEY ("to_bank_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_bags" ADD CONSTRAINT "transfer_bags_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_bags" ADD CONSTRAINT "transfer_bags_blood_bag_id_fkey" FOREIGN KEY ("blood_bag_id") REFERENCES "blood_bags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
