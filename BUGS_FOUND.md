# HEMOSAFE — Bugs trouvés pendant la campagne QA

> Alimenté au fur et à mesure de `QA_TEST_PLAN.md`. Un bloc par bug, copié depuis le
> template ci-dessous. Garde les bugs **corrigés** dans ce fichier (déplacés dans la
> section du bas) plutôt que de les supprimer — utile pour ne pas re-tester une
> régression déjà vue.
>
> Rappel : ne reporte pas ici les points déjà listés en §4 de `QA_TEST_PLAN.md`
> (marqués `[CONNU]`) — sauf si le comportement observé est *différent* de ce qui y
> est décrit.

---

## 🔴 Bloquant

<!-- Empêche de continuer à tester / casse une fonctionnalité cœur -->

## 🟠 Majeur

<!-- Fonctionnalité incorrecte ou RBAC/IDOR cassé, mais contournable -->

## 🟡 Mineur

<!-- Comportement gênant mais sans impact fonctionnel réel -->

## ⚪ Cosmétique

<!-- Visuel, texte, ergonomie -->

---

## ✅ Corrigés

### BUG-1 — `/auth/refresh` renvoie 401 dans Swagger

**Statut : pas un bug de code, clarifié le 2026-07-27.** `/auth/refresh` valide le
**refreshToken**, pas l'accessToken — mais Swagger n'a qu'un seul champ "Authorize"
global. Pour tester cette route : clique Authorize, colle temporairement le
`refreshToken` (pas l'accessToken) à la place, teste `/auth/refresh`, puis remets
l'accessToken pour la suite.

### BUG-2 — Le token reste valide après `/auth/logout`

**Corrigé et vérifié le 2026-07-27.** `logout()` ne faisait qu'effacer le
`refreshToken` en base ; l'accessToken (JWT stateless) restait valide jusqu'à son
expiration naturelle (15 min). Ajout d'une liste de révocation Redis : `/auth/logout`
blackliste désormais l'accessToken en cours pour le temps qu'il lui restait à vivre,
vérifié à chaque requête dans `JwtStrategy`. Testé : `GET /auth/me` → 200 avant
logout, → **401 "Token has been revoked"** juste après avec le même token ; un
nouveau login (nouveau token) continue de fonctionner normalement.
Fichiers modifiés : `auth/strategies/jwt.strategy.ts`, `auth/auth.service.ts`,
`auth/auth.controller.ts`, `common/decorators/current-user.decorator.ts`.

### BUG-3 / BUG-4 — Un HOSPITAL arrive à créer un compte ADMIN

**Faux positif dû à un serveur périmé — reconfirmé corrigé le 2026-07-27.** Le fix
anti-escalade de privilège avait bien été appliqué au code source plus tôt dans la
session, mais le process `dist/main` qui tournait sur le port 3001 avait été démarré
*avant* la dernière reconstruction et n'avait jamais été redémarré — Node ne recharge
pas le code à chaud. Après `npm run build` + redémarrage du serveur, retesté en
direct : `POST /users` avec `role: ADMIN` depuis un compte HOSPITAL → **403
`Cannot create a user with role ADMIN`**.
**⚠️ Le compte `doctor@hopital-alger.dz` (role ADMIN, créé pendant ce test) existe
encore en base — à supprimer ou désactiver manuellement, il ne sera pas nettoyé
automatiquement.**

---

## Template à copier pour chaque nouveau bug

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
