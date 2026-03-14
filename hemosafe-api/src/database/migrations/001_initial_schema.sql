-- =============================================================================
-- HEMOSAFE — National Blood Bank Management System
-- PostgreSQL Schema — Migration 001: Initial Schema
-- =============================================================================
-- Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Geospatial queries
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram search on names
CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- GiST index on exclusion constraints

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'HOSPITAL',
  'BLOOD_BANK'
);

CREATE TYPE facility_type AS ENUM (
  'HOSPITAL',
  'BLOOD_BANK'
);

CREATE TYPE blood_abo AS ENUM ('A', 'B', 'AB', 'O');
CREATE TYPE blood_rh  AS ENUM ('+', '-');

CREATE TYPE bag_status AS ENUM (
  'AVAILABLE',
  'RESERVED',
  'DISTRIBUTED',
  'EXPIRED',
  'DISCARDED'
);

CREATE TYPE reservation_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'DISPATCHED',
  'DELIVERED',
  'EXPIRED',
  'CANCELLED'
);

CREATE TYPE urgency_level AS ENUM (
  'ROUTINE',
  'URGENT',
  'EMERGENCY'
);

CREATE TYPE movement_type AS ENUM (
  'RECEIVED',       -- Bag entered bank inventory
  'RESERVED',       -- Bag locked for a reservation
  'RELEASED',       -- Reservation cancelled, bag back to AVAILABLE
  'DISTRIBUTED',    -- Bag physically sent to hospital
  'EXPIRED',        -- Reached expiry date
  'DISCARDED',      -- Manually removed (quality issue)
  'TRANSFERRED'     -- Moved between blood banks
);

CREATE TYPE transfer_status AS ENUM (
  'INITIATED',
  'IN_TRANSIT',
  'RECEIVED',
  'CANCELLED'
);

CREATE TYPE notification_type AS ENUM (
  'LOW_STOCK',
  'RESERVATION_CONFIRMED',
  'RESERVATION_EXPIRED',
  'BAG_EXPIRING_SOON',
  'TRANSFER_RECEIVED',
  'PRESCRIPTION_FILLED',
  'SYSTEM'
);

CREATE TYPE sync_operation AS ENUM (
  'POST',
  'PUT',
  'PATCH',
  'DELETE'
);

CREATE TYPE sync_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'DONE',
  'FAILED'
);

-- =============================================================================
-- REFERENCE TABLES
-- =============================================================================

-- Administrative regions (national hierarchy)
CREATE TABLE regions (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(10) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  parent_id   UUID        REFERENCES regions(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  regions           IS 'National administrative regions (wilaya, daïra, commune…)';
COMMENT ON COLUMN regions.parent_id IS 'Self-referential for hierarchical regions';

-- Blood type compatibility reference
CREATE TABLE blood_types (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  abo_group         blood_abo   NOT NULL,
  rh_factor         blood_rh    NOT NULL,
  compatible_donor  blood_abo[] NOT NULL DEFAULT '{}',   -- ABO groups this type can receive from
  label             VARCHAR(4)  NOT NULL UNIQUE,          -- e.g. 'A+', 'O-'
  UNIQUE (abo_group, rh_factor)
);

COMMENT ON TABLE blood_types IS 'ABO/Rh reference with pre-computed compatibility rules';

-- =============================================================================
-- FACILITIES
-- =============================================================================

-- Facilities: hospitals and blood banks share a common location model
CREATE TABLE facilities (
  id            UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          facility_type   NOT NULL,
  name          VARCHAR(200)    NOT NULL,
  code          VARCHAR(30)     NOT NULL UNIQUE,     -- National facility code
  address       TEXT            NOT NULL,
  region_id     UUID            NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  location      GEOGRAPHY(POINT, 4326),              -- PostGIS lat/lng
  phone         VARCHAR(30),
  email         VARCHAR(150),
  is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN facilities.location IS 'PostGIS POINT for proximity queries via ST_DWithin';
COMMENT ON COLUMN facilities.code     IS 'Ministry-issued national identifier';

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE users (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role    NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  phone           VARCHAR(30),
  facility_id     UUID         REFERENCES facilities(id) ON DELETE RESTRICT,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  mfa_secret      VARCHAR(64),                        -- TOTP seed (ADMIN only)
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- ADMIN users are not bound to a facility
  CONSTRAINT chk_facility_role CHECK (
    (role = 'ADMIN' AND facility_id IS NULL) OR
    (role <> 'ADMIN' AND facility_id IS NOT NULL)
  )
);

COMMENT ON COLUMN users.password_hash IS 'bcrypt hash, never store plaintext';
COMMENT ON COLUMN users.mfa_secret    IS 'TOTP secret; required for ADMIN role';

-- =============================================================================
-- DONORS
-- =============================================================================

CREATE TABLE donors (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  national_id         VARCHAR(30) NOT NULL UNIQUE,    -- Encrypted at app layer
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  dob                 DATE         NOT NULL,
  blood_type_id       UUID         NOT NULL REFERENCES blood_types(id) ON DELETE RESTRICT,
  phone               VARCHAR(30),
  email               VARCHAR(150),
  is_eligible         BOOLEAN      NOT NULL DEFAULT TRUE,
  ineligibility_reason TEXT,
  last_donation_at    TIMESTAMPTZ,
  donation_count      INT          NOT NULL DEFAULT 0 CHECK (donation_count >= 0),
  registered_bank_id  UUID         REFERENCES facilities(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN donors.national_id  IS 'Encrypted at application layer (PII)';
COMMENT ON COLUMN donors.is_eligible  IS 'Computed by eligibility service; updated after each donation';

-- Health screenings tied to each visit
CREATE TABLE health_screenings (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id        UUID        NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,
  screened_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  screened_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hemoglobin_g_dl NUMERIC(4,1),
  blood_pressure  VARCHAR(10), -- e.g. '120/80'
  weight_kg       NUMERIC(5,1),
  temperature_c   NUMERIC(4,1),
  is_passed       BOOLEAN      NOT NULL,
  notes           TEXT
);

-- =============================================================================
-- BLOOD BAGS
-- =============================================================================

CREATE TABLE blood_bags (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(50) NOT NULL UNIQUE,        -- Barcode / label
  blood_type_id   UUID        NOT NULL REFERENCES blood_types(id) ON DELETE RESTRICT,
  donor_id        UUID        REFERENCES donors(id) ON DELETE RESTRICT,
  screening_id    UUID        REFERENCES health_screenings(id) ON DELETE SET NULL,
  blood_bank_id   UUID        NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  volume_ml       SMALLINT    NOT NULL CHECK (volume_ml BETWEEN 100 AND 600),
  collected_at    TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  status          bag_status  NOT NULL DEFAULT 'AVAILABLE',
  discarded_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_expiry_after_collection CHECK (expires_at > collected_at),
  CONSTRAINT chk_discard_reason CHECK (
    (status = 'DISCARDED' AND discarded_reason IS NOT NULL) OR
    (status <> 'DISCARDED')
  )
);

COMMENT ON COLUMN blood_bags.code          IS 'Physical barcode printed on the bag label';
COMMENT ON COLUMN blood_bags.volume_ml     IS 'Standard whole-blood unit: 450–500 ml';
COMMENT ON COLUMN blood_bags.expires_at    IS 'Typically collected_at + 42 days for RBCs';

-- =============================================================================
-- PATIENTS
-- =============================================================================

CREATE TABLE patients (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id   UUID        NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  national_id   VARCHAR(30) UNIQUE,                  -- Optional; encrypted at app layer
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  dob           DATE,
  blood_type_id UUID        REFERENCES blood_types(id) ON DELETE RESTRICT,
  medical_record_no VARCHAR(50),
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PRESCRIPTIONS
-- =============================================================================

CREATE TABLE prescriptions (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID            NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  physician_id    UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  hospital_id     UUID            NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  blood_type_id   UUID            NOT NULL REFERENCES blood_types(id) ON DELETE RESTRICT,
  quantity        SMALLINT        NOT NULL CHECK (quantity > 0),
  urgency         urgency_level   NOT NULL DEFAULT 'ROUTINE',
  clinical_notes  TEXT,
  is_fulfilled    BOOLEAN         NOT NULL DEFAULT FALSE,
  fulfilled_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,                        -- Clinically valid until
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE prescriptions IS 'Physician order for blood transfusion; drives reservation requests';

-- =============================================================================
-- RESERVATIONS  (expire after 24 hours)
-- =============================================================================

CREATE TABLE reservations (
  id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(20)         NOT NULL UNIQUE,       -- Human-readable ref
  hospital_id     UUID                NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  blood_bank_id   UUID                NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  prescription_id UUID                REFERENCES prescriptions(id) ON DELETE SET NULL,
  requested_by    UUID                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  blood_type_id   UUID                NOT NULL REFERENCES blood_types(id) ON DELETE RESTRICT,
  quantity        SMALLINT            NOT NULL CHECK (quantity > 0),
  urgency         urgency_level       NOT NULL DEFAULT 'ROUTINE',
  status          reservation_status  NOT NULL DEFAULT 'PENDING',
  notes           TEXT,
  expires_at      TIMESTAMPTZ         NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  confirmed_at    TIMESTAMPTZ,
  dispatched_at   TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_hospital_ne_bank  CHECK (hospital_id <> blood_bank_id),
  CONSTRAINT chk_cancel_reason     CHECK (
    (status = 'CANCELLED' AND cancel_reason IS NOT NULL) OR
    (status <> 'CANCELLED')
  ),
  CONSTRAINT chk_status_timestamps CHECK (
    (confirmed_at IS NOT NULL  OR status NOT IN ('CONFIRMED','DISPATCHED','DELIVERED')) AND
    (dispatched_at IS NOT NULL OR status NOT IN ('DISPATCHED','DELIVERED')) AND
    (delivered_at IS NOT NULL  OR status <> 'DELIVERED')
  )
);

COMMENT ON COLUMN reservations.expires_at IS '24-hour TTL from creation; job auto-transitions to EXPIRED';
COMMENT ON COLUMN reservations.code       IS 'Alphanumeric ref shown to hospital staff (e.g. RES-2025-001234)';

-- M2M: which specific bags are allocated to a reservation
CREATE TABLE reservation_bags (
  reservation_id  UUID  NOT NULL REFERENCES reservations(id)  ON DELETE CASCADE,
  blood_bag_id    UUID  NOT NULL REFERENCES blood_bags(id)     ON DELETE RESTRICT,
  allocated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (reservation_id, blood_bag_id)
);

COMMENT ON TABLE reservation_bags IS 'Specific bags committed to a reservation; drives bag status → RESERVED';

-- =============================================================================
-- STOCK MOVEMENTS  (immutable ledger)
-- =============================================================================

CREATE TABLE stock_movements (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  blood_bag_id    UUID            NOT NULL REFERENCES blood_bags(id) ON DELETE RESTRICT,
  movement_type   movement_type   NOT NULL,
  from_status     bag_status      NOT NULL,
  to_status       bag_status      NOT NULL,
  performed_by    UUID            REFERENCES users(id) ON DELETE SET NULL,
  reservation_id  UUID            REFERENCES reservations(id) ON DELETE SET NULL,
  transfer_id     UUID,                                           -- FK set later
  notes           TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_status_changed CHECK (from_status <> to_status)
);

COMMENT ON TABLE stock_movements IS 'Append-only ledger; every bag status change is recorded here';

-- =============================================================================
-- TRANSFERS  (bag moved between blood banks)
-- =============================================================================

CREATE TABLE transfers (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(20)     NOT NULL UNIQUE,
  from_bank_id    UUID            NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  to_bank_id      UUID            NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  initiated_by    UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  received_by     UUID            REFERENCES users(id) ON DELETE SET NULL,
  status          transfer_status NOT NULL DEFAULT 'INITIATED',
  reason          TEXT,
  initiated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  in_transit_at   TIMESTAMPTZ,
  received_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_banks_differ CHECK (from_bank_id <> to_bank_id)
);

-- Bags included in this transfer (one transfer can bundle multiple bags)
CREATE TABLE transfer_bags (
  transfer_id   UUID  NOT NULL REFERENCES transfers(id)   ON DELETE CASCADE,
  blood_bag_id  UUID  NOT NULL REFERENCES blood_bags(id)  ON DELETE RESTRICT,
  PRIMARY KEY (transfer_id, blood_bag_id)
);

-- Add deferred FK from stock_movements to transfers
ALTER TABLE stock_movements
  ADD CONSTRAINT fk_stock_movement_transfer
  FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE SET NULL;

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
  id            UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          notification_type   NOT NULL,
  title         VARCHAR(200)        NOT NULL,
  body          TEXT                NOT NULL,
  is_read       BOOLEAN             NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  metadata      JSONB               NOT NULL DEFAULT '{}',   -- flexible payload per type
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_read_at CHECK (
    (is_read = TRUE AND read_at IS NOT NULL) OR
    (is_read = FALSE AND read_at IS NULL)
  )
);

COMMENT ON COLUMN notifications.metadata IS 'Type-specific data: {reservationId}, {bagCode}, {stockLevel}…';

-- =============================================================================
-- AUDIT LOGS  (immutable, append-only)
-- =============================================================================

CREATE TABLE audit_logs (
  id          BIGSERIAL     PRIMARY KEY,              -- BIGSERIAL: high volume, no UUID overhead
  user_id     UUID          REFERENCES users(id) ON DELETE SET NULL,
  role        user_role,
  action      VARCHAR(100)  NOT NULL,                 -- e.g. 'UPDATE reservation status'
  entity      VARCHAR(60)   NOT NULL,                 -- table name
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  audit_logs IS 'Immutable write ledger. Never UPDATE or DELETE rows here.';
COMMENT ON COLUMN audit_logs.id IS 'BIGSERIAL for high-volume insert performance; no UUID needed';

-- Revoke UPDATE/DELETE from application role (set at DB level)
-- REVOKE UPDATE, DELETE ON audit_logs FROM hemosafe_app;

-- =============================================================================
-- SYNC QUEUE  (offline operations from PWA clients)
-- =============================================================================

CREATE TABLE sync_queue (
  id              BIGSERIAL       PRIMARY KEY,
  user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id     UUID            REFERENCES facilities(id) ON DELETE CASCADE,
  operation_id    UUID            NOT NULL UNIQUE,        -- Client-generated idempotency key
  method          sync_operation  NOT NULL,
  endpoint        VARCHAR(255)    NOT NULL,
  payload         JSONB           NOT NULL DEFAULT '{}',
  status          sync_status     NOT NULL DEFAULT 'PENDING',
  retries         SMALLINT        NOT NULL DEFAULT 0 CHECK (retries >= 0),
  error_message   TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

COMMENT ON COLUMN sync_queue.operation_id IS 'UUID from client; ensures idempotent replay';
COMMENT ON COLUMN sync_queue.endpoint     IS 'Original API path, e.g. /reservations';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- 1. Auto-update updated_at on every table that has it
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'facilities','users','donors','blood_bags',
    'patients','reservations','transfers'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- 2. Record a stock_movement every time a blood_bag status changes
CREATE OR REPLACE FUNCTION record_bag_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO stock_movements (
      blood_bag_id, movement_type, from_status, to_status, created_at
    ) VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'AVAILABLE'   THEN 'RELEASED'::movement_type
        WHEN 'RESERVED'    THEN 'RESERVED'::movement_type
        WHEN 'DISTRIBUTED' THEN 'DISTRIBUTED'::movement_type
        WHEN 'EXPIRED'     THEN 'EXPIRED'::movement_type
        WHEN 'DISCARDED'   THEN 'DISCARDED'::movement_type
      END,
      OLD.status,
      NEW.status,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bag_status_movement
  AFTER UPDATE OF status ON blood_bags
  FOR EACH ROW EXECUTE FUNCTION record_bag_status_change();

-- 3. Expire reservations past their 24-hour TTL
--    Called by the application's cron job (or pg_cron if available)
CREATE OR REPLACE FUNCTION expire_stale_reservations()
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
  affected INT;
BEGIN
  -- Step 1: Release all reserved bags back to AVAILABLE
  UPDATE blood_bags
  SET    status = 'AVAILABLE'
  WHERE  id IN (
    SELECT rb.blood_bag_id
    FROM   reservation_bags rb
    JOIN   reservations r ON r.id = rb.reservation_id
    WHERE  r.status IN ('PENDING','CONFIRMED')
      AND  r.expires_at < NOW()
  );

  -- Step 2: Mark reservations as EXPIRED
  UPDATE reservations
  SET    status = 'EXPIRED'
  WHERE  status IN ('PENDING','CONFIRMED')
    AND  expires_at < NOW();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

COMMENT ON FUNCTION expire_stale_reservations IS
  'Safe to call repeatedly; idempotent. Run every minute via pg_cron or app scheduler.';

-- 4. Prevent re-reserving an already-reserved or distributed bag (double-booking guard)
CREATE OR REPLACE FUNCTION guard_bag_double_booking()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_status bag_status;
BEGIN
  SELECT status INTO current_status
  FROM   blood_bags
  WHERE  id = NEW.blood_bag_id
  FOR UPDATE;                              -- Row-level lock within the transaction

  IF current_status <> 'AVAILABLE' THEN
    RAISE EXCEPTION
      'Blood bag % is not available (current status: %)',
      NEW.blood_bag_id, current_status
    USING ERRCODE = 'P0001';
  END IF;

  -- Mark bag as RESERVED atomically
  UPDATE blood_bags SET status = 'RESERVED' WHERE id = NEW.blood_bag_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reservation_bag_booking
  BEFORE INSERT ON reservation_bags
  FOR EACH ROW EXECUTE FUNCTION guard_bag_double_booking();

-- 5. Increment donor donation_count and update last_donation_at when a bag is created
CREATE OR REPLACE FUNCTION update_donor_stats_on_bag()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.donor_id IS NOT NULL THEN
    UPDATE donors
    SET    donation_count   = donation_count + 1,
           last_donation_at = NEW.collected_at
    WHERE  id = NEW.donor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bag_inserted_donor_stats
  AFTER INSERT ON blood_bags
  FOR EACH ROW EXECUTE FUNCTION update_donor_stats_on_bag();

-- =============================================================================
-- INDEXES
-- =============================================================================

-- facilities
CREATE INDEX idx_facilities_type           ON facilities (type);
CREATE INDEX idx_facilities_region         ON facilities (region_id);
CREATE INDEX idx_facilities_location       ON facilities USING GIST (location);   -- PostGIS

-- users
CREATE INDEX idx_users_facility            ON users (facility_id);
CREATE INDEX idx_users_role                ON users (role);
CREATE INDEX idx_users_email_active        ON users (email) WHERE is_active = TRUE;

-- donors
CREATE INDEX idx_donors_blood_type         ON donors (blood_type_id);
CREATE INDEX idx_donors_registered_bank    ON donors (registered_bank_id);
CREATE INDEX idx_donors_eligible           ON donors (is_eligible) WHERE is_eligible = TRUE;
CREATE INDEX idx_donors_name_trgm          ON donors USING GIN (
  (first_name || ' ' || last_name) gin_trgm_ops
);

-- blood_bags  (most query-critical table)
CREATE INDEX idx_bags_status               ON blood_bags (status);
CREATE INDEX idx_bags_blood_type           ON blood_bags (blood_type_id);
CREATE INDEX idx_bags_blood_bank           ON blood_bags (blood_bank_id);
CREATE INDEX idx_bags_donor                ON blood_bags (donor_id);
CREATE INDEX idx_bags_expires_at           ON blood_bags (expires_at);
CREATE INDEX idx_bags_available_type_bank  ON blood_bags (blood_type_id, blood_bank_id)
  WHERE status = 'AVAILABLE';                                                      -- Partial: only live inventory
CREATE INDEX idx_bags_expiring_soon        ON blood_bags (expires_at)
  WHERE status = 'AVAILABLE'
    AND expires_at > NOW();                                                        -- Partial: upcoming expiry alerts

-- patients
CREATE INDEX idx_patients_hospital         ON patients (hospital_id);
CREATE INDEX idx_patients_blood_type       ON patients (blood_type_id);

-- prescriptions
CREATE INDEX idx_prescriptions_patient     ON prescriptions (patient_id);
CREATE INDEX idx_prescriptions_hospital    ON prescriptions (hospital_id);
CREATE INDEX idx_prescriptions_unfulfilled ON prescriptions (hospital_id, created_at)
  WHERE is_fulfilled = FALSE;

-- reservations
CREATE INDEX idx_reservations_hospital     ON reservations (hospital_id);
CREATE INDEX idx_reservations_blood_bank   ON reservations (blood_bank_id);
CREATE INDEX idx_reservations_status       ON reservations (status);
CREATE INDEX idx_reservations_expires      ON reservations (expires_at)
  WHERE status IN ('PENDING','CONFIRMED');                                          -- Partial: for expiry cron
CREATE INDEX idx_reservations_urgency      ON reservations (urgency, created_at)
  WHERE status = 'PENDING';

-- reservation_bags
CREATE INDEX idx_reservation_bags_bag      ON reservation_bags (blood_bag_id);

-- stock_movements
CREATE INDEX idx_movements_bag             ON stock_movements (blood_bag_id, created_at DESC);
CREATE INDEX idx_movements_type            ON stock_movements (movement_type);
CREATE INDEX idx_movements_reservation     ON stock_movements (reservation_id);

-- transfers
CREATE INDEX idx_transfers_from_bank       ON transfers (from_bank_id);
CREATE INDEX idx_transfers_to_bank         ON transfers (to_bank_id);
CREATE INDEX idx_transfers_status          ON transfers (status);

-- notifications
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, created_at DESC)
  WHERE is_read = FALSE;

-- audit_logs  (write-heavy; keep indexes minimal)
CREATE INDEX idx_audit_entity              ON audit_logs (entity, entity_id);
CREATE INDEX idx_audit_user                ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_created_at          ON audit_logs (created_at DESC);         -- For monthly partition pruning

-- sync_queue
CREATE INDEX idx_sync_user_pending         ON sync_queue (user_id, created_at)
  WHERE status = 'PENDING';

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on multi-tenant tables
ALTER TABLE blood_bags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue     ENABLE ROW LEVEL SECURITY;

-- Blood banks see only their own bags; hospitals see AVAILABLE bags from any bank
CREATE POLICY policy_bags_blood_bank ON blood_bags
  USING (
    current_setting('app.role', TRUE) = 'ADMIN'
    OR (current_setting('app.role', TRUE) = 'BLOOD_BANK'
        AND blood_bank_id = current_setting('app.facility_id', TRUE)::UUID)
    OR  current_setting('app.role', TRUE) = 'HOSPITAL'
  );

-- Hospitals see only their own reservations
CREATE POLICY policy_reservations_hospital ON reservations
  USING (
    current_setting('app.role', TRUE) = 'ADMIN'
    OR hospital_id  = current_setting('app.facility_id', TRUE)::UUID
    OR blood_bank_id = current_setting('app.facility_id', TRUE)::UUID
  );

-- Patients are hospital-scoped
CREATE POLICY policy_patients_hospital ON patients
  USING (
    current_setting('app.role', TRUE) = 'ADMIN'
    OR hospital_id = current_setting('app.facility_id', TRUE)::UUID
  );

-- Users see only their own notifications
CREATE POLICY policy_notifications_user ON notifications
  USING (user_id = current_setting('app.user_id', TRUE)::UUID
      OR current_setting('app.role', TRUE) = 'ADMIN');

-- =============================================================================
-- SEED: BLOOD TYPE REFERENCE DATA
-- =============================================================================

INSERT INTO blood_types (abo_group, rh_factor, label, compatible_donor) VALUES
  ('A',  '+', 'A+',  ARRAY['A','O']),
  ('A',  '-', 'A-',  ARRAY['A','O']),
  ('B',  '+', 'B+',  ARRAY['B','O']),
  ('B',  '-', 'B-',  ARRAY['B','O']),
  ('AB', '+', 'AB+', ARRAY['A','B','AB','O']),
  ('AB', '-', 'AB-', ARRAY['A','B','AB','O']),
  ('O',  '+', 'O+',  ARRAY['O']),
  ('O',  '-', 'O-',  ARRAY['O']);
