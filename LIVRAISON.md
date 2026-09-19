# Cléopâtre — installation en cinq minutes

Tout ce qu'il faut pour faire tourner la boutique en local, et l'état exact de
ce qui est construit. Ce fichier est écrit pour quelqu'un qui ouvre le projet
pour la première fois.

---

## 1. Prérequis

- **Node 22** (le projet est développé et testé sur Node 22.22).
- **Rien d'autre.** La base de données est embarquée : `npm run db:start` monte
  un PostgreSQL 17 local dans `.devdb/`, sans Docker, sans service à installer.
- 1 Go d'espace disque environ (dépendances + base + vidéos).

## 2. Démarrer

```bash
npm install                # 521 paquets, ~20 s
npm run db:start           # démarre PostgreSQL 17 local et écrit .env
npm run db:push            # crée les tables depuis src/db/schema.ts
npm run db:seed            # charge le catalogue de démonstration (81 références, 355 lots)
npm run build              # build de production
npm run start -- --port 3000
```

Ou, pour développer avec rechargement à chaud :

```bash
npm run dev
```

Ouvrir ensuite <http://localhost:3000>.

### Comptes de démonstration

| Rôle | Adresse | Mot de passe |
| --- | --- | --- |
| Administration | `admin@cleopatre.tn` | `Admin123!` |
| Support | `support@cleopatre.tn` | `Support123!` |
| Cliente | `client@cleopatre.tn` | `Client123!` |

Le back-office est sur `/admin`, l'espace cliente sur `/compte`. Une liste
partagée de démonstration existe : `/liste/demo-partage-2026`.

## 3. Vérifier que tout tient debout

```bash
npm run typecheck      # TypeScript + types générés par Next
npm run lint           # ESLint, tout le dépôt
npm test               # 111 tests unitaires (node:test), sans base de données
npm run smoke          # 41 vérifications : chaque porte publique répond,
                       # chaque porte privée reste fermée
```

Le poids réel des pages se mesure sur un serveur **de production** :

```bash
WEIGHT_BUDGET_KB=420 \
WEIGHT_ROUTES="/,/boutique,/produit/la-roche-posay-effaclar-duo-m,/actifs,/rapidite,/journal,/etat,/produit/nuxe-huile-prodigieuse" \
node scripts/weight-guard.mjs http://127.0.0.1:3000
```

## 4. Remettre la base à zéro

```bash
npm run db:stop && npm run db:reset && npm run db:start && npm run db:push && npm run db:seed
```

`npm run db:seed` vide toutes les tables avant de recharger : ne jamais le
lancer sur une base contenant des données réelles (`ALLOW_DESTRUCTIVE_SEED=1`
est exigé en production, et refuse sans mots de passe fournis par
l'environnement).

## 5. Ce qu'il y a dans cette livraison

### L'interface

- **Palette « Apple Modern »** : `#F5F5F7` (sol), `#1D1D1F` (encre), `#AAAAAA`
  (filets), `#007AFF` (signal). Définie une seule fois dans
  `src/app/globals.css` : les pages, le back-office et le mode nuit en dérivent.
- **Le film n'est jamais voilé** : ni nappe, ni grain, ni recadrage sur les
  vidéos ; un dégradé sous les mots et une ombre portée sur le texte suffisent.
- **Formulaires à taille de comptoir** : champs de 58 px, 17 px de corps
  (en dessous de 16 px, un téléphone zoome la page entière au premier focus),
  colonne de 58 rem, boutons de 52 px.
- **Poste de commande** : déconnexion dans l'en-tête, au pied de la colonne et
  dans le tiroir du téléphone.
- **La connexion suit l'inscription** : même sol clair, mêmes deux colonnes,
  même feuille pour le formulaire.

### La boutique

Vitrine cinématographique par rayons, catalogue de 81 références, fiche produit
complète, recherche (avec tolérance aux fautes, recherche par actif et par
code-barres), panier avec jauge de livraison offerte et les pièces qui comblent
l'écart, commande, suivi, compte cliente, carte cadeau, journal, glossaire des
actifs, diagnostic.

### La vérité des fiches (le cœur du travail récent)

- **81 fiches écrites une par une** : aucune composition, aucun mode d'emploi,
  aucune description partagée entre deux références — c'est vérifié par test.
- **Composition sourcée** : 20 fiches recoupées sur la notice du laboratoire et
  affichées comme vérifiées ; les autres disent, sur la page publique, qu'un
  pharmacien ne les a pas encore signées. Aucune formule inventée.
- **Allergènes lus dans la formule** par le code (26 allergènes parfumants
  déclarables), jamais saisis à la main.
- **Identité imprimée sur la fiche** : EAN-13 calculé avec sa clé de contrôle,
  PAO réel, pays de fabrication, distributeur, âge minimum.

### La péremption (17 points)

- **Lots** : numéro, date, comptoir, fournisseur, rayon ou réserve. 355 lots en
  démonstration, dont volontairement : des lots à moins de 30 jours, des lots à
  moins de 90 jours, 4 lots déjà périmés (en quarantaine, hors stock vendable)
  et 3 lots sans date — tous visibles.
- **FEFO** : la caisse sort toujours le lot qui périme en premier. Un lot
  périmé ou non daté n'est **jamais** vendable, et le checkout refuse plutôt que
  de vendre du stock qu'on ne peut pas justifier.
- **Filet de sécurité** : la tâche quotidienne met en quarantaine ce qui a
  dépassé sa date, même si personne ne regarde.
- **Au comptoir** : réception de lot, datation d'un lot reçu sans date,
  quarantaine / destruction / remise en vente avec motif, remise courte date
  portée par le lot (jamais un faux prix barré général), transfert entre
  comptoirs, inventaire des écarts, étiquettes rayon imprimables avec code-barres
  réel, rapport mensuel de ce qui a été détruit ou retourné.
- **Sur la fiche** : date du lot le plus proche, mention honnête quand du stock
  est à date courte, et comptage des unités reçues sans date.

### L'exploitation

- `/etat` public : base de données, catalogue, lots datés, courrier sortant,
  tâche quotidienne — chaque ligne est une requête, et la page dit aussi ce
  qu'elle ne vérifie pas. `/api/health` sert le même rapport en JSON (503 dès
  qu'un contrôle passe au rouge).
- **Rupture prévue** dans l'administration du stock : « il reste 6, et vous en
  vendez 2 par jour » — épuisement daté, quantité de commande conseillée.
- **Audit qualité** qui demande si la donnée est *vraie* (19 contrôles par
  fiche, 8 à l'échelle du catalogue), y compris un détecteur de formules
  copiées.

### Les données de la cliente

- « **Ce qui va périmer chez vous** » : les dates réelles des lots livrés.
- « **Probablement à racheter** » : son rythme d'achat réel, rien pour un
  produit acheté une seule fois.
- **Export** complet en JSON, et en CSV (une ligne par article, avec lot et
  date) depuis `/compte/profil`.
- **Suppression de compte** en trois gestes, qui dit avant d'agir ce qui est
  effacé et ce qui reste (les factures, dix ans, sans coordonnées).

## 6. Ce qui n'est pas construit

Pour que personne ne le découvre par surprise :

- **Carte bancaire** : la caisse encaisse la carte cadeau et le paiement à la
  livraison. Aucun branchement de passerelle — voir `docs/PAYMENTS.md`.
- **Ordonnance déposée** (photo/PDF) : demande une décision de stockage chiffré ;
  non construite tant qu'elle n'est pas prise.
- **Vérification de dates par navigateur automatisé** : l'environnement de
  développement utilisé n'a pas de navigateur installé. Tout est vérifié par
  serveur, tests unitaires, build et curl — pas par un parcours Playwright.
- **Appels de service externe** (SMS, passerelles, calendrier) : les interfaces
  existent, les comptes n'existent pas.
- Les points marqués ⚠ dans la feuille de route (données d'équipe à saisir,
  décisions de stockage) restent volontairement dehors tant que l'information
  doit venir de la maison : le site n'invente pas de données qu'il ne possède
  pas.
