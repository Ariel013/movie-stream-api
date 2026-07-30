# HEMOSAFE — Plan de test QA complet

> Document vivant : mets à jour le statut de chaque cas au fur et à mesure
> (✅ passé / ❌ échoué / ⏭️ non testé), et note le numéro de bug à côté de tout
> cas échoué. Généré le 2026-07-27 après un audit de code en 3 passes (backend
> module par module, endpoints/DTOs/guards, puis bootstrap de l'app) croisé avec
> une campagne de vérification API réelle (curl, tous rôles) menée dans la même
> session. Complète `CLAUDE.md` (historique des corrections) et `README.md`
> (setup/architecture) — ce document-ci est le script de test, pas la doc produit.

---

## Sommaire

**Introduction** — [0. Mode d'emploi](#0-comment-utiliser-ce-document) · [1. Prérequis](#1-prérequis-avant-de-commencer) · [2. Template de bug](#2-template-de-rapport-de-bug) · [3. Comptes de test](#3-comptes-de-test-créés-par-prisma-db-seed) · [4. Limitations connues](#4-️-limitations-connues-ne-pas-reporter-comme-nouveaux-bugs)

**Backend `[Swagger/Postman]`, module par module** — [5. Auth](#5-module-auth) · [6. Users](#6-module-users) · [7. Hospitals & Blood Banks](#7-module-hospitals--blood-banks-établissements) · [8. Blood Bags](#8-module-blood-bags-stock-de-poches) · [9. Donors](#9-module-donors) · [10. Patients](#10-module-patients) · [11. Prescriptions](#11-module-prescriptions) · [12. Réservations](#12-module-réservations--le-cœur-du-produit) · [13. Transfers](#13-module-transfers-inter-banques) · [14. Notifications](#14-module-notifications) · [15. Statistics](#15-module-statistics) · [16. Sync offline](#16-module-sync-hors-ligne--testé-via-api-cette-session-pas-via-lui) · [17. Audit Logs](#17-module-audit-logs) · [18. Health](#18-module-health)

**Frontend `[Web]`, page par page** — [19. Navigation/Sidebar](#19-navigation--sidebar) · [20. Login](#20-authentification-page-login) · [21. Dashboard (3 rôles)](#21-dashboard-daccueil-dashboard--3-variantes-par-rôle) · [22. Stock](#22-stock-dashboardstock--admin-blood_bank) · [23. Réservations](#23-réservations--liste-dashboardreservations-et-détail-dashboardreservationsid) · [24. Blood Search](#24-blood-search-dashboardblood-search--hospital) · [25. Donors](#25-donors-dashboarddonors--admin-blood_bank) · [26. Patients](#26-patients-dashboardpatients--hospital) · [27. Directory](#27-directory--annuaire-dashboarddirectory--tous-rôles) · [28. Map](#28-map-dashboardmap--admin-hospital-pas-blood_bank) · [29. Statistics](#29-statistics-dashboardstatistics--admin) · [30. Notifications](#30-notifications-dashboardnotifications--tous-rôles) · [31. Logs](#31-logs-dashboardlogs--admin) · [32. Settings](#32-settings-dashboardsettings--tous-rôles) · [33. Offline](#33-système-hors-ligne--ce-qui-est-réellement-testable)

**Synthèse `[Web + Swagger]`** — [34. Scénarios de bout en bout](#34-parcours-complets-inter-modules) · [35. Matrice RBAC](#35-matrice-rbac-récapitulative) · [36. Checklist finale](#36-checklist-finale-avant-de-considérer-la-campagne-terminée)

---

## 0. Comment utiliser ce document

1. Suis les modules dans l'ordre — certains dépendent de données créées dans les
   précédents (ex : il faut un donneur avant de tester un bilan de santé, une
   poche disponible avant de tester une réservation).
2. Pour chaque cas de test : exécute l'étape, compare au résultat attendu, coche.
3. Si un cas échoue, note-le avec le format du template de bug (§2) et **continue**
   les autres cas — ne bloque pas toute la campagne sur un seul bug, sauf si un
   cas ultérieur dépend explicitement du cas cassé (c'est indiqué à chaque fois).
4. La colonne « Rôle requis » indique qui peut légitimement faire l'action. Teste
   **toujours aussi** avec un rôle qui ne devrait PAS y arriver (RBAC négatif) —
   c'est indiqué explicitement dans chaque section « Cas négatifs / RBAC ».
5. Les cas marqués **[CONNU]** sont des comportements déjà identifiés comme
   probablement cassés ou non implémentés lors de l'audit — ne les reporte pas
   comme nouveaux bugs, confirme juste qu'ils se comportent comme décrit.
6. **Avec quel outil tester quelle partie** — chaque grand titre du sommaire est
   maintenant étiqueté, mais pour référence rapide :

   | Sections | Outil | Pourquoi |
   | --- | --- | --- |
   | **§5 à §18** (Backend, par module : Auth, Users, Hospitals/Blood Banks, Blood Bags, Donors, Patients, Prescriptions, Réservations, Transfers, Notifications, Statistics, Sync, Audit Logs, Health) | **Swagger** (`localhost:3001/api/docs`) ou Postman | Plus rapide/précis pour vérifier des codes HTTP exacts, des messages d'erreur, et changer de rôle en 2 clics via le token — sans naviguer dans l'UI |
   | **§19 à §33** (Frontend, page par page) | **Site web** (`localhost:3000`) | Ce sont des bugs d'interface (boutons morts, filtres cassés, états de chargement) invisibles depuis l'API — il faut regarder l'écran réel |
   | **§34** (Scénarios de bout en bout) | **Les deux**, souvent en alternant | Certaines étapes d'un scénario se vérifient plus vite en API (ex. l'allocation FEFO exacte), d'autres nécessitent l'UI (ex. la carte "Réservations actives" qui se met à jour) |
   | **§35** (Matrice RBAC) | Les deux, au choix | C'est une grille de synthèse, pas une nouvelle série de cas — recoupe ce que tu as déjà testé en §5-18 |

---

## 1. Prérequis avant de commencer

- [ ] Stack démarrée : `docker compose up -d` (Postgres+PostGIS, Redis), API sur
      `:3001`, Web sur `:3000` — ou lancés manuellement en dev (`npm run start:dev`
      / `npm run dev`), voir README §Démarrage rapide.
- [ ] Migrations appliquées : `npx prisma migrate deploy` (ou `migrate dev` **une
      seule fois sur base vide** — voir l'avertissement README sur le piège
      `facilities.location`).
- [ ] Seed exécuté : `npx prisma db seed`.
- [ ] Swagger accessible sur `http://localhost:3001/api/docs` — utile pour
      composer les requêtes si tu testes l'API directement (Postman/curl/Swagger UI)
      en plus du frontend.
- [ ] Décide de ton outil : **frontend uniquement** (comportement utilisateur réel)
      ou **frontend + API directe** (Swagger/Postman, pour isoler si un bug vient
      du backend ou de l'affichage). Ce document couvre les deux à chaque module.

---

## 2. Template de rapport de bug

Copie ce bloc pour chaque bug trouvé :

```
### BUG-<numéro>
Module :
Rôle utilisé :
Étapes pour reproduire :
  1.
  2.
Résultat attendu :
Résultat obtenu :
Sévérité (bloquant / majeur / mineur / cosmétique) :
Capture d'écran / réponse API brute (si pertinent) :
```

---

## 3. Comptes de test (créés par `prisma db seed`)

| Rôle | Email | Mot de passe | Établissement |
| --- | --- | --- | --- |
| `ADMIN` | `admin@hemosafe.ci` | `Admin1234!` | — (vue nationale) |
| `HOSPITAL` | `hopital@hemosafe.ci` | `Hospital1234!` | CHU de Cocody |
| `BLOOD_BANK` | `banque@hemosafe.ci` | `BloodBank1234!` | Centre National de Transfusion Sanguine (CNTS-ABJ) |

**Pour les tests RBAC croisés (IDOR)**, tu auras besoin d'un **2ᵉ compte HOSPITAL**
(autre hôpital, ex. Hôpital Général de Gagnoa) et d'un **2ᵉ compte BLOOD_BANK**
(autre banque, ex. Banque de Sang CHU de Cocody) — crée-les via `POST /users` en
`ADMIN` dès le module 4 (Users), tu en auras besoin dans presque tous les modules
suivants pour vérifier qu'un établissement ne peut pas toucher aux données d'un
autre.

---

## 4. ⚠️ Limitations connues (ne pas reporter comme nouveaux bugs)

| # | Comportement | Détail |
| --- | --- | --- |
| K1 | **Notifications temps réel absentes** | `EventsGateway` (WebSocket/Socket.io) existe dans le code mais n'est enregistré dans aucun module ni adapté dans `main.ts`. Le frontend n'a aucun client `socket.io-client`. Les notifications ne se rafraîchissent **jamais** en push — uniquement en rechargeant la page / en pollant `GET /notifications`. Ne teste pas "la notif apparaît en temps réel sans recharger" — ça ne peut pas marcher actuellement. |
| K2 | **Rate limiting login inactif en local** | `ThrottlerGuard` n'est jamais appliqué (ni globalement ni sur la route), donc `@Throttle()` sur `/auth/login` est inerte tant qu'on n'est pas derrière le Nginx de prod. Tenter 20 logins ratés d'affilée en local **ne bloquera pas** le compte — ce n'est pas un bug de cette campagne, mais à garder en tête si testé en pré-prod avec Nginx. |
| K3 | **Géolocalisation ignorée à la création d'un établissement** | `POST /hospitals` et `POST /blood-banks` acceptent `lat`/`lng` dans le formulaire mais ne les enregistrent jamais (la colonne PostGIS `location` reste vide). Un hôpital/banque créé via l'API **n'apparaîtra jamais** dans `/nearby` ni dans la recherche géolocalisée de sang. Seuls les établissements du seed ont une position. À tester explicitement en §7 pour confirmer que le comportement est bien celui-ci (et pas pire). |
| K4 | **Aucun test automatisé** | `hemosafe-api/test/` est vide. Le CI a un job qui tente d'en lancer — probablement no-op. Sans rapport avec tes tests manuels, juste pour contexte. |
| K5 | **Dashboards en fait bien câblés** (correction à CLAUDE.md) | Confirmé par inventaire frontend : `AdminDashboard`, `HospitalDashboard`, `BloodBankDashboard` appellent bien de vraies API (`/statistics/national`, `/blood-banks/nearby`, `/reservations`, `/blood-banks/:id/stock`). En revanche, plusieurs éléments visuels sur ces pages sont **décoratifs et non fonctionnels** : le panneau "Carte du réseau" sur AdminDashboard (points de couleur fixes, aucune donnée réelle), la barre de recherche héro sur HospitalDashboard (n'a pas de `onChange`, le bouton ignore ce qui est tapé), le panneau "Urgence" (lien statique). Ne pas reporter ces éléments décoratifs comme des bugs — ils sont documentés comme volontairement non-implémentés (probablement des maquettes non finies) ; mais **vérifie quand même** que les vrais chiffres/graphiques affichés sont corrects. |
| K6 | **Carte (`/dashboard/map`) confirmée 100% statique** | Aucun appel API dans tout le composant — la liste des 6 banques (position, stock, statut) est une constante codée en dur dans le fichier. `nationalAvailabilityMap` existe côté backend mais n'est exposée par aucune route HTTP. Ne teste pas "le stock affiché sur la carte est à jour" — c'est structurellement impossible actuellement. **Bug réel à reporter quand même** (pas juste une limitation) : les pastilles de filtre par groupe sanguin (`O+/A+/B+/O-`) sur cette page changent visuellement d'état au clic mais ne filtrent **jamais** la liste affichée — vérifie et confirme ce comportement cassé. |
| K7 | **Système offline construit mais non branché** | L'infrastructure offline (Dexie/IndexedDB, `sync-engine.ts`, retry avec backoff, résolution de conflit) est complète et fonctionnelle en soi, mais **aucune page réelle ne l'utilise** — Stock, Réservations, Blood Search, Donors, Patients appellent toutes `axios` directement, sans passer par la file d'attente offline. Concrètement : soumettre un formulaire hors-ligne échouera simplement (spinner bloqué ou échec silencieux selon la page), ça ne sera **pas** mis en attente puis synchronisé comme le sous-entend le widget `OfflineIndicator`. Seul le "Sync Now"/auto-sync à la reconnexion fonctionne réellement, mais avec une file vide en pratique. Ne teste pas "je crée une réservation hors-ligne, elle apparaît après reconnexion" en passant par l'UI — ça ne peut pas marcher aujourd'hui. Le widget `OfflineIndicator` lui-même (bandeau "mode hors-ligne", compteur, bouton "Sync Now") est fonctionnel et testable indépendamment. |
| K8 | **WebSocket confirmé mort des deux côtés** | Backend : `EventsGateway` n'est enregistré dans aucun module, aucun adapter WebSocket configuré dans `main.ts`. Frontend : `socket.io-client` est une dépendance déclarée mais **jamais importée nulle part** dans le code. La page Notifications ne se met donc jamais à jour toute seule — il faut recharger. La petite pastille rouge sur l'icône cloche du `TopBar` est **statique** (toujours affichée, aucune logique de compteur, aucun clic ne fait quoi que ce soit). |
| K9 | **Boutons morts recensés** | Plusieurs boutons "Voir"/"Voir détails" (Stock, Donors, Patients, Directory) n'ont **aucun** gestionnaire — clique dessus, rien ne se passe (aucune page de détail n'existe pour ces entités). "Ajouter un établissement" (Directory, ADMIN) est aussi sans handler. Dans Réglages, les onglets "Notifications" et "Préférences" sont 100% décoratifs (aucun état, aucune sauvegarde, le bouton "Sauvegarder" ne fait rien) ; le widget "Sync Now" en bas de la Sidebar (différent de celui d'`OfflineIndicator`) est également mort. À confirmer un par un en §Frontend plutôt qu'à re-reporter individuellement comme "nouveaux" bugs. |

---

## 5. Module Auth

**Endpoints :** `POST /api/v1/auth/login` (public) · `POST /api/v1/auth/refresh` (public, nécessite refresh token) · `POST /api/v1/auth/logout` · `GET /api/v1/auth/me`

### 5.1 Login — cas nominaux

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| A1 | Login avec `admin@hemosafe.ci` / `Admin1234!` | 200, reçoit `accessToken` + `refreshToken`, redirection vers `/dashboard` côté web |
| A2 | Login avec `hopital@hemosafe.ci` / `Hospital1234!` | 200, `role: HOSPITAL`, `facilityId` = CHU de Cocody |
| A3 | Login avec `CC` / `BloodBank1234!` | 200, `role: BLOOD_BANK`, `facilityId` = CNTS-ABJ |
| A4 | Après login, appeler `GET /auth/me` avec le token reçu | 200, renvoie le profil complet (email, rôle, `facilityId`, `facility: {name, type}`) |

### 5.2 Login — cas négatifs

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| A5 | Mauvais mot de passe | 401 `Invalid email or password` |
| A6 | Email inexistant | 401 (même message que A5 — ne doit **pas** révéler si l'email existe ou non) |
| A7 | Email mal formé (`pas-un-email`) | 400 (erreur de validation `IsEmail`) |
| A8 | Mot de passe < 8 caractères | 400 (validation `MinLength(8)`) |
| A9 | Body vide `{}` | 400 |
| A10 | Champ en trop dans le body, ex. `{"email":"...","password":"...","role":"ADMIN"}` | 400 — `whitelist`/`forbidNonWhitelisted` global doit rejeter tout champ non attendu (bon réflexe à tester partout, pas juste ici) |

### 5.3 Refresh token

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| A11 | Login, puis appeler `/auth/refresh` avec le `refreshToken` reçu | 200, nouveau `accessToken` + `refreshToken` |
| A12 | Rejouer l'ancien `refreshToken` après un refresh réussi | Comportement à observer — vérifier si l'ancien token est bien invalidé (rotation) ou encore accepté |
| A13 | Appeler `/auth/refresh` avec un token bidon | 401/403 |
| A14 | Appeler `/auth/refresh` avec un `accessToken` à la place du `refreshToken` | Doit être rejeté (stratégie `jwt-refresh` dédiée, pas la même que l'auth normale) |

### 5.4 Logout & expiration

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| A15 | Login puis `POST /auth/logout` | 204 |
| A16 | Après logout, retenter `/auth/refresh` avec l'ancien refreshToken | Doit échouer (le refresh token est invalidé en base côté serveur) |
| A17 | Désactiver un compte via `PATCH /users/:id` (`isActive: false` — **si le champ est exposé, voir module Users**) puis retenter une requête avec un token émis avant la désactivation | Doit échouer avant l'expiration naturelle du token (15 min) — le `JwtStrategy` revérifie `isActive` en base à chaque requête |
| A18 | Attendre l'expiration de l'access token (15 min) sans rafraîchir, puis appeler une route protégée | 401, le frontend doit déclencher un refresh automatique (intercepteur Axios) — vérifier que l'UI ne reste pas juste bloquée sur une erreur brute |

### 5.5 RBAC transverse (à répéter dans CHAQUE module suivant)

Pour toute route protégée par `@Roles(...)` : teste avec un rôle autorisé (200/201) **et** avec chaque rôle non autorisé (403), **et** sans token du tout (401), **et** avec un token expiré/invalide (401).

---

## 6. Module Users

**Endpoints :** `GET /users` · `GET /users/:id` · `POST /users` · `PATCH /users/:id` · `DELETE /users/:id` (désactivation)

### 6.1 Création — cas nominaux

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| U1 | ADMIN | Créer un `HOSPITAL` pour un hôpital quelconque | 201 |
| U2 | ADMIN | Créer un `BLOOD_BANK` pour une banque quelconque | 201 |
| U3 | ADMIN | Créer un 2ᵉ compte `HOSPITAL` pour un **autre** hôpital que celui du compte seed (nécessaire pour les tests IDOR des modules suivants) | 201 |
| U4 | ADMIN | Créer un 2ᵉ compte `BLOOD_BANK` pour une **autre** banque (nécessaire pour les tests IDOR) | 201 |
| U5 | HOSPITAL | Créer un `HOSPITAL` dans **son propre** établissement | 201 |
| U6 | BLOOD_BANK | Créer un `BLOOD_BANK` dans **sa propre** banque | 201 |

### 6.2 Création — sécurité (⚠️ zone corrigée cette session, à vérifier en priorité)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| U7 | HOSPITAL | Tenter de créer un compte avec `role: ADMIN` | **403** — `Cannot create a user with role ADMIN`. Si ça passe en 201, c'est une escalade de privilège critique. |
| U8 | BLOOD_BANK | Idem, tenter `role: ADMIN` | 403 |
| U9 | HOSPITAL | Tenter de créer un compte `role: BLOOD_BANK` (rôle différent du sien) | 403 |
| U10 | HOSPITAL | Tenter de créer un utilisateur avec `facilityId` d'un **autre** hôpital | 403 — `Cannot create user for another facility` |
| U11 | Email déjà utilisé (ex. `admin@hemosafe.ci`) | Tenter de créer un compte avec cet email, n'importe quel rôle | 409 `Email already in use` |
| U12 | Mot de passe < 8 caractères | Tenter de créer un compte | 400 |

### 6.3 Lecture et modification

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| U13 | ADMIN | `GET /users` | Voit tous les utilisateurs de tous les établissements |
| U14 | HOSPITAL | `GET /users` | Voit uniquement les utilisateurs de **son** établissement |
| U15 | HOSPITAL | `GET /users/:id` sur un utilisateur d'un **autre** établissement | 403 |
| U16 | HOSPITAL | `PATCH /users/:id` sur son propre profil (nom, téléphone) | 200 |
| U17 | HOSPITAL | `PATCH /users/:id` sur un utilisateur d'un **autre** établissement | 403 |
| U18 | N'importe quel rôle | `PATCH /users/:id` en tentant de passer `role` ou `password` dans le body | 400 — ces champs sont exclus du DTO de mise à jour (`OmitType(['password','role'])`), donc rejetés par `forbidNonWhitelisted` |

### 6.4 Désactivation

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| U19 | ADMIN | `DELETE /users/:id` sur un utilisateur | 200, l'utilisateur ne peut plus se connecter (`isActive: false`) |
| U20 | HOSPITAL ou BLOOD_BANK | Tenter `DELETE /users/:id` | 403 — seul ADMIN peut désactiver |
| U21 | (compte désactivé) | Après désactivation, tenter un login avec ce compte | 403 `Account is deactivated` |

---

## 7. Module Hospitals & Blood Banks (établissements)

**Endpoints (identiques en miroir pour les deux) :**
`GET /hospitals` · `GET /hospitals/nearby?lat&lng&radiusKm` · `GET /hospitals/:id` · `POST /hospitals` (ADMIN) · `PATCH /hospitals/:id` (ADMIN)
`GET /blood-banks` · `GET /blood-banks/nearby?lat&lng&radiusKm` · `GET /blood-banks/:id` · `GET /blood-banks/:id/stock` · `POST /blood-banks` (ADMIN) · `PATCH /blood-banks/:id` (ADMIN)

### 7.1 Lecture

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| H1 | `GET /hospitals` sans filtre | Liste des 4 hôpitaux du seed |
| H2 | `GET /hospitals?regionId=<uuid Abidjan>` | Uniquement les hôpitaux de la région filtrée |
| H3 | `GET /blood-banks` | Liste des 6 banques du seed |
| H4 | `GET /hospitals/:id` avec un ID inexistant | 404 |
| H5 | `GET /blood-banks/:id/stock` en tant que `BLOOD_BANK` sur **sa propre** banque | 200, résumé du stock par groupe sanguin |
| H6 | `GET /blood-banks/:id/stock` en tant que `BLOOD_BANK` sur une **autre** banque | 403 |
| H7 | `GET /blood-banks/:id/stock` en tant que `HOSPITAL` | 403 — `Hospitals cannot access blood bank stock details` |
| H8 | `GET /blood-banks/:id/stock` en tant que `ADMIN`, n'importe quelle banque | 200 |

### 7.2 Recherche géolocalisée (`nearby`)

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| H9 | `GET /hospitals/nearby?lat=5.359&lng=-3.988&radiusKm=20` (coordonnées d'Abidjan) | Renvoie les hôpitaux du seed situés dans ce rayon, triés par distance |
| H10 | Même requête avec `radiusKm=1` (très petit rayon) | Liste réduite ou vide selon la précision des coordonnées |
| H11 | Coordonnées en plein océan (`lat=0&lng=0`) | Liste vide, pas d'erreur |
| H12 | Paramètres manquants (`lat` seul) | 400 |

### 7.3 Création (ADMIN uniquement) — **inclut la vérification du K3**

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| H13 | ADMIN | `POST /hospitals` avec tous les champs y compris `lat`/`lng` valides | 201 |
| H14 | HOSPITAL ou BLOOD_BANK | Tenter `POST /hospitals` | 403 |
| H15 | ADMIN | `POST /blood-banks` avec tous les champs y compris `lat`/`lng` | 201 |
| H16 | ADMIN | **[CONNU K3]** Immédiatement après H15, chercher cette nouvelle banque via `GET /blood-banks/nearby` avec des coordonnées proches de celles fournies | **Elle n'apparaîtra pas** dans les résultats — confirme K3 (lat/lng jamais persistés). Si elle apparaît, tant mieux, note-le comme déjà corrigé. |
| H17 | ADMIN | `PATCH /hospitals/:id` — modifier le nom | 200 |
| H18 | ADMIN | `regionId` invalide (UUID inexistant) sur création | 400/404 selon la validation |

---

## 8. Module Blood Bags (stock de poches)

**Endpoints :** `GET /blood-bags` · `GET /blood-bags/types` · `GET /blood-bags/expiring-soon` · `GET /blood-bags/stock-summary/:bankId` · `GET /blood-bags/:id` · `POST /blood-bags` (BLOOD_BANK/ADMIN) · `PATCH /blood-bags/:id/discard` (BLOOD_BANK/ADMIN)

### 8.1 Référentiel & listing

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| B1 | `GET /blood-bags/types` | 8 groupes sanguins (O+, O-, A+, A-, B+, B-, AB+, AB-) avec UUID |
| B2 | `GET /blood-bags` sans filtre, en ADMIN | Liste paginée (défaut 20/page), triée FEFO (`expiresAt` croissant) |
| B3 | `GET /blood-bags?page=2&limit=5` | Pagination correcte, `total` cohérent avec le compte réel |
| B4 | `GET /blood-bags?status=AVAILABLE` | Uniquement les poches disponibles |
| B5 | `GET /blood-bags?aboGroup=O&rhFactor=POSITIVE` | ⚠️ **Zone corrigée cette session** — doit renvoyer uniquement les poches O+. Si le filtre est ignoré (renvoie toutes les poches), c'est une régression du bug déjà corrigé. |
| B6 | `GET /blood-bags?bloodBankId=<uuid>` en tant que BLOOD_BANK sur sa propre banque | Résultats filtrés à cette banque |
| B7 | BLOOD_BANK, `GET /blood-bags` sans filtre `bloodBankId` | Doit être automatiquement scopé à **sa propre** banque uniquement (pas de fuite inter-banque) |
| B8 | `GET /blood-bags/expiring-soon` | Poches expirant sous 48h, toutes banques si ADMIN, sa banque si BLOOD_BANK |
| B9 | `GET /blood-bags/stock-summary/:bankId` deux fois de suite (< 3 min d'écart), sans créer/modifier de poche entre les deux | Résultat identique (cache Redis 3 min) — pas un bug si figé, c'est voulu |
| B10 | Créer une poche puis rappeler `stock-summary` **avant** 3 min | Le nouveau total peut ne pas apparaître tout de suite (cache) — attendre le TTL ou vérifier si l'app invalide le cache à l'écriture (probablement pas encore le cas, à confirmer) |

### 8.2 Création — cas nominaux

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| B11 | BLOOD_BANK | Créer une poche avec `aboGroup`/`rhFactor`/`bloodTypeId` cohérents entre eux, `expiresAt` > `collectedAt` | 201, poche `status: AVAILABLE`, liée à sa propre banque |
| B12 | ADMIN | Créer une poche en spécifiant `bloodBankId` explicitement | 201 |

### 8.3 Création — cas négatifs

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| B13 | HOSPITAL | Tenter `POST /blood-bags` | 403 |
| B14 | BLOOD_BANK | `aboGroup: AB`, `rhFactor: NEGATIVE`, mais `bloodTypeId` pointant vers O+ | **400** `aboGroup/rhFactor (ABNEGATIVE) does not match bloodTypeId` — zone corrigée cette session, teste en priorité |
| B15 | BLOOD_BANK | `expiresAt` antérieure ou égale à `collectedAt` | 400 `expiresAt must be after collectedAt` |
| B16 | BLOOD_BANK | `volumeMl` hors bornes (< 100 ou > 600) | 400 |
| B17 | ADMIN | `POST /blood-bags` sans `bloodBankId` | 400 `bloodBankId is required for ADMIN` |
| B18 | BLOOD_BANK | `code` déjà utilisé par une autre poche | 409/500 selon la contrainte unique — à vérifier que ça renvoie une erreur propre (pas un 500 brut de Prisma) |
| B19 | BLOOD_BANK | `bloodTypeId` inexistant | 404 |

### 8.4 Discard (retrait)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| B20 | BLOOD_BANK | Discard une poche `AVAILABLE` de sa propre banque avec une raison ≥ 10 caractères | 200, `status: DISCARDED`, `discardedReason` rempli |
| B21 | BLOOD_BANK | Discard avec une raison < 10 caractères | 400 |
| B22 | BLOOD_BANK | Discard une poche d'une **autre** banque | 403 |
| B23 | BLOOD_BANK | Discard une poche déjà `DISTRIBUTED` ou déjà `DISCARDED` | 400 `Cannot discard a bag with status ...` |
| B24 | HOSPITAL | Tenter de discard n'importe quelle poche | 403 |

### 8.5 Cron / tâches planifiées (nécessite d'attendre ou de manipuler les dates en base)

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| B25 | Créer une poche avec `expiresAt` dans le passé (via Prisma Studio ou en base) puis attendre l'exécution du cron horaire (`markExpiredBags`) | La poche passe automatiquement `AVAILABLE → EXPIRED` |
| B26 | Créer une poche expirant dans < 48h, attendre le cron quotidien 8h (`alertNearExpiry`) — difficile à tester en conditions réelles, à défaut vérifier via les logs serveur que l'event `bags.expiring-soon` est bien émis | Notification générée pour le personnel de la banque concernée (cf. module Notifications) |

---

## 9. Module Donors

**Endpoints :** `GET /donors` · `GET /donors/:id` · `POST /donors` (BLOOD_BANK/ADMIN) · `PATCH /donors/:id` · `POST /donors/screenings` (BLOOD_BANK/ADMIN)

### 9.1 RBAC — priorité haute (zone corrigée cette session)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| D1 | HOSPITAL | `GET /donors` | **403** `Hospitals do not have access to the donor directory` — confirme que le lien est bien masqué côté frontend (sidebar) ET bloqué côté backend |
| D2 | HOSPITAL | `GET /donors/:id` sur un donneur existant | 403 |
| D3 | BLOOD_BANK | `GET /donors` | Voit uniquement les donneurs enregistrés dans **sa propre** banque |
| D4 | ADMIN | `GET /donors` | Voit tous les donneurs, toutes banques |

### 9.2 Création

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| D5 | BLOOD_BANK | Créer un donneur avec tous les champs requis (`nationalId`, `firstName`, `lastName`, `dob`, `bloodTypeId`) | 201 |
| D6 | HOSPITAL | Tenter `POST /donors` | 403 |
| D7 | BLOOD_BANK | `nationalId` déjà utilisé par un autre donneur | 409/erreur de contrainte unique — vérifier que le message est propre, pas un 500 brut |
| D8 | BLOOD_BANK | `dob` mal formée (pas ISO 8601) | 400 |

### 9.3 Modification — IDOR (zone corrigée cette session, priorité haute)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| D9 | BLOOD_BANK (propriétaire) | `PATCH /donors/:id` sur un donneur de sa propre banque | 200 |
| D10 | BLOOD_BANK (**autre** banque) | `PATCH /donors/:id` sur un donneur d'une banque différente | **403** `Access denied to this donor` — bug critique si ça passe (permettait avant correction de modifier les données d'un donneur d'un concurrent) |
| D11 | HOSPITAL | Tenter `PATCH /donors/:id` (même si ID valide) | 403 |
| D12 | ADMIN | `PATCH /donors/:id` sur n'importe quel donneur | 200 |

### 9.4 Bilan de santé (screening)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| D13 | BLOOD_BANK (propriétaire du donneur) | `POST /donors/screenings` avec `donorId`, `isPassed: true`, `hemoglobinGDl`, `bloodPressure`, `weightKg`, `temperatureC` | 201 |
| D14 | BLOOD_BANK (**autre** banque) | `POST /donors/screenings` sur un donneur d'une autre banque | **403** — zone corrigée cette session |
| D15 | BLOOD_BANK | Créer un screening avec `isPassed: false` | 201, et vérifier que le donneur passe automatiquement `isEligible: false` avec `ineligibilityReason` rempli (relire le donneur via `GET /donors/:id` après) |
| D16 | HOSPITAL | Tenter `POST /donors/screenings` | 403 |
| D17 | BLOOD_BANK | `donorId` inexistant | 404 |

---

## 10. Module Patients

**Endpoints :** `GET /patients` (HOSPITAL/ADMIN) · `GET /patients/:id` · `POST /patients` (HOSPITAL/ADMIN) · `PATCH /patients/:id` · `DELETE /patients/:id` (désactivation)

### 10.1 RBAC

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| P1 | BLOOD_BANK | `GET /patients` | 403 `Blood banks cannot access patient records` |
| P2 | HOSPITAL | `GET /patients` | Voit uniquement les patients de **son propre** hôpital |
| P3 | ADMIN | `GET /patients` | Voit tous les patients |

### 10.2 Création

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| P4 | HOSPITAL | Créer un patient avec juste `firstName`+`lastName` (seuls champs obligatoires) | 201, rattaché automatiquement à son propre hôpital |
| P5 | HOSPITAL | Créer un patient avec tous les champs optionnels (`nationalId`, `dob`, `bloodTypeId`, `medicalRecordNo`) | 201 |
| P6 | BLOOD_BANK | Tenter `POST /patients` | 403 |
| P7 | ADMIN | Créer un patient en spécifiant `hospitalId` explicitement | 201 |

### 10.3 Modification / désactivation — IDOR (zone corrigée cette session, priorité haute)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| P8 | HOSPITAL (propriétaire) | `PATCH /patients/:id` sur un patient de son hôpital | 200 |
| P9 | HOSPITAL (**autre** hôpital) | `PATCH /patients/:id` sur un patient d'un autre hôpital | **403** `Access denied to this patient` — bug critique si ça passe |
| P10 | HOSPITAL (**autre** hôpital) | `DELETE /patients/:id` (désactivation) sur un patient d'un autre hôpital | **403** — même correction, à tester séparément du PATCH |
| P11 | BLOOD_BANK | Tenter `PATCH` ou `DELETE` sur un patient (même ID valide) | 403 |
| P12 | HOSPITAL (propriétaire) | `DELETE /patients/:id` | 200, `isActive: false`, le patient n'apparaît plus dans les filtres "Actifs" du frontend |

---

## 11. Module Prescriptions

**Endpoints :** `GET /prescriptions` · `GET /prescriptions/unfulfilled` · `GET /prescriptions/:id` · `POST /prescriptions` (HOSPITAL/ADMIN) · `PATCH /prescriptions/:id/fulfill`

> ⚠️ Ce module n'a été vérifié que par relecture de code cette session, pas par appel API réel — à tester avec une attention particulière.

### 11.1 RBAC & création

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| PR1 | BLOOD_BANK | `GET /prescriptions` | 403 `Blood banks cannot access prescriptions` |
| PR2 | HOSPITAL | `GET /prescriptions` | Voit uniquement les prescriptions de son hôpital |
| PR3 | HOSPITAL | Créer une prescription (`patientId`, `bloodTypeId`, `quantity`, `urgency`) pour un patient de **son** hôpital | 201 |
| PR4 | BLOOD_BANK | Tenter `POST /prescriptions` | 403 |
| PR5 | HOSPITAL | Créer une prescription pour un `patientId` d'un **autre** hôpital | À vérifier : le service ne semble pas croiser `patient.hospitalId` avec `actor.facilityId` à la création — teste explicitement, c'est un IDOR potentiel non couvert par les corrections de cette session |

### 11.2 Fulfillment (satisfaction) & liaison avec les réservations

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| PR6 | HOSPITAL (même hôpital) | `PATCH /prescriptions/:id/fulfill` | 200 |
| PR7 | HOSPITAL (**autre** hôpital) | `PATCH /prescriptions/:id/fulfill` sur une prescription d'un autre hôpital | 403 |
| PR8 | ADMIN | `PATCH /prescriptions/:id/fulfill` sur n'importe quelle prescription | 200 |
| PR9 | HOSPITAL | `GET /prescriptions/unfulfilled` | Uniquement les prescriptions `isFulfilled: false`, scopées par hôpital si HOSPITAL |
| PR10 | HOSPITAL | **Scénario inter-module** — créer une réservation (`POST /reservations`) en passant `prescriptionId` d'une prescription existante et non expirée, avec le bon `bloodTypeId`/`quantity` | 201, la réservation est liée à la prescription |
| PR11 | HOSPITAL | Idem avec un `bloodTypeId` différent de celui de la prescription | 400 `Reservation blood type does not match prescription blood type` |
| PR12 | HOSPITAL | Idem avec une prescription déjà `isFulfilled: true` | 409 `Prescription is already fulfilled` |
| PR13 | HOSPITAL | Idem avec une prescription expirée (`expiresAt` passée) | 400 `Prescription has expired` |
| PR14 | HOSPITAL | **Scénario complet** — créer une prescription, créer une réservation liée, faire passer la réservation jusqu'à `DELIVERED` | Vérifier via `GET /prescriptions/:id` que `isFulfilled` passe automatiquement à `true` et `fulfilledAt` est rempli (logique dans `reservation-engine.service.ts`, transition DELIVERED) |

---

## 12. Module Réservations — le cœur du produit

**Endpoints :** `POST /reservations` · `GET /reservations` · `GET /reservations/:id` · `POST /reservations/search` · `PATCH /reservations/:id/status` · `POST /reservations/:id/verify-bag`

**FSM (à respecter strictement) :**

```
PENDING ──(BLOOD_BANK)──► CONFIRMED ──(BLOOD_BANK)──► DISPATCHED ──(HOSPITAL)──► DELIVERED
   │                          │
   └──(HOSPITAL ou BLOOD_BANK, cancelReason obligatoire)──► CANCELLED
   └──(automatique, cron chaque minute, après 24h)──► EXPIRED
```

### 12.1 Recherche géolocalisée (`POST /reservations/search`)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| R1 | HOSPITAL | Rechercher avec `bloodTypeId`, `quantity: 1`, coordonnées d'Abidjan, `radiusKm: 50` | Liste de banques triées par distance, avec `availableCount` et `nextExpiresAt` |
| R2 | HOSPITAL | Même recherche avec `quantity: 999` | Liste vide ou réduite aux banques ayant vraiment ce volume disponible |
| R3 | HOSPITAL | `radiusKm: 1` sur des coordonnées isolées | Liste vide, pas d'erreur |
| R4 | HOSPITAL | Coordonnées invalides (`lat: 999`) | 400 |

### 12.2 Création — allocation FEFO (⚠️ le bug bloquant corrigé cette session, priorité absolue)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| R5 | HOSPITAL | Créer une réservation avec `bloodBankId`, `bloodTypeId`, `aboGroup`/`rhFactor` cohérents, `quantity: 2`, `urgency: ROUTINE` sur une banque ayant du stock | **201** — si ça renvoie une erreur 500 mentionnant `pg_advisory_xact_lock`/`void`, c'est une régression du bug initial, à reporter en priorité absolue |
| R6 | HOSPITAL | Vérifier la réponse de R5 | Exactement 2 poches allouées dans `reservationBags`, les 2 poches qui expirent le plus tôt parmi le stock disponible (ordre FEFO), toutes deux passées `status: RESERVED` |
| R7 | HOSPITAL | Créer une réservation avec `aboGroup`/`rhFactor` incohérents avec `bloodTypeId` | 400 — zone corrigée cette session |
| R8 | BLOOD_BANK | Tenter `POST /reservations` | 403 `Blood banks cannot create reservations` |
| R9 | HOSPITAL | `quantity` > stock disponible, `urgency: ROUTINE` | 409 `Insufficient stock. Requested: X, available: Y` — **aucune poche ne doit être allouée** (vérifier qu'aucune poche n'est passée RESERVED malgré l'échec) |
| R10 | HOSPITAL | Même situation mais `urgency: EMERGENCY` | 201 — allocation **partielle** acceptée (moins de poches que demandé, mais au moins 1) |
| R11 | HOSPITAL | `urgency: EMERGENCY` mais stock = 0 pour ce groupe | 409 `No available bags of requested blood type — even for emergency` |
| R12 | HOSPITAL | `bloodBankId` inexistant ou inactif | 404 |
| R13 | HOSPITAL | `quantity` hors bornes (0 ou > 50) | 400 |
| R14 | HOSPITAL | **Concurrence (si possible à tester)** — deux requêtes `POST /reservations` simultanées sur le même `bloodBankId`+`bloodTypeId` avec un stock juste suffisant pour une seule | Une seule doit réussir intégralement, l'autre doit échouer proprement (409, pas de double-allocation de la même poche, pas de deadlock/timeout) — c'est exactement ce que le verrou consultatif est censé garantir |

### 12.3 Transitions FSM — respect des rôles (testé et validé cette session, à revérifier)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| R15 | HOSPITAL | Tenter de faire passer sa propre réservation `PENDING → CONFIRMED` | **403** — seul BLOOD_BANK peut confirmer |
| R16 | BLOOD_BANK | `PENDING → CONFIRMED` | 200, `confirmedAt` rempli |
| R17 | BLOOD_BANK | `CONFIRMED → DISPATCHED` | 200, `dispatchedAt` rempli |
| R18 | HOSPITAL | Tenter `CONFIRMED → DISPATCHED` | 403 |
| R19 | BLOOD_BANK | Tenter `DISPATCHED → DELIVERED` | **403** — seul HOSPITAL peut confirmer la livraison |
| R20 | HOSPITAL | `DISPATCHED → DELIVERED` | 200, `deliveredAt` rempli. Vérifier via `GET /blood-bags/:id` sur chaque poche allouée que son statut est passé `DISTRIBUTED` |
| R21 | N'importe quel rôle | Tenter une transition invalide, ex. `PENDING → DELIVERED` directement (saut d'étape) | 400 `Transition ... is not allowed` |
| R22 | N'importe quel rôle | Tenter une transition depuis un état terminal (`DELIVERED → *`, `CANCELLED → *`) | 400 |
| R23 | HOSPITAL **ou** BLOOD_BANK (propriétaires) | `PENDING → CANCELLED` ou `CONFIRMED → CANCELLED` avec `cancelReason` ≥ 5 caractères | 200. Vérifier que les poches précédemment `RESERVED` repassent `AVAILABLE` |
| R24 | N'importe quel rôle | Tenter `CANCELLED` sans `cancelReason` ou avec < 5 caractères | 400 `cancelReason is required` |
| R25 | ADMIN | Consulter une réservation `PENDING` | Aucune action de transition ne doit être proposée côté frontend (voir §Frontend R.detail) ; côté API, vérifier si ADMIN peut forcer une transition (le code actuel ne semble accorder à ADMIN que les mêmes permissions que BLOOD_BANK pour confirm/dispatch — teste explicitement) |

### 12.4 Accès croisé (IDOR) sur les réservations

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| R26 | HOSPITAL (**autre** hôpital) | `GET /reservations/:id` sur une réservation qui ne lui appartient pas | 403 |
| R27 | BLOOD_BANK (**autre** banque) | Idem | 403 |
| R28 | HOSPITAL (**autre** hôpital) | Tenter `PATCH /reservations/:id/status` sur une réservation d'un autre hôpital | 403 |
| R29 | HOSPITAL | `GET /reservations` | Ne voit que les réservations de son propre hôpital |
| R30 | BLOOD_BANK | `GET /reservations` | Ne voit que les réservations adressées à sa propre banque |

### 12.5 Expiration automatique (cron, chaque minute)

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| R31 | Créer une réservation, puis en base (Prisma Studio) reculer artificiellement `expiresAt` à une date passée, tant que le statut est encore `PENDING` ou `CONFIRMED` | Dans la minute qui suit, la réservation passe automatiquement `EXPIRED`, ses poches repassent `AVAILABLE`, une notification `RESERVATION_EXPIRED` doit être générée pour le demandeur |
| R32 | Répéter R31 mais avec le statut `DISPATCHED` | Ne doit **pas** expirer automatiquement (le cron ne cible que PENDING/CONFIRMED) — comportement attendu, pas un bug |

### 12.6 Vérification de poche au retrait (`verify-bag`)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| R33 | BLOOD_BANK (propriétaire) | `POST /reservations/:id/verify-bag` avec le `bagCode` d'une poche réellement allouée à cette réservation | `{valid: true, message: "Bag verified successfully"}` |
| R34 | BLOOD_BANK | Même appel avec un code de poche qui n'appartient pas à cette réservation | `{valid: false, message: "... is not part of this reservation"}` |
| R35 | BLOOD_BANK | Code de poche inexistant | `{valid: false, message: "... not found"}` |
| R36 | BLOOD_BANK (**autre** banque) | Vérifier une poche appartenant à une autre banque | `{valid: false, message: "... does not belong to your blood bank"}` |

---

## 13. Module Transfers (inter-banques)

**Endpoints :** `GET /transfers` · `GET /transfers/:id` · `POST /transfers` (BLOOD_BANK/ADMIN) · `PATCH /transfers/:id/status` · `DELETE /transfers/:id/cancel`

**FSM :** `INITIATED → IN_TRANSIT → RECEIVED`, ou `INITIATED → CANCELLED`.

### 13.1 RBAC & accès (⚠️ crash HOSPITAL corrigé cette session)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| T1 | HOSPITAL | `GET /transfers` | **200, liste vide** — si ça renvoie une 500, c'est une régression du bug corrigé cette session (filtre invalide sur colonne UUID) |
| T2 | HOSPITAL | Tenter `POST /transfers` | 403 |
| T3 | BLOOD_BANK | `GET /transfers` | Voit les transferts où sa banque est source **ou** destination |
| T4 | ADMIN | `GET /transfers` | Voit tous les transferts |

### 13.2 Création

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| T5 | BLOOD_BANK | Créer un transfert vers une autre banque avec des poches `AVAILABLE` lui appartenant | 201, poches passées `RESERVED` |
| T6 | BLOOD_BANK | `toBankId` identique à sa propre banque | 400 `Source and destination blood banks must differ` |
| T7 | BLOOD_BANK | `toBankId` inexistant | **400** `Destination blood bank ... not found or inactive` — zone corrigée cette session (avant : plantait probablement en 500 sur l'échec du `connect` Prisma) |
| T8 | BLOOD_BANK | Inclure une poche appartenant à une **autre** banque dans `bloodBagIds` | 403 `Bags do not belong to the source bank` |
| T9 | BLOOD_BANK | Inclure une poche déjà `RESERVED`/`DISTRIBUTED` | 409 `Bags not in AVAILABLE status` |
| T10 | BLOOD_BANK | `bloodBagIds: []` (vide) | 400 (`ArrayMinSize(1)`) |

### 13.3 Transitions

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| T11 | Banque source | `PATCH /transfers/:id/status {status: IN_TRANSIT}` | 200, `inTransitAt` rempli |
| T12 | Banque **destination** (pas la source) | Tenter `IN_TRANSIT` | 403 `Only the initiating bank can mark transfer as IN_TRANSIT` |
| T13 | Banque destination | `PATCH .../status {status: RECEIVED}` | 200, `receivedAt` rempli. Vérifier que les poches passent `AVAILABLE` **et changent de `bloodBankId`** vers la banque destination (`GET /blood-bags/:id` sur chaque poche transférée) |
| T14 | Banque source (pas la destination) | Tenter `RECEIVED` | 403 `Only the recipient bank can mark transfer as RECEIVED` |
| T15 | N'importe qui | Transition invalide (ex. `INITIATED → RECEIVED` directement) | 400 |
| T16 | Banque source | `DELETE /transfers/:id/cancel` sur un transfert encore `INITIATED` | 200, poches repassées `AVAILABLE`, transfert `CANCELLED` |
| T17 | Banque source | Tenter d'annuler un transfert déjà `IN_TRANSIT` ou `RECEIVED` | 400 `Only INITIATED transfers can be cancelled` |
| T18 | Banque destination (pas la source) | Tenter d'annuler | 403 `Only the initiating bank can cancel a transfer` |

---

## 14. Module Notifications

**Endpoints :** `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/read-all` · `PATCH /notifications/:id/read`

> Rappel K1/K8 : pas de temps réel, tout est en polling. Recharge la page pour voir une nouvelle notification.

### 14.1 Lecture et scoping

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| N1 | N'importe quel rôle | `GET /notifications` | Ne renvoie que **ses propres** notifications (scopé par `userId`, jamais par établissement) |
| N2 | N'importe quel rôle | `GET /notifications?isRead=false` | Uniquement les non lues |
| N3 | N'importe quel rôle | `GET /notifications?page=2&limit=10` | Pagination correcte |
| N4 | N'importe quel rôle | `GET /notifications/unread-count` | Compte cohérent avec le nombre réel de non lues |

### 14.2 Marquage comme lu

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| N5 | Propriétaire | `PATCH /notifications/:id/read` sur sa propre notification | 200, `isRead: true`, `readAt` rempli |
| N6 | **Autre utilisateur** | `PATCH /notifications/:id/read` sur une notification qui ne lui appartient pas (deviner un UUID d'une notif d'un autre user) | **403** `You can only mark your own notifications as read` — teste explicitement, c'est un IDOR sur données personnelles |
| N7 | Propriétaire | `PATCH /notifications/read-all` | 200, toutes ses notifications non lues passent lues, `unread-count` retombe à 0 |

### 14.3 Génération automatique (déclenchée par d'autres modules — teste en lien avec §12/§8)

| # | Scénario déclencheur | Résultat attendu côté notifications |
| --- | --- | --- |
| N8 | HOSPITAL crée une réservation (§R5) | Le personnel `BLOOD_BANK` de la banque ciblée reçoit une notification `SYSTEM` "New reservation request" — vérifier avec `GET /notifications` connecté en tant que ce personnel |
| N9 | HOSPITAL marque une réservation `DELIVERED` (§R20) | Le personnel de la banque reçoit "Reservation delivered" |
| N10 | Une réservation expire automatiquement (§R31) | Le demandeur original (HOSPITAL) reçoit une notification `RESERVATION_EXPIRED` |
| N11 | Le cron `alertNearExpiry` détecte des poches expirant sous 48h (§B26, difficile à déclencher manuellement) | Le personnel de la banque concernée reçoit une notification `BAG_EXPIRING_SOON` groupée (une notif listant plusieurs codes de poches, pas une par poche) |
| N12 | Un `HealthScreening` échoue (`isPassed: false`, §D15) | Vérifier s'il existe une notification associée — **à confirmer**, le code actuel ne semble pas générer de notification sur ce cas précis, uniquement mettre à jour l'éligibilité du donneur |

---

## 15. Module Statistics

**Endpoints :** `GET /statistics/national` (ADMIN/HOSPITAL) · `GET /statistics/regional/:regionId` (ADMIN) · `GET /statistics/facility/:facilityId/stock` · `GET /statistics/donors` (ADMIN) · `GET /statistics/reservation-trends?days=N`

> Tous ces endpoints sont mis en cache Redis 3 minutes (ajouté cette session) — si tu modifies des données puis rappelles l'endpoint immédiatement après, le résultat peut être périmé de quelques minutes. Ce n'est pas un bug.

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| S1 | ADMIN | `GET /statistics/national` | Agrégats cohérents : nombre de poches par statut, total donneurs, total hôpitaux/banques actifs, réservations par statut, poches par groupe sanguin |
| S2 | HOSPITAL | `GET /statistics/national` | 200 (autorisé, contrairement à `regional`/`donors`) |
| S3 | BLOOD_BANK | `GET /statistics/national` | 403 (rôle non autorisé sur cette route) |
| S4 | ADMIN | `GET /statistics/regional/:regionId` | Agrégats filtrés à la région |
| S5 | HOSPITAL ou BLOOD_BANK | Tenter `GET /statistics/regional/:regionId` | 403 |
| S6 | BLOOD_BANK (propriétaire) | `GET /statistics/facility/:facilityId/stock` sur sa propre banque | 200 |
| S7 | BLOOD_BANK (**autre** banque) | Idem sur une autre banque | 403 |
| S8 | HOSPITAL | Tenter `GET /statistics/facility/:facilityId/stock` | 403 `Hospitals cannot access facility stock details` |
| S9 | ADMIN | `GET /statistics/donors` | Top 10 donneurs par nombre de dons + tendance sur 12 mois |
| S10 | HOSPITAL/BLOOD_BANK | Tenter `GET /statistics/donors` | 403 |
| S11 | N'importe quel rôle autorisé | `GET /statistics/reservation-trends?days=7` puis `?days=90` | Résultats différents, cohérents avec la fenêtre demandée ; `days` par défaut = 30 si omis |

---

## 16. Module Sync (hors-ligne) — testé via API cette session, pas via l'UI

**Endpoints :** `POST /sync/batch` · `GET /sync/pull?since=&scopes=`

> ⚠️ Rappel K7 : **le frontend n'utilise pas du tout ce mécanisme actuellement.** Cette section teste le contrat API directement (Postman/curl/Swagger), pas un scénario utilisateur réel dans le navigateur — utile si/quand le frontend sera branché dessus, et pour vérifier que le backend est solide en attendant.

### 16.1 `POST /sync/batch` — traite jusqu'à 50 opérations en une fois

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| SY1 | HOSPITAL | Envoyer une opération `{method: POST, endpoint: /api/v1/reservations, payload: {...}}` avec un `operationId` UUID valide | `status: applied` — et vérifier que ça a **réellement alloué des poches FEFO** (`GET /reservations/:id` sur l'ID renvoyé), pas juste créé une coquille vide — c'est le chantier corrigé cette session |
| SY2 | HOSPITAL | Rejouer exactement la **même** opération (même `operationId`) | `status: duplicate` — ne doit **pas** créer une deuxième réservation |
| SY3 | HOSPITAL | Envoyer une opération avec `payload.hospitalId` pointant vers un **autre** hôpital que le sien | La réservation créée doit rester rattachée à **son propre** hôpital réel — l'`hospitalId` du payload doit être ignoré (protection anti-usurpation ajoutée cette session) |
| SY4 | HOSPITAL | Envoyer une opération de création de poche (`endpoint: /api/v1/blood-bags`) | 403 attendu si le rôle n'a pas le droit (le dispatch réutilise les mêmes règles RBAC que l'API en ligne) |
| SY5 | BLOOD_BANK | Envoyer une opération PATCH sur une poche avec `payload: {status: 'DISCARDED', reason: '...'}` | Doit aboutir à un vrai discard (route interne vers `discard()`) |
| SY6 | BLOOD_BANK | Envoyer une opération PATCH avec un `status` autre que `DISCARDED` | 400 `Unsupported offline blood-bag update` — l'API en ligne n'expose pas de PATCH générique sur les poches, le dispatch offline ne doit pas en inventer un |
| SY7 | HOSPITAL | Envoyer un lot de 51 opérations d'un coup | 400 (`ArrayMaxSize(50)`) |
| SY8 | HOSPITAL | Provoquer un cas où le backend renverrait normalement un 409 (à identifier — ex. réserver un stock déjà épuisé via sync) | `status: conflict`, `errorCode: 409` — vérifier que le champ `status` est bien `conflict` et pas `error` (bug de lecture du code d'erreur corrigé cette session) |

### 16.2 `GET /sync/pull`

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| SY9 | BLOOD_BANK | `GET /sync/pull?scopes=notifications` après avoir reçu plusieurs notifications (via §N8) | Les notifications apparaissent bien dans la réponse — zone corrigée cette session (avant : toujours vide pour HOSPITAL/BLOOD_BANK, bug `facilityId` vs `userId`) |
| SY10 | BLOOD_BANK | `GET /sync/pull?scopes=stock` | Poches de **sa propre** banque uniquement |
| SY11 | HOSPITAL | `GET /sync/pull?scopes=reservations` | Réservations où son hôpital est impliqué |
| SY12 | N'importe qui | `GET /sync/pull` sans `since` | Renvoie les ~500 dernières entrées par portée (chargement initial) |
| SY13 | N'importe qui | `GET /sync/pull?since=<ISO d'il y a 1h>` | Uniquement les entrées modifiées après cette date |

---

## 17. Module Audit Logs

**Endpoint :** `GET /audit-logs` (ADMIN uniquement)

| # | Rôle acteur | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| AL1 | ADMIN | `GET /audit-logs` | Liste paginée (défaut `limit=100`), triée par date décroissante |
| AL2 | HOSPITAL ou BLOOD_BANK | Tenter `GET /audit-logs` | 403 |
| AL3 | ADMIN | Effectuer n'importe quelle mutation ailleurs (créer une poche, changer un statut de réservation…) puis rappeler `GET /audit-logs` | Une nouvelle entrée apparaît, avec `action` = `METHODE /chemin`, `entity`, `role`, `userId`, `ipAddress` corrects |
| AL4 | ADMIN | Vérifier une mutation qui **échoue** (ex. tentative refusée en 403 ailleurs) | Confirmer si l'audit log enregistre aussi les tentatives échouées ou seulement les succès (l'intercepteur se déclenche sur toute requête POST/PUT/PATCH/DELETE, à vérifier si le corps de la réponse d'erreur produit quand même une entrée) |

---

## 18. Module Health

**Endpoints :** `GET /health` (public) · `GET /health/metrics` (public)

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| HE1 | `GET /health`, base de données et Redis actifs | 200, `status: ok`, latences DB/Redis renseignées |
| HE2 | Couper Redis (`docker compose stop redis`) puis rappeler `GET /health` | 503, `checks.redis.status: error` |
| HE3 | Relancer Redis, couper Postgres, rappeler | 503, `checks.database.status: error` |
| HE4 | `GET /health/metrics` | Texte au format Prometheus (`# HELP`, `# TYPE`, métriques `process_uptime_seconds` etc.) |
| HE5 | Appeler `/health` **sans** token d'authentification | 200 — doit rester public (utilisé par Docker/Nginx) |

---

## PARTIE FRONTEND

> Teste chaque page avec **les 3 rôles**, même quand la sidebar ne montre le lien
> qu'à un seul rôle — la plupart des pages n'ont **aucune protection côté
> composant**, seule la sidebar cache le lien. Accéder à l'URL directement avec un
> rôle non prévu doit être testé systématiquement : soit la page affiche quelque
> chose de raisonnable (lecture seule, vide), soit les actions échouent proprement
> via l'API (403) — mais ne doit jamais planter le rendu.

## 19. Navigation & Sidebar

| # | Rôle | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| F1 | ADMIN | Se connecter, observer la sidebar | Liens visibles : Dashboard, Stock, Reservations, Donors, Directory, Map, Statistics, Notifications, Logs, Settings (**pas** Blood Search, **pas** Patients) |
| F2 | HOSPITAL | Se connecter, observer la sidebar | Liens visibles : Dashboard, Reservations, Blood Search, Patients, Directory, Map, Notifications, Settings (**pas** Stock, **pas** Donors, **pas** Statistics, **pas** Logs) |
| F3 | BLOOD_BANK | Se connecter, observer la sidebar | Liens visibles : Dashboard, Stock, Reservations, Donors, Directory, Notifications, Settings (**pas** Blood Search, **pas** Patients, **pas** Map, **pas** Statistics, **pas** Logs) |
| F4 | N'importe quel rôle | Naviguer directement vers l'URL d'une page masquée par la sidebar (ex. HOSPITAL vers `/dashboard/stock`) | La page se charge quand même (pas de garde de layout par rôle) — vérifie qu'elle ne casse pas et que les actions d'écriture échouent bien côté API |
| F5 | Non connecté | Naviguer vers n'importe quelle URL `/dashboard/*` | Redirection vers `/auth/login` |
| F6 | Connecté | Naviguer vers `/auth/login` | Redirection automatique vers `/dashboard` |
| F7 | Connecté | Naviguer vers `/` (racine) | Redirige vers `/auth/login` puis immédiatement vers `/dashboard` — vérifier que le bouton "précédent" du navigateur ne boucle pas indéfiniment |
| F8 | N'importe qui | Cliquer sur l'icône cloche (notifications) dans le TopBar | **[CONNU K9]** Ne fait rien — bouton mort, pas de navigation vers `/dashboard/notifications`. Confirme juste que c'est bien le comportement (pas une régression d'un lien qui marchait avant) |
| F9 | N'importe qui | Observer le panneau "Mode hors-ligne" en bas de la sidebar (différent du widget `OfflineIndicator`) | **[CONNU K9]** Le bouton "Sync Now" de ce panneau ne fait rien — purement décoratif |

## 20. Authentification (page login)

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| F10 | Champ email vide, soumettre | Erreur inline "Invalid email address" sous le champ (validation zod côté client, avant même l'appel API) | ✅
| F11 | Mot de passe < 6 caractères, soumettre | Erreur inline "Password must be at least 6 characters" — **note : le frontend valide ≥6, le backend valide ≥8** ; teste un mot de passe de 6-7 caractères pour voir lequel des deux messages apparaît en pratique | ✅
| F12 | Identifiants corrects | Connexion réussie, redirection `/dashboard`, le rôle correct s'affiche dans la sidebar/topbar | ✅
| F13 | Identifiants incorrects | Bandeau rouge au-dessus du bouton avec le message d'erreur serveur ; le champ mot de passe **n'est pas vidé** (vérifie que ce n'est pas gênant/dangereux niveau UX) | ✅
| F14 | Cliquer sur l'icône œil dans le champ mot de passe | Bascule affichage/masquage du texte | ✅
| F15 | Se connecter, ouvrir les DevTools → Application → Local Storage | Vérifie la présence de la clé `hemosafe-auth` contenant `accessToken`/`refreshToken`/`user` en clair — **point d'attention sécurité, pas un bug à reporter dans cette campagne, mais à signaler** : ce n'est pas dans un cookie httpOnly, donc exposé à un XSS potentiel | ✅
| F16 | Liens du pied de page (Confidentialité/Mentions légales/Sécurité) | **[CONNU]** Ne mènent nulle part (`href="#"`) | ✅

## 21. Dashboard d'accueil (`/dashboard`) — 3 variantes par rôle

### 21.1 Vue ADMIN

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| F17 | Se connecter en ADMIN, observer les cartes KPI | Hôpitaux/Banques/Poches disponibles/Réservations/Expirations — comparer aux vrais chiffres via `GET /statistics/national` en parallèle pour confirmer la cohérence | ✅
| F18 | Observer le graphique en courbes (réservations vs livrées, 7 jours) | Cohérent avec `GET /statistics/reservation-trends?days=7` | ✅
| F19 | Observer le panneau "Carte du réseau" | **[CONNU K5]** Points de couleur fixes, ne représente pas le vrai réseau — confirme juste que ça ne casse pas, ne reporte pas comme bug | ✅
| F20 | Cliquer "Ouvrir la carte nationale →" | Navigue vers `/dashboard/map` | ✅
| F21 | Couper l'API backend puis recharger `/dashboard` | **Aucun message d'erreur visible** — toutes les cartes retombent silencieusement à 0/`—`. À reporter comme amélioration UX souhaitable (pas un crash, mais une confusion possible pour l'utilisateur) | ✅

### 21.2 Vue HOSPITAL

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| F22 | Se connecter en HOSPITAL, observer la barre de recherche héro en haut | **[CONNU K9]** Taper du texte n'a aucun effet ; le bouton "Rechercher" navigue vers `/dashboard/blood-search` en ignorant le texte saisi | ⏭️
| F23 | Observer "Banques à proximité" | Résultats réels (top 3) depuis `/blood-banks/nearby` — **note : les coordonnées utilisées sont celles d'Abidjan-centre codées en dur**, pas la position réelle de l'hôpital connecté ; si tu es connecté avec un hôpital loin d'Abidjan (ex. Gagnoa), les résultats peuvent sembler incohérents — ce n'est pas un bug de calcul, c'est la coordonnée de départ qui est fausse | ⏭️
| F24 | Observer "Mes réservations" (compteurs) | Cohérents avec un `GET /reservations` filtré côté client par statut |
| F25 | Observer "Réservations actives" | Jusqu'à 4 cartes, bordure rouge si `urgency: EMERGENCY` ou expire sous 3h — crée une réservation EMERGENCY (§R10) puis reviens ici pour vérifier visuellement |
| F26 | Cliquer sur une réservation active | Navigue vers `/dashboard/reservations/[id]` |

### 21.3 Vue BLOOD_BANK

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| F27 | Se connecter en BLOOD_BANK, observer les métriques | Poches disponibles / Réservations en cours / Stock expiré (rouge si > 0) — cohérent avec `/blood-banks/:id/stock` |
| F28 | Observer "Niveaux de stock par groupe" | Seuils : Stable ≥50, Modéré ≥20, Critique <20 — teste les valeurs limites (19 vs 20, 49 vs 50) si possible en ajustant le stock |
| F29 | Observer "Demandes en attente de confirmation" | Réservations `PENDING` avec boutons **Confirmer**/**Refuser** inline |
| F30 | Cliquer **Confirmer** sur une demande | `PATCH /reservations/:id/status {CONFIRMED}`, la ligne disparaît de la liste sans recharger toute la page, le compteur se met à jour |
| F31 | Cliquer **Refuser** sur une demande | `PATCH .../status {CANCELLED, cancelReason: 'Refusé depuis le tableau de bord'}` — vérifier que la poche revient bien `AVAILABLE` (comme testé en §R23) |
| F32 | Se connecter avec un compte BLOOD_BANK **sans `facilityId`** (scénario à provoquer manuellement si possible) | **[CONNU]** Le spinner de chargement tourne indéfiniment — le `useEffect` ne se déclenche jamais. Confirme ce comportement plutôt que d'attendre que ça finisse par charger |

---

## 22. Stock (`/dashboard/stock`) — ADMIN, BLOOD_BANK

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F33 | BLOOD_BANK | Ouvrir la page | Liste des poches de sa banque (jusqu'à 100 lignes, **pas de pagination au-delà**) |
| F34 | BLOOD_BANK | Utiliser la recherche texte (code ou groupe sanguin) | Filtrage instantané côté client |
| F35 | BLOOD_BANK | Utiliser les pastilles de statut (Toutes/Disponible/Réservée/Distribuée/Expirée) | Filtrage cohérent |
| F36 | BLOOD_BANK | Observer les cartes résumé (Disponibles/Réservées/Distribuées/Expirées) | **Attention** : ces compteurs sont calculés sur les 100 lignes chargées, pas sur le total réel — si la banque a plus de 100 poches, les chiffres seront faux. Teste ce cas si le volume de données le permet (le seed en a 118 pour CNTS) |
| F37 | BLOOD_BANK | Cliquer "Enregistrer une poche", remplir le formulaire avec un groupe ABO/Rhésus cohérent | Modal se ferme, liste rafraîchie, nouvelle poche visible |
| F38 | BLOOD_BANK | Dans le même formulaire, sélectionner un groupe qui n'existe pas dans le référentiel (normalement impossible via les selects, mais vérifie que le message "Groupe sanguin introuvable." apparaît si ça arrive) | Erreur inline dans le modal |
| F39 | BLOOD_BANK | Cliquer "Voir" sur une ligne | **[CONNU K9]** Ne fait rien — pas de page de détail poche |
| F40 | ADMIN | Ouvrir la page | Le bouton "Enregistrer une poche" est visible (rôle autorisé) |
| F41 | HOSPITAL | Naviguer directement vers `/dashboard/stock` | Page accessible (pas de garde), mais le bouton d'enregistrement est masqué ; si tu forces l'appel API sous-jacent, confirme le 403 |
| F42 | Couper le réseau puis recharger la page | Liste tombe silencieusement à vide, sans message d'erreur visible |

## 23. Réservations — liste (`/dashboard/reservations`) et détail (`/dashboard/reservations/[id]`)

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F43 | Tous | Ouvrir la liste | Réservations scopées par rôle (cohérent avec §R29/R30) |
| F44 | Tous | Filtrer par statut via les pastilles | **Bug confirmé** : le statut `EXPIRED` n'apparaît **pas** dans les pastilles de filtre alors qu'il existe et peut s'afficher dans la liste — impossible de filtrer spécifiquement dessus depuis l'UI |
| F45 | HOSPITAL | Observer le bouton "Nouvelle réservation" | Visible uniquement pour HOSPITAL, mène à `/dashboard/blood-search` |
| F46 | ADMIN/BLOOD_BANK | Observer le bouton "Nouvelle réservation" | Absent |
| F47 | Tous | Cliquer "Voir" sur une ligne | Navigue vers le détail |
| F48 | BLOOD_BANK, sur une réservation `PENDING` | Le bouton "Confirmer la réservation" est visible | Clic → `PATCH .../status {CONFIRMED}`, statut mis à jour à l'écran sans recharger |
| F49 | HOSPITAL, sur la même réservation une fois `PENDING` | **Aucun** bouton d'action visible | Confirme qu'un HOSPITAL ne peut pas confirmer sa propre demande depuis l'UI (cohérent avec R15) |
| F50 | BLOOD_BANK, sur une réservation `CONFIRMED` | Bouton "Marquer comme expédié" | Clic → `DISPATCHED` |
| F51 | HOSPITAL, sur une réservation `DISPATCHED` | Bouton "Confirmer la réception" | Clic → `DELIVERED` |
| F52 | ADMIN, sur n'importe quelle réservation à n'importe quel statut | **Aucun bouton d'action FSM** | Uniquement lecture (info hôpital/banque/poches/chronologie) — confirme que c'est le comportement voulu, pas un oubli |
| F53 | HOSPITAL ou BLOOD_BANK, sur une réservation `PENDING`/`CONFIRMED` | Bouton "Annuler" révèle un champ de motif obligatoire | Motif vide → bouton de confirmation reste désactivé ; motif rempli → `PATCH .../status {CANCELLED, cancelReason}` |
| F54 | Tous | Naviguer vers un ID de réservation inexistant | Page d'erreur propre centrée ("Réservation introuvable.") avec bouton retour — **cette page a une meilleure gestion d'erreur que les autres**, confirme que ça reste le cas |
| F55 | HOSPITAL (autre hôpital) | Naviguer vers l'ID d'une réservation qui ne lui appartient pas | L'appel API renvoie 403 (cohérent R26) — vérifie comment la page l'affiche (message d'erreur générique attendu, même traitement que F54) |

## 24. Blood Search (`/dashboard/blood-search`) — HOSPITAL

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F56 | HOSPITAL | Ouvrir la page, le groupe sanguin est présélectionné | Premier groupe de la liste auto-sélectionné |
| F57 | HOSPITAL | Rechercher avec quantité=1, rayon=50km | Résultats affichés avec distance, stock dispo, prochaine expiration |
| F58 | HOSPITAL | **Attention** : la recherche utilise des coordonnées fixes (Abidjan-centre), pas la position réelle de l'hôpital connecté — teste avec le compte Gagnoa (loin d'Abidjan) | Les résultats resteront centrés sur Abidjan, pas sur Gagnoa — confirme, ne reporte pas comme un nouveau bug de calcul de distance mais comme la source du problème (coordonnées jamais résolues dynamiquement, lié à K3) |
| F59 | HOSPITAL | Cliquer "Réserver" sur une banque dont le stock est inférieur à la quantité demandée | Bouton désactivé, libellé "Stock insuffisant" |
| F60 | HOSPITAL | Cliquer "Réserver" sur une banque avec stock suffisant, choisir une urgence, ajouter une note, confirmer | Écran de succès avec le code de réservation généré, message "Valable 24h" ; la recherche se relance automatiquement et le stock affiché diminue |
| F61 | BLOOD_BANK | Naviguer directement vers `/dashboard/blood-search`, tenter une réservation | La page se charge et laisse faire (pas de garde front) — l'appel `POST /reservations` doit échouer en 403 côté API (cohérent R8) ; vérifie que l'erreur s'affiche proprement dans le modal et pas juste une exception silencieuse |
| F62 | HOSPITAL | Rayon minimal (10km) sur une zone sans banque | État vide "Aucune banque de sang trouvée dans ce rayon." avec suggestion d'élargir |

## 25. Donors (`/dashboard/donors`) — ADMIN, BLOOD_BANK

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F63 | BLOOD_BANK | Ouvrir la page | Donneurs de sa banque uniquement |
| F64 | HOSPITAL | Naviguer directement vers `/dashboard/donors` | Page accessible côté frontend (pas de garde), mais `GET /donors` doit échouer 403 — vérifie que la page affiche un état vide/erreur cohérent plutôt qu'une liste vide silencieuse qui pourrait laisser croire "il n'y a aucun donneur" |
| F65 | BLOOD_BANK | Filtrer par statut Éligible/Non éligible | Cohérent avec `isEligible` de chaque donneur |
| F66 | BLOOD_BANK | Enregistrer un nouveau donneur (tous champs requis) | Modal se ferme, donneur ajouté en tête de liste sans refetch complet |
| F67 | BLOOD_BANK | Cliquer "Voir" sur un donneur | **[CONNU K9]** Bouton mort |
| F68 | Tous | Chercher une trace de bilan de santé (screening) dans l'UI | **[CONNU]** N'existe pas côté frontend actuellement — seul `POST /donors/screenings` existe côté API (testé en §D13-17), aucun formulaire ne l'expose. Ne pas chercher ce test sur cette page. |

## 26. Patients (`/dashboard/patients`) — HOSPITAL

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F69 | HOSPITAL | Ouvrir la page | Patients de son hôpital uniquement |
| F70 | BLOOD_BANK | Naviguer directement vers `/dashboard/patients` | Page accessible, `GET /patients` doit échouer 403 côté API |
| F71 | HOSPITAL | Ajouter un patient avec seulement prénom+nom (champs minimaux) | Succès, ajouté en tête de liste |
| F72 | HOSPITAL | Ajouter un patient avec un groupe sanguin qui ne correspond à aucune combinaison ABO/Rh valide | **Aucune erreur bloquante n'est montrée** (contrairement au formulaire Donors/Stock) — le `bloodTypeId` part juste `undefined` silencieusement. Vérifie ce comportement, ça peut être surprenant pour l'utilisateur |
| F73 | HOSPITAL | Cliquer "Voir" | **[CONNU K9]** Bouton mort |

## 27. Directory / Annuaire (`/dashboard/directory`) — tous rôles

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F74 | Tous | Ouvrir la page, onglet "Tous" | Liste fusionnée hôpitaux + banques |
| F75 | Tous | Onglets "Hôpitaux" / "Banques de sang" | Filtrage correct |
| F76 | Tous | Rechercher par nom/région/adresse | Filtrage cohérent |
| F77 | Tous | Cliquer un numéro de téléphone / email affiché | Ouvre l'app téléphone/mail par défaut (`tel:`/`mailto:`) |
| F78 | Tous | Cliquer "Voir détails" sur une carte | **[CONNU K9]** Bouton mort — aucune page de détail établissement |
| F79 | ADMIN | Observer le bouton "Ajouter un établissement" | Visible **uniquement pour ADMIN**, mais **[CONNU K9]** sans aucun effet au clic — aucun formulaire n'existe. Pour créer un hôpital/banque, il faut passer par l'API directement (§7.3) |
| F80 | HOSPITAL/BLOOD_BANK | Observer le même bouton | Absent |

## 28. Map (`/dashboard/map`) — ADMIN, HOSPITAL (**pas** BLOOD_BANK)

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F81 | BLOOD_BANK | Vérifier que le lien "Map" est **absent** de la sidebar | Confirme — contrairement à ce qu'on pourrait supposer, BLOOD_BANK n'a pas accès à cette page dans la nav |
| F82 | ADMIN ou HOSPITAL | Ouvrir la page | **[CONNU K6]** Liste et carte 100% statiques (6 banques codées en dur) — aucune requête réseau n'est faite. Confirme qu'aucun appel API n'apparaît dans l'onglet Réseau des DevTools |
| F83 | ADMIN ou HOSPITAL | Rechercher un nom de banque dans la barre de recherche | Filtre correctement la liste statique |
| F84 | ADMIN ou HOSPITAL | Cliquer une pastille de filtre par groupe sanguin (O+/A+/B+/O-) | **BUG CONFIRMÉ À REPORTER** : la pastille change d'apparence (sélectionnée visuellement) mais la liste affichée **ne change jamais** — le filtre n'est jamais réellement appliqué |
| F85 | ADMIN ou HOSPITAL | Cliquer une banque dans la liste | Le panneau de détail s'affiche, la carte Leaflet se centre dessus (`flyTo`) |
| F86 | ADMIN ou HOSPITAL | Cliquer "Search & Reserve" depuis le détail | Navigue vers `/dashboard/blood-search` (sans présélectionner la banque cliquée) |

## 29. Statistics (`/dashboard/statistics`) — ADMIN

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F87 | ADMIN | Ouvrir la page | KPI + graphiques cohérents avec `/statistics/national` et `/statistics/reservation-trends?days=30` |
| F88 | ADMIN | Observer le "Taux de perte" (wastage) | Calcul = poches expirées / total, mis en évidence visuellement si > 0 |
| F89 | HOSPITAL/BLOOD_BANK | Naviguer directement vers `/dashboard/statistics` | Page accessible côté front (lien caché mais pas gardé) — vérifie que les appels API sous-jacents échouent bien en 403 (cohérent S3/S10) et que la page ne plante pas, juste vide/erreur |

## 30. Notifications (`/dashboard/notifications`) — tous rôles

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F90 | Tous | Ouvrir la page après avoir généré des notifications (§N8-N11) | Liste visible, onglets "Toutes"/"Non lues" avec compteurs corrects |
| F91 | Tous | Cliquer une notification non lue | Marquée lue immédiatement (optimiste), `PATCH /notifications/:id/read` appelé une seule fois |
| F92 | Tous | "Tout marquer comme lu" | Toutes passent lues, compteur "Non lues" à 0 |
| F93 | Tous | Générer une nouvelle notification (ex. créer une réservation depuis un autre onglet/rôle) **sans recharger** cette page | **[CONNU K1/K8]** Rien n'apparaît tant que la page n'est pas rechargée manuellement — confirme l'absence de mise à jour temps réel |
| F94 | Tous | Avoir plus de 50 notifications au total | Seules les 50 plus récentes sont chargées, pas de pagination/chargement supplémentaire disponible |

## 31. Logs (`/dashboard/logs`) — ADMIN

| # | Rôle | Étapes | Résultat attendu |
|---|---|---|
| F95 | ADMIN | Ouvrir la page après avoir effectué plusieurs mutations ailleurs | Les 200 entrées les plus récentes s'affichent, triées par date |
| F96 | ADMIN | Filtrer par type d'entité (pastilles) | Les pastilles ne reflètent que les entités présentes dans les 200 lignes chargées, pas l'univers complet des entités possibles — teste que ce n'est pas trompeur |
| F97 | ADMIN | Rechercher par nom d'acteur ou ID d'entité | Filtrage cohérent |
| F98 | HOSPITAL/BLOOD_BANK | Naviguer directement vers `/dashboard/logs` | Page accessible côté front, `GET /audit-logs` doit échouer 403 |

## 32. Settings (`/dashboard/settings`) — tous rôles

| # | Onglet | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| F99 | Profil | Modifier prénom/nom, sauvegarder | `PATCH /users/:id`, le store Zustand se met à jour, confirmation verte affichée |
| F100 | Profil | Vérifier le champ Email | En lecture seule, non modifiable |
| F101 | Profil | Vérifier le sélecteur de langue FR/EN | **[CONNU K9]** Purement décoratif, ne fait rien |
| F102 | Sécurité | Changer le mot de passe avec confirmation qui ne correspond pas | Erreur inline "Les mots de passe ne correspondent pas." |
| F103 | Sécurité | Nouveau mot de passe < 8 caractères | Erreur inline |
| F104 | Sécurité | Changement valide | `PATCH /auth/change-password` — **vérifie que cet endpoint existe réellement côté backend**, il n'a pas été identifié dans l'audit backend de ce document ; si l'appel échoue en 404, c'est un vrai bug à reporter (page qui appelle une route inexistante) |
| F105 | Sécurité | Observer la carte "Session active" | **[CONNU K9]** Statique, aucune vraie gestion de sessions/appareils |
| F106 | Notifications (onglet réglages) | Basculer les interrupteurs, cliquer "Sauvegarder", recharger la page | **[CONNU K9]** Rien n'est persisté — retombe aux valeurs par défaut au rechargement, le bouton Sauvegarder n'a aucun handler |
| F107 | Préférences | Idem sur les 3 menus déroulants | **[CONNU K9]** 100% décoratif, aucun état ni sauvegarde |
| F108 | À propos | Vérifier l'affichage | Contenu statique (version, build, licence) — rien à tester au-delà du rendu |

## 33. Système hors-ligne — ce qui est réellement testable

> Rappel K7 : ne teste **pas** "je remplis un formulaire hors-ligne, il se synchronise au retour" sur Stock/Réservations/Blood Search/Donors/Patients — ce chemin n'existe pas dans le code actuel. Les tests ci-dessous couvrent ce qui fonctionne réellement.

| # | Étapes | Résultat attendu |
| --- | --- | --- |
| F109 | Couper le réseau (DevTools → Network → Offline) | Le widget `OfflineIndicator` (en bas à droite, sur toutes les pages dashboard) affiche le bandeau "mode hors-ligne" |
| F110 | Recharger `/`, `/auth/login`, `/dashboard` sans réseau | Ces 3 URLs précises doivent se charger depuis le cache du service worker (shell précaché) — les autres pages dashboard n'ont pas de garantie de cache |
| F111 | Sur une page dashboard, hors-ligne, soumettre n'importe quel formulaire (ex. ajouter une poche) | L'appel `axios` échoue simplement — observe le comportement réel : spinner bloqué indéfiniment, ou message d'erreur réseau brut ? Documente précisément ce qui se passe, c'est utile pour prioriser le futur branchement de l'offline sur ces pages |
| F112 | Rétablir le réseau | Le widget détecte la reconnexion, lance une synchronisation automatique (`fullSync`) — avec une file vide en pratique, ça doit juste tourner puis disparaître sans erreur |
| F113 | Cliquer manuellement "Sync Now" dans le widget `OfflineIndicator` (hors-ligne ou en ligne) | Déclenche `fullSync()` — vérifie qu'il n'y a pas d'erreur silencieuse dans la console |
| F114 | Ouvrir DevTools → Application → IndexedDB → `hemosafe_v2` | Vérifier la présence des tables `blood_stock`, `reservations`, `patients`, `sync_queue`, `failed_ops`, `notifications`, `meta` — `sync_queue`/`failed_ops` doivent être vides (rien ne les alimente actuellement), les autres peuvent contenir des données si `GET /sync/pull` a été appelé au moins une fois par le widget |

---

## PARTIE SCÉNARIOS DE BOUT EN BOUT

## 34. Parcours complets inter-modules

Ces scénarios enchaînent plusieurs modules dans l'ordre — c'est là que se cachent
les bugs qu'aucun test unitaire par module ne révèle. Utilise 3 fenêtres/onglets
de navigateur en parallèle (un par rôle) pour suivre l'effet des actions de l'un
sur l'écran de l'autre.

### E1 — Le cycle de vie complet d'une poche de sang

1. **BLOOD_BANK** enregistre une nouvelle poche (§B11/F37).
2. **BLOOD_BANK** vérifie qu'elle apparaît dans `GET /blood-bags/stock-summary` (peut être en cache 3 min, §B9) et dans la page Stock (F33).
3. **HOSPITAL** recherche ce groupe sanguin via Blood Search (§F57) — vérifie que le nombre disponible inclut cette nouvelle poche (une fois le cache expiré si besoin).
4. **HOSPITAL** réserve, y compris potentiellement cette poche précise si c'est la plus proche de péremption du lot.
5. **BLOOD_BANK** reçoit la notification (§N8), confirme (§F30), puis expédie (§F50).
6. **HOSPITAL** confirme la réception (§F51) — la poche passe `DISTRIBUTED`, statut terminal.
7. **ADMIN** retrouve la trace complète de ce cycle dans `GET /audit-logs` (§AL3) — chaque mutation (création poche, création réservation, 3 transitions) doit avoir sa propre entrée.
8. **Vérification finale** : `GET /blood-bags/:id` sur cette poche précise doit maintenant afficher `status: DISTRIBUTED` et un `stockMovements` historique complet (RECEIVED → RESERVED → DISTRIBUTED).

### E2 — Rupture de stock et urgence

1. **BLOOD_BANK** identifie un groupe sanguin avec un stock très faible (ou le vide volontairement via plusieurs discards, §B20).
2. **HOSPITAL** tente une réservation `ROUTINE` sur ce groupe avec une quantité supérieure au stock → 409 attendu (§R9).
3. **HOSPITAL** retente en `EMERGENCY` → allocation partielle acceptée (§R10), ou 409 si stock = 0 (§R11).
4. Vérifie que la carte "Réservations actives" du dashboard HOSPITAL (§F25) montre bien cette réservation en bordure rouge (urgence).
5. **BLOOD_BANK** voit la demande dans son dashboard (§F29) et la confirme malgré la pénurie.

### E3 — Prescription → Réservation → Distribution

1. **HOSPITAL** crée un patient (§P4).
2. **HOSPITAL** crée une prescription pour ce patient (§PR3).
3. **HOSPITAL** crée une réservation en liant `prescriptionId` (§PR10).
4. Le cycle de réservation se déroule normalement jusqu'à `DELIVERED`.
5. **Vérification** : `GET /prescriptions/:id` doit montrer `isFulfilled: true` sans action manuelle supplémentaire (§PR14).
6. Tenter de créer une **deuxième** réservation avec la même `prescriptionId` → doit échouer proprement (§PR12, déjà fulfilled).

### E4 — Un donneur devient une poche

1. **BLOOD_BANK** enregistre un donneur (§D5).
2. **BLOOD_BANK** enregistre un bilan de santé pour ce donneur avec `isPassed: true` (§D13).
3. **BLOOD_BANK** enregistre une poche en spécifiant ce `donorId` (champ optionnel du DTO `CreateBloodBagDto`, non couvert explicitement plus haut — teste-le ici : `POST /blood-bags` avec `donorId` renseigné).
4. **Vérification** : `GET /blood-bags/:id` doit inclure les infos du donneur lié (`donor: {id, firstName, lastName}`).
5. Refais le scénario avec un bilan `isPassed: false` (§D15) — le donneur passe `isEligible: false` — vérifie qu'il reste malgré tout possible ou non de créer une poche avec ce `donorId` (le backend ne semble pas bloquer explicitement l'enregistrement d'une poche venant d'un donneur inéligible — à confirmer, potentiel bug d'intégrité des données si aucune vérification n'existe).

### E5 — Transfert inter-banques et recherche géolocalisée

1. **BLOOD_BANK A** (ex. CNTS-ABJ) transfère des poches vers **BLOOD_BANK B** (ex. BB-COCODY) (§T5).
2. Pendant que le transfert est `INITIATED`/`IN_TRANSIT`, vérifie que ces poches n'apparaissent **ni** dans le stock de A (elles sont `RESERVED`) **ni** dans celui de B (elles ont encore `bloodBankId` = A) — un `HOSPITAL` qui cherche ce groupe sanguin via Blood Search ne doit voir ni l'un ni l'autre les compter comme disponibles.
3. **BLOOD_BANK B** confirme la réception (§T13).
4. **Vérification** : ces poches apparaissent maintenant dans le stock de B (`bloodBankId` changé), redeviennent `AVAILABLE`, et un `HOSPITAL` cherchant ce groupe sanguin les voit désormais rattachées à B, pas à A.

### E6 — Isolation totale entre deux établissements du même type

Utilise le 2ᵉ compte HOSPITAL et le 2ᵉ compte BLOOD_BANK créés en §U3/U4.

1. Avec le compte HOSPITAL n°1, crée un patient, une prescription, une réservation.
2. Connecte-toi avec le compte HOSPITAL n°2 (établissement différent).
3. Vérifie qu'**aucune** de ces données n'est visible : `GET /patients`, `GET /prescriptions`, `GET /reservations` doivent tous être vides ou exclure ces entités.
4. Tente d'accéder directement par ID à chacune (URL directe côté frontend, ou appel API direct) → 403 partout.
5. Répète symétriquement avec les 2 comptes BLOOD_BANK sur donneurs/poches/stock.

### E7 — Un compte désactivé en pleine session

1. **ADMIN** (dans un onglet) et **HOSPITAL** (dans un autre, déjà connecté) ouverts en parallèle.
2. **ADMIN** désactive le compte HOSPITAL (§U19).
3. Dans l'onglet HOSPITAL encore ouvert, effectue n'importe quelle action nécessitant un appel API (naviguer vers une nouvelle page, rafraîchir une liste).
4. **Résultat attendu** : la requête échoue en 401 (le `JwtStrategy` revérifie `isActive` à chaque requête, §A17) — vérifie ce que fait le frontend : redirige-t-il proprement vers le login, ou reste-t-il bloqué sur une erreur brute ?

### E8 — Recherche géolocalisée et l'angle mort K3

1. **ADMIN** crée une nouvelle banque de sang avec des coordonnées `lat`/`lng` valides, proches d'un hôpital existant (§H15).
2. **BLOOD_BANK** (le nouveau compte créé pour cette banque, ou un compte existant réassigné) enregistre des poches dans cette nouvelle banque.
3. **HOSPITAL** proche recherche ce groupe sanguin via Blood Search avec un petit rayon centré sur cette zone.
4. **Résultat attendu (confirmant K3)** : cette nouvelle banque **n'apparaît pas** dans les résultats malgré un stock réel et une proximité réelle — parce que `location` n'a jamais été enregistrée en base. À reporter comme bug si tu veux que ce soit corrigé (ce n'est qu'une limitation documentée, pas un choix produit assumé).

---

## 35. Matrice RBAC récapitulative

Coche chaque case en testant explicitement l'action avec **le rôle indiqué en colonne**, pas seulement celui indiqué en exemple dans les sections précédentes. `✅` = autorisé attendu, `❌` = refusé attendu (403), `👁️` = lecture scopée à ses propres données uniquement, `—` = action non applicable à ce rôle (route inexistante ou sans objet).

| Action | ADMIN | HOSPITAL | BLOOD_BANK |
| --- | --- | --- | --- |
| Créer un hôpital / une banque | ✅ | ❌ | ❌ |
| Créer un utilisateur ADMIN | ✅ | ❌ | ❌ |
| Créer un utilisateur de son propre rôle, sa propre structure | ✅ | ✅ | ✅ |
| Voir tous les utilisateurs | ✅ | 👁️ (son établissement) | 👁️ (son établissement) |
| Désactiver un utilisateur | ✅ | ❌ | ❌ |
| Enregistrer une poche de sang | ✅ | ❌ | ✅ (sa banque) |
| Retirer (discard) une poche | ✅ | ❌ | 👁️ (sa banque uniquement) |
| Lister/consulter les poches | ✅ | ✅ (lecture, pas de scoping à un établissement) | 👁️ (sa banque par défaut) |
| Créer un donneur | ✅ | ❌ | ✅ (sa banque) |
| Voir la liste des donneurs | ✅ | ❌ | 👁️ (sa banque) |
| Modifier un donneur / créer un bilan de santé | ✅ | ❌ | 👁️ (donneurs de sa banque uniquement) |
| Créer un patient | ✅ | ✅ (son hôpital) | ❌ |
| Voir/modifier/désactiver un patient | ✅ | 👁️ (son hôpital) | ❌ |
| Créer une prescription | ✅ | ✅ (son hôpital) | ❌ |
| Marquer une prescription comme satisfaite | ✅ | 👁️ (son hôpital) | ❌ |
| Créer une réservation | ✅ | ✅ | ❌ |
| Confirmer / expédier une réservation | ✅ | ❌ | ✅ (sa banque, si elle est destinataire) |
| Marquer une réservation comme livrée | ✅ | ✅ (son hôpital, si demandeur) | ❌ |
| Annuler une réservation | ✅ | ✅ (la sienne) | ✅ (la sienne) |
| Voir les réservations | ✅ | 👁️ (son hôpital) | 👁️ (sa banque) |
| Créer un transfert | ✅ | ❌ | ✅ (depuis sa banque) |
| Faire avancer/annuler un transfert | ✅ | ❌ | 👁️ (selon rôle source/destination) |
| Voir les transferts | ✅ | — (liste toujours vide) | 👁️ (sa banque, source ou destination) |
| Voir les statistiques nationales | ✅ | ✅ | ❌ |
| Voir les statistiques régionales / donneurs | ✅ | ❌ | ❌ |
| Voir le stock détaillé d'une banque | ✅ | ❌ | 👁️ (sa banque) |
| Voir les logs d'audit | ✅ | ❌ | ❌ |
| Voir/marquer ses notifications | ✅ | ✅ | ✅ (toujours scopé à soi-même, jamais à l'établissement) |

---

## 36. Checklist finale avant de considérer la campagne terminée

- [ ] Tous les cas des sections 5 à 18 (backend, par module) ont un statut ✅/❌/⏭️
- [ ] Tous les cas des sections 19 à 33 (frontend, par page) ont un statut
- [ ] Tous les scénarios de bout en bout (§34) ont été rejoués au moins une fois
- [ ] La matrice RBAC (§35) est entièrement cochée pour les 3 rôles
- [ ] Chaque bug trouvé a été documenté avec le template §2, y compris sévérité
- [ ] Les bugs déjà connus (§4, marqués [CONNU]) n'ont pas été re-reportés en double
- [ ] Une synthèse des bugs par sévérité (bloquant/majeur/mineur/cosmétique) a été partagée pour prioriser les corrections
- [ ] Si des données de test ont été créées pendant la campagne (comptes, réservations, poches…), elles ont été nettoyées ou clairement signalées avant de passer la main

---

*Fin du document. Mets-le à jour à chaque nouvelle campagne — ajoute des cas quand une fonctionnalité est ajoutée, retire un `[CONNU]` de la §4 dès qu'il est corrigé et confirmé.*
