# HEMOSAFE — Blood Reservation Engine
## Complete Design: Algorithm · Locking · Transactions · Edge Cases

---

## 1. RESERVATION ALGORITHM

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 1 — SEARCH                                │
│                                                                     │
│  Hospital → POST /api/v1/reservations/search                        │
│  { bloodTypeId, quantity, lat, lng, radiusKm }                      │
│                                                                     │
│  PostGIS query:                                                      │
│    SELECT banks with available_count >= quantity                     │
│    WHERE ST_DWithin(location, point, radius)                        │
│    ORDER BY distance ASC, available_count DESC                      │
│                                                                     │
│  Returns: [ { bankId, name, distanceKm, availableCount } ]          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 2 — ALLOCATE                              │
│                                                                     │
│  Hospital → POST /api/v1/reservations                               │
│  { bloodBankId, bloodTypeId, quantity, urgency, prescriptionId }    │
│                                                                     │
│  BEGIN TRANSACTION (REPEATABLE READ)                                │
│  │                                                                  │
│  ├─ 1. Acquire advisory lock on (bankId, bloodTypeId)               │
│  │     pg_advisory_xact_lock(hashtext('bankId:typeId'))             │
│  │     → Serialises concurrent requests to the same bank/type       │
│  │                                                                  │
│  ├─ 2. SELECT bags FOR UPDATE SKIP LOCKED                           │
│  │     WHERE bank=X AND type=Y AND status=AVAILABLE                 │
│  │     ORDER BY expires_at ASC  ← FEFO                             │
│  │     LIMIT quantity                                               │
│  │     → Row-level lock; SKIP LOCKED avoids deadlock                │
│  │                                                                  │
│  ├─ 3. COUNT(bags) < quantity?  → CONFLICT (release lock + rollback)│
│  │                                                                  │
│  ├─ 4. UPDATE bags SET status='RESERVED'                            │
│  │                                                                  │
│  ├─ 5. INSERT reservation (code, expiresAt = NOW()+24h)             │
│  │                                                                  │
│  ├─ 6. INSERT reservation_bags (reservation_id, bag_id)            │
│  │                                                                  │
│  ├─ 7. INSERT stock_movements (AVAILABLE → RESERVED)               │
│  │                                                                  │
│  └─ COMMIT  → advisory lock released automatically                  │
│                                                                     │
│  Emit: reservation.created → blood bank notified via WebSocket      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 3 — CONFIRM (Blood Bank)                  │
│                                                                     │
│  Blood Bank → PATCH /api/v1/reservations/:id/status                 │
│  { status: CONFIRMED }                                              │
│                                                                     │
│  Validates: PENDING → CONFIRMED (FSM)                               │
│  Updates: reservation.confirmedAt = NOW()                           │
│  Emits: reservation.confirmed → hospital notified                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 4 — PICKUP (Patient Arrives)              │
│                                                                     │
│  Blood Bank → PATCH /api/v1/reservations/:id/status                 │
│  { status: DISPATCHED }                                             │
│                                                                     │
│  Blood Bank scans each bag barcode → verify it belongs to this      │
│  reservation (POST /api/v1/reservations/:id/confirm-bags)           │
│                                                                     │
│  Hospital → PATCH /api/v1/reservations/:id/status                   │
│  { status: DELIVERED }                                              │
│                                                                     │
│  BEGIN TRANSACTION                                                   │
│  │                                                                  │
│  ├─ UPDATE bags SET status='DISTRIBUTED'                            │
│  ├─ INSERT stock_movements (RESERVED → DISTRIBUTED)                 │
│  └─ COMMIT                                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 5 — EXPIRY (Cron)                         │
│                                                                     │
│  Every 60 seconds:                                                   │
│    SELECT reservations WHERE status IN (PENDING, CONFIRMED)          │
│      AND expires_at < NOW()                                         │
│                                                                     │
│  For each expired reservation (in transaction):                     │
│    UPDATE bags SET status='AVAILABLE'  ← release                    │
│    UPDATE reservation SET status='EXPIRED'                          │
│    INSERT stock_movements (RESERVED → AVAILABLE)                    │
│    Emit: reservation.expired → notify hospital                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. LOCKING STRATEGY

### Layer 1 — PostgreSQL Advisory Lock (serialises concurrent requests)

```sql
-- Transactional advisory lock: auto-released at COMMIT/ROLLBACK
-- Key derived from (blood_bank_id, blood_type_id) hash
SELECT pg_advisory_xact_lock(
  hashtext($1 || ':' || $2)::bigint
);
```

**Why advisory lock first?**

Without it, two concurrent transactions could both read "5 bags available",
both try to lock them, and deadlock (T1 locks bag-A then bag-B; T2 locks bag-B then bag-A).

With the advisory lock:
```
T1: acquire advisory(bank-X, type-A) ✓  →  proceed to SELECT FOR UPDATE
T2: acquire advisory(bank-X, type-A)    →  WAIT (blocked)
T1: allocates bags 1-3, COMMIT, releases advisory lock
T2: now proceeds, sees bags 1-3 as RESERVED, allocates bags 4-5
```

### Layer 2 — SELECT FOR UPDATE SKIP LOCKED (row-level lock)

```sql
SELECT id, code, expires_at, volume_ml
FROM   blood_bags
WHERE  blood_bank_id = $1::uuid
  AND  blood_type_id = $2::uuid
  AND  status        = 'AVAILABLE'
  AND  expires_at    > NOW()
ORDER  BY expires_at ASC         -- FEFO: First Expired, First Out
LIMIT  $3
FOR UPDATE SKIP LOCKED;          -- Skip rows locked by other transactions
```

**SKIP LOCKED vs plain FOR UPDATE:**

| Strategy | Concurrent Behaviour | Risk |
|---|---|---|
| `FOR UPDATE` | Waits for locked rows | Deadlock possible; high latency |
| `FOR UPDATE SKIP LOCKED` | Skips locked rows, picks next available | None — never waits |
| `FOR UPDATE NOWAIT` | Errors immediately if locked | Returns error to client |

HEMOSAFE uses **SKIP LOCKED** for maximum throughput. Combined with the advisory lock,
T2 will never attempt to lock the same rows as T1 — T2 is queued until T1 commits.

### Layer 3 — Optimistic check after lock

After acquiring bags, re-verify the count before inserting the reservation.
This catches the narrow window where bags were modified between statement executions.

### Transaction Isolation Level

```
REPEATABLE READ (not SERIALIZABLE)
```

- Prevents non-repeatable reads within the transaction
- Does NOT require full serializability overhead
- Advisory lock + SELECT FOR UPDATE provides the necessary isolation

---

## 3. DOUBLE-BOOKING PREVENTION

```
Timeline: Hospital-A and Hospital-B both request O+ bags from Bank-1 simultaneously

Bank-1 has exactly 3 O+ bags (bag-1, bag-2, bag-3)
Both hospitals request 3 bags

WITHOUT LOCKING:
  T-A: reads bags [1,2,3] AVAILABLE
  T-B: reads bags [1,2,3] AVAILABLE           ← reads before T-A commits
  T-A: UPDATE bags 1,2,3 → RESERVED
  T-B: UPDATE bags 1,2,3 → RESERVED           ← bags reserved twice!
  T-A: INSERT reservation-A linking bags 1,2,3
  T-B: INSERT reservation-B linking bags 1,2,3 ← UNIQUE CONSTRAINT ERROR
       or silently double-books

WITH ADVISORY LOCK + FOR UPDATE SKIP LOCKED:
  T-A: pg_advisory_xact_lock(key) ✓
  T-B: pg_advisory_xact_lock(key) → BLOCKS
  T-A: SELECT bags [1,2,3] FOR UPDATE → locks rows
  T-A: UPDATE bags [1,2,3] → RESERVED
  T-A: INSERT reservation-A
  T-A: COMMIT → advisory lock released
  T-B: pg_advisory_xact_lock(key) ✓ (now proceeds)
  T-B: SELECT bags FOR UPDATE SKIP LOCKED → bags 1,2,3 now RESERVED
       → returns 0 rows
  T-B: count(0) < quantity(3) → ConflictException: "Not enough available bags"
  T-B: ROLLBACK
```

---

## 4. EDGE CASES & MITIGATIONS

| # | Edge Case | Detection | Mitigation |
|---|---|---|---|
| 1 | **Double-booking** | Same bag reserved twice | Advisory lock + FOR UPDATE |
| 2 | **Partial stock** | `count < quantity` after lock | ConflictException, client retries with nearest alternative bank |
| 3 | **Bag expires during RESERVED** | Bag expires_at < NOW() | Cron does NOT expire RESERVED bags — they stay reserved; expiry only affects AVAILABLE bags |
| 4 | **Transaction timeout** | Long-running Tx | Prisma `maxWait:5000, timeout:10000`; bags stay AVAILABLE on rollback |
| 5 | **Network failure mid-commit** | Connection dropped | PG auto-rollbacks; bags stay AVAILABLE |
| 6 | **Hospital cancels after dispatch** | Wrong status in FSM | `DISPATCHED → CANCELLED` not in FSM; `BadRequestException` |
| 7 | **Concurrent cancel + expire** | Cron + hospital both try to release bags | Reservation status check inside transaction; second op hits status ≠ PENDING/CONFIRMED |
| 8 | **Advisory lock contention** | High traffic to same bank/type | `pg_try_advisory_xact_lock` with retry (max 3); queue EMERGENCY requests ahead of ROUTINE |
| 9 | **Phantom bags** | New bag inserted after lock acquired | REPEATABLE READ prevents phantom reads within the Tx |
| 10 | **Clock skew** | `expires_at` computed at DB vs app | `DEFAULT (NOW() + INTERVAL '24 hours')` in DB schema; never computed in app |
| 11 | **Emergency override** | Emergency request when stock low | `EMERGENCY` urgency bypasses quantity check: reserves even 1 bag when requested qty unavailable |
| 12 | **Idempotent retry** | Hospital submits same request twice | Unique `code` constraint on reservations; client uses idempotency key header |

---

## 5. PSEUDO-CODE

```
function allocateBloodBags(bloodBankId, bloodTypeId, quantity, urgency):

  advisoryKey = hashtext(bloodBankId + ':' + bloodTypeId)

  BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ

    // Step 1: Serialise concurrent requests for this bank+type
    SELECT pg_advisory_xact_lock(advisoryKey)

    // Step 2: Lock rows with FEFO ordering
    bags = SELECT * FROM blood_bags
           WHERE blood_bank_id = bloodBankId
             AND blood_type_id = bloodTypeId
             AND status = 'AVAILABLE'
             AND expires_at > NOW()
           ORDER BY expires_at ASC
           LIMIT quantity
           FOR UPDATE SKIP LOCKED

    // Step 3: Validate stock
    IF urgency == EMERGENCY AND len(bags) == 0:
      THROW ConflictException("No bags available at all")
    ELSE IF urgency != EMERGENCY AND len(bags) < quantity:
      THROW ConflictException("Insufficient stock: have {len(bags)}, need {quantity}")
    END IF

    // Step 4: Reserve bags
    allocatedQty = min(len(bags), quantity)  // EMERGENCY may get partial
    bagIds = bags[0..allocatedQty].map(b => b.id)

    UPDATE blood_bags
    SET status = 'RESERVED'
    WHERE id IN bagIds

    // Step 5: Create reservation (expires in 24h, set by DB default)
    reservationId = INSERT INTO reservations (
      code, hospital_id, blood_bank_id, blood_type_id,
      quantity, urgency, status='PENDING'
    )

    // Step 6: Link bags
    INSERT INTO reservation_bags (reservation_id, blood_bag_id)
    FOR EACH bagId IN bagIds

    // Step 7: Audit trail
    INSERT INTO stock_movements (bag_id, AVAILABLE → RESERVED, reservation_id)
    FOR EACH bagId IN bagIds

  COMMIT
  // advisory lock auto-released

  EMIT reservation.created(reservationId, bloodBankId)
  RETURN reservation


function confirmPickup(reservationId, actorBankId):

  reservation = SELECT * FROM reservations WHERE id = reservationId FOR UPDATE

  ASSERT reservation.blood_bank_id == actorBankId
  ASSERT reservation.status IN (PENDING, CONFIRMED)
  ASSERT reservation.expires_at > NOW()  // not expired

  bagIds = SELECT blood_bag_id FROM reservation_bags WHERE reservation_id = reservationId

  BEGIN TRANSACTION

    UPDATE blood_bags SET status='DISTRIBUTED' WHERE id IN bagIds

    UPDATE reservations SET status='DELIVERED', delivered_at=NOW()
    WHERE id = reservationId

    INSERT INTO stock_movements (bag_id, RESERVED → DISTRIBUTED)
    FOR EACH bagId

  COMMIT

  EMIT reservation.delivered(reservationId)


function expireStaleReservations():  // runs every 60 seconds

  stale = SELECT * FROM reservations
          WHERE status IN (PENDING, CONFIRMED)
            AND expires_at < NOW()

  FOR EACH reservation IN stale:

    BEGIN TRANSACTION

      bagIds = SELECT blood_bag_id FROM reservation_bags
               WHERE reservation_id = reservation.id

      UPDATE blood_bags SET status='AVAILABLE' WHERE id IN bagIds
      UPDATE reservations SET status='EXPIRED' WHERE id = reservation.id

      INSERT INTO stock_movements (bag_id, RESERVED → AVAILABLE, 'RELEASED')
      FOR EACH bagId

    COMMIT

    EMIT reservation.expired(reservation.id, reservation.hospital_id)
```

---

## 6. DATABASE INDEX STRATEGY FOR THE ENGINE

```sql
-- Hot path: find available bags for a bank+type (used in every allocation)
CREATE INDEX idx_bags_allocatable
ON blood_bags (blood_bank_id, blood_type_id, expires_at)
WHERE status = 'AVAILABLE';        -- Partial: only active inventory

-- Expiry cron: find stale reservations
CREATE INDEX idx_reservations_expiry_cron
ON reservations (expires_at)
WHERE status IN ('PENDING', 'CONFIRMED');   -- Partial

-- Advisory lock key lookup
-- No index needed — hashtext() is O(1) string hash
```

---

## 7. CONCURRENCY STRESS TEST SCENARIO

```
Setup: Bank-1 has 5 O+ bags (bag-1 .. bag-5)
       10 hospitals simultaneously request 1 O+ bag each from Bank-1

Expected outcome:
  5 hospitals get reservations (bags 1-5 reserved)
  5 hospitals get ConflictException (0 bags available after first 5)

With advisory lock:
  Requests queued: R1,R2,R3,R4,R5 succeed sequentially
  Requests R6-R10: each sees 0 AVAILABLE bags → Conflict

Throughput: ~5 successful reservations/second for same bank+type
(Advisory lock overhead: ~1ms per transaction)
```
