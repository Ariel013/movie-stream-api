# HEMOSAFE — Système National de Gestion du Stock Sanguin

> Plateforme de gestion du sang en temps réel à l'échelle nationale : hôpitaux, banques de sang, donneurs et réservations, avec mode hors-ligne intégré.

---

## Table des matières

1. [Présentation](#présentation)
2. [Architecture](#architecture)
3. [Stack technique](#stack-technique)
4. [Structure du dépôt](#structure-du-dépôt)
5. [Pré-requis](#pré-requis)
6. [Démarrage rapide (développement)](#démarrage-rapide-développement)
7. [Variables d'environnement](#variables-denvironnement)
8. [API — Endpoints principaux](#api--endpoints-principaux)
9. [Système hors-ligne (Offline-first)](#système-hors-ligne-offline-first)
10. [Déploiement en production](#déploiement-en-production)
11. [Monitoring & Alertes](#monitoring--alertes)
12. [Sécurité](#sécurité)
13. [État actuel & tests](#état-actuel--tests)
14. [CI/CD](#cicd)
15. [Scripts utilitaires](#scripts-utilitaires)

---

## Présentation

HEMOSAFE est une application web Progressive (PWA) destinée à la gestion centralisée du stock de sang dans les établissements de santé d'un pays. Elle permet :

- La **recherche géolocalisée** de poches de sang disponibles par groupe/rhésus et rayon
- La **réservation** de poches depuis n'importe quel hôpital vers n'importe quelle banque de sang
- La **gestion FEFO** (First Expired, First Out) du stock dans les banques de sang
- Le **suivi des donneurs** et des prescriptions médicales
- Le **fonctionnement hors-ligne** : les actions sont stockées localement (IndexedDB) et synchronisées automatiquement à la reconnexion
- Un **tableau de bord national** pour le Ministère de la Santé avec statistiques et cartographie en temps réel

### Rôles utilisateurs

> ⚠️ **État réel du code** (vérifié 2026-07-27) — seuls 3 rôles sont implémentés :
> `ADMIN`, `HOSPITAL`, `BLOOD_BANK` (enum `UserRole` dans `schema.prisma`).
> `BLOOD_BANK_MANAGER`, `HOSPITAL_STAFF` et `DONOR` (compte donneur authentifié) sont
> la cible produit, pas encore implémentés. Détail de l'écart et du plan de migration
> dans `CLAUDE.md` §3.

| Rôle (implémenté) | Description |
|---|---|
| `ADMIN` | Vue nationale, gestion des utilisateurs et de toutes les banques/hôpitaux |
| `BLOOD_BANK` | Gestion du stock de sa banque, validation des réservations entrantes, donneurs de sa banque |
| `HOSPITAL` | Recherche de sang, création de réservations, gestion de ses patients/prescriptions |

---

## Architecture

```
Internet
    │
    ▼
Nginx (TLS 1.3, rate-limiting, WAF)
    │
    ├── /api/v1/*  →  NestJS API  (3 réplicas)
    │                    │
    │                    ├── PgBouncer → PostgreSQL (primary + replica)
    │                    └── Redis     (cache, sessions, idempotency)
    │
    └── /*         →  Next.js Web (2 réplicas, standalone)
```

**Offline-first :**

```
Navigateur
    ├── IndexedDB  (Dexie.js) — stock local, réservations, patients
    ├── Sync Queue — opérations en attente par priorité (0=URGENT, 1=NORMAL, 2=LOW)
    └── Service Worker — Background Sync, push notifications
              │
              ▼ (à la reconnexion)
         POST /api/v1/sync/batch   (jusqu'à 50 ops, idempotent)
         GET  /api/v1/sync/pull    (delta depuis last_sync)
```

---

## Stack technique

### Backend (`hemosafe-api`)

| Technologie | Version | Rôle |
|---|---|---|
| NestJS | 10 | Framework API modulaire |
| TypeScript | 5 | Typage statique |
| Prisma | 5 | ORM + migrations |
| PostgreSQL + PostGIS | 16 | Base de données principale + géospatial |
| Redis (ioredis) | 7 | Cache, sessions JWT, idempotency |
| PgBouncer | 1.23 | Connection pooling (transaction mode) |
| Passport JWT | — | Authentification + RBAC |
| Socket.io | 4 | Notifications temps réel |
| Swagger/OpenAPI | — | Documentation auto-générée |

### Frontend (`hemosafe-web`)

| Technologie | Version | Rôle |
|---|---|---|
| Next.js | 14 (App Router) | Framework React SSR/SSG |
| TypeScript | 5 | Typage statique |
| TailwindCSS | 3 | Styling (Material Design 3) |
| Zustand | — | État global (auth, persist) |
| TanStack Query | 5 | État serveur, cache, invalidation |
| Axios | — | Client HTTP + intercepteurs JWT refresh |
| Recharts | — | Graphiques (Line, Bar, Area, Pie) |
| Leaflet + React-Leaflet | — | Cartographie OSM |
| Dexie.js | 3 | Wrapper IndexedDB (offline) |
| React Hook Form + Zod | — | Formulaires avec validation |
| Socket.io Client | — | Notifications temps réel |

### Infrastructure

| Composant | Outil |
|---|---|
| Conteneurs | Docker + Docker Compose |
| Reverse proxy | Nginx |
| CI/CD | GitHub Actions |
| Registry | GitHub Container Registry (GHCR) |
| Monitoring | Prometheus + Grafana + Alertmanager |
| Logs | Loki + Promtail |
| Backups | pg_dump + AES-256 + S3 |
| Sécurité | fail2ban, Trivy, npm audit |

---

## Structure du dépôt

```
Hemosafe-/
├── hemosafe-api/              # Backend NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # JWT, RBAC, refresh tokens
│   │   │   ├── blood-bags/    # Gestion des poches (FEFO, statuts)
│   │   │   ├── blood-banks/   # Banques de sang
│   │   │   ├── hospitals/     # Hôpitaux
│   │   │   ├── reservations/  # FSM : PENDING → CONFIRMED → DISPATCHED → DELIVERED
│   │   │   ├── donors/        # Donneurs
│   │   │   ├── patients/      # Patients et prescriptions
│   │   │   ├── sync/          # POST /sync/batch, GET /sync/pull
│   │   │   ├── health/        # GET /health, GET /metrics
│   │   │   ├── statistics/    # Tableaux de bord agrégés
│   │   │   └── notifications/ # WebSocket + push
│   │   ├── common/            # Guards, interceptors, decorators, filters
│   │   ├── prisma/            # PrismaService
│   │   └── config/            # Validation des variables d'env
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── Dockerfile
│
├── hemosafe-web/              # Frontend Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/  # Page de connexion
│   │   │   └── (dashboard)/   # Layout protégé + toutes les pages
│   │   ├── modules/
│   │   │   └── dashboard/     # AdminDashboard, HospitalDashboard, BloodBankDashboard
│   │   └── shared/
│   │       ├── store/         # Zustand (auth)
│   │       ├── lib/           # Axios instance, API client
│   │       ├── offline/       # db.ts (Dexie), sync-engine.ts, offline-mutations.ts
│   │       ├── hooks/         # useOffline, useOfflineMutation
│   │       └── components/    # Sidebar, TopBar, OfflineIndicator
│   ├── public/sw.js           # Service Worker (Background Sync, Push)
│   └── Dockerfile
│
├── nginx/
│   ├── nginx.conf             # Config globale (rate-limit, logs JSON, gzip)
│   └── conf.d/hemosafe.conf   # VHost (TLS, CSP, cache statique, WebSocket)
│
├── monitoring/
│   ├── docker-compose.monitoring.yml
│   ├── prometheus.yml         # Scrape configs
│   ├── alertmanager.yml       # Routing Slack/Email
│   ├── loki.yml               # Agrégation logs
│   ├── promtail.yml           # Collecte logs Docker
│   ├── alerts/hemosafe.yml    # Règles d'alerte Prometheus
│   ├── postgres-exporter-queries.yml  # Métriques métier SQL
│   └── grafana/
│       ├── provisioning/      # Datasources + dashboards auto-provisionnés
│       └── dashboards/        # JSON dashboards
│
├── pgbouncer/                 # Connection pooling PostgreSQL
├── security/                  # fail2ban, pg_hba.conf
├── scripts/
│   ├── backup.sh              # Sauvegarde chiffrée vers S3
│   ├── restore.sh             # Restauration depuis S3 ou fichier local
│   └── security-check.sh      # Gate de sécurité pré-déploiement
│
├── .github/workflows/
│   ├── ci.yml                 # Lint → Test → Audit → Build → Push GHCR
│   └── deploy.yml             # Deploy staging (auto) + production (approbation manuelle)
│
├── docker-compose.yml         # Stack de développement
├── docker-compose.prod.yml    # Stack de production
└── .env.example               # Référence des variables d'environnement
```

---

## Pré-requis

### Développement

| Outil | Version minimale |
|---|---|
| Node.js | 20 LTS |
| npm | 10 |
| Docker | 24 |
| Docker Compose | v2.20 |
| Git | — |

```sh
node -v   # v20.x
docker -v # Docker version 24.x
```

### Production (serveur)

- OS : Ubuntu 22.04 LTS ou Debian 12
- RAM : 8 Go minimum (16 Go recommandé)
- Disque : 100 Go SSD (données + logs + sauvegardes locales)
- Ports ouverts : 80, 443 (Nginx). Tous les autres ports sont internes.
- Accès S3 (ou compatible) pour les sauvegardes
- Compte SMTP pour les alertes email

---

## Démarrage rapide (développement)

### 1. Cloner le dépôt

```sh
git clone git@github.com:Ariel013/Hemosafe-.git
cd hemosafe
```

### 2. Variables d'environnement de développement

```sh
cp .env.example .env.dev
```

Les valeurs par défaut du fichier `.env.example` fonctionnent tel quel en développement. Aucune modification n'est requise pour démarrer.

### 3. Démarrer la stack Docker

```sh
docker compose up -d
```

Cela démarre : PostgreSQL (avec PostGIS), Redis, l'API NestJS et le frontend Next.js.

```sh
docker compose ps      # Vérifier que tous les services sont healthy
docker compose logs -f api  # Suivre les logs de l'API
```

### 4. Initialiser la base de données

```sh
# Appliquer les migrations Prisma
docker compose exec api npx prisma migrate dev

# (Optionnel) Insérer des données de test
docker compose exec api npx prisma db seed
```

> ⚠️ **Piège connu avec `prisma migrate dev`** — la colonne PostGIS
> `facilities.location` n'est pas déclarée dans `schema.prisma` (Prisma ne gère pas
> nativement le type `geography`, elle est ajoutée via une migration SQL manuelle,
> voir `20260525000001_add_facility_location`). Résultat : dès que cette colonne
> contient des données (après le seed, ou en usage réel), relancer
> `prisma migrate dev` pour créer une **nouvelle** migration propose de **DROP la
> colonne `location` et son index GIST**, ce qui détruit la géolocalisation de
> toutes les banques/hôpitaux. La première exécution (base vide) est sans risque.
> **Pour toute migration ultérieure : relire le SQL généré avant de valider**, ou
> utiliser `prisma migrate diff` pour l'inspecter sans l'appliquer.

### 5. Accéder à l'application

| Service | URL | Identifiants par défaut |
|---|---|---|
| Application web | http://localhost:3000 | voir comptes de test ci-dessous |
| API NestJS | http://localhost:3001/api | — |
| Swagger / Docs API | http://localhost:3001/api/docs | — |
| Prisma Studio | http://localhost:5555 | — |

**Comptes de test créés par `prisma db seed`** (un par rôle implémenté, cf. `hemosafe-api/prisma/seed.ts`) :

| Rôle | Email | Mot de passe | Établissement |
|---|---|---|---|
| `ADMIN` | `admin@hemosafe.ci` | `Admin1234!` | — (vue nationale) |
| `HOSPITAL` | `hopital@hemosafe.ci` | `Hospital1234!` | CHU de Cocody |
| `BLOOD_BANK` | `banque@hemosafe.ci` | `BloodBank1234!` | Centre National de Transfusion Sanguine (CNTS-ABJ) |

Le seed crée aussi 6 banques de sang, 4 hôpitaux et ~118 poches de sang de démonstration
répartis sur des villes de Côte d'Ivoire (Abidjan, Bouaké, San-Pédro, Korhogo, Gagnoa).

```sh
# Lancer Prisma Studio (interface visuelle BDD)
docker compose exec api npx prisma studio
```

### 6. Développement sans Docker (optionnel)

**API :**
```sh
cd hemosafe-api
npm install
cp ../.env.example .env       # Ajuster DATABASE_URL et REDIS_URL
npx prisma generate
npx prisma migrate dev
npm run start:dev             # Hot reload
```

**Web :**
```sh
cd hemosafe-web
npm install
# Créer .env.local :
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm run dev                   # http://localhost:3000
```

---

## Variables d'environnement

Toutes les variables sont documentées dans [`.env.example`](.env.example). Les variables obligatoires sont :

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL (via PgBouncer en prod) |
| `DATABASE_DIRECT_URL` | URL directe PostgreSQL (migrations Prisma uniquement) |
| `REDIS_URL` | URL Redis avec mot de passe |
| `JWT_SECRET` | Clé secrète JWT (min. 32 caractères, aléatoire) |
| `JWT_REFRESH_SECRET` | Clé secrète refresh token (différente de JWT_SECRET) |
| `BACKUP_ENCRYPTION_KEY` | Clé AES-256 pour les sauvegardes chiffrées |
| `GRAFANA_ADMIN_PASSWORD` | Mot de passe admin Grafana |

**Générer des secrets sécurisés :**
```sh
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## API — Endpoints principaux

La documentation complète est disponible sur `/api/docs` (Swagger UI, désactivé en production).

### Authentification
```
POST   /api/v1/auth/login         Connexion (retourne access_token + refresh_token)
POST   /api/v1/auth/refresh        Renouveler l'access token
POST   /api/v1/auth/logout         Invalider la session
```

### Stock sanguin
```
GET    /api/v1/blood-bags                        Lister les poches (filtres: aboGroup, rhFactor, status, bloodBankId)
GET    /api/v1/blood-bags/types                   Référentiel des groupes sanguins (UUID + label)
GET    /api/v1/blood-bags/expiring-soon           Poches expirant sous 48h
GET    /api/v1/blood-bags/stock-summary/:bankId   Résumé du stock disponible par groupe (mis en cache 3 min)
GET    /api/v1/blood-bags/:id                     Détail d'une poche + historique des mouvements
POST   /api/v1/blood-bags                         Enregistrer une nouvelle poche (BLOOD_BANK / ADMIN)
PATCH  /api/v1/blood-bags/:id/discard             Retirer une poche (raison obligatoire, min 10 caractères)
```
> Pas de recherche géolocalisée sous `/blood-bags` — elle vit sous `/reservations/search`
> (voir ci-dessous), avec verrouillage de stock si utilisée pour réserver.

### Réservations
```
POST   /api/v1/reservations              Créer une réservation (alloue les poches FEFO sous verrou)
GET    /api/v1/reservations              Lister (scoping automatique par établissement)
GET    /api/v1/reservations/:id          Détail
POST   /api/v1/reservations/search       Recherche géolocalisée de banques avec stock (lat, lng, radiusKm, bloodTypeId)
PATCH  /api/v1/reservations/:id/status   Transition FSM unique — body { status, cancelReason? }
                                          PENDING→CONFIRMED→DISPATCHED→DELIVERED, ou CANCELLED depuis PENDING/CONFIRMED
                                          (CONFIRMED/DISPATCHED: BLOOD_BANK — DELIVERED: HOSPITAL — CANCELLED: les deux)
POST   /api/v1/reservations/:id/verify-bag   Vérifier un code-barres de poche au retrait
```

### Synchronisation hors-ligne
```
POST   /api/v1/sync/batch          Traiter un lot d'opérations offline (max 50)
GET    /api/v1/sync/pull           Delta depuis ?since=<ISO>&scopes=stock,reservations
```

### Santé & Métriques
```
GET    /api/v1/health              Health check (DB + Redis) — utilisé par Docker et CI
GET    /api/v1/metrics             Métriques format Prometheus
```

---

## Système hors-ligne (Offline-first)

L'application fonctionne sans connexion internet. Les données sont stockées dans IndexedDB via **Dexie.js** et synchronisées automatiquement à la reconnexion.

### Opérations supportées hors-ligne

| Opération | Priorité | Déduplication |
|---|---|---|
| Créer une réservation d'urgence | 0 — URGENTE | Non (toujours créée) |
| Créer une réservation normale | 1 — NORMALE | Non |
| Mettre à jour le stock | 1 — NORMALE | Oui — les modifications successives sur la même poche sont fusionnées |
| Mettre à jour un patient | 1 — NORMALE | Oui |
| Enregistrer une poche | 1 — NORMALE | Non |

### Résolution des conflits

La stratégie **server-wins** est appliquée : en cas de conflit (HTTP 409), l'état du serveur écrase la version locale dans IndexedDB.

### Retry avec backoff exponentiel

```
Délai = min(2^(n+1) × 1000ms, 10 minutes)
Tentative 1 : 2s  |  2 : 4s  |  3 : 8s  |  4 : 16s  |  5 → dead-letter queue
```

Les opérations qui échouent définitivement sont déplacées dans `failed_ops` (table IndexedDB) et visibles dans l'indicateur hors-ligne de l'interface.

---

## Déploiement en production

### 1. Préparer le serveur

```sh
# Sur le serveur de production
sudo apt update && sudo apt install -y docker.io docker-compose-plugin fail2ban
sudo systemctl enable --now docker fail2ban

# Créer le répertoire de déploiement
sudo mkdir -p /opt/hemosafe && sudo chown $USER:$USER /opt/hemosafe
cd /opt/hemosafe
git clone https://github.com/votre-org/hemosafe.git .
```

### 2. Configurer les variables de production

```sh
cp .env.example .env.prod
nano .env.prod  # Renseigner toutes les valeurs — NE PAS committer ce fichier
chmod 600 .env.prod
```

### 3. Certificats TLS

```sh
mkdir -p nginx/certs
# Option A — Let's Encrypt (certbot)
certbot certonly --standalone -d hemosafe.gov.dz
cp /etc/letsencrypt/live/hemosafe.gov.dz/fullchain.pem nginx/certs/hemosafe.crt
cp /etc/letsencrypt/live/hemosafe.gov.dz/privkey.pem   nginx/certs/hemosafe.key

# Option B — Certificat institutionnel
cp /path/to/cert.crt nginx/certs/hemosafe.crt
cp /path/to/cert.key nginx/certs/hemosafe.key
chmod 600 nginx/certs/hemosafe.key
```

### 4. Vérification sécurité pré-déploiement

```sh
./scripts/security-check.sh .env.prod
# Doit afficher "PASSED" avant tout déploiement
```

### 5. Démarrer la stack de production

```sh
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Appliquer les migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Vérifier l'état
docker compose -f docker-compose.prod.yml ps
curl -sf https://hemosafe.gov.dz/api/v1/health
```

### 6. Démarrer le monitoring

```sh
docker compose -f monitoring/docker-compose.monitoring.yml --env-file .env.prod up -d
```

Grafana est accessible sur `http://127.0.0.1:3100` (derrière Nginx en production).

---

## Monitoring & Alertes

### Services de monitoring

| Service | Port (local) | URL (via Nginx) |
|---|---|---|
| Grafana | 3100 | https://hemosafe.gov.dz/grafana |
| Prometheus | 9090 | interne uniquement |
| Alertmanager | 9093 | interne uniquement |
| Loki | 3010 | interne uniquement |

### Alertes configurées

| Alerte | Seuil | Sévérité |
|---|---|---|
| `APIDown` | API injoignable > 1min | critique |
| `HighErrorRate` | Taux 5xx > 5% sur 5min | critique |
| `CriticalBloodStockLevel` | < 5 poches disponibles | critique |
| `LowBloodStockLevel` | < 20 poches disponibles | avertissement |
| `BloodBagsExpiringSoon` | Péremption < 48h | avertissement |
| `PostgreSQLDown` | BDD injoignable > 1min | critique |
| `BackupFailed` | Pas de sauvegarde réussie depuis 36h | critique |
| `HostDiskSpaceCritical` | Disque < 5% | critique |

Les alertes critiques sont routées vers **Slack #hemosafe-critical** et **email astreinte@hemosafe.gov.dz**.

---

## Sécurité

### Mesures en place

- **TLS 1.2/1.3 uniquement** — TLS 1.0/1.1 désactivés, OCSP stapling activé
- **En-têtes de sécurité** — CSP, HSTS preload, X-Frame-Options DENY, X-Content-Type-Options
- **Rate limiting Nginx** — Auth : 10 req/min, API : 120 req/min, Upload : 5 req/min
- **fail2ban** — Bannissement automatique après 10 tentatives de login échouées (1h)
- **JWT short-lived** — Access token 15min, refresh token 7 jours
- **RBAC** — Chaque endpoint vérifie le rôle via `@Roles()` + `RolesGuard`
- **Idempotency** — Chaque mutation offline porte un `X-Idempotency-Key` UUID (Redis, TTL 24h)
- **Audit log** — Toutes les mutations sont tracées via `AuditInterceptor`
- **pg_hba.conf durci** — Connexions réseau restreintes au sous-réseau Docker, `scram-sha-256` uniquement
- **Images Docker non-root** — Utilisateurs `api:hemosafe` et `web:hemosafe` (UID > 1000)
- **Scan Trivy** — Analyse des vulnérabilités à chaque build CI (SARIF uploadé dans GitHub Security)

### Vérification de sécurité

```sh
# Lancer le check complet avant un déploiement
./scripts/security-check.sh .env.prod
```

---

## État actuel & tests

> Section à tenir à jour à chaque campagne de test — voir aussi `CLAUDE.md` §8 pour
> l'historique détaillé des corrections.

### Tests automatisés

**Aucun test automatisé n'existe actuellement** (`hemosafe-api/test/` est vide,
aucun `*.spec.ts` dans `src/`), bien que `.github/workflows/ci.yml` définisse un job
`test-api` qui exécute Jest contre une vraie PostgreSQL + Redis. À écrire en priorité
sur les modules critiques : `reservations/engine` (FSM + allocation FEFO), `auth`,
`sync`.

### Dernière vérification fonctionnelle manuelle (2026-07-27)

Passe de correction de bugs suivie d'une vérification par appels API réels (curl,
instance dédiée, pas seulement compilation) sur les 3 rôles :

| Module | Vérifié | Non couvert |
|---|---|---|
| Auth (login/refresh/me) | ✅ 3 rôles | logout, expiration de token |
| Réservations (FSM complet) | ✅ création, transitions, rôles, rejets | expiration automatique (cron), verify-bag |
| Blood bags | ✅ création, discard, filtres, cache stock-summary | expiring-soon en réel, cron d'expiration |
| Donors | ✅ RBAC, IDOR inter-banques, screening | — |
| Patients | ✅ RBAC, IDOR inter-hôpitaux | — |
| Prescriptions | Relecture de code uniquement | Aucun appel réel |
| Transfers | ✅ création, FSM, crash HOSPITAL corrigé | IN_TRANSIT→RECEIVED, cancel |
| Sync offline (`/sync/batch`, `/sync/pull`) | ✅ allocation réelle, anti-usurpation, idempotence, notifications | endpoints `blood-bags`/`patients` du dispatch (seul `reservations` testé en direct) |
| Users | ✅ anti-escalade de privilège | — |
| Notifications | ✅ listeners banque (implémentés cette session) | WebSocket temps réel |
| Statistics | Relecture de code + cache vérifié sur `stock-summary` uniquement | `national`, `regional`, `donors`, `reservation-trends` |
| Hospitals/Blood-banks (`nearby`) | Non testé | Recherche géospatiale |
| Audit-logs, Health/Metrics | Non testé en direct | — |
| **Frontend (navigateur)** | **Non testé** | Toute l'interface — seule l'API a été appelée directement |

---

## CI/CD

### Pipeline GitHub Actions

```
Push sur main
    │
    ├── lint-api        TypeScript strict check (tsc --noEmit)
    ├── lint-web        Next.js build check
    ├── test-api        Jest avec vraie PostgreSQL + Redis (coverage → Codecov)
    ├── security-audit  npm audit HIGH + Trivy filesystem scan
    └── build-images    Docker Buildx → push GHCR → Trivy image scan → SARIF
            │
            ▼ (si CI réussit)
    deploy-staging      SSH → docker pull → rolling update → smoke test → Slack
            │
            ▼ (déclenchement manuel avec approbation)
    deploy-production   Migrations → rolling scale (3 API + 2 Web) → smoke test → git tag
```

### Déployer en production via GitHub

1. Aller dans **Actions → Deploy → Run workflow**
2. Choisir `production` et saisir le tag d'image souhaité
3. L'approbation d'un reviewer est requise (configurée dans les GitHub Environments)
4. Les migrations sont appliquées automatiquement avant le déploiement
5. Un tag `release-YYYYMMDD-HHMMSS-<sha>` est créé dans Git

---

## Scripts utilitaires

### Sauvegarde manuelle

```sh
# Sauvegarde locale (chiffrée AES-256)
./scripts/backup.sh

# La sauvegarde est automatiquement uploadée sur S3 :
# s3://${BACKUP_S3_BUCKET}/hemosafe_prod_YYYYMMDD_HHMMSS.dump.enc
```

La sauvegarde automatique est configurée via cron dans `docker-compose.prod.yml` (tous les jours à 2h00 UTC).

### Restauration

```sh
# Depuis un fichier local
./scripts/restore.sh /chemin/vers/backup.dump.enc

# Depuis S3
./scripts/restore.sh s3://hemosafe-backups-prod/hemosafe_prod_20260313_020000.dump.enc
```

> **Attention :** La restauration DROP et recrée la base de données. Elle demande une confirmation de 10 secondes.

### Vérification de sécurité

```sh
./scripts/security-check.sh .env.prod
```

---

## Licence

Ce projet est propriété du Ministère de la Santé de la République Algérienne Démocratique et Populaire.
Usage interne uniquement — voir [LICENSE](LICENSE).
