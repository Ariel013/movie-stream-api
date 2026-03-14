# HEMOSAFE — National Blood Bank Management System
## Complete System Architecture

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MINISTRY OF HEALTH (ADMIN)                             │
│                          National Dashboard · Policy · Reports                      │
└─────────────────────────────────────┬───────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
     ┌────────▼──────────┐  ┌─────────▼──────────┐  ┌────────▼──────────┐
     │     HOSPITALS      │  │    BLOOD BANKS      │  │   ADMIN PORTAL    │
     │  (Web + PWA/Mobile)│  │  (Web + PWA/Mobile) │  │  (Web Dashboard)  │
     └────────┬───────────┘  └─────────┬───────────┘  └────────┬──────────┘
              │                        │                        │
              └────────────────────────▼────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │   CDN / WAF     │
                              │  (CloudFront /  │
                              │   Cloudflare)   │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  API GATEWAY /  │
                              │  LOAD BALANCER  │
                              │  (Nginx / Kong) │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼───────────────────────┐
              │                        │                       │
     ┌────────▼──────────┐   ┌─────────▼──────────┐  ┌────────▼──────────┐
     │   AUTH SERVICE    │   │    CORE API         │  │  NOTIFICATION     │
     │   (NestJS)        │   │  (NestJS Modular    │  │  SERVICE          │
     │   JWT + RBAC      │   │   Monolith)         │  │  (NestJS)         │
     └────────┬──────────┘   └─────────┬───────────┘  └────────┬──────────┘
              │                        │                        │
              └────────────────────────▼────────────────────────┘
                                       │
          ┌────────────────────────────▼──────────────────────────────┐
          │                     DATA LAYER                            │
          │                                                           │
          │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
          │  │  PostgreSQL  │  │    Redis     │  │  File Storage  │  │
          │  │  (Primary +  │  │  (Cache +    │  │  (S3 / MinIO)  │  │
          │  │   Replicas)  │  │   Sessions + │  │  Documents,    │  │
          │  │              │  │   Pub/Sub)   │  │  Blood bag PDFs│  │
          │  └──────────────┘  └──────────────┘  └────────────────┘  │
          └───────────────────────────────────────────────────────────┘
                                       │
          ┌────────────────────────────▼──────────────────────────────┐
          │                  SUPPORTING SERVICES                      │
          │                                                           │
          │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
          │  │  Map Service │  │  SMS Gateway │  │  Audit Logger  │  │
          │  │ (Leaflet/OSM)│  │(Twilio/Local)│  │ (Immutable Log)│  │
          │  └──────────────┘  └──────────────┘  └────────────────┘  │
          └───────────────────────────────────────────────────────────┘
```

---

## 2. CLIENT ARCHITECTURE (PWA)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS PWA CLIENT                           │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ Auth Module │  │Blood Stock  │  │ Reservation │  │  Dashboard │  │
│  │ Login/RBAC  │  │  Module     │  │  Module     │  │  Module    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Donor     │  │  Patient /  │  │  GeoSearch  │  │ Notif.     │  │
│  │  Module     │  │Prescription │  │  Module     │  │  Module    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                   OFFLINE LAYER                              │    │
│  │  Service Worker ──► IndexedDB ──► Sync Queue ──► API Sync   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │   STATE (Zustand) │ SERVER STATE (React Query/TanStack)      │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. BACKEND MODULE BREAKDOWN

```
CORE API (NestJS Modular Monolith)
│
├── [IAM Module]         Identity & Access Management
│   ├── Authentication   JWT RS256 + Refresh tokens
│   ├── Authorization    RBAC (ADMIN, HOSPITAL, BLOOD_BANK)
│   └── Session          Redis session store
│
├── [Blood Stock Module] Inventory lifecycle
│   ├── Bag Registry     CRUD for blood bags
│   ├── Blood Types      ABO/Rh grouping rules
│   ├── Expiry Tracking  Automated alerts for near-expiry
│   └── Stock Levels     Threshold alerts per bank
│
├── [Reservation Module] Booking workflow
│   ├── Request Queue    Hospital requests
│   ├── Allocation       Auto-matching algorithm
│   ├── Status FSM       PENDING → CONFIRMED → DISPATCHED → DELIVERED
│   └── Conflict Guard   Optimistic locking on bag reservation
│
├── [Donor Module]       Full traceability
│   ├── Profile          Demographics, blood type, health data
│   ├── Donation History Linked to specific bags
│   ├── Eligibility      Rules engine (interval, weight, health)
│   └── Traceability     Donor → Bag → Reservation → Patient chain
│
├── [Patient Module]     Hospital-side patient management
│   ├── Prescriptions    Blood transfusion prescriptions
│   ├── Transfusion Log  History per patient
│   └── Compatibility    Cross-matching rules
│
├── [Geo Module]         Location services
│   ├── Blood Bank Geo   Registered coordinates
│   ├── Proximity Search PostGIS radius queries
│   └── Map Data         GeoJSON endpoints for Leaflet
│
├── [Notification Module] Real-time + async alerts
│   ├── WebSocket        Live updates (Socket.IO)
│   ├── In-App           Stored notifications
│   ├── SMS              Critical alerts (low stock, urgent requests)
│   └── Email            Reports, confirmations
│
├── [Analytics Module]  Statistics & reporting
│   ├── National Stats   Ministry-level aggregations
│   ├── Regional Stats   Per-region breakdowns
│   ├── Stock Reports    Usage, waste, shortage trends
│   └── Export           PDF/Excel report generation
│
└── [Sync Module]        Offline reconciliation
    ├── Change Feed      Server-sent events for delta sync
    ├── Conflict Resolver Last-write-wins with manual override
    └── Sync Queue       Ordered operation replay
```

---

## 4. FOLDER STRUCTURE

### Frontend (Next.js)

```
hemosafe-web/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker (built by next-pwa)
│   └── icons/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # Role-aware shell
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx    # Ministry dashboard
│   │   │   │   ├── banks/
│   │   │   │   ├── hospitals/
│   │   │   │   └── analytics/
│   │   │   ├── hospital/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── reservations/
│   │   │   │   ├── patients/
│   │   │   │   └── search/     # Geo blood search
│   │   │   └── blood-bank/
│   │   │       ├── page.tsx
│   │   │       ├── stock/
│   │   │       ├── donors/
│   │   │       └── reservations/
│   │   └── api/                # Next.js API routes (BFF)
│   │       └── auth/[...nextauth]/
│   │
│   ├── modules/                # Feature modules (mirrors backend)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── blood-stock/
│   │   │   ├── components/
│   │   │   │   ├── StockTable.tsx
│   │   │   │   ├── BloodBagCard.tsx
│   │   │   │   ├── ExpiryAlert.tsx
│   │   │   │   └── StockLevelChart.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useBloodStock.ts
│   │   │   │   └── useStockAlerts.ts
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── reservation/
│   │   ├── donor/
│   │   ├── patient/
│   │   ├── geosearch/
│   │   │   ├── components/
│   │   │   │   ├── BloodMap.tsx     # Leaflet map wrapper
│   │   │   │   ├── BankMarker.tsx
│   │   │   │   └── RadiusFilter.tsx
│   │   │   └── hooks/
│   │   ├── notifications/
│   │   └── analytics/
│   │       ├── components/
│   │       │   ├── NationalMap.tsx
│   │       │   ├── StockPieChart.tsx
│   │       │   └── DonationTimeline.tsx
│   │       └── hooks/
│   │
│   ├── shared/                 # Shared across modules
│   │   ├── components/
│   │   │   ├── ui/             # Design system primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Badge.tsx   # Blood type badges
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── DataTable.tsx
│   │   │   ├── layout/
│   │   │   └── forms/
│   │   ├── hooks/
│   │   │   ├── useOffline.ts   # Network status
│   │   │   └── useSync.ts      # Offline sync trigger
│   │   ├── lib/
│   │   │   ├── api-client.ts   # Axios instance + interceptors
│   │   │   ├── socket.ts       # Socket.IO client
│   │   │   └── query-client.ts # React Query config
│   │   ├── offline/
│   │   │   ├── db.ts           # Dexie.js (IndexedDB wrapper)
│   │   │   ├── schemas/        # IndexedDB table definitions
│   │   │   ├── sync-queue.ts   # Outbound operation queue
│   │   │   └── reconciler.ts   # Conflict resolution
│   │   ├── store/
│   │   │   └── app.store.ts    # Zustand global state
│   │   └── types/              # Shared TypeScript types
│   │       ├── blood.types.ts
│   │       ├── user.types.ts
│   │       └── api.types.ts
│   │
│   └── config/
│       ├── routes.ts
│       └── permissions.ts      # RBAC route guards
│
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Backend (NestJS)

```
hemosafe-api/
├── src/
│   ├── main.ts                 # Bootstrap, Swagger, Helmet
│   ├── app.module.ts           # Root module
│   │
│   ├── config/                 # Config & env validation
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── jwt.config.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── iam/                # Identity & Access Management
│   │   │   ├── iam.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── refresh.strategy.ts
│   │   │   │   └── guards/
│   │   │   │       ├── jwt-auth.guard.ts
│   │   │   │       └── roles.guard.ts
│   │   │   ├── users/
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.repository.ts
│   │   │   │   └── entities/
│   │   │   │       └── user.entity.ts
│   │   │   └── decorators/
│   │   │       ├── roles.decorator.ts
│   │   │       └── current-user.decorator.ts
│   │   │
│   │   ├── blood-stock/        # Blood inventory management
│   │   │   ├── blood-stock.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── blood-bag.controller.ts
│   │   │   │   └── stock-alert.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── blood-bag.service.ts
│   │   │   │   ├── stock-level.service.ts
│   │   │   │   └── expiry-tracker.service.ts   # Cron job
│   │   │   ├── repositories/
│   │   │   ├── entities/
│   │   │   │   ├── blood-bag.entity.ts
│   │   │   │   └── blood-type.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── reservation/        # Booking workflow
│   │   │   ├── reservation.module.ts
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── reservation.service.ts
│   │   │   │   ├── allocation.service.ts       # Matching algorithm
│   │   │   │   └── reservation-fsm.service.ts  # State machine
│   │   │   ├── repositories/
│   │   │   ├── entities/
│   │   │   │   └── reservation.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── donor/              # Donor management + traceability
│   │   │   ├── donor.module.ts
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── donor.service.ts
│   │   │   │   ├── eligibility.service.ts      # Rules engine
│   │   │   │   └── traceability.service.ts     # Donor → Patient chain
│   │   │   ├── entities/
│   │   │   │   ├── donor.entity.ts
│   │   │   │   └── donation.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── patient/            # Hospital patient + prescriptions
│   │   │   ├── patient.module.ts
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── patient.service.ts
│   │   │   │   ├── prescription.service.ts
│   │   │   │   └── compatibility.service.ts    # Cross-match rules
│   │   │   ├── entities/
│   │   │   │   ├── patient.entity.ts
│   │   │   │   └── prescription.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── geo/                # Geolocation & proximity
│   │   │   ├── geo.module.ts
│   │   │   ├── geo.controller.ts
│   │   │   ├── geo.service.ts                  # PostGIS queries
│   │   │   └── dto/
│   │   │
│   │   ├── notification/       # Multi-channel notifications
│   │   │   ├── notification.module.ts
│   │   │   ├── gateways/
│   │   │   │   └── events.gateway.ts           # Socket.IO gateway
│   │   │   ├── services/
│   │   │   │   ├── notification.service.ts
│   │   │   │   ├── sms.service.ts
│   │   │   │   └── email.service.ts
│   │   │   └── entities/
│   │   │       └── notification.entity.ts
│   │   │
│   │   ├── analytics/          # Statistics & reporting
│   │   │   ├── analytics.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── national.controller.ts
│   │   │   │   └── regional.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── analytics.service.ts
│   │   │   │   └── report.service.ts           # PDF/Excel export
│   │   │   └── dto/
│   │   │
│   │   └── sync/               # Offline sync reconciliation
│   │       ├── sync.module.ts
│   │       ├── sync.controller.ts
│   │       ├── sync.service.ts
│   │       └── dto/
│   │           └── sync-operation.dto.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── migrations/
│   │   └── seeds/
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── audit.interceptor.ts            # All write ops logged
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   │
│   └── infrastructure/
│       ├── cache/
│       │   └── redis.module.ts
│       ├── queue/
│       │   └── bull.module.ts                  # BullMQ for async jobs
│       └── storage/
│           └── s3.module.ts
│
├── test/
├── .env.example
├── docker-compose.yml
└── tsconfig.json
```

---

## 5. DATABASE SCHEMA (Key Tables)

```sql
-- Core user / tenant tables
users           (id, email, role, facility_id, is_active, created_at)
facilities      (id, name, type[HOSPITAL|BLOOD_BANK], region_id, lat, lng, address)
regions         (id, name, code)                    -- National administrative regions

-- Blood inventory
blood_bags      (id, code, blood_type, rh_factor, volume_ml, collected_at,
                 expires_at, status[AVAILABLE|RESERVED|USED|EXPIRED|DISCARDED],
                 blood_bank_id, donor_id, created_at)
blood_types     (id, abo_group, rh_factor, compatible_with[])

-- Donor traceability
donors          (id, national_id, first_name, last_name, blood_type, dob,
                 phone, last_donation_at, donation_count, is_eligible)
donations       (id, donor_id, blood_bank_id, donated_at, bag_id, health_screening_id)
health_screenings (id, donor_id, hemoglobin, blood_pressure, weight, is_passed, screened_at)

-- Reservation workflow
reservations    (id, code, hospital_id, blood_bank_id, blood_type, rh_factor,
                 quantity, urgency[ROUTINE|URGENT|EMERGENCY],
                 status[PENDING|CONFIRMED|DISPATCHED|DELIVERED|CANCELLED],
                 requested_at, confirmed_at, delivered_at)
reservation_bags (reservation_id, blood_bag_id)     -- M2M

-- Patient / prescription
patients        (id, hospital_id, national_id, first_name, last_name, blood_type, dob)
prescriptions   (id, patient_id, physician_id, blood_type, quantity,
                 urgency, notes, created_at)
transfusions    (id, patient_id, bag_id, physician_id, administered_at, outcome)

-- Notifications
notifications   (id, user_id, type, title, body, is_read, created_at, metadata jsonb)

-- Audit trail (append-only)
audit_logs      (id, user_id, action, entity, entity_id, old_value jsonb,
                 new_value jsonb, ip_address, created_at)
```

---

## 6. DATA FLOW — BLOOD RESERVATION

```
Hospital Staff              API Gateway             Core API              Blood Bank
─────────────────────────────────────────────────────────────────────────────────────
1. Search nearby banks
   with blood type A+    ──► GeoController        ──► PostGIS query
                                                   ◄── [bank list + stock]
   ◄── Map + markers ────────────────────────────────────────────────

2. Select bank,
   submit reservation    ──► ReservationController
                             validate + auth guard
                                                   ──► AllocationService
                                                       lock bags (Redis)
                                                       create reservation
                                                                          ──► WebSocket
                                                                              notify bank
                                                                          ◄── bank confirms
                             ◄── CONFIRMED status ─────────────────────────────────────
   ◄── Toast notification ──────────────────────────

3. Bag dispatched
   by blood bank         ──► ReservationController
                             status → DISPATCHED
                                                   ──► NotificationService
   ◄── SMS + in-app ─────────────────────────────────────────────────
```

---

## 7. OFFLINE ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────┐
│                    SERVICE WORKER (sw.ts)                        │
│                                                                  │
│  Cache Strategy:                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  GET /api/blood-stock    → Cache First  (stale-while-   │    │
│  │  GET /api/nearby-banks      revalidate, 10min TTL)      │    │
│  │  Static assets           → Cache First  (immutable)     │    │
│  │  POST/PUT/DELETE         → Network First + queue        │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    IndexedDB (Dexie.js)                          │
│                                                                  │
│  Tables:                                                         │
│  ├── blood_stock      Last known stock per nearby bank           │
│  ├── reservations     Local draft + confirmed reservations       │
│  ├── notifications    Unread notifications cache                 │
│  ├── sync_queue       [{ id, operation, payload, retries }]      │
│  └── meta             Last sync timestamp, user context          │
└──────────────────────────────────────────────────────────────────┘
                              │
            Online detected   │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SYNC RECONCILER                               │
│                                                                  │
│  1. Flush sync_queue in order (idempotent operations)           │
│  2. Pull delta from server (changes since last_sync_at)         │
│  3. Merge: server wins on conflicts (with user notification)    │
│  4. Update IndexedDB with fresh data                            │
│  5. Update last_sync_at                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. SECURITY ARCHITECTURE

```
LAYER 1 — PERIMETER
  ├── WAF (Web Application Firewall)       Block OWASP Top 10 at edge
  ├── DDoS Protection                      Rate limiting at CDN layer
  └── TLS 1.3 everywhere                   No plain HTTP

LAYER 2 — API GATEWAY
  ├── Rate Limiting                        100 req/min per IP (public)
  │                                        1000 req/min per authenticated user
  ├── Request Validation                   Schema validation before routing
  └── IP Allowlisting                      Admin API restricted to ministry IPs

LAYER 3 — AUTHENTICATION
  ├── JWT RS256                            Asymmetric signing (public key verifiable)
  ├── Access Token TTL                     15 minutes
  ├── Refresh Token TTL                    7 days (stored in HttpOnly cookie)
  ├── Token Rotation                       New refresh token on each use
  └── MFA                                 TOTP required for ADMIN role

LAYER 4 — AUTHORIZATION (RBAC)
  ┌─────────────────────────────────────────────────────────────────┐
  │  Role          │  Scope                                         │
  │────────────────│────────────────────────────────────────────────│
  │  ADMIN         │  All facilities, all data, analytics           │
  │  HOSPITAL      │  Own patients, own reservations, geo-search    │
  │  BLOOD_BANK    │  Own stock, own donors, reservation responses  │
  └─────────────────────────────────────────────────────────────────┘
  Enforced via: @Roles() decorator + RolesGuard + Row-level filters

LAYER 5 — DATA
  ├── Encryption at rest                   AES-256 (database + S3)
  ├── Field-level encryption               national_id, health data (PII)
  ├── Audit trail                          Immutable append-only log (all writes)
  ├── Data isolation                       facility_id scoping on all queries
  └── SQL injection                        TypeORM parameterized queries only

LAYER 6 — INFRASTRUCTURE
  ├── Secrets Management                   Vault / AWS Secrets Manager
  ├── Network Segmentation                 DB in private subnet (no public access)
  ├── Container Security                   Non-root containers, read-only FS
  └── Dependency Scanning                  Snyk / Dependabot in CI/CD
```

---

## 9. SCALABILITY STRATEGY

```
HORIZONTAL SCALING
  ├── API Servers         Stateless NestJS containers behind load balancer
  │                       Auto-scale on CPU > 70% (Kubernetes HPA)
  ├── Read Replicas       PostgreSQL streaming replication
  │                       Read-heavy queries (analytics, search) → replicas
  └── Redis Cluster       Sentinel mode for HA, Cluster mode for scale

CACHING STRATEGY (multi-layer)
  ├── L1: In-process      NestJS cache-manager (5s TTL for hot data)
  ├── L2: Redis           Blood stock levels (30s TTL, invalidate on write)
  ├── L3: CDN             Static assets, map tiles (long TTL + versioning)
  └── L4: Client          React Query (stale-while-revalidate) + IndexedDB

DATABASE OPTIMIZATION
  ├── Indexes             blood_type + status, facility_id, expires_at, lat/lng (PostGIS)
  ├── Partitioning        audit_logs by month, blood_bags by status
  ├── Connection Pool     PgBouncer for connection multiplexing
  └── Query Optimization  Materialized views for national analytics

ASYNC PROCESSING (BullMQ)
  ├── expiry-alerts       Daily job scanning for bags expiring in 48h
  ├── notification-fan    Fan-out notifications to thousands of users
  ├── report-generation   Heavy PDF/Excel export offloaded to workers
  └── sync-reconciliation Batch conflict resolution jobs

MULTI-REGION DEPLOYMENT (national scale)
  ├── Primary Region      Capital city — write primary
  ├── Regional Nodes      Per administrative region — read replicas
  └── Edge Caching        Blood bank locations, map tiles cached at CDN PoPs
```

---

## 10. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                           │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   Namespace:     │  │   Namespace:     │                   │
│  │   hemosafe-prod  │  │   hemosafe-stg   │                   │
│  │                  │  │                  │                   │
│  │  api (3 pods)    │  │  api (1 pod)     │                   │
│  │  worker (2 pods) │  │  worker (1 pod)  │                   │
│  │  notification    │  │                  │                   │
│  │  (2 pods)        │  │                  │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Managed Services (outside cluster)                      │  │
│  │  ├── PostgreSQL   (RDS / managed PG with replication)    │  │
│  │  ├── Redis        (ElastiCache / managed Redis)          │  │
│  │  ├── S3           (Object storage for documents)         │  │
│  │  └── SMTP/SMS     (Managed mail/SMS gateway)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

CI/CD PIPELINE
  GitHub Actions / GitLab CI
  │
  ├── lint + typecheck + unit tests     (PR)
  ├── integration tests (DB + Redis)    (PR)
  ├── docker build + push to registry  (merge to main)
  ├── deploy to staging                (auto)
  ├── E2E tests (Playwright)           (staging)
  └── deploy to production             (manual approval gate)
```

---

## 11. BLOOD TYPE COMPATIBILITY MATRIX (System Rule)

```
Donor Type → Can donate to:
  O-  (Universal Donor)    →  O-, O+, A-, A+, B-, B+, AB-, AB+
  O+                       →  O+, A+, B+, AB+
  A-                       →  A-, A+, AB-, AB+
  A+                       →  A+, AB+
  B-                       →  B-, B+, AB-, AB+
  B+                       →  B+, AB+
  AB-                      →  AB-, AB+
  AB+ (Universal Recipient)→  AB+

Enforced in: AllocationService + compatibility.service.ts
Stored in: blood_types.compatible_with[] (PostgreSQL array)
```

---

## 12. TECHNOLOGY SUMMARY

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 + React + TypeScript | SSR + App Router, PWA support |
| Styling | TailwindCSS | Rapid UI, consistent design system |
| State | Zustand + TanStack Query | Local state + server state separation |
| Offline DB | Dexie.js (IndexedDB) | Typed IndexedDB, offline-first |
| Maps | Leaflet + OpenStreetMap | Open source, no API cost, self-hostable |
| Backend | NestJS + TypeScript | Modular, DI, decorator-based, enterprise-ready |
| ORM | TypeORM + PostGIS | PostgreSQL geospatial queries |
| Cache | Redis (ioredis) | Sessions, pub/sub, queue, rate-limit |
| Queue | BullMQ | Redis-backed, reliable async jobs |
| WebSocket | Socket.IO (NestJS Gateway) | Real-time notifications |
| Auth | JWT RS256 + Passport.js | Asymmetric, stateless, secure |
| Container | Docker + Kubernetes | Scale, rollback, namespace isolation |
| CI/CD | GitHub Actions | Automated test + deploy pipeline |
