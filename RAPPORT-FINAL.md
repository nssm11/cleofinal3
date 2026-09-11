# Cléopâtre — Espace Santé Beauté — Rapport final

Projet : `nassimcleolast-main` → livraison `nassimcleolast-main-FINAL.zip`
Date : 2026-09-10 · Branche : `arena/01a08d4b-cleofinal3`
Environnement de validation : Debian 12, Node v22.22.3 / npm 10.9.8, PostgreSQL 17.10 (instance isolée `.devdb/`, port 5433).

**Vocabulaire de statut utilisé dans ce rapport : PASS · FAIL · NON-TESTÉ.**
Aucun élément non testé n'est présenté comme validé.

---

## 1. Architecture

| Élément | Constat |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack), React 19.2.6, TypeScript 5.9.3 |
| Styles | Tailwind CSS v4.1.17, design system en `@theme` + `@utility` (`src/app/globals.css`) |
| Animation | Framer Motion 13.2 (transform/opacity uniquement) |
| Données | Drizzle ORM 0.45.2 + `pg` 8.20 · PostgreSQL 17 · Zod 4 · Server Actions |
| Découpage | `src/app/(site)` public · `src/app/admin` back-office · `src/actions` mutations · `src/lib` métier · `src/db` schéma |
| Rendu | Server Components par défaut ; Client Components uniquement là où l'interaction l'exige (panier, filtres, en-tête, recherche, formulaires) |
| API | `/api/health`, `/api/search`, `/api/products`, `/api/admin/export/[kind]`, `/api/orders/[number]/invoice` |
| Pages | 52 entrées dans le build : 29 pages publiques, 15 écrans d'administration, 5 routes d'API, plus `/_not-found`, `/robots.txt`, `/sitemap.xml` |
| Code mort supprimé | `header.tsx`, `desktop-nav.tsx`, `mobile-drawer.tsx`, `search-overlay.tsx`, `cart-drawer.tsx`, `account-menu.tsx`, `announcement-bar.tsx`, `hero-text.tsx`, `PanelScrim`, et 4 icônes jamais référencées |

**Statut : PASS** — `npx tsc --noEmit` (0 erreur), `npx eslint .` (0 erreur/avertissement), `npm run build` (compilation complète, 52 entrées).

---

## 2. Database

- 25 tables / 13 énumérations : `users`, `sessions`, `addresses`, `brands`, `categories`, `concerns`, `products`, `product_concerns`, `reviews`, `inventory_movements`, `promotions`, `orders`, `order_items`, `order_events`, `wishlist_items`, `articles`, `stores`, `search_events`, `analytics_events`, `audit_logs`, `support_tickets`, `return_requests`, `loyalty_transactions`, `newsletter_subscribers`, `rate_limits`.
- Extensions créées automatiquement : **`unaccent`** (recherche française) et **`pg_trgm`**, par `start.ps1` et `scripts/dev-db.mjs`.
- Schéma appliqué par `drizzle-kit push` ; **migration SQL générée** : `drizzle/0000_rare_madame_web.sql` (+ `drizzle/meta`).
- Graine : 81 produits, 16 marques, 7 univers + sous-catégories, 11 besoins, 5 promotions, 2 boutiques, 4 articles, 3 comptes de démonstration (mots de passe vérifiés par scrypt), commandes/avis/points de fidélité d'exemple.
- Contrainte métier en base : index unique partiel `returns_one_per_item_idx (order_item_id, user_id)` — l'unicité d'une demande de retour n'est pas seulement applicative.
- Identifiants d'accès aux commandes : `access_key` 256 bits, index unique ; `idempotency_key` unique.

**Statut : PASS** — base neuve → extensions → schéma → graine → application fonctionnelle, validé sur l'instance isolée. Recherche accent-insensible vérifiée (`?q=creme` retourne « Crème Pieds Réparatrice Urea 10 % »).

---

## 3. Commerce

- Panier : store externe (`useSyncExternalStore`) + persistance `localStorage` (`cleo.cart.v1`), vol produit→panier au clic, quantités bornées au stock, plateau latéral.
- Commande : 4 étapes (Informations → Livraison → Paiement → Récapitulatif), **re-tarification côté serveur**, contrôle d'origine, idempotence.
- Remises : moteur pur `src/lib/promotions-math.ts` (pourcentage, montant, livraison offerte, plafonds, ciblage par univers, dates, limites d'usage).
- Livraison : standard 7 DT / express 12 DT / offerte dès 99 DT / retrait 2 h ; emballage cadeau 5 DT.
- Numérotation : `CL-YYMMDD-XXXXXXXXXX` + clé d'accès ; page de suivi exige numéro **et** e-mail ou clé.
- Retours : autorisation (propriété de la commande), validation Zod, statut expédié/livré requis, ticket support lié créé dans la même transaction.
- Facture PDF : `/api/orders/[number]/invoice` (session propriétaire, staff, clé d'accès, ou e-mail vérifié pour les commandes historiques).

**Statut : PASS** pour la facture PDF (200, `application/pdf`, 3 877 octets avec `?e=`), la confirmation (clé valide → contenu réel), le refus d'accès (sans clé → page introuvable, jamais le contenu), la page de suivi, et l'unicité des retours.
**Statut : PASS (test dédié)** — concurrence : deux insertions simultanées de la même demande ⇒ `["ok","23505"]`, **1 seule ligne** stockée ; le code applicatif traduit `23505` en message « demande déjà existante ».
**Statut : NON-TESTÉ** — le parcours complet panier→paiement→commande via l'interface (nécessite un navigateur) ; aucune commande n'a été créée par ce chemin pendant la validation.

---

## 4. Authentication

- Mots de passe : `scrypt` (`scrypt$sel$hash`), comparaison à temps constant.
- Sessions : cookie `cleo_session`, `httpOnly`, `sameSite=lax`, `secure` en production, 30 jours, purge opportuniste des sessions expirées.
- Rôles : `client` / `support` / `admin` ; contrôles serveur `requireUser`, `requireStaff`, `requireAdmin`.
- Aucune authentification Google / OAuth : recherche exhaustive (`google|Google|oauth|OAuth`) — seules des URL `maps.google.com` subsistent dans la graine. Rien à retirer.

**Statut : PASS** — anonyme sur `/admin/*` → 307 vers `connexion?next=/admin` ; session cliente sur `/admin` → 307 vers `/compte` (jamais le back-office) ; session admin → 12 pages admin en 200 ; pages client avec session → 200.
**Statut : NON-TESTÉ** — inscription/connexion via l'interface (navigateur requis) ; les Server Actions et la validation Zod sont couvertes par la lecture de code et le typage.

---

## 5. Admin

- 15 écrans : tableau de bord, commandes (+ détail), produits (+ création/édition/archivage), stock (mouvements), clients (+ fiche), promotions, avis, tickets support, recherches, journal, boutiques, audit.
- Langage visuel **volontairement distinct** : jetons `admin-*` (fond, panneaux, bordures, or), densité élevée, tables, actions inline, export CSV (`/api/admin/export/[kind]`).
- « Accès rapide » supprimé (aucune valeur opérationnelle) ; navigation latérale unique et stable.
- Journal d'audit alimenté par les mutations sensibles.

**Statut : PASS** — 12 routes listées en 200 avec session admin ; contrôles d'accès vérifiés (résultats ci-dessus).
**Statut : NON-TESTÉ** — les mutations d'administration (édition produit, upload d'image, ajustement de stock, traitement d'un retour) via l'interface : elles exigent un navigateur ; les Server Actions correspondantes sont validées par le typage, le lint et la lecture de code.

---

## 6. UI

- Identité chromatique **inchangée** (papier / crème / ivoire / marbre / pierre / encre / champagne / terre / olive / noir), uniquement travaillée par transparence, superposition, grain, lumière et variations tonales. Ni noir-luxe, ni néon, ni dégradé géant.
- Réinvention complète : en-tête flottant qui se transforme au défilement, tiroir de navigation architecturé, recherche plein écran « L'Archive », plateau panier, ouverture de chapitre par univers (lumière et motif propres à chaque rayon), cartes produit en compositions éditoriales (plate / feature / leaf), page produit en cinq mouvements (théâtre, comptoir, rituel, formule, avis), compte client « salon particulier », back-office séparé.
- Bandeaux noirs supprimés au profit de l'ivoire et du marbre ; typographie display (Newsreader) employée avec parcimonie ; un seul système d'icônes fines.
- Accessibilité : structure sémantique, focus visibles, `aria-*` sur les zones dynamiques, contrastes de la palette conservés, légendes `sr-only`, navigation clavier dans la recherche (↑ ↓ ↵ Esc) et les feuilles modales (piège de focus).

**Statut : PASS** sur les critères vérifiables hors navigateur (typage, lint, build, présence des composants, rendu HTML complet de 29 routes).
**Statut : NON-TESTÉ** pour la validation visuelle (rendu réel, chevauchements, lisibilité, images) : aucun navigateur n'est disponible dans cet environnement.

---

## 7. Motion

- Grammaire unique dans `src/lib/motion.ts` : verbes `arrive / leave / touch / veil`, durées `.18 → 1.15 s`, ressorts `panel / soft / snap`, presets `pageTransition`, `sheetUp`, `panelRight`, `veilDown`, `rowIn`, `hoverLift`.
- Aucune animation de `width/height/top/left` : uniquement `transform` et `opacity` (sauf largeur de la jauge de livraison offerte, un seul élément, transition CSS).
- Parallaxe sur `requestAnimationFrame`, désactivée sur pointeur grossier ; vol produit→panier réservé aux pointeurs fins.
- **Révélations « fail open »** — un bloc d'entrée est porté par **deux déclencheurs indépendants**, et le premier qui répond gagne : un `IntersectionObserver` écrit à la main (pré-déclenché à 6 % avant l'entrée dans la fenêtre) et un contrôle géométrique partagé, limité à un `requestAnimationFrame` par image, qui compare le rectangle du bloc à la hauteur de la fenêtre. Un bloc à l'écran ne peut donc pas rester invisible — même si l'observateur ne se déclenche jamais, ment, ou n'existe pas (cf. §13.8). La géométrie est isolée dans `src/lib/visible.ts` et testée unitairement.
- Révélations toujours **uniques** (une fois montrées, elles ne bougent plus) et composées uniquement de `transform` / `opacity` / `clip-path`.
- `prefers-reduced-motion` court-circuite chaque animation : les 24 composants clients animés l'interrogent (vérifié par recherche exhaustive), y compris l'écran d'erreur et les notifications, corrigés lors de la passe de double vérification. Sans script, `@media (scripting: none)` annule l'état masqué : le contenu est peint tel quel.

**Statut : PASS** (revue de code, build, tests unitaires de la géométrie, vérification en DOM réel des trois cas — observateur actif, observateur muet, observateur absent).
**Statut : NON-TESTÉ** pour la perception réelle des animations (navigateur requis).

---

## 8. Responsive

- Points de rupture couverts par construction : 1920×1080, 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 375×812.
- Mobile = expérience distincte : barre d'onglets basse, feuille de navigation plein écran, rythme de grille propre, comptoir produit fixe au-dessus de la barre (avec `env(safe-area-inset-bottom)`), pas d'effets de survol portés depuis le desktop, parallaxe réduite.
- Aucune largeur fixe en pixels sur les conteneurs ; les tableaux administratifs défilent horizontalement ; les rails utilisent `scroll-snap` ou masquage de barre.

**Statut : NON-TESTÉ** — la passe visuelle aux 8 largeurs ne peut pas être exécutée sans navigateur. Les garanties ci-dessus proviennent de la lecture du CSS et des composants, pas d'une observation.

---

## 9. Security

| Mesure | État |
|---|---|
| Mots de passe scrypt, comparaisons à temps constant | PASS (revue de code) |
| Sessions httpOnly / sameSite / secure en production | PASS (en-têtes vérifiés) |
| Autorisations serveur (`requireAdmin` / `requireStaff`) sur chaque route protégée | PASS (test HTTP : anonyme → 307, cliente → 307, admin → 200) |
| Jetons d'accès aux commandes non devinables + vérification par `safeEqual` | PASS (confirmation sans clé ⇒ page introuvable) |
| Contrôle d'origine sur les Server Actions + limitation de débit | PASS (revue de code) |
| Index unique en base sur les retours (course concurrente) | PASS (test de concurrence) |
| En-têtes : `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `COOP` | PASS (vérifiés par `curl -I` **en production**) |
| **Content-Security-Policy** en production | PASS (en-tête présent, pages et actifs toujours servis en 200 après activation) |
| Anti-cadrage (`X-Frame-Options` / `COOP` / CSP) **uniquement en production** | PASS — en développement, la boutique doit pouvoir être affichée dans l'aperçu hébergé ; aucune de ces trois en-têtes n'y est envoyée, les en-têtes de base restent présents (cf. §13.6) |
| Aucun secret dans le dépôt (`.env` ignoré, `.env.example` sans valeur réelle) | PASS |

Point connu : les pages appelant `notFound()` peuvent répondre **200** lorsque la coquille a déjà été diffusée en flux (Next.js). Le composant `not-found` porte donc `robots: noindex` — statut HTTP perfectible, indexation empêchée.

---

## 10. Performance

- Build de production : compilation complète en ~25 s, 52 entrées de route, aucune erreur ni avertissement bloquant.
- Images : `next/image` partout, formats AVIF/WebP, `sizes` adaptés, priorité limitée à l'ouverture et à la première galerie. Une seule balise `<img>` : le clone temporaire du vol produit→panier, alimenté par une image déjà en cache (commenté dans le code).
- JavaScript client strictement nécessaire ; les pages de contenu restent des Server Components ; aucun écran de chargement artificiel.
- Animations composées (`transform`/`opacity`). Quatre révélations repliables (`details`/accordéons, bandeau d'annonce et son repli au défilement) animent `height` pendant l'interaction uniquement, sur des sous-arbres de quelques dizaines de pixels ; rien de continu, rien de coûteux. Le seul autre cas est le clone du vol produit→panier (660 ms, au clic).
- Recherche : `unaccent + ILIKE` + index `pg_trgm`, limitation 40 req/min, cache privé 30 s, mémoïsation côté client des suggestions par requête.
- Serveur local : première réponse 250–650 ms en développement, < 60 ms pour les actifs statiques en production.

**Statut : PASS** (build, mesures locales, revue de code).
**Statut : NON-TESTÉ** — aucune mesure Lighthouse / WebPageTest : sans navigateur, aucun score de performance réel n'est mesurable ici.

---

## 11. Tests

| Porte technique | Résultat |
|---|---|
| `npm run typecheck` (`next typegen` puis `tsc --noEmit`) | **PASS** (0 erreur ; vérifié à froid dans une copie sans `.next`) |
| `npx eslint .` | **PASS** (0 erreur, 0 avertissement) |
| `npm run build` | **PASS** (compilation, 52 entrées de route) |
| `npm test` (`node:test` via `tsx`) | **PASS** — 23/23 (panier : clamp, fusion, suppression, insertion ; promotions : pourcentage, montant fixe, livraison offerte, expiration, épuisement, plafond ; visibilité : bloc hors écran, bloc qui entre, **bloc plus haut que la fenêtre**, bloc déjà dépassé, bloc non mesuré, fenêtre nulle, marge de pré-déclenchement) |
| Smoke HTTP production (37 URL) | **PASS** — toutes 200, aucune trace d'erreur applicative |
| API : `/api/health`, `/api/products`, `/api/search` | **PASS** (unaccent vérifié) |
| Facture PDF | **PASS** (200, `application/pdf`) |
| Autorisations admin / compte | **PASS** (cf. §4) |
| Concurrence des retours | **PASS** (1 insertion sur 2, `23505`) |
| Navigation, recherche, filtres, panier, commande, compte, back-office **dans un navigateur** | **NON-TESTÉ** — aucun navigateur disponible (téléchargement Playwright impossible dans l'environnement) |
| Console navigateur, réseau, hydratation, images cassées (§49) | **NON-TESTÉ** |
| Identifiants de démonstration (scrypt, refus d'un mot de passe erroné) | **PASS** — 3 comptes, rôles `admin` / `support` / `customer` |
| Écoute PostgreSQL limitée à la boucle locale | **PASS** — `listen_addresses=127.0.0.1` (le second socket observé sur 5433 est le `socat` du bac à sable, pas Postgres) |
| `start.ps1` | **NON-TESTÉ** — PowerShell absent de l'environnement de validation ; les commandes qu'il enchaîne (`dev-db.mjs`, `db:push`, `db:seed`, `dev`) sont elles-mêmes validées |

Aucun échec (**FAIL**) n'a été rencontré lors de cette campagne.

---

## 12. Procédure de démarrage (livrable)

1. Décompresser `nassimcleolast-main-FINAL.zip`.
2. Windows : `.\start.ps1` (options `-Port`, `-Prod`, `-SkipSeed`, `-ResetDb`).
   macOS/Linux : `cp .env.example .env` → `npm install` → `node scripts/dev-db.mjs start` → `npm run db:push` → `npm run db:seed` → `npm run dev`.
3. Comptes de démonstration (rôles `admin`, `support`, `customer`) : `admin@cleopatre.tn / Admin123!` · `support@cleopatre.tn / Support123!` · `client@cleopatre.tn / Client123!`.

Sous Linux, `node scripts/dev-db.mjs start` inscrit lui-même `DATABASE_URL` dans `.env`
lorsqu'il démarre son propre cluster : la commande `start` suffit, aucune édition manuelle
n'est nécessaire.

Le script ne touche jamais à un serveur PostgreSQL existant : il réutilise `DATABASE_URL` lorsque le serveur répond, sinon il crée une instance isolée dans `.devdb/` (port 5433), avec ses propres extensions et son propre répertoire de données.

---

## 13. Double vérification — défauts trouvés et corrigés

Une seconde passe a été menée **sur un environnement remis à zéro** (aucun `node_modules`, aucun `.env`, aucun cluster), en suivant exactement la procédure du README, et non les raccourcis utilisés pendant le développement. Trois défauts réels ont été trouvés (§13.1 à §13.3), puis trois autres lors de la recette dans l'aperçu hébergé (§13.6, §13.7 et §13.8). Tous sont corrigés et re-vérifiés ci-dessous.

### 13.1 Le cluster local était arrêté dès la fin du script (critique)

`embedded-postgres` enregistre un *hook* de sortie de processus qui arrête tous les serveurs qu'il a démarrés. `persistent: true` ne conserve que les **données**, pas le **serveur** : `node scripts/dev-db.mjs start` initialisait donc le cluster, puis le tuait en se terminant. La suite de la procédure (`db:push`, `db:seed`, l'application) échouait avec `ECONNREFUSED`.

La passe précédente ne l'avait pas vu parce qu'un serveur survivant d'un lancement interrompu masquait le problème.

**Correction** — le cluster est désormais lancé en démon par `pg_ctl` (binaire fourni par la même dépendance), qui rend la main immédiatement et laisse le serveur en vie ; `stop` et `reset` passent également par `pg_ctl`. L'API de la bibliothèque ne sert plus qu'à `initdb`.

### 13.2 `DATABASE_URL` restait périmé après le démarrage du cluster (bloquant)

En suivant le README (`cp .env.example .env` → `start`), le cluster s'ouvrait sur le port 5433 alors que `.env` conservait l'adresse d'exemple (port 5432) : `npm run db:push` sortait en **erreur 1**. `start.ps1` présentait le même trou, puisqu'il relisait `DATABASE_URL` depuis `.env` avant de pousser le schéma.

**Correction** — `dev-db.mjs` inscrit l'adresse de son propre cluster dans `.env` (uniquement cette ligne, et jamais pour un serveur qu'il n'a pas démarré) ; `start.ps1` vérifie en plus que la base répond réellement et reprend l'adresse du cluster local si besoin, et un échec du schéma arrête désormais le script au lieu d'un avertissement.

**Vérifié après correction** : base vierge → `start` → `.env` mis à jour → `db:push` (schéma appliqué) → `db:seed` (81 produits) → application servie.

### 13.3 Un `.env` créé sans `SESSION_SECRET` (bloquant en production)

Dernier test de la passe : l'archive livrée a été **extraite dans un répertoire vierge**, installée, construite, puis lancée après avoir supprimé son `.env`. Résultat : 19 pages sur 20 en erreur 500. La cause n'est pas un défaut applicatif — le garde-fou d'`env.ts` refuse de démarrer en production sans `SESSION_SECRET` réel (il rejette même les valeurs d'exemple, y compris celle de `.env.example`) — mais un manque dans l'outillage : `dev-db.mjs` créait un `.env` ne contenant que `DATABASE_URL`.

**Correction** — lorsque aucun `.env` n'existe, le script en écrit un complet : `DATABASE_URL`, `SESSION_SECRET` aléatoire de 32 octets, `NEXT_PUBLIC_SITE_URL`. Le message de création le dit explicitement.

La même passe a durci un cas voisin : un port occupé ne prouve pas que le serveur qui répond est le nôtre. Si le répertoire de données du projet est absent alors que le port répond, le script s'arrête maintenant avec un message clair (arrêter le processus, ou choisir `DEV_DB_PORT`) au lieu de servir une base étrangère.

### 13.4 Accessibilité et propreté

- **`prefers-reduced-motion`** n'était pas respecté par l'écran d'erreur global ni par les notifications : tous deux animaient un déplacement vertical. Corrigé ; les 24 composants clients animés interrogent maintenant le réglage.
- **Barre de progression du panneau panier** : le repère était positionné par `left` (propriété de mise en page). Supprimé — la barre se remplit par `transform: scaleX()`, et la phrase sous la jauge porte l'information.
- **Quatre icônes non référencées** (`ChevronLeft`, `Mail`, `Edit`, `Eye`) supprimées, conformément à la consigne de propreté.
- La balise `<img>` du vol produit→panier est désormais **justifiée en commentaire** : c'est le seul cas, l'image étant déjà en cache au moment du clic.

### 13.5 Contrôles refaits après correction (tous PASS)

| Contrôle | Résultat |
|---|---|
| Parcours README depuis un état vierge | `start` → `db:push` → `db:seed` → application |
| `npx tsc --noEmit` · `npx eslint .` · `npm test` | 0 erreur · 0 erreur · 15/15 |
| `npm run build` | 52 entrées de route |
| 37 URL en production | toutes 200, aucune erreur applicative |
| Gating des accès | anonyme → 307 · cliente → 307 · support → 200 · admin 15/15 écrans 200 |
| Confidentialité des commandes | confirmation sans clé → page introuvable · facture sans identité → 404 · facture propriétaire → 200 PDF (3 877 o) |
| Retours concurrents | `["ok","23505"]`, **1** ligne stockée |
| En-têtes de sécurité | CSP, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `COOP` présents |
| Identifiants de démonstration | 3 comptes vérifiés par scrypt, mot de passe erroné refusé |
| Écoute de PostgreSQL | `127.0.0.1` uniquement |
| **Archive extraite dans un répertoire vierge** | `npm install` (407 paquets) → `npm run build` (**52 routes**) → `dev-db start` (base neuve, port 5434) → `db:push` → `db:seed` (81 produits) → application servie : **20/20 URL en 200**, garde-fou d'accès confirmé |

### 13.6 La boutique refusait de s'afficher dans l'aperçu hébergé (bloquant pour la recette visuelle)

Symptôme signalé : l'aperçu de la boutique affichait « contents not available ». Aucune erreur serveur, aucune page en échec — l'application refusait simplement d'être **cadrée**.

Cause : `headers()` appliquait le jeu d'en-têtes de sécurité complet à **toutes** les réponses, développement compris. Or `X-Frame-Options: DENY` (accompagné de `Cross-Origin-Opener-Policy: same-origin`) interdit au navigateur d'afficher la page dans une `<iframe>` : l'aperçu hébergé, qui est précisément un cadre, restait vide.

**Correction** — les en-têtes sont désormais scindés :

- **Tous les environnements** : `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`.
- **Production uniquement** : `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, `Content-Security-Policy`.

Le déploiement de production reste donc strictement protégé — l'en-tête `frame-ancestors 'none'` de la CSP n'est pas non plus assoupli — tandis que le serveur de développement peut être affiché dans l'aperçu.

Un second piège a été corrigé au passage : Next.js 16 en mode développement **rejette en 403 les requêtes `/_next/*` d'une origine inconnue** (protection anti-CSRF du serveur de développement). Sur un aperçu hébergé, le symptôme est une page blanche ou non stylée, sans la moindre erreur serveur — l'application paraît cassée alors qu'elle répond. `allowedDevOrigins` déclare donc `localhost`, `127.0.0.1`, `0.0.0.0`, `*.e2b.app`, `*.e2b.dev`, plus les origines listées dans `NEXT_PUBLIC_DEV_ORIGINS` (documentée dans `.env.example`) pour tout autre hébergeur.

**Vérifié après correction :**

| Contrôle | Résultat |
|---|---|
| Développement — en-têtes de la page d'accueil | aucun `X-Frame-Options`, aucun `COOP`, aucune CSP ; `nosniff`, `Referrer-Policy`, `Permissions-Policy` présents |
| Développement — actif `/_next/…` demandé avec un hôte d'aperçu (`Origin: https://…e2b.app`) | **200** |
| Développement — même actif depuis une origine non déclarée | **403** (la protection reste active) |
| Production — en-têtes | `X-Frame-Options: DENY`, `COOP`, CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy` tous présents |
| Production — pages (`/`, `/boutique`, `/panier`, `/connexion`), API (`/api/health`), actif JS | **200** ; `/admin` anonyme → **307** |

### 13.7 `tsc` dépendait du dernier code exécuté (outillage de vérification)

Next génère des types de routes dans `.next/types` (build) ou `.next/dev/types` (développement), et `next-env.d.ts` pointe vers l'un ou l'autre. Lancer `tsc --noEmit` juste après un build, dans un dépôt qui vient de servir en développement, produisait donc des erreurs de type fantômes sans rapport avec le code.

**Correction** — le script `typecheck` enchaîne désormais `next typegen` puis `tsc --noEmit`, ce qui régénère les types de l'environnement courant avant de vérifier. Contrôle effectué sur une copie **sans aucun `.next`** : PASS.

### 13.8 Des compositions restaient vides dans l'aperçu (bloquant pour la recette visuelle)

Constat sur l'aperçu hébergé : sous les titres de section, de grandes zones parfaitement vides — la section « Les sept rayons » et l'ouverture des pages univers, exactement là où des plaques photographiques sont attendues.

Cause : **tout le système d'entrée était « fail closed »**. Chaque bloc était rendu masqué côté serveur (`clip-path: inset(100% 0 0 0)` pour les plaques, `opacity: 0` + translation pour les blocs de contenu) et n'était révélé que par un `whileInView` de la bibliothèque. Un seul déclencheur, donc un seul point de défaillance : si l'observateur ne rendait pas son verdict, le contenu restait masqué — parfaitement présent dans le DOM, parfaitement invisible à l'écran.

Deux faiblesses de conception ont été identifiées et corrigées :

1. **Seuil inatteignable.** Les plaques exigeaient 30 % de visibilité (`amount: 0.3`). Or une plaque plus haute que la fenêtre — ce qui arrive dès qu'un univers s'affiche en pleine largeur sur un écran court — ne peut jamais atteindre un tel ratio. Le seuil est désormais « dès qu'un bord se présente », et le pré-déclenchement commence 6 % avant l'entrée dans la fenêtre.
2. **Déclencheur unique.** L'observateur est maintenant écrit à la main — la version de la bibliothèque lève une exception si `IntersectionObserver` n'existe pas, ce qui suffisait à faire tomber la page — et il est doublé d'un contrôle géométrique indépendant : le rectangle du bloc est comparé à la fenêtre, un `requestAnimationFrame` par image pour tous les blocs non encore révélés, avec un contrôle de rattrapage. Un bloc à l'écran ne peut plus rester vide. Sans script du tout, `@media (scripting: none)` annule l'état masqué.

**Vérifié après correction** — la primitive réelle (et non une imitation) montée dans un DOM réel, dans les trois cas de figure :

| Scénario | Avant | Après |
|---|---|---|
| Observateur actif | visible | **visible** (animation conservée : masqué au montage, révélé en 1,15 s) |
| Observateur présent mais **muet** (ne rappelle jamais) | **restait masqué** | **visible** — le contrôle géométrique a révélé le bloc |
| `IntersectionObserver` **absent** | **exception au montage, page vide** | **visible** — aucune exception, le contrôle géométrique prend le relais |

Contrôles complémentaires : `npm test` 23/23 (dont 8 sur la géométrie de visibilité), `npm run typecheck` PASS, `npx eslint .` PASS, `npm run build` PASS (52 entrées de route), HTML servi avec 50 marqueurs de révélation et 10 plaques en attente, feuille de style de production contenant bien la règle `@media (scripting: none)`.

---

## 14. Recommandations (non bloquantes)

1. Exécuter la passe navigateur (§48/§49) sur un poste disposant de Chrome ou Firefox : c'est la seule zone restée NON-TESTÉE.
2. Valider `start.ps1` une fois sur Windows (PowerShell 5.1 et 7).
3. Envisager `drizzle-kit migrate` (migrations versionnées) plutôt que `push` en production — la migration initiale est déjà générée.
4. Statut HTTP 404 pour les pages introuvables lorsqu'aucun flux n'a commencé (limitation de Next 16, sans incidence sur le référencement grâce au `noindex`).
5. Réintroduire une stratégie de cache (`revalidate`) pour l'accueil et les pages de contenu, aujourd'hui toutes en `force-dynamic`, lorsque le catalogue sera stable.
