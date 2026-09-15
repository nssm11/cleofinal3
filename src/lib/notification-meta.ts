/**
 * NOTIFICATION VOCABULARY — shared by the server ledger and the client center.
 *
 * No secrets, no queries: this module is safe to import from client
 * components. The server validates every category against CATEGORIES before
 * writing, and the center renders every row through CATEGORY_META — an
 * unknown category degrades to a neutral mark, never to a crash.
 */

export const NOTIFICATION_CATEGORIES = [
  "order",
  "payment",
  "shipping",
  "loyalty",
  "subscription",
  "wishlist",
  "account",
  "support",
  "review",
  "gift",
  "retours",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_PRIORITIES = ["info", "normal", "high"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export function isNotificationCategory(v: unknown): v is NotificationCategory {
  return typeof v === "string" && (NOTIFICATION_CATEGORIES as readonly string[]).includes(v);
}

export function isNotificationPriority(v: unknown): v is NotificationPriority {
  return typeof v === "string" && (NOTIFICATION_PRIORITIES as readonly string[]).includes(v);
}

/** Icon key (see `NotificationGlyph`) + French label per shelf. */
export const CATEGORY_META: Record<NotificationCategory, { label: string; icon: string }> = {
  order: { label: "Commandes", icon: "package" },
  payment: { label: "Paiements", icon: "card" },
  shipping: { label: "Livraison", icon: "truck" },
  loyalty: { label: "Cercle", icon: "star" },
  subscription: { label: "Abonnement", icon: "refresh" },
  wishlist: { label: "Favoris", icon: "heart" },
  account: { label: "Compte", icon: "user" },
  support: { label: "Conciergerie", icon: "chat" },
  review: { label: "Avis", icon: "spark" },
  gift: { label: "Cadeaux", icon: "gift" },
  retours: { label: "Retours", icon: "swap" },
};

export function categoryMeta(category: string): { label: string; icon: string } {
  if (isNotificationCategory(category)) return CATEGORY_META[category];
  return { label: "La maison", icon: "bell" };
}

/**
 * Destination guard — a notification href must stay inside the house.
 * Relative paths only: a single leading slash, never `//host`, never a
 * backslash escape, never a scheme. Anything else renders as plain text.
 */
export function isSafeNotificationHref(href: unknown): href is string {
  if (typeof href !== "string" || !href) return false;
  if (href.length > 300) return false;
  if (!href.startsWith("/")) return false;
  if (href.startsWith("//")) return false;
  if (href.startsWith("/\\")) return false;
  if (/[\s\\]/.test(href)) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) return false;
  return true;
}
