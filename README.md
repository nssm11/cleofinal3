# Cléopâtre — Espace Santé Beauté

Boutique en ligne de la parapharmacie Cléopâtre (Ezzahra / Hammam-Lif, Tunisie).
Interface éditoriale, mouvement continu, et commerce réel : comptes clients, panier,
commandes, retours, back-office et base PostgreSQL comme source unique de vérité.

**Stack** : Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion ·
GSAP + ScrollTrigger · Embla Carousel · Lucide · Drizzle ORM + PostgreSQL 17 · Zod · Server Actions.

---

## Direction artistique — « Beauty in Ritual »

La vitrine est une campagne, pas un site d'ecommerce : la page d'accueil est un
film en six chapitres (hero + cinq rayons + crédits), chaque scène étant un
plein écran vidéo 100svh. Le moteur de commerce (produits, stock, commandes,
fidélité, abonnements, support, admin) est inchangé — seule la surface a été
refaite.

- **Chapitres** — `/public/videos/` : `hero-main` + `category-{skin,hair,body,sun,baby}`,
  chacun avec sa variante `-mobile` (1080×1920) et son poster
  (`/public/videos/posters/`). Desktop et mobile sont servis via `<source media>`.
- **Chargement** — les `<video>` ne montent que quand la scène approche du
  viewport (IntersectionObserver, marge 125 %) ; avant le premier frame, le
  poster reste affiché avec un fin filet de progression. `preload="metadata"`,
  `muted loop autoplay playsInline`.
- **Transitions** — GSAP ScrollTrigger uniquement : la scène qui sort respire
  (`scale 1→1.03`, `opacity 1→0.8`, scrub), celle qui arrive lève
  (`opacity 0→1`, `y 30→0`, ~1 s ease-out), plus un léger parallax.
  `prefers-reduced-motion` désactive le tout.
- **Composants** — `src/components/cinematic/` : `VideoHero`, `VideoSection`,
  `VideoLoader`, `SectionOverlay`, `CategoryIntro`, `CinematicUniverseHero`,
  `CinematicFooter`, `GlobalFooter`, `PageVeil` (dissolution entre pages via
  Framer Motion).
- **Typographie** — `next/font/local` (Manrope pour le corps, Noto Kufi pour
  l'arabe) ; la serif éditoriale Newsreader (romaine + italique) est servie en
  variable CSS.
- **Le jour de la maison** — le film garde sa nuit ; le reste de la vitrine
  vit en lumière. La classe `.cine-world` (racine du layout `(site)`) relit
  la palette vers le jour : `paper` `#faf7f0` (blanc chaud), `ivory`
  `#fffefb`, `cream` `#f7f2e6`, `marble` `#f0e9d9`, `stone` `#d9cfb6`,
  `ink` `#221c13` (l'obscurité ne sert plus que de contraste),
  `champagne` inchangé, plus `glow` `#ecd9a4` (le jaune tiède de la
  lumière). Les fonds cinématiques (`noir`, `braise`) restent sombres là où
  le cinéma parle : bandes « rituel » de la fiche, héro des catégories,
  404, conciergerie. Le film (accueil + héro des univers) garde ses tokens
  `cine-*` et ses voix propres (`--font-film-display/-body`) — le monde peut
  se re-taper sans jamais le toucher. Chaque page publique a sa propre
  composition (pas de page clone) ; l'en-tête est ivoire au-dessus du film,
  encre sur le jour, et la bande au scroll est crème translucide.
- **Univers** — chaque univers ouvre sur le plein écran vidéo de son chapitre
  (`CinematicUniverseHero`, même architecture que le hero d'accueil :
  `object-cover`, 100svh, sources desktop/mobile, poster, crossfade). La
  correspondance univers→vidéo est déclarative dans
  `src/lib/universe-cinema.ts`. Le reste de la page continue en éditorial :
  phrase de l'univers, étagère des rayons, sélection du comptoir, rayon
  complet, autres chapitres.
- **Économie vidéo** — un seul `<video>` par page ; armé au scroll
  (IntersectionObserver, marge 125 %), en pause dès que la scène sort du
  viewport, `preload="metadata"` + poster.
- **Composants de vitrine** — produits, catégories, sac, checkout et espace
  client reprennent le même langage : filets de lumière, serif, champagne,
  carrousels Embla (`src/components/catalog/embla-row.tsx`).
- **Admin** — volontairement hors du monde cinématique (route `/admin`
  distincte, palette et rythme d'outil) : dense et fonctionnel.

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

## Revue — Le jour de la maison (monde clair + porte cinématique)

Refonte visuelle de TOUTE la vitrine publique (logique de commerce et admin
intacts) :

- **Le monde bascule du côté de la lumière** — `.cine-world` (racine du
  layout `(site)`) relit la palette de la maison : blanc chaud → ivoire →
  crème → champagne doux → glow `#ecd9a4` ; les tons sombres (encre, noir,
  braise) ne servent plus que de contraste et de fonds cinématiques.
  `color-scheme: light`, fond d'overscroll clair. L'accueil et les héro des
  univers restent le film (nuit, `cine-*`, Newsreader) — rien d'autre.
- **La porte est cinématique** — `/connexion` a son propre film
  (`/videos/auth-login.mp4` 1920×1080 + `-mobile` 1080×1920 + poster,
  boucle de 20 s, fondu par la lumière entre trois plans) : plein viewport,
  `object-cover`, `autoplay muted loop playsInline preload="metadata"`,
  sources desktop/mobile via `<source media>`, poster d'abord, crossfade du
  premier frame, pause hors viewport, `prefers-reduced-motion` = planche
  fixe. Le voilage est TRÈS subtil (ivoire translucide `from-ivory/64 via
  /30 to-ivory/56` + un radial champagne) : jamais de noir sur la vidéo.
  La déclaration des assets vit dans `src/lib/auth-cinema.ts` — un asset
  dédié pour une autre scène d'auth se branche sans architecture.
- **Chaque scène d'auth a sa composition** — `/inscription` : le grand
  registre (deux colonnes, lumière architecturale, faits de la maison,
  formulaire sur feuille) ; `/mot-de-passe-oublie` : la lettre (colonne
  étroite, double filet d'enveloppe) ; `/reinitialiser-mot-de-passe/[token]`
  : la nouvelle clé (filet champagne, token vérifié côté serveur AVANT le
  formulaire, excuse dédiée si le lien est brûlé). Video seulement à la
  porte — pas de vidéo ajoutée ailleurs.
- **Le squelette des grilles** — toutes les grilles produit publiques
  parlent la structure carte (`card` → `figure` → `card-body` →
  `card-title` → `card-actions`, utilities `globals.css`) : photographie en
  `figure` avec ses marques et l'orbite favori, légende en pure typographie
  (`card-title`), et dans `card-actions` le prix tabulaire + le geste
  primaire (encre-plus `card-btn` sur les planches, `btn-primary` complète
  sur la feature). Apparence 100 % maison, jamais le look par défaut du
  squelette.
- **Typographie premium + icônes unifiées** — Fraunces Variable (display,
  optical sizing) + Jost Variable (texte/micro-caps) auto-hébergés ; le film
  conserve Newsreader/Manrope via `--font-film-*` (découplage : les
  utilitaires `cine-*` lisent les voix du film, les pages publiques lisent
  celles du monde). Icônes : plus aucun `lucide-react` importé côté public —
  tout passe par `src/components/icons` (une famille, un `Base`, un trait).
- **En-tête du jour** — ivoire au-dessus du film (`/` et `/univers/*`,
  avant scroll), encre partout ailleurs ; bande au scroll crème translucide
  au lieu de la nuit ; le monogramme parle la voix du film au-dessus du film,
  celle du monde ailleurs.

## Audit général (après P15) — ce que la relecture a trouvé et réparé

Un passage systématique : tsc/eslint/tests/build, tables du schéma sans
lecteur, clés de copie sans usage, fichiers orphelins, liens morts, gardes
côté serveur. Trouvé et fermé :

- **53 clés de copie mortes × 3 dictionnaires** (FR / tounsi latin / tounsi
  arabe) retirées — vestiges des refontes P09/P10 (`Votre palier`,
  `Dernières commandes…`) ; `tsc` prouve que plus rien ne les lit. La ligne
  de navigation Cercle ne promet plus des « paliers et cadeaux » qui
  n'existent pas : « Des points, un carnet, la caisse » / « nokta fel
  defter, monna fel kâss » / « نقاط في دفتر، وفلوس عند الكاس ».
- **`annual_rewards` supprimé du schéma** : la cérémonie d'anniversaire est
  morte depuis P10, la table ne servait plus qu'au seed à écrire des lignes
  que personne ne lisait. Suppression propre (schéma + seed + TRUNCATE).
- **Garde de lien dans le curatage de recherche (P15)** : `/…` accepté, mais
  `//hôte` et `/\hôte` refusés — un « chemin relatif » double-slash quitterait
  la maison et pourrait habiller un miroir de phishing d'un lien de confiance.
- **Garde de renvoi (P12)** : une lettre `cancelled` ne se remet plus en file
  d'un clic — l'annulation était une décision, elle se reprend à sa source.
- **`analytics_events` enfin lu** : le `track()` interne (commande posée,
  diagnostic, liste, retour) écrivait dans une table sans lecteur ; /admin/
  recherches affiche désormais « Activité interne — 30 jours ». Mesure locale,
  aucun traqueur ajouté (0 tiers vérifié par grep, rate-limit côté journal de
  recherche).
- **`global-error.tsx`** ajouté : filet de dernière chance si le layout
  racine casse — document autonome, couleurs de la maison, pas de dépendance
  aux polices.
- **Vérifié sans rien toucher** : aucune chaîne TODO/placeholder, aucun
  `href="#"`, aucun handler vide, toutes `<Image>` bornées, dictionnaires tn
  typés contre fr (parité structurelle garantie par le compilateur), sitemap
  à jour des routes publiques, champs de la feuille de préparation conformes
  au schéma, journal admin 6×6 colonnes, export CSV opérationnel.

## Prompt 15 — Mesurer, puis réparer la vraie requête

- **Le journal de recherche capte le second vrai signal** : `search_events.
  out_of_stock` — la requête a trouvé des rayons… tous vides. /admin/recherches
  gagne la table « Trouvé mais en rupture — réassort » à côté des requêtes
  populaires et des zéros : ce sont LES mots que le pays demande et que la
  réserve doit rendre. Mesure brute, pas de dashboard vaniteux.
- **Réparer plutôt qu'agrandir** : table `query_landings` — le bureau épingle
  une PORTE sur une requête qui ne mène nulle part (zéro résultat) ou ne mène
  qu'à des ruptures : libellé écrit par l'équipe + lien interne/vérifié HTTPS.
  La page de recherche l'affiche : carte « Le comptoir a prévu » dans le
  panneau zéro, bandeau « Rupture au comptoir » au-dessus des résultats quand
  tout est en rupture. Libellés en français, tounsi latin et tounsi arabe.
- **Le curatage est un clic dans le journal** : chaque ligne « sans résultat »
  porte « Épingler une porte » (pré-remplit la requête) ; un seul formulaire
  upsert (query+kind), retrait en un bouton, chaque opération tracée dans
  l'audit. Deux exemples honnêtes vivent dans le seed (marque sur ordonnance
  jamais vendue en ligne ; syndet en réassort → son remplaçant recommandé).
- **Zéro traqueur** : la mesure est 100 % interne (aucun gtag/meta/pixel —
  vérifié par grep) ; le rate-limit (30/min par client) borne le journal sans
  cookie de pistage.

## Prompt 14 — Paiement : ce que la caisse dit est vrai

- **Le panier n'affiche que ce que le serveur accepte** : la liste des moyens
  de paiement vient de `enabledPaymentMethods()` (env `PAYMENT_METHODS_ENABLED`)
  et non d'une copie tenue à la main ; « Carte bancaire » reste en teaser
  désactivé « Bientôt disponible » tant que l'intégration n'existe pas — et le
  serveur refuse `card` à la soumission. Pas de claim SSL/PCI bidon nulle part
  (vérifié par grep) : la maison encaisse à la livraison, par virement, ou en
  carte cadeau vérifiée par téléphone.
- **Le fait de paiement, écrit une seule fois** : `tracking.payNote` (fr /
  tounsi latin / tounsi arabe) — « à régler à la livraison, le livreur rend la
  monnaie », « en attente du virement — RIB communiqué à la confirmation »,
  « code cadeau vérifié par téléphone », « paiement reçu — rien à régler »,
  « paiement non validé — écrivez au comptoir ». Affiché sur /suivi sous le
  total et sur la confirmation dans la liste des prochaines étapes : même
  texte, deux endroits, zéro contradiction.
- **La moitié manquante du paiement hors ligne** : `/admin/commandes/:id` gagne
  `PaymentControl` — « Marquer payé / remboursé / en attente » réservé à
  l'admin, tracé dans l'audit, événement de chronologie inclus. COD exclus
  volontairement (la livraison règle son statut — deux horloges d'un même
  fait = divergence garantie). Les points restent crédités à la livraison
  pour TOUS les moyens : un seul point de règlement.

## Prompt 13 — Mobile vrai, premiers pixels légers

- **L'échelle des images suit le téléphone** : `deviceSizes` gagne 320/390/414/540 —
  avant, un iPhone de 390 px téléchargeait systématiquement la variante 640 px de
  chaque carte produit (≈ 2,7× les octets utiles au premier écran). Le crop est
  gardé en cache 24 h (`minimumCacheTTL`) : la session ne régénère pas les mêmes
  variantes à chaque page.
- **Audit des points durs, tout est vérifié en place plutôt que repeint** :
  toutes les `<Image>` du site portent un `sizes` (aucun `fill` non borné) ;
  l'illustration du hero produit, la galerie et la première carte du rail sont
  en `priority` ; le PDP garde sa barre d'achat sticky mobile et son panneau
  sticky desktop ; les hauteurs pleines sont en `dvh` (barre d'URL mobile
  comprise) ; les tables admin roulent (`overflow-x-auto`) au lieu de casser la
  page ; `min-h-11` sur les cibles tactiles publiques.
- **Polices déjà exemplaires** : Newsreader/Manrope variable auto-hébergées
  (fontsource), `swap` et sous-sets unicode-range choisis par le navigateur —
  rien à dégraisser, le poids du texte au premier rendu est minimal.

## Prompt 12 — Vitesse au comptoir (admin)

- **Renvoyer une lettre, en un clic** — colonne « Renvoi » dans le journal de
  la poste (/admin/emails) : la ligne repasse en file, la ronde part
  immédiatement (`flushOutbox` in-process, pas tributaire du cron externe),
  le résultat réel est annoncé (remise en main propre / échec + motif). Les
  lignes encore en file sont refusées — pas de double envoi accidentel ;
  chaque renvoi est tracé dans l'audit.
- **La feuille de préparation** — /admin/commandes/:id/packing : une page
  noire sur blanc, cases à cocher « prévu / fait », quantités en gras, SKU et
  marque, mode d'acheminement, **somme à encaisser pour la livraison COD**,
  mot cadeau, notes, ligne de signature du préparateur. Bouton Imprimer + CSS
  `@media print` qui sort le chrome admin. Lien direct depuis la fiche
  commande.
- **Déjà en place, vérifié sans rien repeindre** : export CSV des commandes
  (`/api/admin/export/orders`, route handler en pièce jointe), sélecteur de
  rôle admin/support/client sur la fiche client (auto-protection comprise),
  visionneuse de journal d'audit (/admin/audit) — la vitesse demandée était
  en partie construite ; P12 ferme les deux vrais trous.

## Prompt 11 — Retours tenus, factures sûres, nouvelles qui préviennent

- **La fenêtre des 7 jours est une loi, pas une phrase** : `returnWindow()`
  (src/lib/returns.ts, 4 tests) mesure depuis l’ÉVÉNEMENT `delivered` du
  registre d’ordre — ni expédition, ni confirmation. Le formulaire ne s’ouvre
  qu’à la réception ; hors délai il se ferme de lui-même et renvoie calmement
  au comptoir (« une demande au cas par cas ») au lieu d’un bouton mort.
  Le serveur rejoue le même contrôle à la soumission — le client ne fait pas
  la loi.
- **Le formulaire dit la promesse exacte** : « Sous 7 jours après réception,
  produit non ouvert — remboursement ou avoir sous 5 jours après retour »,
  avec décompte live (« il vous reste 5 jours ») — identique à /livraison.
- **Chaque étape du retour écrit au client** : approbation (consignes + 5 j),
  attente client (photo/blister/lot), refus (motif + relecture par un
  pharmacien), clôture (remboursement parti) — e-mail dédié `return_update`,
  français ou tounsi selon la langue du compte, le mot du comptoir inclus.
  `pending`/`in_review` restent internes : pas de spam d’étapes vides.
- **Factures** (vérifiées, rien à construire) : PDF signé via
  `/api/orders/:number/invoice`, quatre portes d’accès (session propriétaire,
  staff, clé d’accès de la commande, e-mail vérifié + rate-limit), lien sur la
  fiche commande et sur /suivi.

## Prompt 10 — Fidélité : les points, rien d’autre

- **La règle tient en une phrase** : 1 DT dépensée = 10 points ; 1 000 points =
  10 DT au moment de payer, dans la limite du reste dû (verrou `FOR UPDATE`,
  unicité (order, kind) au ledger — deux paniers simultanés ne dépensent pas
  deux fois les mêmes points).
- **Crédit à la livraison uniquement** — jamais à la création ; `awardLoyaltyForOrder`
  est idempotent (index unique partiel + onConflictDoNothing). La lettre
  « commandée livrée » affiche la ligne du carnet (+N points) en FR et en tounsi.
- **Clawback honnête** — annulation ou retour reprennent les points gagnés ET
  rendent les points dépensés (`reverseLoyaltyForOrder` + `restoreSpentLoyalty`),
  solde plancher à 0.
- **L’escalier est retiré** (Sable/Nacre/Champagne/Or, anneaux, bénéfices) : ses
  promesses (« livraison offerte dès 79 DT », ventes anticipées) n’avaient aucun
  effet réel à la caisse. Une promesse non tenue vaut moins qu’aucune.
- **Le cadeau d’anniversaire est retiré aussi** : plus de cérémonie dans le cron
  quotidien, plus de formulaire, plus d’e-mail `vip_birthday` (retiré du
  registre d’envoi — les lignes passées dorment dans les tables, rien n’est supprimé).
- **/compte/fidelite = solde + règle + carnet** (24 dernières lignes signées,
  gains verts, retraits terre). vip.ts réduit à `getVipSummary` : solde,
  lifetime exact (somme SQL des lignes positives), historique.

## Prompt 09 — Compte épuré

- **Vue d'ensemble ramenée à l'essentiel** : la commande en cours (avec le suivi
  en un clic), trois portes discrètes (points · favoris · retours en cours — le
  chiffre qui compte, vers la page qui sait y répondre), et le registre des
  trois dernières commandes. Les tuiles de services, la grille de favoris et le
  livre de points en double ont sauté : chaque donnée vit désormais sur SA page.
- **Le solde reste dans l'en-tête du salon** (grand chiffre, petit compta) —
  c'est l'identité du compte, pas un widget.
- **Rien n'est supprimé côté pages** : favoris, rituels, fidélité, abonnement,
  support, retours gardent leur route et leur profondeur ; seul l'écran d'accueil
  respire.

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

- Palette du jour (vitrine publique) : papier `#faf7f0`, ivoire `#fffefb`,
  crème `#f7f2e6`, marbre `#f0e9d9`, pierre `#d9cfb6`, encre `#221c13`,
  champagne `#a3803f` / `#87662e` / `#cbb078`, glow `#ecd9a4`, terre `#96522f`,
  noir `#16120c` (fonds cinématiques uniquement).
- Typographie : **Fraunces Variable** (display) + **Jost Variable** (texte et
  micro-caps) pour le monde du jour ; **Newsreader Variable** (display) +
  **Manrope Variable** (texte) restent les voix du film (accueil, héro des
  univers, menu et pied cinématiques) via `--font-film-*` ; Noto Kufi pour
  l'arabe. Tout est auto-hébergé (`@fontsource-variable`).
- Icônes : une seule famille — `src/components/icons` (tracés 24×24, trait
  1.5, coins ronds) ; aucun import direct de lucide-react côté public.
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
