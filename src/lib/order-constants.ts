import type { OrderStatus } from "@/db/schema";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente", confirmed: "Confirmée", preparing: "En préparation", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée", returned: "Retournée",
};
export const ORDER_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered"];
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
export const PAYMENT_LABELS = { cod: "Paiement à la livraison", bank_transfer: "Virement bancaire", card: "Carte bancaire", gift_card: "Carte cadeau" } as const;
export const SHIPPING_LABELS = { standard: "Livraison standard", express: "Livraison express", pickup: "Click & Collect" } as const;

/**
 * LE RÉCIT DU PARCOURS.
 *
 * `ORDER_FLOW` répond à « où en suis-je ». Ceci répond à « que se passe-t-il,
 * et qu'est-ce que j'attends ensuite » — les sept statuts, y compris les deux
 * issues qui sortent du parcours heureux. Chaque étape porte son propre texte :
 * un suivi qui dit seulement « Expédiée » laisse la cliente sans repère, alors
 * que « Expédiée — votre colis est chez le transporteur, comptez 24 à 72 h »
 * évite un appel au service client.
 */
export interface OrderStepCopy {
  /** Étiquette courte, celle du pastille de progression. */
  label: string;
  /** Titre de l'étape courante. */
  title: string;
  /** Ce qui se passe concrètement, en une phrase. */
  description: string;
  /** Ce que la cliente peut attendre ou faire ensuite. */
  next: string;
  /** Issue hors parcours : l'étape est définitive. */
  terminal?: boolean;
}

export const ORDER_STEPS: Record<OrderStatus, OrderStepCopy> = {
  pending: {
    label: "En attente",
    title: "Votre commande est enregistrée",
    description:
      "Nous avons bien reçu votre commande. Un pharmacien vérifie les références et la disponibilité en stock avant de la confirmer.",
    next: "Vous recevez un e-mail dès qu'elle est confirmée — en général dans l'heure ouvrée.",
  },
  confirmed: {
    label: "Confirmée",
    title: "Votre commande est confirmée",
    description:
      "Les articles sont réservés pour vous. Rien ne peut plus partir sans eux : le stock est bloqué jusqu'à la livraison.",
    next: "Elle passe en préparation sous 24 heures ouvrées. Vous pouvez encore l'annuler à ce stade.",
  },
  preparing: {
    label: "En préparation",
    title: "Nous préparons votre colis",
    description:
      "Vos produits sont réunis en boutique, contrôlés un par un — date de péremption, intégrité du scellé — puis emballés.",
    next: "Le colis part chez le transporteur sous 24 à 48 heures. Vous recevrez alors son numéro de suivi.",
  },
  shipped: {
    label: "Expédiée",
    title: "Votre colis est en route",
    description:
      "Il est confié au transporteur et voyage vers l'adresse que vous avez indiquée. Comptez 24 à 72 heures selon le gouvernorat.",
    next: "Suivez le colis avec le numéro de suivi ci-dessous, ou par téléphone au 71 450 210.",
  },
  delivered: {
    label: "Livrée",
    title: "Votre colis est livré",
    description:
      "Vos produits sont entre vos mains. Si un article ne convient pas, vous disposez de 7 jours pour un retour, produit non ouvert.",
    next: "Une question sur l'usage d'un soin ? Un pharmacien vous répond, ou demandez un retour depuis votre espace.",
  },
  cancelled: {
    label: "Annulée",
    title: "Cette commande a été annulée",
    description:
      "Aucun montant ne vous sera débité. Si le paiement avait déjà été encaissé, il est remboursé sur le moyen d'origine sous 5 à 10 jours ouvrés.",
    next: "Une annulation qui ne vient pas de vous ? Écrivez-nous immédiatement, nous vérifions ce qui s'est passé.",
    terminal: true,
  },
  returned: {
    label: "Retournée",
    title: "Votre retour est traité",
    description:
      "Les articles sont revenus en boutique et ont été contrôlés. Le remboursement est engagé sur le moyen de paiement d'origine.",
    next: "Comptez 5 à 10 jours ouvrés pour voir le remboursement apparaître, selon votre banque.",
    terminal: true,
  },
};
