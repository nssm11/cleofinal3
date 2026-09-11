# Cléopâtre — Espace Santé Beauté

Boutique en ligne de la parapharmacie Cléopâtre (Ezzahra / Hammam-Lif, Tunisie).
Interface éditoriale, mouvement continu, et commerce réel : comptes clients, panier,
commandes, retours, back-office et base PostgreSQL comme source unique de vérité.

**Stack** : Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion ·
Drizzle ORM + PostgreSQL 17 · Zod · Server Actions.

---

## Démarrage

### Windows (recommandé)

```powershell
.\start.ps1
```

`start.ps1` prépare tout et lance l'application :

1. vérifie Node.js ≥ 20 ;
2. crée `.env` depuis `.env.example` avec un `SESSION_SECRET` aléatoire ;
3. installe les dépendances si `node_modules` est absent ;
4. **résout la base de données** :
   - réutilise `DATABASE_URL` si le serveur PostgreSQL indiqué répond — un serveur que
     vous exploitez déjà n'est **jamais** modifié, arrêté ni supprimé ;
   - sinon démarre une instance **isolée** dans `.devdb/` (port 5433, propriétaire :
     ce projet), sans jamais toucher aux autres bases de la machine ;
5. crée les extensions requises (`unaccent` pour la recherche française, `pg_trgm`) et
   applique le schéma ;
6. charge les données de démonstration **uniquement** si le catalogue est vide ;
7. lance le serveur.

Options : `-Port 4000`, `-Prod` (build + serveur de production), `-SkipSeed`, `-ResetDb`.

### macOS / Linux

```bash
cp .env.example .env          # ajuster SESSION_SECRET (DATABASE_URL sera rempli si besoin)
npm install
node scripts/dev-db.mjs start  # instance locale isolée dans .devdb/ — ou votre propre serveur
npm run db:push                # crée/actualise le schéma
npm run db:seed                # données de démo : 81 produits, 16 marques, 7 rayons
npm run dev                    # http://localhost:3000
```

`scripts/dev-db.mjs` accepte `start | stop | reset | status | url`. Il ne démarre une
instance locale que si `DATABASE_URL` n'est pas joignable ; `CLEOPATRE_FORCE_LOCAL_DB=1`
force l'instance locale. Lorsqu'il démarre son propre cluster, il **inscrit l'adresse
retenue dans `.env`** : sans cela, un `cp .env.example .env` suivi de `start` laisserait
`db:push` pointer sur l'adresse d'exemple (port 5432) et échouer.

S'il n'existe aucun `.env`, le script en crée un complet (adresse de la base, `SESSION_SECRET`
aléatoire, URL du site) : c'est ce qui évite un démarrage en production refusé faute de secret.

Le cluster local est lancé en démon par `pg_ctl` (et non par l'API de la bibliothèque, qui
arrête ses serveurs à la fin du script) : il survit donc à la commande `start` et reste
joignable pour `db:push`, `db:seed` et l'application. Il n'écoute que sur `127.0.0.1`.

## Comptes de démonstration

| Rôle    | E-mail                | Mot de passe |
|---------|-----------------------|--------------|
| Admin   | admin@cleopatre.tn    | Admin123!    |
| Support | support@cleopatre.tn  | Support123!  |
| Client  | client@cleopatre.tn   | Client123!   |

Codes promo actifs : `BIENVENUE10` (−10 % dès 50 DT), `SOLAIRE15` (−15 % sur le solaire),
`LIVRAISON` (livraison offerte dès 40 DT), `CLEO20` (−20 DT dès 150 DT).
`ETE2024` est volontairement expiré (cas de test).

## Structure

- `src/app/(site)` — public : accueil, boutique, univers, catégories, besoins, marques,
  recherche, fiche produit, promotions, journal, boutiques, aide, panier, commande,
  confirmation, suivi, compte client.
- `src/app/admin` — back-office (rôles `admin` / `support`) : tableau de bord, commandes,
  produits, stock, clients, promotions, avis, tickets, recherches, audit.
- `src/actions` — Server Actions (`auth`, `shop`, `checkout`, `admin`) : Zod + contrôle
  d'origine + rate limiting.
- `src/lib` — logique métier : auth (scrypt + sessions httpOnly), montants en millimes,
  promotions (moteur pur, testé), commandes, facture PDF, Tunisie (gouvernorats/livraison),
  mouvement (`motion.ts`), atmosphères des rayons.
- `src/db/schema.ts` — schéma Drizzle : 25 tables, 13 énumérations, index (dont
  contraintes d'unicité métier), relations. Migration versionnée : `drizzle/0000_*.sql`.
- `src/components` — `shell` (en-tête flottant, tiroir de navigation, recherche immersive,
  plateau panier, touche mobile), `catalog`, `product`, `checkout`, `account`, `admin`,
  `motion`, `ui`.

## Design & mouvement

- Palette inchangée : papier `#f2ecdf`, crème `#faf6ec`, ivoire `#f6f1e6`, marbre `#ece4d3`,
  pierre `#ddd3bd`, encre `#211b12`, champagne `#a3803f` / `#87662e` / `#cbb078`,
  terre `#96522f`, olive `#5f6236`, noir `#16120c`.
- Typographie : Newsreader Variable (display) + Manrope Variable (texte).
- Mouvement : `src/lib/motion.ts` — verbes `arrive / leave / touch / veil`, durées
  `.18 → 1.15 s`, ressorts `panel / soft / snap`. Uniquement `transform` et `opacity`.
- `prefers-reduced-motion` est respecté partout (parallaxe, vol produit→panier, révélations,
  transitions de page, soulignés animés).
- Mobile : navigation par barre basse + feuilles, grilles et rythmes propres au mobile —
  pas un desktop réduit.

## Configuration

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL. |
| `SESSION_SECRET` | Secret des sessions (≥ 32 caractères). Obligatoire en production. |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (défaut `http://localhost:3000`). |
| `TRUST_PROXY` | `true` derrière un reverse proxy pour prendre en compte `x-forwarded-for`. |
| `PAYMENT_METHODS_ENABLED` | Moyens de paiement autorisés, ex. `cod,bank_transfer,gift_card`. |

En production, `npm run db:seed` exige `ALLOW_DESTRUCTIVE_SEED=1` (le script vide les
tables) ainsi que `SEED_ADMIN_PASSWORD` / `SEED_SUPPORT_PASSWORD` / `SEED_CLIENT_PASSWORD`.

## Notes d'implémentation

- Montants stockés en **millimes** (entiers) ; formatage `fr-TN` via `formatDT`.
- Le numéro de commande (`CL-YYMMDD-XXXXXXXXXX`) n'est **pas** un identifiant d'accès :
  la confirmation exige une session propriétaire ou la clé d'accès de 256 bits remise à
  la commande ; `/suivi` demande numéro **et** e-mail.
- L'unicité d'une demande de retour par article est garantie par un **index unique**
  partiel en base, pas seulement par une lecture préalable.
- La recherche française s'appuie sur `unaccent` + `ILIKE` (extensions créées par
  `start.ps1` / `dev-db.mjs`).
- Aucun écran de chargement artificiel : la navigation est réelle et immédiate.

## Commandes utiles

```bash
npm run dev         # serveur de développement
npm run build       # build de production
npm run start       # serveur de production (après build)
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # tests unitaires (node:test via tsx)
npm run db:push     # applique le schéma Drizzle
npm run db:seed     # (re)charge les données de démonstration
node scripts/dev-db.mjs status   # état de l'instance locale
```
