import type { IconKey } from "./icons";

/**
 * La carte de la maison.
 *
 * Six rooms, one per question an operator actually asks. A module appears
 * here only when the application can answer for it — an entry that leads to a
 * dead room would be a lie told to the person running the shop.
 */

export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
  hint: string;
  keywords?: string[];
  badge?: "attention" | "tasks" | "aprep" | "reviews" | "tickets";
  /** Short name for the five doors on a telephone. */
  short?: string;
  mobile?: boolean;
  exact?: boolean;
  /** Roles allowed to see this door. Absent = every staff member. */
  roles?: readonly ("admin" | "support")[];
};

export type NavGroup = {
  key: string;
  label: string;
  blurb: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    key: "command",
    label: "Pilotage",
    blurb: "Ce qui s'est passé, ce qui bloque, quoi faire ensuite.",
    items: [
      { href: "/admin", label: "Poste de commande", icon: "command", short: "Poste", hint: "Vue d'ensemble et pilotage du jour", keywords: ["dashboard", "accueil", "command center"], mobile: true, exact: true },
      { href: "/admin/aujourdhui", label: "Aujourd'hui", icon: "clock", hint: "Chronologie du jour, filtre par nature", keywords: ["timeline", "jour", "journal du jour"] },
      { href: "/admin/attention", label: "Centre d'attention", icon: "alert", short: "Alertes", hint: "Ce qui bloque, par gravité", keywords: ["alertes", "urgences", "critical"], badge: "attention", mobile: true },
      { href: "/admin/taches", label: "Centre de tâches", icon: "check", short: "Tâches", hint: "File de travail de l'équipe", keywords: ["tâches", "todo", "assignations"], badge: "tasks", mobile: true },
      { href: "/admin/activite", label: "Activité en direct", icon: "pulse", hint: "Ce que la boutique fait, maintenant", keywords: ["live", "flux", "temps réel"] },
      { href: "/admin/opportunites", label: "Centre d'opportunités", icon: "spark", hint: "Ce que les données proposent de faire", keywords: ["opportunités", "growth", "idées"] },
    ],
  },
  {
    key: "commerce",
    label: "Commerce",
    blurb: "La marchandise, ses prix, son stock, sa mise en scène.",
    items: [
      { href: "/admin/commandes", label: "Commandes", icon: "bag", short: "Commandes", hint: "Espace opérationnel des commandes", keywords: ["orders", "ventes"], badge: "aprep", mobile: true },
      { href: "/admin/preparation", label: "Picking entrepôt", icon: "layers", hint: "Vagues de prélèvement et contrôle stock", keywords: ["warehouse", "picking", "préparation"] },
      { href: "/admin/packing", label: "Checklist packing", icon: "check", hint: "Contrôle colis, facture, preuve photo", keywords: ["packing", "colisage", "scan"] },
      { href: "/admin/commandes/nouvelle", label: "Commande manuelle", icon: "plus", hint: "Saisir une commande pour une cliente", keywords: ["créer", "saisie", "téléphone"] },
      { href: "/admin/produits", label: "Produits", icon: "cube", hint: "Catalogue, santé produit, conversion", keywords: ["catalogue", "fiches"] },
      { href: "/admin/stock", label: "Stock", icon: "layers", hint: "Buckets, mouvements, prévisions", keywords: ["inventaire", "rupture", "réappro"] },
      { href: "/admin/previsions", label: "Prévisions stock", icon: "gauge", hint: "Ruptures prévues et suggestions d'achat", keywords: ["forecast", "stockout", "prévision"] },
      { href: "/admin/fournisseurs", label: "Fournisseurs", icon: "store", hint: "Contacts, lead times et exposition par fournisseur", keywords: ["supplier", "fournisseur"] },
      { href: "/admin/achats", label: "Achats", icon: "ledger", hint: "Commandes fournisseurs et réception", keywords: ["purchase", "po", "achat"] },
      { href: "/admin/produits/qualite", label: "Audit qualité", icon: "beaker", hint: "Fiches incomplètes, images manquantes", keywords: ["qualité", "complétude", "audit"] },
      { href: "/admin/promotions", label: "Studio promotions", icon: "ticket", hint: "Promotions, coupons, bundles, performance", keywords: ["promo", "remise", "code"] },
      { href: "/admin/cartes-cadeaux", label: "Cartes cadeaux", icon: "ticket", hint: "Valeur stockée : émission, soldes, annulation", keywords: ["cadeau", "carte", "gift"], roles: ["admin"] },
      { href: "/admin/mise-en-scene", label: "Mise en scène", icon: "grid", hint: "Vitrines, sélections, duos, rituels", keywords: ["vitrine", "merchandising", "shelves"] },
      { href: "/admin/media", label: "Médiathèque", icon: "image", hint: "Images du catalogue et orphelines", keywords: ["images", "visuels", "assets"] },
    ],
  },
  {
    key: "customers",
    label: "Clientes",
    blurb: "Qui achète, comment, et ce qu'il faut lui dire.",
    items: [
      { href: "/admin/clients", label: "Clientes", icon: "users", short: "Clientes", hint: "Fiche 360°, RFM, valeur", keywords: ["clients", "rfm", "segments"], mobile: true },
      { href: "/admin/avis", label: "Avis", icon: "star", hint: "Modération et satisfaction", keywords: ["reviews", "notes"], badge: "reviews" },
      { href: "/admin/moderation-photos", label: "Modération photos", icon: "image", hint: "UGC, photos avis et avant/après", keywords: ["ugc", "photos", "moderation"] },
      { href: "/admin/questions-votes", label: "Questions & votes", icon: "note", hint: "Questions produit priorisées par votes", keywords: ["questions", "votes", "q&a"] },
      { href: "/admin/retours-rma", label: "Retours RMA", icon: "undo", hint: "Demandes retour, validation et réception", keywords: ["returns", "rma", "retours"] },
      { href: "/admin/support", label: "Support", icon: "note", hint: "Demandes clientes et retours", keywords: ["tickets", "sav", "retours"], badge: "tickets" },
      { href: "/admin/emails", label: "Opérations e-mail", icon: "mail", hint: "File d'envoi, échecs, reprises", keywords: ["outbox", "emails", "newsletter"] },
    ],
  },
  {
    key: "analytics",
    label: "Analytique",
    blurb: "Mesurer, creuser, expliquer — jamais inventer.",
    items: [
      { href: "/admin/analytique", label: "Explorateur", icon: "sigma", hint: "Métrique × période, par rayon, marque ou produit", keywords: ["analytics", "tableau", "explorer", "ca"] },
      { href: "/admin/recherches", label: "Intelligence de recherche", icon: "searchSpark", hint: "Ce que les clientes cherchent vraiment", keywords: ["requêtes", "zéro résultat"] },
      { href: "/admin/echanges", label: "Exports & rapports", icon: "download", hint: "Sorties CSV encadrées des données réelles", keywords: ["csv", "export", "rapports"], roles: ["admin"] },
    ],
  },
  {
    key: "operations",
    label: "Opérations",
    blurb: "Faire tourner la maison sans y penser deux fois.",
    items: [
      { href: "/admin/journal", label: "Journal & éditorial", icon: "book", hint: "Articles de la maison, publication", keywords: ["cms", "contenu", "articles"] },
      { href: "/admin/landing-pages", label: "Landing pages", icon: "grid", hint: "Builder de pages campagne", keywords: ["landing", "builder", "seo"] },
      { href: "/admin/newsletter", label: "Newsletter", icon: "mail", hint: "Segments, captures et exports", keywords: ["newsletter", "crm", "email"] },
      { href: "/admin/bannieres", label: "Bannières", icon: "clapper", hint: "Planning des bandeaux promo", keywords: ["banner", "promo", "scheduler"] },
      { href: "/admin/campagnes", label: "Campagnes", icon: "clapper", hint: "Landing pages, guides, newsletter et UTM", keywords: ["campaign", "newsletter", "utm"] },
      { href: "/admin/operations", label: "Opérations livraison", icon: "route", hint: "Packing, coursiers, retraits et incidents", keywords: ["courier", "packing", "delivery"] },
      { href: "/admin/incidents-livraison", label: "Incidents livraison", icon: "alert", hint: "Échecs, relances et transporteur", keywords: ["incident", "delivery", "transporteur"] },
      { href: "/admin/taches-internes", label: "Tâches internes", icon: "check", hint: "Board équipe transversal", keywords: ["tasks", "kanban", "todo"] },
      { href: "/admin/conformite", label: "Conformité & sécurité", icon: "scale", hint: "Rappels, disclaimers, âges, consentements", keywords: ["recall", "privacy", "safety"] },
      { href: "/admin/disclaimers", label: "Disclaimers", icon: "scale", hint: "Règles médicales, âge, grossesse", keywords: ["disclaimer", "pregnancy", "age"] },
      { href: "/admin/audit", label: "Journal d'audit", icon: "stamp", hint: "Qui a fait quoi, quand", keywords: ["logs", "traçabilité", "audit"] },
      { href: "/admin/boutiques", label: "Boutiques", icon: "store", hint: "Points de vente", keywords: ["stores", "magasins"] },
    ],
  },
  {
    key: "system",
    label: "Système",
    blurb: "L'état de la machine, ses gardiens, ses réglages.",
    items: [
      { href: "/admin/systeme", label: "Santé du système", icon: "server", hint: "Diagnostic réel, latence, files, échecs", keywords: ["system", "health", "diagnostic"], roles: ["admin"] },
      { href: "/admin/equipe", label: "Équipe & accès", icon: "lock", hint: "Comptes d'administration et rôles", keywords: ["admin", "roles", "utilisateurs"], roles: ["admin"] },
      { href: "/admin/reglages", label: "Réglages de la maison", icon: "scale", hint: "Ce que la maison expose — lecture seule", keywords: ["settings", "configuration"], roles: ["admin"] },
      { href: "/admin/tests", label: "Smoke tests", icon: "check", hint: "Routes et APIs critiques à vérifier", keywords: ["test", "smoke", "qa"], roles: ["admin"] },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);
export const MOBILE_TABS = NAV_ITEMS.filter((i) => i.mobile).slice(0, 5);

/** Shortcuts an operator should be able to reach without moving the mouse. */
export const PALETTE_ACTIONS: { label: string; hint: string; href: string; keywords?: string[] }[] = [
  { label: "Nouvelle commande manuelle", hint: "Saisie assistée", href: "/admin/commandes/nouvelle", keywords: ["créer", "commande", "téléphone"] },
  { label: "Créer une tâche", hint: "Centre de tâches", href: "/admin/taches?nouvelle=1", keywords: ["todo", "assigner"] },
  { label: "Générer des coupons", hint: "Studio promotions", href: "/admin/promotions?panel=coupons", keywords: ["codes", "promo"] },
  { label: "Lancer l'audit de la boutique", hint: "Santé du système", href: "/admin/systeme?audit=1", keywords: ["diagnostic", "scan"] },
  { label: "Exporter les commandes", hint: "Exports & rapports", href: "/admin/echanges?kind=orders", keywords: ["csv", "export"] },
];

export function findNavItem(pathname: string): NavItem | null {
  const exact = NAV_ITEMS.find((i) => i.exact && i.href === pathname);
  if (exact) return exact;
  return NAV_ITEMS.filter((i) => pathname.startsWith(i.href) && i.href !== "/admin").sort((a, b) => b.href.length - a.href.length)[0] ?? null;
}

export function groupOf(pathname: string): NavGroup | null {
  const item = findNavItem(pathname);
  if (!item) return null;
  return NAV.find((g) => g.items.some((i) => i.href === item.href)) ?? null;
}
