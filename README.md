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
| `RESEND_API_KEY` | Clé Resend. **Sans elle, aucun e-mail n'est envoyé** : ils sont écrits dans `.mail/sink/`. |
| `MAIL_FROM` / `MAIL_REPLY_TO` | Expéditeur et adresse de réponse des e-mails transactionnels. |
| `MAIL_SOCIAL` | Liens sociaux du pied de page, `Instagram\|https://…,Facebook\|https://…`. Vide = ligne omise. |

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
- **E-mails transactionnels** (`src/lib/mail/`) : 12 lettres françaises (bienvenue, les
  7 statuts de commande, mot de passe oublié, 3 lettres de support). Les gabarits
  écrivent du HTML directement — `react-dom/server` est refusé dans un server action —
  et chaque lettre emporte sa version texte. L'envoi passe par l'API Resend, avec repli
  automatique sur le dossier local `.mail/` : une panne du prestataire ne bloque jamais
  une commande. Aperçus dans le back office (`/admin/emails`) ou via `npm run mail:preview`.

- **Réinitialisation du mot de passe** (`/mot-de-passe`) : un seul écran, deux états —
  demander un lien, ou s'en servir. Seule l'empreinte SHA-256 du jeton est stockée
  (`password_resets`), un seul lien vivant par compte, validité 60 minutes, usage unique
  garanti par une réclamation conditionnelle en base. La réponse du formulaire est
  identique que l'adresse existe ou non : ce n'est pas un annuaire. Un mot de passe changé
  déconnecte tous les autres appareils.

## Expérience

### Suivi de commande intelligent
`/suivi` ne se contente plus d'afficher un statut : trois couches lisibles.
La progression en cinq étapes, puis **l'étape courante développée** — ce qui se passe
concrètement et ce qu'on attend ensuite, dans ses propres mots (`ORDER_STEPS` couvre les
**sept** statuts, y compris annulée et remboursée, qui ont leur propre panneau et leur
propre texte de remboursement), puis le journal horodaté replié. Un bouton
**« J'ai un problème »** ouvre un ticket déjà rempli du numéro de commande : la cliente
n'a pas à retrouver une référence qu'on vient de lui afficher.

### Réassort — « prévenez-moi »
Une référence épuisée propose la file d'attente plutôt qu'un simple « épuisé » : canal au
choix (e-mail ou WhatsApp), adresse pré-remplie pour un compte connecté, confirmation qui
nomme l'adresse qui sera prévenue. L'unicité (produit, e-mail) est un **index unique** en
base, pas une lecture préalable. Un réassort saisi en back office vide la file — comptes
connectés servis en premier, dans l'ordre des inscriptions — et écrit la 13ᵉ lettre du
système. Les lignes sont marquées avant l'envoi : un e-mail perdu reste dans la file.

### Diagnostic beauté — `/conseil`
Quatre questions, une à la fois, puis un conseil **expliqué**. Le barème est déclaratif et
lisible dans `src/lib/advisor-questions.ts` : la priorité déclarée pèse le plus, le type de
peau ajuste, une peau sensible ajoute la tolérance, et la protection solaire ferme toujours
le conseil — c'est le seul geste qu'un pharmacien ne dira jamais facultatif. Le classement
des références est explicite (somme des poids des préoccupations portées, puis note, puis
ventes) et ne retient que du **disponible**.

Le questionnaire vit dans un module **sans base de données** : il est importé par un
composant client, et sans cette séparation Turbopack tire `pg` dans le bundle navigateur.
Les réponses sont contraintes par un schéma Zod aux valeurs proposées — jamais une chaîne
libre, sinon un appelant choisirait le résultat qu'il veut voir. Un compte connecté
retrouve son conseil dans `/compte/diagnostic`, réponses remises en phrases.

### Le Cercle — `/compte/fidelite`
Tableau de bord de fidélité calé sur la mécanique déjà en place (10 points par dinar,
1 000 points = 10 DT) : palier courant, valeur du solde en dinars écrite en toutes lettres,
progression **mesurée entre deux paliers** — une barre qui repart de zéro à chaque palier
donne l'impression de recommencer — et le registre complet avec la raison de chaque
mouvement. Aucune date d'expiration n'est annoncée : le schéma n'en porte pas, et l'écrire
serait une promesse que rien ne tient.

### Favoris partagés et « Offrir ce soin »
Une sélection se partage par un lien dont l'adresse tient lieu de clé : 128 bits
d'aléatoire, index unique, aucune route ne liste les jetons. Trois états annoncés sans
détour — pas de lien, lien actif, lien **suspendu** (l'adresse est conservée, elle ne
répond plus) — et « révoquer » supprime la ligne, donc le lien cesse d'exister. La page
publique ne montre que les favoris : ni coordonnées, ni commandes, ni adresses, et elle
est en `noindex, nofollow`.

« Offrir ce soin » demande le mot **avant** l'ajout au panier et enclenche l'emballage
cadeau d'office. Le mot vit désormais dans l'état du panier (`giftMessage`) et non dans
un état local de la page de commande : écrit depuis la fiche, il doit survivre jusqu'à la
caisse, où il reste modifiable.

### Mon rituel — `/compte/rituel`
Plusieurs routines nommées par personne (six au plus), chacune une liste ordonnée de
produits avec posologie et quantité. Un produit n'apparaît qu'une fois par routine :
l'ordre d'application est l'information, la répétition n'en est pas une.

Le glisser-déposer n'est **jamais le seul chemin** : chaque étape porte aussi des flèches
monter/descendre et un bouton retirer, parce que le glisser-déposer seul est inutilisable
au clavier et hasardeux sur mobile. Les flèches se désactivent aux deux extrémités.

Deux décisions qui méritent d'être écrites, parce qu'elles se cassent en silence :

- **Toute écriture porte le couple (routine, utilisateur) dans son `where`**, jamais
  l'identifiant de routine seul — sinon on réordonne la routine d'un autre en devinant un
  identifiant. Le réordonnancement réécrit toutes les positions **en une transaction** :
  un ordre à moitié écrit laisse deux étapes à la même place.
- **`resolveMoveTarget()` vit à part, dans `src/lib/routines.ts`, et est testée.** Elle est
  née d'un bug réel : `Number(null)` vaut `0`, donc un déplacement « d'un cran » sans
  position cible était lu comme « aller à la position 0 » — ordre inchangé pour la première
  étape, et aucun message pour le dire. La position envoyée par le client est une
  *intention*, jamais une vérité : elle est re-bornée côté serveur contre la liste réelle.

### La suite d'une livraison
Deux lettres, pas une de plus : un retour d'usage à **J+2** pendant que c'est frais, et
des nouvelles à **J+10**, au moment où l'on abandonne un soin qui allait marcher. Aucune
des deux ne vend. L'avertissement sanitaire passe avant l'invitation à commenter — si
quelque chose irrite, la priorité n'est pas l'avis, c'est le téléphone.

Rien dans l'application ne tourne en tâche de fond : `npm run care:followups` est le point
d'entrée à brancher sur un ordonnanceur (une exécution par heure suffit, les échéances se
comptent en jours). Il est idempotent — l'index unique (commande, type) garantit en base
qu'une commande ne reçoit jamais deux fois la même lettre — et une commande annulée ou
retournée après coup ne reçoit plus rien.

Le script tourne avec `--conditions=react-server`, la condition d'export qui fait résoudre
`server-only` sur son module vide, exactement comme Next le fait côté serveur.

### Conseiller en ligne
Un bouton flottant, présent sur toutes les pages, avec deux régimes décidés par
`src/lib/hours.ts` **à l'heure de Tunis** (`Intl.DateTimeFormat` avec fuseau explicite :
le serveur peut tourner n'importe où). Comptoir ouvert, un pharmacien répond — attente
annoncée sous 2 heures ouvrées. Comptoir fermé, un assistant répond aux questions
courantes à partir de réponses **déjà écrites par la maison** : ce qu'il ne sait pas
devient un ticket, jamais une improvisation. Focus piégé, Échap, `aria-live`.

## Langues

La couche de langue vit dans `src/i18n/`. `fr` est la source de vérité : sa forme est
inférée, et toute autre langue est typée `typeof fr`, si bien qu'une clé manquante ou
renommée est une **erreur de compilation**, pas un vide en production.

- **Choix** : un cookie (`cleo_lang`), pas l'URL. Le catalogue garde un seul slug par
  produit ; dupliquer chaque route pour une deuxième langue diviserait le référencement
  de toutes les pages. Le curseur « Français | تونسي / Tounsi » est dans l'en-tête et dans
  le panneau mobile.
- **Résolution** : le layout lit le cookie (`readLocale`) et passe des **chaînes déjà
  traduites** aux composants client — jamais la langue à résoudre.
- **E-mails** : la langue de la personne est enregistrée sur son compte (`users.locale`,
  prise au moment de l'inscription) et décide de la langue des lettres, qui partent sans
  personne derrière l'écran pour la choisir.

### Ce qui est traduit aujourd'hui

| Zone | État |
| --- | --- |
| Bandeau d'annonce (4 faits) | ✅ FR · Tounsi |
| En-tête (libellés, `aria-label`, recherche) | ✅ FR · Tounsi |
| Curseur de langue + panneau mobile (liens, compte) | ✅ FR · Tounsi |
| Colophon (titres, arguments, Journal, mentions légales) | ✅ FR · Tounsi |
| Connexion · inscription · mot de passe oublié (écrans, champs, boutons, titres de page) | ✅ FR · Tounsi |
| Lettre de bienvenue (objet + pré-en-tête) | ✅ FR · Tounsi |
| Lettres de commande, de support et de réinitialisation (corps) | ⏳ français |
| Fiches produit, univers, articles du Journal (contenu éditorial) | ⏳ français |
| Messages d'erreur serveur, back office | ⏳ français |

Le Tounsi est écrit en **lettres latines**, la façon dont il s'écrit réellement en ligne.
La version en caractères arabes est le même dictionnaire sous un autre rendu, avec
`dir="rtl"` : elle s'ajoute comme troisième clé sans toucher aucun point d'appel.

## Commandes utiles

```bash
npm run dev         # serveur de développement
npm run build       # build de production
npm run start       # serveur de production (après build)
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # tests unitaires (node:test via tsx)
npm run mail:preview # génère les 15 e-mails dans .mail/preview/
npm run care:followups # envoie les lettres de suivi échues (à ordonnancer)
npm run db:push     # applique le schéma Drizzle
npm run db:seed     # (re)charge les données de démonstration
node scripts/dev-db.mjs status   # état de l'instance locale
```
