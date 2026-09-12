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

---

## Prompt 08 — Canaux conseil : WhatsApp en first-class, articles signés

- **WhatsApp = canal de premier rang** : bouton contextuel dans le pied de page
  (message pré-rempli), sur chaque fiche boutique (« Rendez-vous conseil » avec
  jour/créneau/question en prefill) — en plus du téléphone et de l'itinéraire.
  Le rendez-vous est *optionnel* : le conseil au comptoir reste sans rendez-vous.
- **Formulaire conseil → ticket réel** (hérité, vérifié) : /aide crée un ticket
  `pharmacist_advice` — pas de boîte « contact us » décorative.
- **Admin support : filtres par type** (chips e-commerce — Every, Delivery,
  Damaged, Conseil pharmacien…) + badge calme « Grossesse / enfant — précautions
  d'usage » dérivé du sujet du ticket : l'équipe est signalée, le client n'est
  pas alarmé. Pas d'alarmisme : la guidance douce reste la fiche tolérances
  produit (badge « Compatible grossesse ») et la question au comptoir.
- **Journal signé** — `articles.author/authorRole` (migration additive, seeds :
  Ines Belkadi, préparatrice ; Dr. Amine Trabelsi, pharmacien), signature sur la
  liste et l'article, JSON-LD `Person` quand signée. Un conseil sans auteur est
  une publicité.
- **Article → 2 produits maximum** (jointure `articleProducts`, limite
  d'affichage 2) : le lien editorial reste une recommandation, pas un rayon.
- **Heures d'ouverture partout** : concierge, panneau conseil PDP (réponse le
  jour même 8h30–20h30), lignes horaires boutique.
- **Pas de chatbot-personnage** : le « veilleur de nuit » répond hors horaires
  UNIQUEMENT par FAQ honnête (regex sur un jeu d'entrées réelles) et passe la
  main à l'humain — jamais de faux conseil santé, jamais de faux humanoïde.

## Prompt 07 — Vérité du stock, réassort & Click & Collect

- **Le registre fait foi** : chaque mouvement (vente, ajustement admin, fiche
  produit, réassort) passe par `inventory_movements` avec motif, dans la même
  transaction que la colonne `stock` — jamais l'un sans l'autre.
- **Une alerte par e-mail et par SKU** — index unique `restock_alerts(product_id, email)` ;
  « Me prévenir » cliqué trois fois ne vaut qu'un seul message. Notification au
  réassort par l'admin (ajustement de stock → `enqueueRestockAlerts`), canal
  e-mail OU WhatsApp selon le choix, langue du demandeur respectée.
- **Compteur d'attente** — /admin/stock affiche « N attendu(s) » par référence en
  tension (alertes non encore notifiées) : la file de réassort est visible, pas
  devinée.
- **Cartes en rupture** — le bouton d'ajout disparaît, remplacé par « Me prévenir »
  qui saute sur la fiche (`?alert=1`) et y DÉBOUCLE directement le formulaire
  d'alerte — zéro recherche du bon bouton.
- **Click & Collect calculé** — `pickupWindow()` : prêt 2 h après la commande
  UNIQUEMENT si la journée le permet (lun–sam avant 18 h 30), sinon report à
  l'ouverture suivante ; garde de 48 h ensuite. Affiché sur la confirmation et
  sur /suivi pour toute commande en retrait — la promesse « 2 h » n'est plus un
  slogan, c'est une horloge. (Testée : 4 cas, samedi soir, dimanche, aube de
  mercredi.)
- **Pas de « 24 h chrono »** sur une référence en simple réassort — hérité de
  P02/P04 (promesse calculée + suppression de la ligne figée du panier).

## Prompt 06 — Suivi de colis, sans compte

La page /suivi (numéro + e-mail, rate-limitée, bilingue) était en place ; ce
pass l'a complétée côté « dernière mile » :

- **Note après livraison** — une commande `delivered` affiche une invitation
  sobre à raconter l'expérience depuis la fiche du produit (le formulaire
  d'avis, lui, reste verrouillé sur l'achat vérifié — P02).
- **Couche humaine** : lien WhatsApp direct pré-rempli « Commande CL-… —
  J'ai un problème », à côté du bouton de ticket, dans les trois langues.
- Déjà vérifiés conformes : timeline des 7 statuts animée, lien transporteur
  (17TRACK), facture PDF (clé d'accès ou e-mail en second facteur), message
  d'erreur utile quand la paire numéro/e-mail ne correspond pas.

## Prompt 05 — Emails du cycle de vie (audit : conforme, rien à forcer)

Pass de vérification sur la couche e-mail existante — chaque exigence du cahier
a été retrouvée dans le code, aucune rustine ajoutée pour faire joli :

- **Sept statuts couverts** : `order_confirmed`, `preparing`, `shipped`,
  `out_for_delivery`, `delivered`, `cancelled`, `refunded` (registry + templates
  `orders.tsx`), déclenchés par la table d'acheminement `email_outbox`.
- **Un seul CTA par e-mail**, choisi selon le moment : voir sa commande → suivre
  le colis → laisser un avis (à la livraison) → nous écrire (annulation).
- **Numéro de commande** dans chaque sujet (`{num}`) et dans le corps.
- **Langue par destinataire** : `users.locale` pilote FR/TN/TN-arabe ; défaut
  français assumé pour les invités. Les CTA tunisiens existent dans les deux
  graphies.
- **Hooks admin non-bloquants** : `void sendOrderStatusEmail(...)` — une panne
  d'API ne fait jamais échouer le changement de statut ; backoff 4 tentatives,
  sinon `failed` + `error` loggés dans l'outbox (visible /admin/emails).
- **Dev** : sans clé Resend, chaque e-mail s'écrit sur fichier et se logge.

## Prompt 03 — Recherche, navigation & états vides

- **Recherche tolérante** — `unaccent` partout (creme → crème) ET repli trigrammes `pg_trgm`
  quand l'exact est vide : « efaclat » trouve Effaclar, avec la ligne
  « Aucune correspondance exacte — voici ce qui y ressemble » (jamais de mélange silencieux).
- **Suggestions par besoin** — `/api/search` répond en quatre buckets (produits, laboratoires,
  rayons, BESOINS) ; le champ de recherche (déjà debouncé 170 ms, cache par requête) propose
  maintenant les besoins en premier rail, liés vers /besoin.
- **Zéro utile** — une recherche sans résultat n'est jamais un cul-de-sac : besoins les plus
  proches (comptés), les sept rayons comme portes, et un bouton « Écrire à un pharmacien » qui
  ouvre un ticket `product_question` PRÉ-REMPILI avec la requête (« Je cherche « … » »).
  La requête est loggée (table `search_events`, vue admin /admin/recherches).
- **Recherches récentes** — localStorage (`cleo.recent.v1`, 5 max, silencieuses si le stockage
  est refusé), affichées sous le champ ouvert, avec les recherches populaires.
- **Rayons = chambres** — chaque univers, sans filtre actif, ouvre sur « Le choix de la maison »
  (8 sélections : comptoir, best-sellers, nouveautés — le tri par défaut est déjà curaté) et un
  lien honnête « Voir les {n} références » ; les filtres ou le tri basculent sur le rayon complet.
- **Filtres mobiles** — ordre décidé au pouce : Disponibilité → Laboratoires → Tolérances →
  Besoins → Prix → Note. Tri explicite en français (« Notre sélection », « Les plus demandés »,
  « Nouveautés »…), skeletons sur chaque changement d'URL — pas de jank.

## Prompt 02 — La fiche produit qui conclut la vente

- **« À qui s'adresse » / « À vérifier avant de commencer »** — deux panneaux de copie pharmacienne sur chaque fiche (champs produits `audience` / `precautions`, FR d'abord ; les compléments portent d'office la mention d'usage honnête). Panneaux absents si la donnée n'existe pas — jamais de remplissage.
- **Mode d'emploi structuré** — la section sombre « Le rituel » est devenue un `dl` factuel : *Quand · Combien · Dans la routine* (`useWhen` / `useAmount` / `useOrder`), plus le texte libre `howToUse`. Les lignes de marketing génériques ont disparu.
- **Formule** — actifs clés en pastilles (`keyActives`) affichés d'abord ; l'INCI complet est replié sous un `<details>` (toujours publié tel que sur l'emballage).
- **« Souvent associé »** — table `product_pairs`, 2 maximum par référence, raison d'une ligne écrite par l'officine ; aucun algorithme, aucun bloc si rien n'est curaté. Éditable dans *Mise en scène*.
- **CTA conseil** — panneau « Un doute sur ce produit ? » : ticket `pharmacist_advice` pré-rempli (`/aide?type=…&subject=…&message=…` avec nom + URL du produit) et lien WhatsApp direct avec le même contexte. Horaires d'ouverture affichés à côté.
- **Stock par lieu** — `locationStock` (Ezzahra / Hammam-Lif / réserve) affiché uniquement pour les références où l'officine le suit ; le total correspond toujours au stock réel.
- **Promesse de livraison calculée, pas déclarée** — `shippingPromise(stock, heure, jour)` (helper + tests) : « expédié aujourd'hui » seulement si en stock, un jour ouvré, avant 14 h ; sinon demain/lundi ; rupture = aucune promesse. L'ancienne ligne figée « expédié sous 24 h » du panier a été remplacée par « En stock au comptoir ».
- **Retours** — rappel « 7 jours, produit non ouvert » sous le comptoir, vers la politique /livraison.
- **Avis = témoins invités, pas micros ouverts** — dépôt réservé au compte dont une commande de CE produit est livrée (vérifié côté serveur, signature forcée depuis le compte) ; affichage filtré sur `isVerified` ; puce « Achat vérifié » ; file « marquer vérifié » (avis pris au comptoir) dans /admin/avis ; le score produit ne compte que ce que le visiteur voit.
- **Rythme** — espacement vertical de la fiche resserré (hero, sections 03–05, related) sans toucher aux tokens de design.

## Prompt 01 — Merchandising & vérité du catalogue

- **Conseillé au comptoir** — badge typographique champagne sur les cartes et les fiches, case admin dédiée (et exporté dans le comparateur).
- **Filtres de tolérance honnêtes** — sans parfum · grossesse · peau atopique · yeux sensibles, en données tri-état (oui/non/inconnu) sur chaque fiche. Un filtre n’apparaît que si au moins une référence du scope est réellement vérifiée ; l’inconnu ne devient jamais un argument.
- **Besoins → rituels** — bandes « Trois gestes, dans l’ordre » sur les pages /besoin (exactement 3 produits, raisons en trois langues, admin `Mise en scène`).
- **Pages laboratoires renforcées** — histoires de 4–6 lignes au ton officinal (16 maisons) + trio de références héro curées, sinon meilleures ventes.
- **Vitrines de saison datées** — fenêtre de mois (ex. solaire avril→septembre, peaux sèches octobre→mars, avec passage d’année), visibilité automatique, zéro/manual.
- **Remplacer par** — 1–2 substitutions approuvées par le pharmacien sur les fiches en rupture, avec raison ; silence total si rien n’est curé (jamais de « produits similaires » aléatoires).
- **Comparateur** — 2–3 produits max, localStorage + tray flottant, page /comparer : usage, texture, pour qui, format, prix, prix au format réel.
- **Prix au format réel** — ligne discrète « ≈ X DT / 100 ml » (et /unité pour les cures) sur les sérums et grands formats.
- **Duos pharmacien** — bundles fixes de deux références, remise bornée (≤ 35 % du cumulé, jamais la gratuité), tag `duo` porté par les lignes panier, remise recalculée serveur à la commande, visible dans le tray, le panier et le récap.
- **Nouveautés crédibles** — le rail d’accueil n’affiche que les arrivages des 14 derniers jours (`launchedAt` admin, sinon date de création).
- Admin : `/admin/mise-en-scene` (vitrines, duos, rituels, substitutions, pages labos — produits désignés par slug, refus franc sur slug inconnu), champs merchandising dans la fiche produit.

## Nouveautés de la version précédente

### Expérience
- **Accueil resserré** — la grille « Les rayons » devient un mur de sept planches en deux rangées (ratios courts, sentence du rayon révélée sur la photo, jamais sous la grille : plus aucun vide vertical).
- **Pages rayons & catégories** — rythme compacté (hero, titres, grilles) sans rien perdre de la mise en page éditoriale ; le footer ne rejoue plus les rayons.
- **La sélection tournante** — 12 références du comptoir, un nouveau groupe **toutes les 60 secondes** (fondu-coulissé, points + flèches, pause au survol et au clavier, `prefers-reduced-motion` respecté).
- **Le diagnostic** (`/diagnostic`) — cinq questions, une « ordonnance de soins » commentée, sauvegardée dans le compte.
- **Mon Rituel** (`/compte/rituels`) — routines matin/soir, plusieurs rituels (Été, Hiver, Voyage…), glisser-déposer pour l’ordre des gestes, rappel doux hebdomadaire par e-mail.
- **Stock temps réel & “Me prévenir”** — jauge de stock sur la fiche produit, alerte e-mail/WhatsApp au réassort ; **les clientes connectées sont prévenues 24 h avant tout le monde**.
- **Cercle Cléopâtre** (`/compte/fidelite`) — quatre paliers (Sable, Nacre, Champagne, Or impérial), anneau de progression, avantages réels (accès anticipé, échantillons, cadeau d’anniversaire de 500 points).
- **Suivi de commande** — frise à sept statuts (dont « En cours de livraison »), lien transporteur 17TRACK, bouton **« J’ai un problème »** qui ouvre un ticket pré-rempli et lié à la commande.
- **Listes de souhaits partageables** — lien secret révocable (`/liste/[token]`), notes personnelles, **« Offrir ce produit »** (mode cadeau qui pré-coche l’emballage cadeau).
- **Mon Abonnement Cléopâtre** — réassort automatique (21 à 90 jours), −5 % abonnée, pause / saut / échange / cadence en un clic ; la commande est créée et réglée à la livraison par le cycle quotidien.
- **Le Journal relié au comptoir** — chaque article peut pointer les produits qu’il recommande (module « Les produits dont parle cet article » avec ajout au plateau).
- **Séquence post-achat** — +2 j : conseil d’usage & demande d’avis ; +11 j : conseil complémentaire fondé sur la commande. Lettrés par l’outbox, jamais par un tick qui réveille le client.
- **La conciergerie** — bulle flottante « Parler à un conseiller » : aux heures d’ouverture, le fil part dans les tickets du back-office ; la nuit, un veilleur poli répond aux questions courantes et ouvre le ticket à votre place.

### E-mails transactionnels (Resend + React Email)
18 lettres, **toutes en français et en darija tunisienne (écriture latine)** : bienvenue, les sept statuts de commande, réinitialisation du mot de passe, trois vies du ticket, retour en stock, deux lettres de soin post-achat, rappel de rituel, réassort d’abonnement, anniversaire du Cercle. Gabarit commun : fond ivoire, carte crème, typographie Newsreader/Manrope, pied de page adresse + réseaux + mention.

- Sans `RESEND_API_KEY`, chaque lettre est **rendue et écrite dans `./.emails/*.html`** (et journalisée en base) — le dev voit exactement le mail final.
- **Aperçu & journal** : `/admin/emails` (rendu des 18 × 2 langues + file d’envoi).
- **Cœur du système** : table `email_outbox` (programme, rejoue, n’émet jamais deux fois la même lettre) + route cron `POST /api/cron/outbox` (Bearer `CRON_SECRET` ou session staff). Elle fait aussi vivre les rappels de rituel, le cycle des abonnements et la cérémonie d’anniversaire.

```bash
# déclencher la ronde quotidienne (démo locale)
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/outbox
# ou depuis l’admin : /admin/emails suffit à lire le journal ; le bouton n’existe pas — un cron planifié le fait pour vous.
```

Variables d’environnement ajoutées : `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CRON_SECRET`.

### Tunisien complet (FR · Tounsi · تونسي)
- Sélecteur de langue dans l’en-tête (**FR | TN | تونسي**) ; la préférence vit dans un cookie **et** sur le compte (elle suit la personne d’un appareil à l’autre).
- `?lang=tn` force la langue au premier chargement — utile dans tous les liens d’e-mails.
- **Trois locues** : `fr` ; `tn` darija en écriture latine (la voie « charsiya », celle du web tunisien) ; `tn-arab` écriture arabe, **RTL complet** (`dir="rtl"`, Noto Kufi Arabic, lettres espacées neutralisées, flèches retournées via `.rtl-mirror`).
- Tout le commerce est traduit : coquille du site, accueil, univers & catégories, fiches produits (noms de marques préservés — ce sont des noms propres ; phrases du pharmacien traduites pour les 81 références), panier, compte, fidélité, rituels, abonnement, suivi, conciergerie, e-mails.
- Les textes légaux longs (CGV, confidentialité) restent en français — l’exactitude juridique prime ; leur habillement de page suit la langue.

### Comptes de démonstration (mis à jour)
| Rôle | E-mail | Mot de passe | Note |
|------|--------|--------------|------|
| Admin | admin@cleopatre.tn | Admin123! | voit `/admin/emails` |
| Support | support@cleopatre.tn | Support123! | file des tickets + conciergerie |
| Cliente (FR) | client@cleopatre.tn | Client123! | rituels, abonnement, liste partagée |
| Cliente (تونسي) | client.tn@cleopatre.tn | Client123! | interface et e-mails en darija |

Liste partagée de démo : `/liste/demo-partage-2026`.


---

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
