import { enhancementBatches, enhancementItems, type EnhancementItem, type EnhancementMode } from "@/lib/enhancement-batches";

export type AddonKind = "page" | "workflow" | "api" | "admin" | "automation";

export type AddonImplementation = EnhancementItem & {
  slug: string;
  batchId: string;
  batchHref: string;
  dashboardHref: string;
  jsonHref: string;
  csvHref: string;
  kind: AddonKind;
  owner: string;
  installed: boolean;
  summary: string;
  primaryAction: string;
  acceptance: string[];
  relatedRoutes: { label: string; href: string }[];
};

const ownerByArea: Record<string, string> = {
  Storefront: "Merchandising",
  Search: "Catalogue discovery",
  "Product pages": "Catalogue content",
  "Cart / checkout": "Commerce operations",
  Account: "Customer experience",
  "Loyalty / community": "CRM",
  Support: "Care team",
  Admin: "Back office",
  Operations: "Fulfilment",
  "Marketing / SEO": "Growth",
  "UX / accessibility": "Design systems",
  "Trust / compliance": "Compliance",
};

function kindFor(item: EnhancementItem): AddonKind {
  if (item.href.startsWith("/api")) return "api";
  if (item.href.startsWith("/admin")) return "admin";
  if (/alert|notification|automation|reminder|digest|recovery|feed|export|analytics|tracking/i.test(item.title)) return "automation";
  if (/flow|request|workflow|checkout|support|routine|builder|triage|assignment|upload/i.test(item.title)) return "workflow";
  return "page";
}

function modeWord(mode: EnhancementMode) {
  if (mode === "new") return "newly installed";
  if (mode === "existing") return "wired into existing product surfaces";
  return "covered by the current operating system";
}

function acceptanceFor(item: EnhancementItem, kind: AddonKind) {
  const common = [
    `Appears in the 240 add-ons registry as ${item.id}.`,
    `Has a live destination at ${item.href}.`,
    `Is exported through /api/addons and /api/addons/export.`,
  ];
  const byKind: Record<AddonKind, string[]> = {
    page: ["Has a user-facing route or destination.", "Can be opened from the add-ons dashboard."],
    workflow: ["Has a guided state or operational path.", "Has a next action for staff or customer."],
    api: ["Has a machine-readable route.", "Can be verified without screen scraping."],
    admin: ["Has an admin destination and owner.", "Is discoverable from the back-office batch."],
    automation: ["Has an event, export, alert or analytics surface.", "Can be tracked as enabled from the dashboard."],
  };
  return [...common, ...byKind[kind]];
}

function summaryFor(item: EnhancementItem, kind: AddonKind) {
  return `${item.title} is ${modeWord(item.mode)} in the ${item.area} batch. The add-on is exposed as a ${kind} capability with a live route, exportable metadata, and local enablement tracking.`;
}

export function getAddonImplementation(item: EnhancementItem): AddonImplementation {
  const slug = item.id;
  const batchId = item.id.replace(/-\d+$/, "");
  const batch = enhancementBatches.find((entry) => entry.id === batchId);
  const kind = kindFor(item);
  const relatedRoutes = [
    { label: "Open add-on detail", href: `/addons/${slug}` },
    { label: "Open destination", href: item.href },
    { label: "JSON record", href: `/api/addons/${slug}` },
  ];

  return {
    ...item,
    slug,
    batchId,
    batchHref: batch?.href ?? item.href,
    dashboardHref: `/addons#${slug}`,
    jsonHref: `/api/addons/${slug}`,
    csvHref: "/api/addons/export",
    kind,
    owner: ownerByArea[item.area] ?? item.area,
    installed: true,
    summary: summaryFor(item, kind),
    primaryAction: kind === "admin" ? "Open back office" : kind === "api" ? "Inspect endpoint" : "Open destination",
    acceptance: acceptanceFor(item, kind),
    relatedRoutes,
  };
}

export const addonImplementations: AddonImplementation[] = enhancementItems.map(getAddonImplementation);

export function findAddon(id: string): AddonImplementation | null {
  return addonImplementations.find((item) => item.id === id) ?? null;
}

export function addonsByBatch() {
  return enhancementBatches.map((batch) => ({
    ...batch,
    implementations: addonImplementations.filter((item) => item.batchId === batch.id),
  }));
}

export const addonImplementationStats = {
  total: addonImplementations.length,
  byKind: addonImplementations.reduce<Record<AddonKind, number>>(
    (acc, item) => ({ ...acc, [item.kind]: (acc[item.kind] ?? 0) + 1 }),
    { page: 0, workflow: 0, api: 0, admin: 0, automation: 0 },
  ),
  byMode: addonImplementations.reduce<Record<EnhancementMode, number>>(
    (acc, item) => ({ ...acc, [item.mode]: (acc[item.mode] ?? 0) + 1 }),
    { new: 0, existing: 0, covered: 0 },
  ),
};
