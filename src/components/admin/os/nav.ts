import type { IconKey } from "./icons";

/**
 * Carte de l'instrument.
 *
 * Seven houses, one per question an operator actually asks. A module appears
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
  mobile?: boolean;
  exact?: boolean;
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
    label: "Commandement",
    blurb: "Ce qui s'est passé, ce qui demande attention, quoi faire ensuite.",
    items: [
      { href: "/admin", label: "Poste de commande", icon: "command", hint: "Vue d'ensemble et pilotage du jour", keywords: ["dashboard", "accueil", "command center"], mobile: true, exact: true },
      { href: "/admin/aujourdhui", label: "Aujourd'hui", icon: "clock", hint: "Chronologie du jour, filtre par nature", keywords: ["timeline", "jour", "journal du jour"], mobile: true },
      { href: "/admin/attention", label: "Centre d'attention", icon: "alert", hint: "Ce qui bloque, par gravité", keywords: ["alertes", "urgences", "critical"], badge: "attention", mobile: true },
      { href: "/admin/opportunites", label: "Centre d'opportunités", icon: "spark", hint: "Ce que les données proposent de faire", keywords: ["opportunités", "growth", "idées"] },
      { href: "/admin/activite", label: "Activité en direct", icon: "pulse", hint: "Ce que la boutique fait, maintenant", keywords: ["live", "flux", "temps réel"] },
      { href: "/admin/taches", label: "Centre de tâches", icon: "check", hint: "File de travail de l'équipe", keywords: ["tâches", "todo", "assignations"], badge: "tasks", mobile: true },
    ],
  },
  {
    key: "commerce",
    label: "Commerce",
    blurb: "La marchandise, ses prix, son stock, sa mise en scène.",
    items: [
      { href: "/admin/commandes", label: "Commandes", icon: "bag", hint: "Espace opérationnel des commandes", keywords: ["orders", "ventes"], badge: "aprep", mobile: true },
      { href: "/admin/commandes/nouvelle", label: "Commande manuelle", icon: "plus", hint: "Saisir une commande pour une cliente", keywords: ["créer", "saisie", "téléphone"], mobile: true },
      { href: "/admin/produits", label: "Produits", icon: "cube", hint: "Catalogue, santé produit, conversion", keywords: ["catalogue", "fiches"], mobile: true },
      { href: "/admin/produits/qualite", label: "Audit qualité", icon: "beaker", hint: "Fiches incomplètes, images manquantes", keywords: ["qualité", "complétude", "audit"] },
      { href: "/admin/stock", label: "Stock", icon: "layers", hint: "Buckets, mouvements, prévisions", keywords: ["inventaire", "rupture", "réappro"] },
      { href: "/admin/media", label: "Médiathèque", icon: "image", hint: "Images du catalogue et orphelines", keywords: ["images", "visuels", "assets"] },
      { href: "/admin/promotions", label: "Studio promotions", icon: "ticket", hint: "Promotions, coupons, bundles, performance", keywords: ["promo", "remise", "code"] },
      { href: "/admin/mise-en-scene", label: "Mise en scène", icon: "grid", hint: "Vitrines, sélections, duos, rituels", keywords: ["vitrine", "merchandising", "shelves"] },
    ],
  },
  {
    key: "customers",
    label: "Clientes",
    blurb: "Qui achète, comment, et ce qu'il faut lui dire.",
    items: [
      { href: "/admin/clients", label: "Clientes", icon: "users", hint: "Fiche 360°, RFM, valeur", keywords: ["clients", "rfm", "segments"], mobile: true },
      { href: "/admin/clients/segments", label: "Segments", icon: "filter", hint: "Construction et lecture des segments", keywords: ["segmentation", "cohortes"] },
      { href: "/admin/avis", label: "Avis", icon: "star", hint: "Modération et satisfaction", keywords: ["reviews", "notes"], badge: "reviews" },
      { href: "/admin/support", label: "Support", icon: "note", hint: "Demandes clientes et retours", keywords: ["tickets", "sav", "retours"], badge: "tickets" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    blurb: "Parler juste, au bon moment, à la bonne personne.",
    items: [
      { href: "/admin/marketing", label: "Centre marketing", icon: "compass", hint: "Canaux, audience, calendrier", keywords: ["campagnes", "acquisition"] },
      { href: "/admin/emails", label: "Opérations e-mail", icon: "mail", hint: "File d'envoi, échecs, reprises", keywords: ["outbox", "emails", "newsletter"] },
      { href: "/admin/contenu", label: "Éditorial", icon: "book", hint: "Articles, pages d'atterrissage, accueil", keywords: ["cms", "contenu", "articles"] },
    ],
  },
  {
    key: "analytics",
    label: "Analytique",
    blurb: "Mesurer, creuser, expliquer — jamais inventer.",
    items: [
      { href: "/admin/analytique", label: "Explorateur", icon: "sigma", hint: "Métrique × dimension × période", keywords: ["analytics", "tableau", "explorer"] },
      { href: "/admin/analytique/revenus", label: "Explorateur de revenus", icon: "delta", hint: "Revenu → catégorie → marque → produit → commande", keywords: ["ca", "chiffre d'affaires", "drill"] },
      { href: "/admin/analytique/conversion", label: "Laboratoire de conversion", icon: "flow", hint: "Entonnoir cliquable, étapes réelles", keywords: ["funnel", "tunnel", "conversion"] },
      { href: "/admin/analytique/recherche", label: "Intelligence de recherche", icon: "spark", hint: "Ce que les clientes cherchent vraiment", keywords: ["requêtes", "spf50", "zéro résultat"] },
      { href: "/admin/analytique/rapports", label: "Centre de rapports", icon: "ledger", hint: "Rapports composés et exportés", keywords: ["reports", "exports", "builder"] },
    ],
  },
  {
    key: "operations",
    label: "Opérations",
    blurb: "Faire tourner la maison sans y penser deux fois.",
    items: [
      { href: "/admin/operations", label: "Automatisations", icon: "flow", hint: "Déclencheur → condition → action", keywords: ["automations", "workflow", "règles"] },
      { href: "/admin/qualite", label: "Qualité des données", icon: "scale", hint: "Cohérence du catalogue et des transactions", keywords: ["data quality", "cohérence"] },
      { href: "/admin/journal", label: "Journal d'audit", icon: "stamp", hint: "Qui a fait quoi, quand", keywords: ["logs", "traçabilité", "audit"] },
      { href: "/admin/echanges", label: "Import / Export", icon: "upload", hint: "Sorties et entrées de données encadrées", keywords: ["csv", "import", "export"] },
    ],
  },
  {
    key: "system",
    label: "Système",
    blurb: "L'état de la machine, ses connexions, ses gardiens.",
    items: [
      { href: "/admin/systeme", label: "Santé du système", icon: "server", hint: "Diagnostic réel, latence, files", keywords: ["system", "health", "diagnostic"] },
      { href: "/admin/systeme/erreurs", label: "Centre d'erreurs", icon: "skull", hint: "Ce qui a échoué et pourquoi", keywords: ["erreurs", "logs", "incidents"] },
      { href: "/admin/systeme/integrations", label: "Intégrations", icon: "plug", hint: "Ce qui est connecté, ce qui manque", keywords: ["api", "paiement", "transporteur"] },
      { href: "/admin/equipe", label: "Équipe", icon: "users", hint: "Comptes d'administration et rôles", keywords: ["admin", "roles", "utilisateurs"] },
      { href: "/admin/boutiques", label: "Boutiques", icon: "grid", hint: "Points de vente et horaires", keywords: ["stores", "magasins"] },
      { href: "/admin/reglages", label: "Réglages", icon: "scale", hint: "Paramètres de la maison", keywords: ["settings", "configuration"] },
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
  { label: "Lancer un audit de la boutique", hint: "Santé du système", href: "/admin/systeme?audit=1", keywords: ["diagnostic", "scan"] },
  { label: "Exporter les commandes du mois", hint: "Import / Export", href: "/admin/echanges?kind=orders", keywords: ["csv", "export"] },
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
