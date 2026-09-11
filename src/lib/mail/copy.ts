import type { OrderStatus } from "@/db/schema";

/**
 * LES MOTS — what each status actually says to a customer.
 *
 * One voice for all seven: calm, concrete, no exclamation marks and no
 * marketing. Each entry carries its own subject, its own next steps and its
 * own invitation, because "expédiée" and "annulée" are not the same letter
 * wearing a different label.
 *
 * The seven statuses are the ones the shop really has (`OrderStatus`):
 * pending · confirmed · preparing · shipped · delivered · cancelled · returned.
 * "Remboursée" is carried by `returned` — that is the status at which money
 * actually goes back — and the copy says so plainly.
 */

export type Tone = "good" | "warn" | "bad" | "neutral";

export type OrderMailCopy = {
  /** Subject line. `{number}` is replaced with the order number. */
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  statusLabel: string;
  tone: Tone;
  /** `{name}` is replaced with the customer's first name. */
  body: string;
  steps: string[];
  cta: { label: string; path: "tracking" | "shop" | "support" | "account" };
  /** Second, quieter invitation under the main one. */
  secondary?: { label: string; path: "tracking" | "shop" | "support" | "account" };
};

export const ORDER_MAIL_COPY: Record<OrderStatus, OrderMailCopy> = {
  pending: {
    subject: "Votre commande {number} est bien arrivée",
    preheader: "Nous la vérifions et vous écrivons dès qu'elle est confirmée.",
    eyebrow: "Réception",
    title: "Commande reçue",
    statusLabel: "En attente de confirmation",
    tone: "neutral",
    body: "Bonjour {name}, votre commande est bien arrivée jusqu'à nous. Un pharmacien vérifie chaque référence et la disponibilité réelle en stock avant de la confirmer — cela prend en général moins d'une heure ouvrée.",
    steps: [
      "Nous vérifions les références et leur disponibilité.",
      "Vous recevez un e-mail de confirmation, puis nous préparons le colis.",
      "Rien à régler maintenant si vous avez choisi le paiement à la livraison.",
    ],
    cta: { label: "Suivre ma commande", path: "tracking" },
    secondary: { label: "Une question ? Écrivez-nous", path: "support" },
  },
  confirmed: {
    subject: "Commande {number} confirmée ✨",
    preheader: "Elle est entre nos mains. Nous la préparons avec soin.",
    eyebrow: "Confirmation",
    title: "Votre commande est confirmée",
    statusLabel: "Confirmée",
    tone: "good",
    body: "Bonjour {name}, merci. Votre commande est confirmée et réservée. Nos pharmaciens la préparent au comptoir d'Ezzahra ou de Hammam-Lif, avec la même attention qu'en boutique.",
    steps: [
      "Vos références sont réservées : plus aucun risque de rupture.",
      "Nous préparons et emballons votre colis sous 24 h ouvrées.",
      "Vous recevrez le numéro de suivi dès l'expédition.",
    ],
    cta: { label: "Voir ma commande", path: "tracking" },
    secondary: { label: "Continuer mes achats", path: "shop" },
  },
  preparing: {
    subject: "Votre commande {number} est en préparation",
    preheader: "Nos pharmaciens composent votre colis au comptoir.",
    eyebrow: "Préparation",
    title: "Nous préparons votre colis",
    statusLabel: "En préparation",
    tone: "neutral",
    body: "Bonjour {name}, votre commande est au comptoir. Chaque référence est vérifiée une dernière fois — date de péremption, état du scellé, conformité du lot — avant d'être emballée.",
    steps: [
      "Contrôle pharmaceutique de chaque référence.",
      "Emballage protégé, avec vos échantillons le cas échéant.",
      "Remise au transporteur sous 24 h ouvrées.",
    ],
    cta: { label: "Suivre ma commande", path: "tracking" },
  },
  shipped: {
    subject: "Votre commande {number} est en route",
    preheader: "Votre colis a quitté la maison. Voici son suivi.",
    eyebrow: "Expédition",
    title: "Votre colis est en route",
    statusLabel: "Expédiée",
    tone: "good",
    body: "Bonjour {name}, votre commande a quitté la maison et voyage vers vous. La livraison prend 24 à 72 h selon votre gouvernorat.",
    steps: [
      "Suivez le colis avec le numéro ci-dessous.",
      "Le transporteur vous appellera avant le passage.",
      "Préparez le règlement si vous avez choisi le paiement à la livraison.",
    ],
    cta: { label: "Suivre la livraison", path: "tracking" },
    secondary: { label: "Un souci de livraison ?", path: "support" },
  },
  delivered: {
    subject: "Votre commande {number} a été livrée",
    preheader: "Merci. Voici quelques conseils pour bien commencer.",
    eyebrow: "Livraison",
    title: "Bien reçu, merci",
    statusLabel: "Livrée",
    tone: "good",
    body: "Bonjour {name}, votre commande vous a été remise. Prenez un instant pour vérifier le contenu : si une référence manque ou arrive abîmée, écrivez-nous dans les sept jours et nous la remplaçons.",
    steps: [
      "Vérifiez le scellé et la date de péremption de chaque référence.",
      "Commencez progressivement : un nouveau soin s'introduit seul, pas trois à la fois.",
      "Vos points de fidélité ont été crédités sur votre espace.",
    ],
    cta: { label: "Voir ma commande", path: "tracking" },
    secondary: { label: "Demander un conseil", path: "support" },
  },
  cancelled: {
    subject: "Votre commande {number} a été annulée",
    preheader: "Les détails de l'annulation et ce qui se passe ensuite.",
    eyebrow: "Annulation",
    title: "Commande annulée",
    statusLabel: "Annulée",
    tone: "bad",
    body: "Bonjour {name}, votre commande a été annulée. Les références ont été remises en stock et aucun prélèvement n'a été effectué. Si vous aviez déjà réglé, le remboursement suit immédiatement.",
    steps: [
      "Aucune référence ne vous sera livrée pour cette commande.",
      "Un paiement déjà encaissé est remboursé sous 5 à 10 jours ouvrés.",
      "Vos points de fidélité éventuellement utilisés vous ont été rendus.",
    ],
    cta: { label: "Voir le détail", path: "tracking" },
    secondary: { label: "Parler à un conseiller", path: "support" },
  },
  returned: {
    subject: "Votre retour {number} est traité et remboursé",
    preheader: "Le remboursement est engagé. Voici le délai.",
    eyebrow: "Retour & remboursement",
    title: "Retour accepté, remboursement engagé",
    statusLabel: "Remboursée",
    tone: "warn",
    body: "Bonjour {name}, votre retour a été reçu et accepté. Le remboursement est engagé sur le moyen de paiement d'origine, ou en espèces au comptoir si vous aviez réglé à la livraison.",
    steps: [
      "Remboursement sous 5 à 10 jours ouvrés.",
      "Les points liés à cette commande ont été repris ; ceux que vous aviez dépensés vous sont rendus.",
      "Une référence ne vous convenait pas ? Nos pharmaciens peuvent vous orienter vers une autre.",
    ],
    cta: { label: "Voir mon retour", path: "account" },
    secondary: { label: "Demander un conseil", path: "support" },
  },
};

/** Where each invitation leads. Filled in at send time with the order's keys. */
export type OrderMailLinks = Record<OrderMailCopy["cta"]["path"], string>;

/* ── Le compte ─────────────────────────────────────────────────────────── */

export const WELCOME_MAIL = {
  subject: "Bienvenue chez Cléopâtre ✨",
  preheader: "Votre espace est ouvert. Voici comment nous travaillons.",
  eyebrow: "Bienvenue",
  title: (name: string) => `Bienvenue, ${name}`,
  body: (name: string) =>
    `Bonjour ${name}, votre espace Cléopâtre est ouvert. Vous y retrouverez vos commandes, vos favoris et le fil de vos conseils. Nous sommes une maison de pharmacie, pas un entrepôt : quatre-vingts références, choisies une à une, et des pharmaciens qui répondent vraiment.`,
  points: [
    "Conseil de pharmacien, du lundi au samedi, en boutique et au téléphone.",
    "Livraison 24 à 72 h partout en Tunisie, offerte dès 99 DT.",
    "Paiement à la livraison, et sept jours pour changer d'avis.",
  ],
  cta: { label: "Découvrir la boutique", href: "/boutique" },
  secondary: { label: "Ouvrir mon espace", href: "/compte" },
} as const;

export const PASSWORD_RESET_MAIL = {
  subject: "Réinitialiser votre mot de passe",
  preheader: "Un lien sécurisé, valable une heure.",
  eyebrow: "Sécurité",
  title: "Réinitialiser votre mot de passe",
  body: "Bonjour, une demande de réinitialisation a été faite pour votre espace Cléopâtre. Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe.",
  notice:
    "Ce lien est personnel et expire dans 60 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.",
  cta: "Choisir un nouveau mot de passe",
  fallbackLabel: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :",
} as const;

/* ── Le support ────────────────────────────────────────────────────────── */

export const TICKET_CREATED_MAIL = {
  subject: "Votre demande #{id} est bien reçue",
  preheader: "Nous répondons sous 24 h ouvrées.",
  eyebrow: "Support",
  title: "Message bien reçu",
  body: "Bonjour {name}, votre message nous est parvenu et porte la référence #{id}. Un pharmacien ou un conseiller le lit et vous répond sous 24 heures ouvrées.",
  steps: [
    "Votre demande est enregistrée sous la référence #{id}.",
    "Réponse sous 24 h ouvrées, par e-mail.",
    "Gardez cette référence : elle accélère tout échange suivant.",
  ],
  cta: { label: "Voir mon ticket", path: "ticket" },
} as const;

export const TICKET_REPLY_MAIL = {
  subject: "Une réponse à votre demande #{id}",
  preheader: "Notre équipe vous a répondu.",
  eyebrow: "Support",
  title: "Nous vous avons répondu",
  body: "Bonjour {name}, votre demande #{id} a reçu une réponse de notre équipe. Vous la trouverez ci-dessous et dans votre espace.",
  cta: { label: "Voir mon ticket", path: "ticket" },
} as const;

export const TICKET_RESOLVED_MAIL = {
  subject: "Votre demande #{id} est résolue",
  preheader: "Nous restons disponibles si besoin.",
  eyebrow: "Support",
  title: "Demande résolue",
  body: "Bonjour {name}, votre demande #{id} est close. Si la réponse ne règle pas tout, rouvrez-la en un clic : elle conservera tout son historique.",
  steps: [
    "La demande #{id} est close.",
    "Vous pouvez la rouvrir à tout moment depuis votre espace.",
    "Pour une autre question, ouvrez une nouvelle demande.",
  ],
  cta: { label: "Voir mon ticket", path: "ticket" },
} as const;

/* ── 13 · De retour en stock ─────────────────────────────────────────────── */

/**
 * La seule lettre qui soit une promesse tenue plutôt qu'une nouvelle : elle
 * n'arrive que parce qu'on l'a demandée. Ni code promo, ni compte à rebours —
 * une personne qui a attendu trois semaines n'a pas besoin d'être pressée.
 */
export const RESTOCK_MAIL = {
  subject: "{name} est de retour",
  preheader: "{name} est de nouveau disponible. Vous nous aviez demandé de vous prévenir.",
  eyebrow: "Réassort",
  title: (name: string) => `« ${name} » est de retour`,
  body:
    "Vous nous aviez demandé de vous prévenir. C'est fait : la référence est de nouveau en stock, et elle est réservée à la file d'attente avant toute autre mise en avant.",
  cta: "Voir la référence",
  notice: "Les réassorts partent vite — la file d'attente est servie en premier, dans l'ordre des inscriptions.",
  fallbackLabel: "Le bouton ne répond pas ? Copiez cette adresse dans votre navigateur :",
} as const;
