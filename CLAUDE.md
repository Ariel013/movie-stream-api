# HEMOSAFE — Contexte projet pour Claude

> Ce fichier est la mémoire persistante du projet. Il doit être tenu à jour à chaque
> décision structurante, changement de priorité, ou clarification obtenue auprès du
> porteur de projet. Si une conversation précédente est perdue, ce fichier doit suffire
> à reprendre le projet sans perte de contexte.

**Dernière mise à jour :** 2026-07-27

---

## 1. Nature du projet — À LIRE EN PREMIER

**HEMOSAFE est un vrai projet destiné à être vendu / proposé commercialement**
(pas un simple exercice pédagogique ou portfolio). Il cible potentiellement un
ministère de la santé / des établissements hospitaliers réels.

**Conséquences concrètes pour Claude :**
- Les exigences de sécurité, fiabilité, auditabilité et conformité doivent être
  traitées comme **réellement critiques**, pas comme de la décoration d'architecture.
- Ne jamais prendre de raccourcis qui compromettent l'intégrité des données médicales
  (stock sanguin, dossiers patients, résultats d'analyses).
- Toute suggestion de simplification doit être mise en balance avec le fait que ce
  produit pourrait gérer de vraies données de santé en production.
- Le porteur du projet (Kevin) est actuellement seul développeur — expliquer les
  compromis techniques plutôt que les present comme acquis.

---

## 2. Présentation fonctionnelle

Plateforme nationale de gestion du stock sanguin en temps réel : hôpitaux, banques de
sang, donneurs, avec mode hors-ligne intégré (PWA).

**Fonctionnalités cœur :**
- Recherche géolocalisée de poches de sang disponibles (groupe/rhésus + rayon)
- Réservation de poches d'un hôpital vers une banque de sang (FSM de statuts)
- Gestion FEFO (First Expired, First Out) du stock
- Suivi des donneurs, historique de dons, résultats d'analyses (screening)
- Fonctionnement hors-ligne avec synchronisation automatique à la reconnexion
- Tableau de bord national (Ministère) : statistiques + cartographie temps réel
- Transferts de poches inter-banques de sang
- Prescriptions médicales liées aux patients

---

## 3. Rôles utilisateurs — ⚠️ ÉCART CONNU À RÉSOUDRE

**État actuel du code (`hemosafe-api/prisma/schema.prisma`) :**
```
enum UserRole { ADMIN  HOSPITAL  BLOOD_BANK }
```
Seulement 3 rôles implémentés. Pas de compte utilisateur pour les donneurs.

**Cible confirmée par le porteur de projet (2026-07-23) :**
Le README documente 4 rôles (`ADMIN`, `BLOOD_BANK_MANAGER`, `HOSPITAL_STAFF`, `DONOR`)
et c'est la direction à suivre :
- `DONOR` doit devenir un **vrai rôle utilisateur authentifié**, pas juste une fiche
  gérée par une banque de sang.
- Un donneur connecté doit pouvoir consulter :
  - l'historique de tous ses dons (`Donor.donationCount`, dates, banque de sang)
  - les résultats de ses analyses (`HealthScreening` : hémoglobine, tension, poids,
    température, `isPassed`)
- `BLOOD_BANK_MANAGER` et `HOSPITAL_STAFF` doivent probablement remplacer/affiner les
  rôles `BLOOD_BANK`/`HOSPITAL` actuels, ou bien co-exister avec eux (à clarifier plus
  finement si un besoin de distinction manager/staff apparaît dans un même
  établissement — pas encore tranché).

**Travail à faire (backend) :**
1. Ajouter `DONOR` à l'enum `UserRole`.
2. Lier `User` ↔ `Donor` (aujourd'hui `Donor` n'a pas de `userId` — à ajouter).
3. Nouveaux endpoints scoped-donor : `GET /donors/me`, `GET /donors/me/screenings`,
   `GET /donors/me/donations`.
4. Guard RBAC pour restreindre un `DONOR` à ses propres données uniquement
   (pas d'accès aux autres donneurs — attention à l'IDOR).
5. Décider si `BLOOD_BANK_MANAGER`/`HOSPITAL_STAFF` sont des rôles à part ou des
   libellés UI pour `BLOOD_BANK`/`HOSPITAL` — **à confirmer avec le porteur avant
   d'implémenter** (impact migration Prisma).

---

## 4. Nomenclature (glossaire FR ↔ code)

Le produit est pensé/documenté en français (UI, README) mais tout le code (variables,
modèles, endpoints) est en anglais. Toujours garder cette convention.

| Terme métier (FR)          | Identifiant code (EN)                  | Où |
|---|---|---|
| Poche de sang               | `BloodBag`                             | Prisma model |
| Banque de sang               | `Facility` avec `type = BLOOD_BANK`    | Prisma model |
| Hôpital                      | `Facility` avec `type = HOSPITAL`      | Prisma model |
| Réservation                  | `Reservation`                          | Prisma model |
| Donneur                      | `Donor`                                | Prisma model |
| Bilan de santé / analyses    | `HealthScreening`                      | Prisma model |
| Transfert inter-banques      | `Transfer`                             | Prisma model |
| Prescription médicale        | `Prescription`                         | Prisma model |
| Mouvement de stock           | `StockMovement`                        | Prisma model |
| Journal d'audit              | `AuditLog`                             | Prisma model |
| File de synchronisation      | `SyncQueue` (backend) / `sync-queue.ts` (frontend Dexie) | — |
| Groupe sanguin ABO           | `AboGroup` (A, B, AB, O)               | Enum |
| Rhésus                       | `RhFactor` (`+` / `-`)                 | Enum |
| Urgence (routine/urgent/emergency) | `UrgencyLevel`                   | Enum |

**FSM des statuts (à respecter strictement dans toute logique métier) :**

- **Réservation** (`ReservationStatus`) :
  `PENDING → CONFIRMED → DISPATCHED → DELIVERED`, avec branches `EXPIRED` et
  `CANCELLED` possibles depuis `PENDING`/`CONFIRMED`.
- **Poche de sang** (`BagStatus`) :
  `AVAILABLE → RESERVED → DISTRIBUTED`, avec `EXPIRED`/`DISCARDED` en état terminal.
- **Transfert** (`TransferStatus`) : `INITIATED → IN_TRANSIT → RECEIVED`, ou `CANCELLED`.
- **Sync offline** (`SyncStatus`) : `PENDING → PROCESSING → DONE`, ou `FAILED`.

Toute transition doit être tracée dans `StockMovement` (pour les poches) et dans
`AuditLog` (pour toute mutation, via `AuditInterceptor`).

---

## 5. Stack technique

### Backend — `hemosafe-api/`
| Techno | Rôle |
|---|---|
| NestJS 10 (monolithe modulaire) | Framework API |
| TypeScript 5 | Typage |
| Prisma 5 | ORM + migrations |
| PostgreSQL 16 + PostGIS + pg_trgm + uuid-ossp | BDD + géospatial |
| Redis (ioredis) | Cache, sessions, idempotency keys |
| PgBouncer | Pooling de connexions (mode transaction) |
| Passport JWT | Auth + RBAC (`@Roles()` + `RolesGuard`) |
| Socket.io | Notifications temps réel |
| Swagger/OpenAPI | Doc API auto-générée (`/api/docs`, désactivé en prod) |
| BullMQ (prévu) | Queues asynchrones — **à vérifier si effectivement utilisé**, pas vu dans `package.json` actuel |

### Frontend — `hemosafe-web/`
| Techno | Rôle |
|---|---|
| Next.js 14 (App Router) | Framework React SSR |
| TypeScript 5 | Typage |
| TailwindCSS 3 | Styling (Material Design 3) |
| Zustand | État global (auth, persisté dans `localStorage` sous la clé `hemosafe-auth`) |
| TanStack Query 5 | État serveur (présent en dépendance, usage à vérifier page par page) |
| Axios | Client HTTP + intercepteur refresh JWT sur 401 |
| Recharts | Graphiques (statistiques) |
| Leaflet + React-Leaflet | Cartographie OSM |
| Dexie.js + dexie-react-hooks | IndexedDB (offline) |
| React Hook Form + Zod | Formulaires + validation |
| Socket.io Client | Notifications temps réel |

### Infrastructure
Docker Compose, Nginx (TLS, rate-limiting), GitHub Actions CI/CD, Prometheus +
Grafana + Alertmanager, Loki + Promtail, sauvegardes pg_dump chiffrées AES-256 vers S3,
fail2ban, scan Trivy. Détail complet dans [`README.md`](README.md) et
[`ARCHITECTURE.md`](ARCHITECTURE.md).

**Design system (Stitch-derived) :**
Primary `#af101a`, Secondary `#4c616c`, Tertiary `#006357`. Polices Manrope
(titres) / Inter (corps). Icônes Material Symbols Outlined.

---

## 6. Structure du dépôt

```
Hemosafe-/
├── hemosafe-api/          # Backend NestJS (voir §7 pour état réel des modules)
├── hemosafe-web/          # Frontend Next.js 14
├── nginx/                 # Reverse proxy (TLS, CSP, cache statique, WebSocket)
├── monitoring/            # Prometheus, Grafana, Alertmanager, Loki, Promtail
├── pgbouncer/              # Connection pooling PostgreSQL
├── security/              # fail2ban, pg_hba.conf
├── scripts/               # backup.sh, restore.sh, security-check.sh
├── .github/workflows/     # ci.yml (lint/test/audit/build), deploy.yml
├── docker-compose.yml      # Stack dev
├── docker-compose.prod.yml # Stack prod
├── README.md               # Doc utilisateur/déploiement (démarrage, endpoints, sécurité)
└── ARCHITECTURE.md          # Doc d'architecture complète (12 sections, très détaillée)
```

`README.md` et `ARCHITECTURE.md` restent les sources de référence pour les détails de
déploiement/infra — ce fichier (`CLAUDE.md`) ne les duplique pas, il documente l'état
réel du code, les écarts, et les priorités.

`QA_TEST_PLAN.md` (créé le 2026-07-27, 378 cas de test sur 40 sections) est le
script de test manuel — backend module par module, frontend page par page (3 rôles),
scénarios de bout en bout inter-modules, matrice RBAC récapitulative. Généré après un
audit de code en 3 passes croisé avec une campagne de vérification API réelle. Contient
sa propre liste de « limitations connues » (§4 du document) — voir aussi la note ci-dessous.

**Nouvelles trouvailles de l'audit en 3 passes (2026-07-27), non encore corrigées :**
- Rate limiting inactif en local : `ThrottlerGuard` jamais appliqué (ni global ni par
  route) — `@Throttle()` sur `/auth/login` est inerte hors du Nginx de prod.
- WebSocket temps réel mort des deux côtés : `EventsGateway` (backend) n'est enregistré
  dans aucun module, aucun adapter WS dans `main.ts` ; le frontend a `socket.io-client`
  en dépendance mais ne l'importe nulle part. Notifications = polling uniquement.
- `POST /hospitals` et `POST /blood-banks` acceptent `lat`/`lng` mais ne les persistent
  jamais (`location` PostGIS reste `NULL`) — tout établissement créé hors seed est
  invisible en recherche géolocalisée.
- **Correction à la note du 2026-07-23** : les dashboards `AdminDashboard`/
  `HospitalDashboard`/`BloodBankDashboard` sont en fait bien câblés à de vraies API —
  seuls certains éléments visuels (panneau carte réseau, barre de recherche héro) sont
  décoratifs. La page `/dashboard/map` en revanche est confirmée 100% statique (zéro
  appel API), et son filtre par groupe sanguin est cassé (ne filtre jamais réellement).
- Système offline frontend complet et fonctionnel en soi (Dexie, retry/backoff,
  résolution de conflit) mais **aucune page réelle ne l'utilise** — Stock/Réservations/
  Blood Search/Donors/Patients appellent `axios` directement, sans passer par la file
  d'attente offline. Seul le pull-sync + détection online/offline du widget
  `OfflineIndicator` fonctionne réellement.
- Plusieurs boutons morts recensés (voir §4/K9 du QA_TEST_PLAN.md) : "Voir" sur
  Stock/Donors/Patients, "Voir détails"/"Ajouter un établissement" sur Directory,
  onglets Notifications/Préférences des Réglages entièrement non fonctionnels.

---

## 7. État réel de l'implémentation (audit du 2026-07-23)

### Backend (`hemosafe-api/src/modules/`)
Tous les modules suivants existent avec controller + service + repository + DTOs :
`auth`, `users`, `hospitals`, `blood-banks`, `blood-bags`, `donors`, `patients`,
`prescriptions`, `reservations` (+ `engine/` avec geo-search, locking,
reservation-validator), `transfers`, `notifications` (+ `notification/gateways/`
websocket), `statistics`, `sync`, `audit-logs`, `health`.

C'est une base solide et cohérente avec l'architecture documentée. Les guards RBAC
(`RolesGuard`, `JwtAuthGuard`), l'intercepteur d'audit et l'intercepteur d'idempotency
sont en place dans `src/common/`.

**⚠️ Aucun fichier de test n'existe** (`hemosafe-api/test/` est vide, aucun
`*.spec.ts` dans `src/`), alors que `.github/workflows/ci.yml` définit un job
`test-api` qui exécute Jest contre une vraie PostgreSQL + Redis. **Le CI casse
probablement dès qu'un test est réellement attendu**, ou le job passe silencieusement
faute de tests à lancer — à vérifier.

### Frontend (`hemosafe-web/src/app/`)
La majorité des pages sont **réellement câblées à l'API** (appels `axios`/`api.*`
visibles, pas des données statiques) :
`blood-search`, `directory`, `donors`, `logs`, `notifications`, `patients`,
`reservations` (liste + détail), `settings`, `statistics`, `stock`, `login`.

**Pages encore en placeholder / à finir :**
- `(dashboard)/dashboard/page.tsx` (accueil dashboard) — pas d'appel API détecté au
  dernier audit, vraisemblablement des données statiques par rôle
  (`AdminDashboard`/`HospitalDashboard`/`BloodBankDashboard`).
- `(dashboard)/dashboard/map/page.tsx` — carte Leaflet, à vérifier si les banques de
  sang affichées viennent de l'API ou sont codées en dur.

Système offline (`shared/offline/db.ts`, `sync-engine.ts`, `sync-queue.ts`,
`offline-mutations.ts`) et hooks (`useOffline`, `useOfflineMutation`) sont présents
en tant que code — leur couverture réelle (quelles mutations passent par la sync
queue vs appellent l'API directement) reste à auditer module par module.

### Base de données
Schéma Prisma (`hemosafe-api/prisma/schema.prisma`) très complet : 16 modèles,
usage cohérent de PostGIS (`geography` géré via `$queryRaw`, pas dans le schema
Prisma directement — attention lors de modifs sur `Facility`/`geo-search.service.ts`).

---

## 8. Dette technique connue / historique

- **Git hygiène (corrigée le 2026-07-23) :** `hemosafe-api/.env`, `.env.dev`,
  `hemosafe-web/.next/` (235 fichiers) et `hemosafe-api/dist/` (308 fichiers)
  étaient trackés dans git. Ils ont été retirés du suivi (`git rm --cached`) et
  ajoutés au `.gitignore`. **L'historique git n'a pas été réécrit** (décision du
  porteur : corriger seulement pour la suite). Les secrets présents dans ces fichiers
  étaient des valeurs de dev faibles/placeholder (`12345`, clés JWT factices), pas de
  vrais secrets de prod — mais rester vigilant : si un jour un vrai `.env.prod` est
  committé par erreur, il faudra envisager une purge d'historique (BFG/filter-repo)
  et une rotation immédiate des secrets concernés.
- **Historique git compressé :** le dépôt actuel a un historique très court
  (`Initial commit` → `[ADD] Project structure and v1` → quelques fixes). Les
  discussions/décisions de conception antérieures ne sont plus dans l'historique —
  d'où l'existence de ce fichier, à tenir à jour pour ne plus perdre le contexte.
- **Pas de tests** malgré un CI qui les attend (voir §7).
- **Rôles utilisateurs incomplets** vs la cible produit (voir §3).
- **Pages dashboard home / map potentiellement non câblées à l'API réelle** (voir §7).
- `BullMQ` **confirmé absent** de `hemosafe-api/package.json` (vérifié le 2026-07-27) —
  ne pas s'appuyer dessus tant qu'il n'est pas ajouté explicitement.
- **Passe de correction de bugs + sécurité (2026-07-27), avant premiers tests manuels.**
  Tous les points ci-dessous ont été **corrigés ET vérifiés par des appels API réels**
  (pas seulement `tsc`/build) sur une instance dédiée (port 3002, séparée du serveur
  dev habituel), avec les 3 rôles seedés + un rôle HOSPITAL et un rôle BLOOD_BANK
  supplémentaires créés pour tester les IDOR inter-établissements. Voir le détail des
  requêtes dans l'historique de conversation si besoin de rejouer un scénario précis.
  - **Critique — corrigé et vérifié :** `POST /users` permettait une escalade de
    privilège : un HOSPITAL/BLOOD_BANK pouvait créer un compte avec `role: ADMIN`.
    Testé en direct : tentative de création d'un ADMIN par un HOSPITAL → 403.
  - **Bloquant — corrigé et vérifié :** création de réservation impossible (500) —
    `pg_advisory_xact_lock()` (retourne `void`) appelé via `$queryRaw` au lieu de
    `$executeRaw` dans `reservation-engine.service.ts` (même bug + cast `bigint`
    invalide corrigés dans `locking.service.ts`, dead code mais injecté). Testé :
    cycle complet PENDING → CONFIRMED → DISPATCHED → DELIVERED avec la bonne
    restriction de rôle à chaque étape, et transition invalide (CONFIRMED→DELIVERED)
    correctement rejetée (400).
  - **IDOR corrigées et vérifiées :** `donors.update()`/`createScreening()` et
    `patients.update()`/`deactivate()`. Testé avec un 2ᵉ user BLOOD_BANK (autre
    banque) et un 2ᵉ user HOSPITAL (autre hôpital) : accès croisé → 403 dans les
    deux cas.
  - **Crash corrigé et vérifié :** `GET /transfers` pour un HOSPITAL → 200 (liste
    vide) au lieu de 500. Transfert vers une banque inexistante → 400 propre.
  - **Bug fonctionnel corrigé et vérifié :** filtre `aboGroup`/`rhFactor` sur
    `GET /blood-bags` et sur `POST /reservations` (même défaut trouvé aux deux
    endroits) — ignoré silencieusement car ces champs vivent sur `BloodType`, pas
    sur `BloodBag`/`Reservation`. Vérification de cohérence `aboGroup`/`rhFactor` ↔
    `bloodTypeId` ajoutée à la création dans les deux modules ; testé : couple
    incohérent → 400 avec message clair.
  - **Bug fonctionnel corrigé et vérifié :** `GET /sync/pull` ne renvoyait jamais
    les notifications en offline (filtrait par `facilityId` au lieu de `userId`) —
    confirmé en pullant les notifications d'un BLOOD_BANK après plusieurs
    réservations.
  - **`GET /donors` restreint pour HOSPITAL** (décision confirmée par le porteur —
    cohérent avec la sidebar frontend qui masquait déjà ce lien pour HOSPITAL).
  - **Chantier terminé et vérifié — sync offline réécrit :** le dispatch de
    `/sync/batch` passe désormais par les vrais services (`ReservationsService`,
    `BloodBagsService`, `PatientsService`) au lieu de Prisma brut. Testé en direct :
    une réservation créée via `/sync/batch` alloue réellement des poches FEFO
    (`status: RESERVED`, poche la plus proche de la péremption choisie) exactement
    comme via l'API en ligne ; une tentative d'usurpation d'`hospitalId` dans le
    payload offline est bien ignorée (la réservation reste rattachée à
    l'établissement réel de l'acteur) ; le replay du même `operationId` renvoie
    `duplicate` sans dupliquer. Corrigé au passage : la détection de conflit 409
    lisait `err.status`, qui n'existe pas sur les exceptions NestJS (`getStatus()`)
    — le mécanisme de conflit n'avait donc jamais pu se déclencher.
  - **Listeners de notifications implémentés et vérifiés :** `reservation.created`,
    `reservation.delivered`, `bags.expiring-soon` dans `notifications.service.ts`
    étaient des no-ops — le personnel de banque de sang n'était jamais notifié.
    Implémenté (résolution des users `BLOOD_BANK` actifs de l'établissement) et
    confirmé via `GET /sync/pull?scopes=notifications` : les notifications
    apparaissent bien pour le bon établissement.
  - **CANCELLED reste ouvert à HOSPITAL et BLOOD_BANK** (décision confirmée par le
    porteur — un `hospitalTransitions` mort dans `reservation-validator.service.ts`
    a été retiré, aucun changement de comportement).
  - Dépendances : vulnérabilités `ws`/`socket.io` corrigées sans breaking change
    (backend 28→24, frontend 9→2 vulnérabilités). Restent volontairement non
    touchées : Next.js 14→16 (2 high, SSRF/PostCSS) et `bcrypt`/`uuid` côté API —
    upgrades majeurs nécessitant un vrai plan de test, pas appliqués à l'aveugle.
  - **Fichiers modifiés** (aucun commit fait — à committer sur demande explicite) :
    `prisma/schema.prisma` (index perf), `common/cache/cache.service.ts` (nouveau),
    `blood-bags/*`, `reservations/*`, `transfers/transfers.service.ts`, `sync/*`,
    `donors/*`, `patients/*`, `users/users.service.ts`, `notifications/*`,
    `statistics/*`.
  - **Non testé en direct (à couvrir lors des tests manuels) :** prescriptions
    (RBAC vérifié par lecture de code, pas par appel réel), hospitals/blood-banks
    (endpoints géospatiaux `nearby`), audit-logs, health/metrics, statistics
    (`national`/`regional`/`donors`/`reservation-trends` — cache vérifié seulement
    sur `stock-summary`), le frontend dans son ensemble (aucun test navigateur —
    uniquement l'API testée via curl).

---

## 9. Priorités actuelles

Le porteur de projet veut avancer sur les trois fronts en parallèle (pas d'ordre
strict imposé) — mais en pratique, un ordre raisonnable pour ne pas construire sur du
sable :

1. **Résoudre l'écart de rôles (§3)** avant d'ajouter des features donneur, sinon
   il faudra re-migrer la base une deuxième fois.
2. **Finir le câblage frontend↔backend** (dashboard home, map) pour avoir un produit
   démontrable de bout en bout.
3. **Ajouter des tests** (au moins sur les modules critiques : `reservations/engine`,
   `auth`, `sync`) — c'est ce qui protège la FSM de réservation et le stock contre les
   régressions, particulièrement sensible vu le contexte réel (santé).
4. **Valider le déploiement** (docker-compose.prod, monitoring, sécurité) une fois
   les deux points précédents stabilisés — pas de valeur à déployer un produit dont le
   frontend n'est pas branché ou dont la logique métier n'est pas testée.

Cet ordre est une proposition, pas une décision figée — à ajuster si le porteur donne
une priorité explicite différente dans une session future (et à mettre à jour ici).

---

## 10. Comment Claude doit se comporter sur ce projet

- **Langue :** répondre en français (le porteur écrit en français), mais garder le
  code et les identifiers en anglais (convention déjà en place dans tout le repo).
- **Sécurité par défaut :** ce n'est pas un projet jouet — toujours valider les accès
  RBAC, ne jamais exposer de données d'un établissement/donneur à un autre rôle sans
  vérification explicite (attention particulière aux endpoints `donors/me`, futurs).
- **Ne pas proposer de microservices** — le monolithe modulaire NestJS est un choix
  assumé (facilité d'exploitation à l'échelle nationale avec une petite équipe).
- **Auditabilité :** toute nouvelle mutation d'API doit passer par `AuditInterceptor`
  et respecter les FSM de statuts existantes (§4) plutôt que d'introduire des
  raccourcis d'état.
- **Avant de modifier le schéma Prisma** (notamment pour le rôle `DONOR`), confirmer
  l'approche avec le porteur si l'impact touche une migration de données existantes.
- **Mettre à jour ce fichier** dès qu'une clarification importante est obtenue, qu'une
  décision d'architecture est prise, ou qu'un écart connu (§8) est résolu — c'est le
  filet de sécurité en cas de perte de conversation.

---

## 11. Démarrage rapide (dev)

Voir [`README.md`](README.md#démarrage-rapide-développement) pour la procédure
complète. Résumé :
```sh
cp .env.example .env.dev        # ne jamais committer .env.dev une fois rempli
docker compose up -d
docker compose exec api npx prisma migrate dev
docker compose exec api npx prisma db seed   # optionnel
```
- Web : http://localhost:3000
- API : http://localhost:3001/api — Swagger : http://localhost:3001/api/docs
- Prisma Studio : `docker compose exec api npx prisma studio` (http://localhost:5555)

---

## 12. Questions ouvertes (à réintégrer ici dès qu'une réponse arrive)

- `BLOOD_BANK_MANAGER` / `HOSPITAL_STAFF` : rôles distincts de `BLOOD_BANK`/`HOSPITAL`,
  ou simples libellés UI ? Impacte directement la migration Prisma du §3.
- ~~Le mode offline (Dexie/service worker) est-il déjà testé sur un vrai scénario de
  coupure réseau, ou seulement câblé en théorie ?~~ **Répondu côté backend le
  2026-07-27** : le endpoint `/sync/batch` contournait entièrement la logique
  métier (pas d'allocation FEFO réelle, pas de RBAC) — corrigé et vérifié (voir §8).
  Reste ouvert : le **frontend** (Dexie/service worker/sync-engine.ts) n'a pas été
  testé en conditions réelles de coupure réseau dans cette session — seule l'API a
  été vérifiée directement via curl, pas le navigateur.
- Existe-t-il un vrai client/prospect identifié pour la vente, avec des exigences
  de conformité spécifiques (hébergement des données de santé, certification, etc.) ?
  Cela orienterait fortement les priorités de sécurité/conformité.
- Cible de déploiement réelle : auto-hébergé chez le client, ou SaaS opéré par vous ?
