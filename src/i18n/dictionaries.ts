/**
 * CLÉOPÂTRE — COUCHES DE LANGUE.
 *
 * Two locales today: French, and Tunisian written in Latin script (`tn`),
 * which is how Tunisians actually type it online. Arabic-script Tounsi is the
 * same dictionary under a different rendering plus `dir="rtl"`; it slots in as
 * a third key without touching any call site.
 *
 * The contract is deliberately strict:
 *   • `fr` is the *source of truth* — its shape is inferred, not declared;
 *   • every other locale is typed as `typeof fr`, so a missing or renamed key
 *     is a **compile error**, not a blank string in production;
 *   • values may carry `{placeholders}`, filled by `t()`.
 *
 * This is the layer the whole site will sit on. Strings that are not here yet
 * are still French-only, and that is tracked in `README.md` rather than hidden.
 */
export const fr = {
  locale: {
    label: "Français",
    short: "FR",
    switchTo: "Passer en tunisien",
    language: "Langue",
  },
  strip: {
    freeShipping: "Livraison offerte dès 99 DT",
    advice: "Conseil pharmaceutique — 71 450 210",
    cod: "Paiement à la livraison",
    authentic: "Produits 100 % authentiques",
  },
  nav: {
    universes: "Univers",
    shop: "Boutique",
    promos: "Offres",
    brands: "Marques",
    journal: "Journal",
    help: "Aide",
  },
  header: {
    menu: "Ouvrir le menu",
    search: "Rechercher",
    searchPlaceholder: "Rechercher dans la maison…",
    cart: "Panier",
    wishlist: "Favoris",
    account: "Mon espace",
    signIn: "Se connecter",
  },
  footer: {
    statementTitle1: "La santé de la peau",
    statementTitle2: "mérite une maison.",
    statementBody:
      "Depuis Ezzahra et Hammam-Lif, nos pharmaciennes et pharmaciens sélectionnent chaque référence — authentique, tolérante, utile — et la préparent pour vous, en boutique ou livrée partout en Tunisie.",
    official: "Distribution officielle",
    fastShipping: "Livraison 24–72 h",
    cod: "Paiement à la livraison",
    houseHeading: "La maison",
    serviceHeading: "Le service",
    countersHeading: "Venir nous voir",
    newsletterTitle: "Le Journal, une fois par mois.",
    newsletterBody: "Des conseils courts, écrits par nos pharmaciens. Pas de publicité, pas de promesse excessive.",
    emailPlaceholder: "votre adresse e-mail",
    subscribe: "S'inscrire",
    terms: "Conditions générales",
    privacy: "Confidentialité",
    legal:
      "Cléopâtre — Espace Santé Beauté, Ezzahra & Hammam-Lif, Tunisie. Vous recevez ce message parce qu'il concerne votre compte ou une commande passée chez nous.",
    links: {
      promos: "Offres du moment",
      brands: "Les laboratoires",
      journal: "Le Journal",
      stores: "Nos boutiques",
      help: "Aide & FAQ",
      track: "Suivre ma commande",
      shipping: "Livraison & retours",
      find: "Trouver mon soin",
      account: "Connexion",
      register: "Créer un compte",
      logout: "Déconnexion",
    },
  },
  auth: {
    loginKicker: "Retrouver votre espace",
    loginTitle1: "Bon retour ",
    loginTitle2: "parmi nous",
    loginEmail: "E-mail",
    loginPassword: "Mot de passe",
    loginSubmit: "Se connecter",
    loginPending: "Connexion…",
    loginNoAccount: "Pas encore de compte ?",
    loginCreate: "Crer un compte",
    loginPrivate: "Espace réservé aux clientes et équipes Cléopâtre.",
    forgot: "Mot de passe oublié ?",
    resetRequestKicker: "Mot de passe oublié",
    resetRequestTitle: "Cela arrive",
    resetRequestNote:
      "Donnez-nous l'e-mail de votre compte : nous vous envoyons un lien personnel, valable une heure.",
    resetRequestField: "L'e-mail de votre compte",
    resetRequestSubmit: "Recevoir le lien",
    resetRequestPending: "Envoi…",
    resetRequestRemember: "Vous vous en souvenez ?",
    resetRequestExpiry: "Le lien est personnel et expire au bout d'une heure.",
    resetKicker: "Nouveau mot de passe",
    resetTitle: "Choisir un nouveau mot de passe",
    resetNote: "Huit caractères au minimum. Vos autres appareils seront déconnectés.",
    resetPassword: "Nouveau mot de passe",
    resetConfirm: "Confirmer le mot de passe",
    resetSubmit: "Choisir ce mot de passe",
    resetPending: "Enregistrement…",
    resetDevices: "Vos autres appareils seront déconnectés par sécurité.",
  },
  mail: {
    welcomeSubject: "Bienvenue chez Cléopâtre ✨",
    welcomePreheader: "Votre espace est ouvert. Voici comment nous travaillons.",
  },
};

/**
 * `fr` is written without `as const` on purpose: its values must widen to
 * `string`, otherwise every other locale would have to reproduce the French
 * sentence letter for letter.
 */
export type Dictionary = typeof fr;

/**
 * Tounsi — Latin script. Same keys, same warmth, spoken the way it is spoken:
 * short sentences, the French loanwords Tunisians actually use for pharmacy
 * products, and no attempt to sound like a translated textbook.
 */
export const tn: Dictionary = {
  locale: {
    label: "Tounsi",
    short: "TN",
    switchTo: "Beddel lel français",
    language: "Llougha",
  },
  strip: {
    freeShipping: "Livraison gratuite men 99 DT",
    advice: "Nasíha men pharmacien — 71 450 210",
    cod: "Khallas ki tawsallek",
    authentic: "Produits 100 % asliyyin",
  },
  nav: {
    universes: "Univers",
    shop: "Boutique",
    promos: "Offres",
    brands: "Marques",
    journal: "Journal",
    help: "Aide",
  },
  header: {
    menu: "Efta7 l menu",
    search: "Lawwej",
    searchPlaceholder: "Lawwej fi Cléopâtre…",
    cart: "Panier",
    wishlist: "Favoris",
    account: "Espace mte3i",
    signIn: "Adkhol",
  },
  footer: {
    statementTitle1: "Se77et l jeld",
    statementTitle2: "testa7eq dar.",
    statementBody:
      "Men Ezzahra w Hammam-Lif, l pharmaciens mte3na yekhtarou kol référence — asliyya, tet7ammel, yestféd biha — w yheyyewha lik, fil boutique wala nwasslouha lik fi toute la Tunisie.",
    official: "Distributeur officiel",
    fastShipping: "Livraison 24–72 s3a",
    cod: "Khallas ki tawsallek",
    houseHeading: "Dar Cléopâtre",
    serviceHeading: "Khidmet",
    countersHeading: "Eja choufna",
    newsletterTitle: "Journal, marra fi chhar.",
    newsletterBody: "Nsa7e7 qsar, ktebhom l pharmaciens mte3na. Kéddhab zéro, w3oud kbira zéro.",
    emailPlaceholder: "adresse e-mail mte3ek",
    subscribe: "Sajjel",
    terms: "Conditions générales",
    privacy: "Confidentialité",
    legal:
      "Cléopâtre — Espace Santé Beauté, Ezzahra w Hammam-Lif, Tunisie. Jawwek l message hedha 5ater ya3ni compte mte3ek wala commande 3melt'ha 3andna.",
    links: {
      promos: "Offres tawa",
      brands: "Laboratoires",
      journal: "Journal",
      stores: "Boutiques mte3na",
      help: "Aide & FAQ",
      track: "Tabba3 commande mte3i",
      shipping: "Livraison & retours",
      find: "Trouver mon soin",
      account: "Connexion",
      register: "Créer un compte",
      logout: "Déconnexion",
    },
  },
  auth: {
    loginKicker: "Rja3 l espace mte3ek",
    loginTitle1: "Marhba bik ",
    loginTitle2: "3andna",
    loginEmail: "E-mail",
    loginPassword: "Mot de passe",
    loginSubmit: "Adkhol",
    loginPending: "Qed nadkhlou…",
    loginNoAccount: "Ma3andekch compte ?",
    loginCreate: "A3mel compte",
    loginPrivate: "Espace réservé lel clientes w équipe Cléopâtre.",
    forgot: "Nsit l mot de passe ?",
    resetRequestKicker: "Nsit l mot de passe",
    resetRequestTitle: "Hedhi tsir",
    resetRequestNote: "A3tina l e-mail mte3 compte mte3ek : nb3athoulik lien personnel, yslo7 s3a.",
    resetRequestField: "E-mail mte3 compte mte3ek",
    resetRequestSubmit: "Ab3athli l lien",
    resetRequestPending: "Qed nib3thou…",
    resetRequestRemember: "Tfakartou ?",
    resetRequestExpiry: "L lien hedha lik enti w youfa ba3d s3a.",
    resetKicker: "Mot de passe jdid",
    resetTitle: "Ekhtar mot de passe jdid",
    resetNote: "8 caractères au minimum. appareils l okhrin mte3ek bech yakhrojou.",
    resetPassword: "Mot de passe jdid",
    resetConfirm: "Akked l mot de passe",
    resetSubmit: "Ekhtar l mot de passe hedha",
    resetPending: "Qed nsajjlou…",
    resetDevices: "Béhiya mte3ek, l appareils l okhrin bech yakhrojou.",
  },
  mail: {
    welcomeSubject: "Marhba bik fi Cléopâtre ✨",
    welcomePreheader: "Espace mte3ek t7ell. Hédhi kif na5dmou.",
  },
};
