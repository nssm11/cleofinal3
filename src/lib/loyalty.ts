/**
 * LE CERCLE — le programme de fidélité.
 *
 * Les paliers sont calés sur la mécanique **déjà en place** : 10 points par
 * dinar dépensé, 1 000 points = 10 DT. Rien ici ne promet ce que la caisse ne
 * sait pas faire — un palier dont l'avantage n'existe pas dans le code est une
 * dette déguisée en élégance.
 *
 * Ce que chaque palier apporte réellement, aujourd'hui :
 *   • les points, qui se dépensent à la caisse (déjà branché) ;
 *   • le conseil prioritaire et la file de réassort servie en premier
 *     (`notifyRestockQueue` classe les comptes avant le reste) ;
 *   • la livraison offerte, seuil déjà calculé par `FREE_SHIPPING_THRESHOLD`.
 *
 * Aucune date d'expiration n'est annoncée : le schéma ne porte pas de
 * péremption, et l'écrire ici serait une promesse que rien ne tient.
 */

export type LoyaltyTier = {
  /** Identifiant stable — sert de clé, jamais affiché. */
  id: "ambre" | "or" | "perle";
  name: string;
  /** Seuil en points pour entrer dans le palier. */
  from: number;
  /** Ce que le palier apporte, en phrases vraies. */
  perks: string[];
};

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "ambre",
    name: "Ambre",
    from: 0,
    perks: [
      "10 points par dinar dépensé",
      "1 000 points = 10 DT de remise à la caisse",
      "File de réassort : prévenue dès l'arrivée",
    ],
  },
  {
    id: "or",
    name: "Or",
    from: 5_000,
    perks: [
      "Livraison offerte dès 99 DT, comme partout",
      "Vos questions passent avant la file générale",
      "Diagnostic beauté conservé et relu par un pharmacien",
    ],
  },
  {
    id: "perle",
    name: "Perle",
    from: 15_000,
    perks: [
      "Réassorts réservés avant la mise en vente publique",
      "Un pharmacien vous suit d'une commande à l'autre",
      "Retrait prioritaire en boutique, préparé à l'avance",
    ],
  },
];

/** 1 000 points = 10 DT ⇒ 100 points = 1 DT. */
export const POINTS_PER_DINAR = 100;

export function pointsToDinars(points: number): number {
  return Math.max(0, points) / POINTS_PER_DINAR;
}

export type LoyaltyProgress = {
  points: number;
  tier: LoyaltyTier;
  /** Palier suivant, ou `null` au sommet — il n'y a rien au-dessus de Perle. */
  next: LoyaltyTier | null;
  /** 0 à 1 vers le palier suivant ; 1 au sommet. */
  ratio: number;
  /** Points manquants, ou 0 au sommet. */
  remaining: number;
  /** Valeur du solde, en dinars. */
  value: number;
};

/**
 * Où en est une personne.
 *
 * Le ratio est calculé **entre deux paliers**, pas depuis zéro : une barre qui
 * part de 0 à chaque palier donne l'impression de recommencer, alors qu'on
 * avance. Au sommet, la barre est pleine — on ne fabrique pas de manque.
 */
export function loyaltyProgress(points: number): LoyaltyProgress {
  const safe = Math.max(0, Math.floor(points));
  const tier = [...LOYALTY_TIERS].reverse().find((t) => safe >= t.from) ?? LOYALTY_TIERS[0];
  const index = LOYALTY_TIERS.findIndex((t) => t.id === tier.id);
  const next = LOYALTY_TIERS[index + 1] ?? null;

  const span = next ? next.from - tier.from : 0;
  const ratio = next ? Math.min(1, Math.max(0, (safe - tier.from) / span)) : 1;

  return {
    points: safe,
    tier,
    next,
    ratio,
    remaining: next ? Math.max(0, next.from - safe) : 0,
    value: pointsToDinars(safe),
  };
}

/** Le libellé d'un mouvement du registre, dans les mots de la cliente. */
export const LOYALTY_KIND_LABELS: Record<string, string> = {
  award: "Points gagnés",
  reversal: "Points repris",
  redeem: "Points utilisés",
  restore: "Points restitués",
};
