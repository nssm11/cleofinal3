import "server-only";
import { notify } from "@/lib/notifications";
import type { Order, OrderStatus, ReturnStatus } from "@/db/schema";

/**
 * THE HOUSE WORD, TRANSLATED — one typed helper per trusted event.
 *
 * Call sites stay one line (`void orderStatusNotified(fresh)`); the copy,
 * the shelf (category) and the idempotency key live here, in one place, so
 * two features can never promise the same event in two voices. Every helper
 * is fire-and-forget safe: `notify` never throws.
 */

const orderHref = (number: string) => `/compte/commandes/${encodeURIComponent(number)}`;

export async function orderStatusNotified(order: Order) {
  if (!order.userId) return;
  const n = order.number;
  const base = { userId: order.userId, href: orderHref(n) };
  const map: Record<string, { category: string; title: string; body: string }> = {
    confirmed: { category: "order", title: `Commande ${n} confirmée`, body: "La maison prépare vos articles." },
    preparing: { category: "order", title: "Votre commande est en préparation", body: `Commande ${n} — le comptoir la soigne.` },
    shipped: { category: "shipping", title: `Commande ${n} expédiée`, body: "Le colis a quitté la maison." },
    delivered: { category: "order", title: `Commande ${n} livrée`, body: "Bonne réception — et à votre rituel." },
    cancelled: { category: "order", title: `Commande ${n} annulée`, body: "Les articles sont remis en rayon." },
    returned: { category: "retours", title: `Retour de la commande ${n} enregistré`, body: "La maison traite votre retour." },
  };
  const m = map[order.status as OrderStatus];
  if (!m) return;
  void notify({ ...base, category: m.category, title: m.title, body: m.body, dedupeKey: `order:${order.id}:${order.status}` });
  if ((order.status === "cancelled" || order.status === "returned") && order.paymentStatus === "refunded") {
    void notify({
      ...base,
      category: "payment",
      title: "Remboursement effectué",
      body: `Commande ${n} — le montant vous est rendu.`,
      dedupeKey: `order:${order.id}:refunded`,
    });
  }
  if (order.status === "delivered" && order.loyaltyEarned > 0) {
    void notify({
      userId: order.userId,
      category: "loyalty",
      title: `${order.loyaltyEarned} points ajoutés au Cercle`,
      body: `Commande ${n} — merci de votre fidélité.`,
      href: "/compte/fidelite",
      dedupeKey: `loyalty:${order.id}:award`,
    });
  }
}

export async function outForDeliveryNotified(order: Order) {
  if (!order.userId) return;
  void notify({
    userId: order.userId,
    category: "shipping",
    title: "En cours de livraison",
    body: `Commande ${order.number} — le livreur est en tournée dans votre secteur.`,
    href: orderHref(order.number),
    dedupeKey: `order:${order.id}:out-for-delivery`,
  });
}

export async function paymentStatusNotified(order: Order, next: "pending" | "paid" | "refunded") {
  if (!order.userId) return;
  if (next === "paid") {
    void notify({
      userId: order.userId,
      category: "payment",
      title: "Paiement confirmé",
      body: `Commande ${order.number} — la maison a bien reçu votre règlement.`,
      href: orderHref(order.number),
      dedupeKey: `order:${order.id}:paid`,
    });
  } else if (next === "refunded") {
    void notify({
      userId: order.userId,
      category: "payment",
      title: "Remboursement effectué",
      body: `Commande ${order.number} — le montant vous est rendu.`,
      href: orderHref(order.number),
      dedupeKey: `order:${order.id}:refunded`,
    });
  }
}

export async function restockNotified(userId: number, productSlug: string, productName: string, alertId: number) {
  void notify({
    userId,
    category: "wishlist",
    title: `De retour en rayon : ${productName.slice(0, 90)}`,
    body: "Vous l'aviez demandé — il est de nouveau disponible.",
    href: `/produit/${encodeURIComponent(productSlug)}`,
    dedupeKey: `restock:${alertId}`,
  });
}

export async function supportReplyNotified(userId: number, ticketId: number, messageId: number, subject: string) {
  void notify({
    userId,
    category: "support",
    title: "La conciergerie vous a répondu",
    body: subject.slice(0, 200),
    href: "/compte/support",
    dedupeKey: `ticket:${ticketId}:msg:${messageId}`,
  });
}

export async function subscriptionOrderedNotified(userId: number, subscriptionId: number, orderNumber: string) {
  void notify({
    userId,
    category: "subscription",
    title: "Votre réassort est en route",
    body: `Abonnement n° ${subscriptionId} — commande ${orderNumber}.`,
    href: orderHref(orderNumber),
    dedupeKey: `sub:${subscriptionId}:order:${orderNumber}`,
  });
}

export async function subscriptionSkippedNotified(userId: number, subscriptionId: number, reason: string) {
  void notify({
    userId,
    category: "subscription",
    title: "Réassort reporté au prochain cycle",
    body: reason.slice(0, 200),
    href: "/compte/abonnement",
    dedupeKey: `sub:${subscriptionId}:skip:${new Date().toISOString().slice(0, 10)}`,
  });
}

const RETURN_COPY: Record<string, string> = {
  approved: "Votre retour est accepté.",
  awaiting_customer: "La maison attend un geste de votre part.",
  rejected: "Votre retour n'a pas pu être accepté.",
  completed: "Votre retour est clôturé.",
};

export async function returnStatusNotified(userId: number, returnId: number, returnNumber: string, status: ReturnStatus) {
  const body = RETURN_COPY[status];
  if (!body) return;
  void notify({
    userId,
    category: "retours",
    title: `Retour ${returnNumber} — ${status === "approved" ? "accepté" : status === "rejected" ? "refusé" : status === "completed" ? "clôturé" : "en attente"}`,
    body,
    href: "/compte/retours",
    dedupeKey: `return:${returnId}:${status}`,
  });
}

export async function reviewPublishedNotified(userId: number, reviewId: number, productSlug: string, productName: string) {
  void notify({
    userId,
    category: "review",
    title: "Votre avis est publié",
    body: `${productName.slice(0, 120)} — merci de votre mot.`,
    href: `/produit/${encodeURIComponent(productSlug)}`,
    dedupeKey: `review:${reviewId}:approved`,
  });
}

export async function securityNotified(userId: number, kind: "password_changed" | "password_reset" | "email_verified") {
  const copy = {
    password_changed: {
      title: "Mot de passe modifié",
      body: "Si ce n'était pas vous, écrivez à la maison sans attendre.",
    },
    password_reset: {
      title: "Mot de passe réinitialisé",
      body: "Votre accès est de nouveau à vous seul.",
    },
    email_verified: {
      title: "Adresse vérifiée — bienvenue",
      body: "Votre compte est scellé. La maison est à vous.",
    },
  }[kind];
  void notify({
    userId,
    category: "account",
    title: copy.title,
    body: copy.body,
    href: "/compte/profil",
    priority: kind === "password_changed" ? "high" : "normal",
    dedupeKey: kind === "email_verified" ? `security:${userId}:verified` : undefined,
  });
}

export async function giftCardRedeemedNotified(userId: number, orderNumber: string, amountMillimes: number) {
  const dt = (amountMillimes / 1000).toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  void notify({
    userId,
    category: "gift",
    title: "Carte cadeau utilisée",
    body: `${dt} DT offerts sur la commande ${orderNumber}.`,
    href: orderHref(orderNumber),
    dedupeKey: `gift:order:${orderNumber}`,
  });
}
