# HEMOSAFE — Database Design Document

---

## 1. ERD DIAGRAM

```
┌──────────────┐         ┌─────────────────────────────────────────────────────┐
│   regions    │         │                     LEGEND                          │
│──────────────│         │  PK  Primary Key                                    │
│ PK id        │         │  FK  Foreign Key                                    │
│    code      │         │  UQ  Unique Constraint                              │
│    name      │         │  ──► one-to-many                                    │
│ FK parent_id │◄────┐   │  ══► many-to-many (via junction table)              │
└──────┬───────┘     │   └─────────────────────────────────────────────────────┘
       │ 1           │
       │ has many    └──── self-referential (hierarchical regions)
       ▼ *
┌─────────────────────┐         ┌───────────────────┐
│      facilities     │         │    blood_types     │
│─────────────────────│         │───────────────────│
│ PK id               │         │ PK id             │
│    type (HOSP/BANK) │         │    abo_group       │
│    name             │         │    rh_factor       │
│ UQ code             │         │    label           │
│    address          │         │    compatible_donor│
│ FK region_id ───────┼──────►  └─────────┬──────────┘
│    location (PostGIS│              │     │
│    phone, email     │              │     │ referenced by
│    is_active        │              │     │ blood_bags, donors,
└──────┬──────────────┘              │     │ patients, prescriptions,
       │ 1                           │     │ reservations
       │                             │     │
       ├──────────────────────────────     │
       │ has many users                    │
       ▼ *                                 │
┌───────────────────┐                      │
│      users        │                      │
│───────────────────│                      │
│ PK id             │                      │
│    email (UQ)     │                      │
│    password_hash  │                      │
│    role           │                      │
│    first_name     │                      │
│    last_name      │                      │
│ FK facility_id    │                      │
│    is_active      │                      │
│    mfa_secret     │                      │
└──────┬────────────┘                      │
       │ 1 (requested_by / physician_id)   │
       │                                   │
       │    ┌──────────────────────────────┼──────────────────────┐
       │    │                              │                      │
       │    ▼ *                            │                      │
       │  ┌────────────────────┐           │                      │
       │  │      donors        │           │                      │
       │  │────────────────────│           │                      │
       │  │ PK id              │           │                      │
       │  │ UQ national_id     │           │                      │
       │  │    first_name      │           │                      │
       │  │    last_name, dob  │           │                      │
       │  │ FK blood_type_id ──┼───────────┘                      │
       │  │    is_eligible     │                                   │
       │  │    donation_count  │                                   │
       │  │    last_donation_at│                                   │
       │  │ FK registered_bank │                                   │
       │  └──────┬─────────────┘                                   │
       │         │ 1                                               │
       │         │ has many                                        │
       │         ▼ *                                               │
       │  ┌───────────────────────┐                                │
       │  │   health_screenings   │                                │
       │  │───────────────────────│                                │
       │  │ PK id                 │                                │
       │  │ FK donor_id           │                                │
       │  │ FK screened_by (user) │                                │
       │  │    hemoglobin         │                                │
       │  │    blood_pressure     │                                │
       │  │    weight_kg          │                                │
       │  │    is_passed          │                                │
       │  └──────┬────────────────┘                                │
       │         │ 1                                               │
       │         │                                                 │
       │         ▼ *                                               │
       │  ┌────────────────────────────────────────────┐          │
       │  │                blood_bags                   │          │
       │  │────────────────────────────────────────────│          │
       │  │ PK id                                       │          │
       │  │ UQ code (barcode)                           │          │
       │  │ FK blood_type_id ───────────────────────────┼──────────┘
       │  │ FK donor_id                                 │
       │  │ FK screening_id                             │
       │  │ FK blood_bank_id ──► facilities             │
       │  │    volume_ml                                │
       │  │    collected_at                             │
       │  │    expires_at                               │
       │  │    status [AVAILABLE|RESERVED|              │
       │  │            DISTRIBUTED|EXPIRED|DISCARDED]   │
       │  └──────┬──────────────────────────────────────┘
       │         │ 1
       │         │ triggers → stock_movements
       │         ├──────────────────────────────────────────────────────────┐
       │         │ *                                                        │
       │         ▼                                                          │
       │  ┌───────────────────┐    ══════════════    ┌─────────────────┐   │
       │  │  reservation_bags │◄══ M2M Junction ══►  │  transfer_bags  │   │
       │  │───────────────────│                      │─────────────────│   │
       │  │ PK reservation_id │                      │ PK transfer_id  │   │
       │  │ PK blood_bag_id   │                      │ PK blood_bag_id │   │
       │  │    allocated_at   │                      └────────┬────────┘   │
       │  └────────┬──────────┘                               │ *          │
       │           │ *                                         │            │
       │           │                                          ▼ 1          │
       │           ▼ 1                               ┌──────────────────┐  │
       │  ┌────────────────────────────────┐         │    transfers      │  │
       │  │         reservations           │         │──────────────────│  │
       │  │────────────────────────────────│         │ PK id            │  │
       │  │ PK id                          │         │ UQ code          │  │
       │  │ UQ code                        │         │ FK from_bank_id  │  │
       │  │ FK hospital_id ──► facilities  │         │ FK to_bank_id    │  │
       │  │ FK blood_bank_id ──► facilities│         │ FK initiated_by  │  │
       │  │ FK prescription_id             │         │ FK received_by   │  │
       │  │ FK requested_by (user) ────────┼─────►   │    status        │  │
       │  │ FK blood_type_id               │         └──────────────────┘  │
       │  │    quantity                    │                               │
       │  │    urgency                     │  ┌───────────────────────┐    │
       │  │    status                      │  │    stock_movements    │◄───┘
       │  │    expires_at (NOW+24h)        │  │───────────────────────│
       │  │    confirmed/dispatched/       │  │ PK id (BIGSERIAL)     │
       │  │    delivered_at                │  │ FK blood_bag_id       │
       │  └──────┬─────────────────────────┘  │    movement_type      │
       │         │ 1                          │    from_status        │
       │         │                            │    to_status          │
       │         ▼ *                          │ FK performed_by       │
       │  ┌───────────────────┐              │ FK reservation_id     │
       │  │   prescriptions   │              │ FK transfer_id        │
       │  │───────────────────│              │    created_at         │
       │  │ PK id             │              └───────────────────────┘
       │  │ FK patient_id     │
       │  │ FK physician_id ──┼──► users
       │  │ FK hospital_id    │
       │  │ FK blood_type_id  │
       │  │    quantity       │   ┌───────────────────┐
       │  │    urgency        │   │      patients      │
       │  │    is_fulfilled   │   │───────────────────│
       │  └───────────────────┘   │ PK id             │
       │                          │ FK hospital_id    │
       │    ┌─────────────────┐   │ UQ national_id    │
       │    │  notifications  │   │    first_name     │
       │    │─────────────────│   │    last_name      │
       │    │ PK id           │   │ FK blood_type_id  │
       │    │ FK user_id ─────┼─► │    medical_record │
       │    │    type         │   └───────────────────┘
       │    │    title, body  │
       │    │    is_read      │   ┌───────────────────┐
       │    │    metadata     │   │    audit_logs     │
       │    └─────────────────┘   │───────────────────│
       │                          │ PK id (BIGSERIAL) │
       │    ┌─────────────────┐   │ FK user_id        │
       │    │   sync_queue    │   │    action         │
       │    │─────────────────│   │    entity         │
       │    │ PK id (BIGSERIAL│   │    entity_id      │
       │    │ FK user_id ─────┼─► │    old/new_value  │
       │    │    operation_id │   │    ip_address     │
       │    │    method       │   │    created_at     │
       │    │    endpoint     │   └───────────────────┘
       │    │    payload      │
       │    │    status       │
       │    └─────────────────┘
       └── (users referenced throughout as FK for all actor fields)
```

---

## 2. RELATIONSHIPS EXPLAINED

### Core Chain: Donor → Bag → Reservation → Patient

```
DONOR donates → BLOOD BAG collected at BLOOD BANK
                      │
                      ├── reserved via RESERVATION ← requested by HOSPITAL
                      │         │
                      │         └── RESERVATION_BAGS (M2M junction)
                      │
                      └── DISTRIBUTED to PATIENT (via TRANSFUSION prescription)
```

### Relationship Matrix

| Table A | Table B | Cardinality | Via |
|---|---|---|---|
| regions | regions | 1:N (self) | parent_id |
| regions | facilities | 1:N | region_id |
| facilities | users | 1:N | facility_id |
| facilities | blood_bags | 1:N | blood_bank_id |
| facilities | reservations | 1:N | hospital_id / blood_bank_id |
| facilities | donors | 1:N | registered_bank_id |
| facilities | patients | 1:N | hospital_id |
| blood_types | blood_bags | 1:N | blood_type_id |
| blood_types | donors | 1:N | blood_type_id |
| blood_types | patients | 1:N | blood_type_id |
| blood_types | prescriptions | 1:N | blood_type_id |
| donors | health_screenings | 1:N | donor_id |
| donors | blood_bags | 1:N | donor_id |
| blood_bags | reservations | N:M | reservation_bags |
| blood_bags | transfers | N:M | transfer_bags |
| blood_bags | stock_movements | 1:N | blood_bag_id (auto-trigger) |
| patients | prescriptions | 1:N | patient_id |
| prescriptions | reservations | 1:N | prescription_id (optional) |
| users | reservations | 1:N | requested_by |
| users | prescriptions | 1:N | physician_id |
| users | notifications | 1:N | user_id |
| users | audit_logs | 1:N | user_id |
| users | sync_queue | 1:N | user_id |

---

## 3. CRITICAL DESIGN DECISIONS

### 3.1 Unified `facilities` Table (Hospital + Blood Bank)

Both entity types share: region, location, contact info, and facility code.
Type-specific logic lives in the application layer (guards via `role`).

**Alternative considered:** Separate `hospitals` and `blood_banks` tables.
**Rejected because:** Geospatial index, region join, and user FK would be duplicated.
Any query asking "find nearby facilities of type X" stays in one table.

### 3.2 Reservation 24-Hour Expiry

Expiry is enforced at **three levels** for defense in depth:

```
Level 1 — Schema:   expires_at DEFAULT (NOW() + INTERVAL '24 hours')
Level 2 — Function: expire_stale_reservations() releases bags atomically
Level 3 — App:      Scheduler calls the function every 60 seconds
```

The function is idempotent — safe to call multiple times.
Bags are released **before** reservations are marked EXPIRED to avoid race conditions.

### 3.3 Double-Booking Prevention

```sql
-- In guard_bag_double_booking() trigger:
SELECT status FROM blood_bags WHERE id = NEW.blood_bag_id FOR UPDATE;
```

`FOR UPDATE` acquires a row-level lock inside the transaction.
Concurrent inserts into `reservation_bags` for the same bag will serialize,
with the second one receiving a `P0001` exception.
No optimistic locking needed at the application layer.

### 3.4 stock_movements as Immutable Ledger

The ledger is populated **only by trigger** (never by application code directly).
This guarantees every status transition is recorded without relying on developers
remembering to log it. The trigger fires on `AFTER UPDATE OF status`.

### 3.5 Audit Logs with BIGSERIAL

`audit_logs` uses `BIGSERIAL` (not UUID) because:
- Insert-only table: no need for globally unique IDs
- Sequential inserts avoid UUID index fragmentation
- Faster sequential scans for time-range reports
- `BIGSERIAL` ceiling: 9.2 × 10¹⁸ rows — effectively unlimited

### 3.6 Partial Indexes (Critical for Performance)

```sql
-- Only index AVAILABLE bags — the hot query path
CREATE INDEX idx_bags_available_type_bank ON blood_bags (blood_type_id, blood_bank_id)
  WHERE status = 'AVAILABLE';

-- Only index PENDING reservations for the expiry cron
CREATE INDEX idx_reservations_expires ON reservations (expires_at)
  WHERE status IN ('PENDING','CONFIRMED');
```

These partial indexes are 5–50× smaller than full indexes and fit in memory.

### 3.7 Row-Level Security (RLS)

Application role and facility are injected via session variables:

```sql
-- Set at connection open (NestJS TypeORM afterConnect hook)
SET LOCAL app.role        = 'HOSPITAL';
SET LOCAL app.facility_id = '<uuid>';
SET LOCAL app.user_id     = '<uuid>';
```

RLS policies then transparently filter all queries.
The ADMIN role bypasses all filters (`current_setting('app.role') = 'ADMIN'`).

---

## 4. TRANSACTION SAFETY PATTERNS

### 4.1 Reservation Creation (ACID transaction)

```sql
BEGIN;

  -- 1. Create reservation
  INSERT INTO reservations (...) VALUES (...) RETURNING id;

  -- 2. Insert into reservation_bags
  --    → trigger fires: FOR UPDATE lock on bag → status → RESERVED
  INSERT INTO reservation_bags (reservation_id, blood_bag_id)
  VALUES ($reservation_id, $bag_id_1),
         ($reservation_id, $bag_id_2);

  -- 3. If prescription-driven, mark it pending
  UPDATE prescriptions SET is_fulfilled = FALSE WHERE id = $prescription_id;

COMMIT;
-- On ROLLBACK: bags remain AVAILABLE, reservation never committed
```

### 4.2 Bag Distribution (status → DISTRIBUTED)

```sql
BEGIN;

  UPDATE blood_bags SET status = 'DISTRIBUTED' WHERE id = $bag_id;
  -- trigger auto-inserts stock_movement

  UPDATE reservations
  SET    status = 'DELIVERED', delivered_at = NOW()
  WHERE  id = $reservation_id;

  UPDATE prescriptions
  SET    is_fulfilled = TRUE, fulfilled_at = NOW()
  WHERE  id = $prescription_id;

COMMIT;
```

### 4.3 Isolation Level Recommendation

| Operation | Isolation Level | Reason |
|---|---|---|
| Read stock levels | `READ COMMITTED` (default) | Acceptable for display |
| Create reservation | `READ COMMITTED` + `FOR UPDATE` | Row lock on bags |
| Expire reservations | `READ COMMITTED` | Cron job, idempotent |
| Generate analytics | `REPEATABLE READ` | Consistent snapshot |
| Audit reports | `SERIALIZABLE` | Regulatory compliance |

---

## 5. OPTIMIZATION STRATEGIES

### 5.1 Table Partitioning

```sql
-- Partition audit_logs by month (high-volume, time-series)
CREATE TABLE audit_logs (
  ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Automate with pg_partman extension
SELECT partman.create_parent('public.audit_logs', 'created_at', 'native', 'monthly');
```

```sql
-- Partition blood_bags by status for analytics vs. operational queries
-- Alternative: partial indexes (simpler, less overhead for this scale)
```

### 5.2 Materialized Views for Analytics

```sql
-- National stock summary — refreshed every 5 minutes by cron
CREATE MATERIALIZED VIEW mv_national_stock AS
SELECT
  f.region_id,
  r.name          AS region_name,
  bt.label        AS blood_type,
  COUNT(bb.id)    AS available_count,
  SUM(bb.volume_ml) / 1000.0 AS available_liters,
  MIN(bb.expires_at) AS next_expiry
FROM   blood_bags bb
JOIN   facilities  f  ON f.id  = bb.blood_bank_id
JOIN   regions     r  ON r.id  = f.region_id
JOIN   blood_types bt ON bt.id = bb.blood_type_id
WHERE  bb.status = 'AVAILABLE'
GROUP  BY f.region_id, r.name, bt.label;

CREATE UNIQUE INDEX ON mv_national_stock (region_id, blood_type);

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_national_stock;
```

### 5.3 Connection Pooling (PgBouncer)

```
App Servers (N pods)
      │
      ▼
  PgBouncer                   PostgreSQL Primary
  pool_mode = transaction  ──► max_connections = 200
  max_client_conn = 2000       (handles N×pods through pooler)
      │
      ├──► Read Replica 1  (analytics, reports)
      └──► Read Replica 2  (search, dashboards)
```

**Rule:** All `SELECT` in analytics/geo modules → replica. All writes → primary.

### 5.4 GeoSpatial Query Optimization

```sql
-- Efficient: bounding-box pre-filter (uses GIST index) + exact distance
SELECT f.id, f.name,
       ST_Distance(f.location, ST_MakePoint($lng, $lat)::geography) / 1000 AS km
FROM   facilities f
WHERE  f.type = 'BLOOD_BANK'
  AND  f.is_active = TRUE
  AND  ST_DWithin(                             -- uses GIST index
         f.location,
         ST_MakePoint($lng, $lat)::geography,
         $radius_meters
       )
ORDER  BY f.location <-> ST_MakePoint($lng, $lat)::geography  -- KNN operator
LIMIT  20;
```

### 5.5 VACUUM & Bloat Management

```sql
-- blood_bags and reservations have high UPDATE rate → aggressive autovacuum
ALTER TABLE blood_bags ALTER COLUMN status SET STORAGE PLAIN;

ALTER TABLE blood_bags   SET (autovacuum_vacuum_scale_factor = 0.01);
ALTER TABLE reservations SET (autovacuum_vacuum_scale_factor = 0.01);
```

### 5.6 Query Plan for the Hot Path

The most frequent query in the system — "find available bags of type X at bank Y":

```sql
-- Execution plan target: Index Scan on idx_bags_available_type_bank
-- Expected cost: O(log n) on partial index (only AVAILABLE bags)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, code, volume_ml, expires_at
FROM   blood_bags
WHERE  blood_type_id = $1
  AND  blood_bank_id = $2
  AND  status        = 'AVAILABLE'
  AND  expires_at    > NOW()
ORDER  BY expires_at ASC    -- FEFO: First Expired, First Out
LIMIT  $quantity;
```

**FEFO ordering** (First Expired, First Out) minimizes blood waste by distributing
bags closest to expiry first.

### 5.7 Index Summary

| Index | Type | Selectivity | Purpose |
|---|---|---|---|
| `idx_bags_available_type_bank` | BTree partial | Very high | Core inventory lookup |
| `idx_bags_expiring_soon` | BTree partial | Medium | Expiry alert cron |
| `idx_reservations_expires` | BTree partial | High | 24h expiry cron |
| `idx_facilities_location` | GIST | High | PostGIS proximity |
| `idx_donors_name_trgm` | GIN trigram | Medium | Name search |
| `idx_notifications_user_unread` | BTree partial | High | Notification bell |
| `idx_audit_entity` | BTree | Low | Compliance queries |

---

## 6. NORMALIZATION ANALYSIS

| Form | Status | Evidence |
|---|---|---|
| 1NF | ✅ | All columns atomic; `compatible_donor[]` is an array on a reference table (intentional denormalization for performance) |
| 2NF | ✅ | No partial dependencies; composite PKs only in junction tables where all columns are part of the key |
| 3NF | ✅ | No transitive dependencies; `region_name` not stored on facilities — joined from `regions` |
| BCNF | ✅ | Every determinant is a superkey |

**Intentional denormalization:**
- `donors.donation_count` — computed field maintained by trigger (avoids COUNT on every read)
- `blood_types.compatible_donor[]` — array avoids a separate compatibility join table for an 8-row reference set
- `mv_national_stock` — materialized view trades freshness for dashboard performance
