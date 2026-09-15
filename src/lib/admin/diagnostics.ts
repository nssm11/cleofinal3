import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { env } from "@/lib/env";
import { enabledPaymentMethods } from "@/lib/payments";
import { dbLatency, qualityAudit, systemCounts } from "./metrics";

async function rows<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] }).rows ?? []) as T[];
}
const num = (v: unknown) => Number(v ?? 0);

/* ══════════════════════════════════════════════════════════════════════════
   DIAGNOSTIC DE LA MAISON
   ──────────────────────────────────────────────────────────────────────────
   `runStoreAudit()` performs real checks on real rows and returns a score built
   from what it found — never a decorative number. Each finding names the
   object, the consequence and the screen where it is fixed.

   The error centre is deliberately honest: this codebase stores no exception
   journal, so the failures shown are the ones the database actually holds —
   refused letters, failed automations, refused payments.
   ══════════════════════════════════════════════════════════════════════════ */

/** Postgres timestamps reach us as strings through the embedded driver: coerce. */
const ts = (v: unknown): Date => (v instanceof Date ? v : new Date(String(v)));
const tsOrNull = (v: unknown): Date | null => (v == null ? null : v instanceof Date ? v : new Date(String(v)));

export type Finding = {
  area: string;
  label: string;
  severity: "critical" | "high" | "normal";
  count: number;
  consequence: string;
  href: string;
  samples: { label: string; sub: string; href: string }[];
};

export type AuditResult = {
  score: number;
  grade: "excellent" | "solide" | "fragile" | "critique";
  checks: { area: string; label: string; ok: boolean; detail: string }[];
  findings: Finding[];
  ranAt: Date;
  durationMs: number;
};

export async function runStoreAudit(): Promise<AuditResult> {
  const t0 = Date.now();
  const [counts, quality, latency] = await Promise.all([systemCounts(), qualityAudit(), dbLatency()]);
  const findings: Finding[] = [];
  const checks: AuditResult["checks"] = [];

  /* Catalogue */
  const criticalQuality = quality.issues.filter((i) => i.severity === "critical");
  checks.push({ area: "Catalogue", label: "Fiches sans défaut bloquant", ok: criticalQuality.length === 0, detail: criticalQuality.length ? `${criticalQuality.length} défaut(s) bloquant(s)` : "aucun défaut bloquant" });
  if (criticalQuality.length) {
    findings.push({
      area: "Catalogue", label: "Défauts bloquants de fiche", severity: "critical", count: criticalQuality.length,
      consequence: "Une fiche sans visuel, sans rayon ou sans prix ne peut pas être vendue correctement.",
      href: "/admin/qualite",
      samples: criticalQuality.slice(0, 5).map((i) => ({ label: i.productName ?? i.label, sub: i.detail, href: i.href })),
    });
  }
  const emptyCategories = await rows<{ id: number; name: string; universe: string | null }>(sql`
    SELECT c.id, c.name, u.name AS universe FROM categories c LEFT JOIN categories u ON u.id = c.parent_id
    WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id) AND c.is_universe = false`);
  checks.push({ area: "Catalogue", label: "Rayons non vides", ok: emptyCategories.length === 0, detail: emptyCategories.length ? `${emptyCategories.length} rayon(s) sans référence` : "tous les rayons sont peuplés" });
  if (emptyCategories.length) {
    findings.push({
      area: "Catalogue", label: "Rayons vides", severity: "normal", count: emptyCategories.length,
      consequence: "Un rayon vide en vitrine est une porte qui ne mène nulle part.",
      href: "/admin/mise-en-scene",
      samples: emptyCategories.slice(0, 5).map((c) => ({ label: c.name, sub: c.universe ?? "rayon", href: "/admin/mise-en-scene" })),
    });
  }
  const brandsWithout = await rows<{ id: number; name: string }>(sql`
    SELECT b.id, b.name FROM brands b WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.brand_id = b.id)`);
  checks.push({ area: "Catalogue", label: "Laboratoires référencés", ok: brandsWithout.length === 0, detail: brandsWithout.length ? `${brandsWithout.length} laboratoire(s) sans produit` : "chaque laboratoire a au moins une référence" });
  if (brandsWithout.length) {
    findings.push({
      area: "Catalogue", label: "Laboratoires sans référence", severity: "normal", count: brandsWithout.length,
      consequence: "La page laboratoire existe mais reste vide.",
      href: "/admin/mise-en-scene",
      samples: brandsWithout.slice(0, 5).map((b) => ({ label: b.name, sub: "aucune référence", href: "/admin/mise-en-scene" })),
    });
  }
  const weakCopy = quality.issues.filter((i) => i.kind === "description" || i.kind === "seo");
  checks.push({ area: "Catalogue", label: "Contenu suffisant", ok: weakCopy.length === 0, detail: weakCopy.length ? `${weakCopy.length} fiche(s) à compléter` : "contenu complet" });
  if (weakCopy.length) {
    findings.push({
      area: "Catalogue", label: "Contenu de fiche insuffisant", severity: "high", count: weakCopy.length,
      consequence: "Les fiches pauvres convertissent moins et se partagent mal.",
      href: "/admin/qualite?kind=description",
      samples: weakCopy.slice(0, 5).map((i) => ({ label: i.productName ?? i.label, sub: i.detail, href: i.href })),
    });
  }

  /* Inventaire */
  const [stock] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*) FILTER (WHERE stock = 0 AND status = 'active')::int AS oos,
      COUNT(*) FILTER (WHERE stock > 0 AND stock <= low_stock_threshold AND status = 'active')::int AS low,
      COUNT(*) FILTER (WHERE stock < 0)::int AS negative,
      COUNT(*) FILTER (WHERE stock > low_stock_threshold * 12)::int AS over
    FROM products`);
  checks.push({ area: "Inventaire", label: "Aucun stock négatif", ok: num(stock?.negative) === 0, detail: num(stock?.negative) ? `${num(stock?.negative)} référence(s) en négatif` : "ledger cohérent" });
  if (num(stock?.negative) > 0) {
    findings.push({ area: "Inventaire", label: "Stock négatif", severity: "critical", count: num(stock?.negative), consequence: "Un stock négatif rend tout calcul de disponibilité faux.", href: "/admin/stock", samples: [] });
  }
  if (num(stock?.oos) > 0) {
    findings.push({
      area: "Inventaire", label: "Références en rupture", severity: "critical", count: num(stock?.oos),
      consequence: "Une référence publiée sans stock ne peut pas être vendue.",
      href: "/admin/stock?view=out",
      samples: (await rows<{ id: number; name: string }>(sql`SELECT id, name FROM products WHERE stock = 0 AND status = 'active' ORDER BY sales_count DESC LIMIT 5`))
        .map((p) => ({ label: p.name, sub: "stock nul", href: `/admin/produits/${num(p.id)}` })),
    });
  }
  if (num(stock?.low) > 0) {
    findings.push({ area: "Inventaire", label: "Stock bas", severity: "high", count: num(stock?.low), consequence: "Ces références passeront en rupture au rythme de vente actuel.", href: "/admin/stock?view=low", samples: [] });
  }
  const ledgerGap = await rows<{ id: number; name: string; stock: number; ledger: number }>(sql`
    SELECT p.id, p.name, p.stock, COALESCE((SELECT SUM(quantity) FROM inventory_movements m WHERE m.product_id = p.id), 0)::int AS ledger
    FROM products p WHERE COALESCE((SELECT SUM(quantity) FROM inventory_movements m WHERE m.product_id = p.id), 0) <> p.stock LIMIT 20`);
  checks.push({ area: "Inventaire", label: "Stock = journal des mouvements", ok: ledgerGap.length === 0, detail: ledgerGap.length ? `${ledgerGap.length} écart(s) entre stock et mouvements` : "le journal et le stock concordent" });
  if (ledgerGap.length) {
    findings.push({
      area: "Inventaire", label: "Écart entre stock et mouvements", severity: "high", count: ledgerGap.length,
      consequence: "Le stock affiché ne correspond pas à l'historique : l'inventaire physique est à refaire.",
      href: "/admin/stock",
      samples: ledgerGap.slice(0, 5).map((p) => ({ label: p.name, sub: `stock ${num(p.stock)} vs journal ${num(p.ledger)}`, href: `/admin/produits/${num(p.id)}` })),
    });
  }

  /* Relation client */
  const [relation] = await rows<Record<string, unknown>>(sql`
    SELECT (SELECT COUNT(*)::int FROM support_tickets WHERE status = 'open') AS tickets,
      (SELECT COUNT(*)::int FROM support_tickets WHERE status = 'open' AND created_at < now() - interval '48 hours') AS tickets_old,
      (SELECT COUNT(*)::int FROM return_requests WHERE status IN ('pending','in_review')) AS returns,
      (SELECT COUNT(*)::int FROM reviews WHERE status = 'pending') AS reviews,
      (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'pending' AND status = 'delivered') AS uncollected`);
  checks.push({ area: "Relation client", label: "Messages suivis", ok: num(relation?.tickets_old) === 0, detail: num(relation?.tickets_old) ? `${num(relation?.tickets_old)} message(s) ouvert(s) depuis plus de 48 h` : "aucun message ancien" });
  if (num(relation?.tickets_old) > 0) {
    findings.push({ area: "Relation client", label: "Messages sans réponse depuis 48 h", severity: "critical", count: num(relation?.tickets_old), consequence: "Une cliente sans réponse appelle le concurrent.", href: "/admin/support", samples: [] });
  }
  if (num(relation?.reviews) > 0) {
    findings.push({ area: "Relation client", label: "Avis en attente", severity: "normal", count: num(relation?.reviews), consequence: "La note publique ne reflète pas les derniers retours.", href: "/admin/avis", samples: [] });
  }
  if (num(relation?.returns) > 0) {
    findings.push({ area: "Relation client", label: "Retours à statuer", severity: "high", count: num(relation?.returns), consequence: "Le remboursement attend une décision, la cliente attend un signe.", href: "/admin/support?tab=retours", samples: [] });
  }
  if (num(relation?.uncollected) > 0) {
    findings.push({ area: "Encaissement", label: "Livré et non encaissé", severity: "high", count: num(relation?.uncollected), consequence: "La marchandise est partie sans règlement confirmé.", href: "/admin/commandes?payment=pending&status=delivered", samples: [] });
  }

  /* Lettres */
  const [letters] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE status = 'pending' AND send_at < now() - interval '2 hours')::int AS late,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending FROM email_outbox`);
  checks.push({ area: "Lettres", label: "Aucune lettre refusée", ok: num(letters?.failed) === 0, detail: num(letters?.failed) ? `${num(letters?.failed)} lettre(s) refusée(s)` : "toutes les lettres sont parties" });
  if (num(letters?.failed) > 0) {
    findings.push({
      area: "Lettres", label: "Lettres refusées par le transporteur", severity: "high", count: num(letters?.failed),
      consequence: "La cliente n'a pas reçu la confirmation ou le suivi attendu.",
      href: "/admin/emails?status=failed",
      samples: (await rows<{ id: number; to: string; subject: string; error: string | null }>(sql`
        SELECT id, "to", subject, error FROM email_outbox WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5`))
        .map((m) => ({ label: m.subject, sub: `${m.to} — ${m.error ?? "erreur inconnue"}`, href: "/admin/emails?status=failed" })),
    });
  }
  if (num(letters?.late) > 0) {
    findings.push({ area: "Lettres", label: "Lettres en retard", severity: "normal", count: num(letters?.late), consequence: "La file d'attente n'est plus vidée : le cron doit passer.", href: "/admin/emails?status=pending", samples: [] });
  }

  /* Automatisations */
  const [autos] = await rows<Record<string, unknown>>(sql`
    SELECT (SELECT COUNT(*)::int FROM automations WHERE is_active) AS active,
      (SELECT COUNT(*)::int FROM automation_runs WHERE status = 'error') AS errors,
      (SELECT COUNT(*)::int FROM automations WHERE is_active AND (last_run_at IS NULL OR last_run_at < now() - interval '7 days')) AS stale`);
  checks.push({ area: "Automatisations", label: "Règles exécutées récemment", ok: num(autos?.stale) === 0, detail: num(autos?.stale) ? `${num(autos?.stale)} règle(s) active(s) sans exécution depuis 7 jours` : `${num(autos?.active)} règle(s) active(s), à jour` });
  if (num(autos?.errors) > 0) {
    findings.push({ area: "Automatisations", label: "Exécutions en erreur", severity: "high", count: num(autos?.errors), consequence: "Une règle qui échoue n'a rien créé : la vérification manuelle est due.", href: "/admin/operations/automations", samples: [] });
  }

  /* Contenu */
  const [content] = await rows<Record<string, unknown>>(sql`
    SELECT (SELECT COUNT(*)::int FROM articles WHERE is_published = false) AS drafts,
      (SELECT COUNT(*)::int FROM articles) AS articles,
      (SELECT COUNT(*)::int FROM products WHERE launched_at IS NOT NULL AND launched_at > now() - interval '14 days') AS novelties`);
  checks.push({ area: "Contenu", label: "Journal publié", ok: num(content?.drafts) === 0, detail: num(content?.drafts) ? `${num(content?.drafts)} article(s) en brouillon` : `${num(content?.articles)} article(s) publié(s)` });

  if (!latency.ok) {
    findings.push({ area: "Infrastructure", label: "Base injoignable", severity: "critical", count: 1, consequence: "Aucune donnée n'est fiable tant que la base ne répond pas.", href: "/admin/systeme", samples: [{ label: latency.error ?? "erreur", sub: "connexion", href: "/admin/systeme" }] });
  }

  /* Score: every finding costs, according to what it blocks. */
  const weight: Record<Finding["severity"], number> = { critical: 9, high: 4, normal: 1.5 };
  const penalty = findings.reduce((a, f) => a + weight[f.severity], 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const grade: AuditResult["grade"] = score >= 90 ? "excellent" : score >= 72 ? "solide" : score >= 50 ? "fragile" : "critique";
  return { score, grade, checks, findings: findings.sort((a, b) => weight[b.severity] - weight[a.severity]), ranAt: new Date(), durationMs: Date.now() - t0 };
}

/* ── Integrations: what is actually configured ───────────────────────────── */

export type Integration = {
  key: string;
  label: string;
  role: string;
  state: "connected" | "warning" | "disconnected";
  detail: string;
  evidence: { label: string; value: string }[];
  action?: { label: string; href: string };
};

export async function integrations(): Promise<Integration[]> {
  const [mails] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending FROM email_outbox`);
  const latency = await dbLatency();
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isLite = databaseUrl.startsWith("pglite");
  const payments = enabledPaymentMethods();
  return [
    {
      key: "database",
      label: isLite ? "Base embarquée (PGlite)" : "PostgreSQL",
      role: "Données de la maison",
      state: latency.ok ? "connected" : "disconnected",
      detail: latency.ok ? `Répond en ${latency.ms} ms` : `Injoignable — ${latency.error ?? "erreur"}`,
      evidence: [
        { label: "Type", value: isLite ? "pglite (fichier local)" : "postgresql réseau" },
        { label: "Temps de réponse", value: `${latency.ms} ms` },
      ],
    },
    {
      key: "email",
      label: "Resend",
      role: "Lettres transactionnelles",
      state: env.RESEND_API_KEY ? (num(mails?.failed) > 0 ? "warning" : "connected") : "warning",
      detail: env.RESEND_API_KEY
        ? `${num(mails?.sent)} lettre(s) remise(s), ${num(mails?.failed)} refusée(s)`
        : "Aucune clé API : les lettres sont rendues en HTML dans ./.emails/ et ne partent pas",
      evidence: [
        { label: "Expéditeur", value: env.EMAIL_FROM },
        { label: "Réponse à", value: env.EMAIL_REPLY_TO },
        { label: "File", value: `${num(mails?.pending)} en attente · ${num(mails?.failed)} en échec` },
      ],
      action: { label: "Ouvrir la file des lettres", href: "/admin/emails" },
    },
    {
      key: "payments",
      label: "Moyens de paiement",
      role: "Encaissement",
      state: "connected",
      detail: `${payments.length} moyen(s) actif(s) — le module carte n'est pas implémenté`,
      evidence: payments.map((p) => ({ label: p, value: p === "cod" ? "à la livraison" : p === "bank_transfer" ? "virement" : "carte cadeau" })),
      action: { label: "Voir les règlements", href: "/admin/commandes?payment=failed" },
    },
    {
      key: "cron",
      label: "Tâches planifiées",
      role: "File d'attente & automatisations",
      state: process.env.CRON_SECRET ? "connected" : "warning",
      detail: process.env.CRON_SECRET
        ? "Route /api/cron/outbox protégée et appelable par un planificateur"
        : "CRON_SECRET absent : la route de file d'attente refuse les appels externes",
      evidence: [{ label: "Route", value: "/api/cron/outbox" }, { label: "Secret", value: process.env.CRON_SECRET ? "défini" : "absent" }],
      action: { label: "Voir les automatisations", href: "/admin/operations/automations" },
    },
    {
      key: "framing",
      label: "En-têtes de sécurité",
      role: "Référrencement & cadrage",
      state: "connected",
      detail: "CSP en production, cadrage refusé hors prévisualisation",
      evidence: [{ label: "ALLOW_FRAMING", value: process.env.ALLOW_FRAMING === "true" ? "true (prévisualisation)" : "non défini" }],
    },
  ];
}

/* ── Error centre ────────────────────────────────────────────────────────── */

export async function errorCentre(limit = 60) {
  const letters = await rows<{ id: number; at: Date | null; to: string; subject: string; error: string | null; attempts: number; kind: string }>(sql`
    SELECT id, COALESCE(sent_at, send_at) AS at, "to", subject, error, attempts, kind FROM email_outbox
    WHERE status = 'failed' ORDER BY created_at DESC LIMIT ${limit}`);
  const runs = await rows<{ id: number; at: Date; name: string | null; detail: string | null; matched: number }>(sql`
    SELECT r.id, r.created_at AS at, a.name, r.detail, r.matched FROM automation_runs r
    LEFT JOIN automations a ON a.id = r.automation_id WHERE r.status = 'error' ORDER BY r.created_at DESC LIMIT ${limit}`);
  const payments = await rows<{ id: number; number: string; at: Date; total: number; method: string }>(sql`
    SELECT id, number, created_at AS at, total_millimes AS total, payment_method AS method FROM orders
    WHERE payment_status = 'failed' ORDER BY created_at DESC LIMIT ${limit}`);
  const [counts] = await rows<Record<string, unknown>>(sql`
    SELECT (SELECT COUNT(*)::int FROM email_outbox WHERE status = 'failed') AS letters,
      (SELECT COUNT(*)::int FROM automation_runs WHERE status = 'error') AS runs,
      (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'failed') AS payments,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'returned') AS returns`);
  return {
    counts: { letters: num(counts?.letters), runs: num(counts?.runs), payments: num(counts?.payments), returns: num(counts?.returns) },
    letters: letters.map((l) => ({ id: num(l.id), at: tsOrNull(l.at), to: String(l.to), subject: String(l.subject), error: (l.error as string | null) ?? null, attempts: num(l.attempts), kind: String(l.kind) })),
    runs: runs.map((r) => ({ id: num(r.id), at: ts(r.at), name: (r.name as string | null) ?? "automation supprimée", detail: (r.detail as string | null) ?? null, matched: num(r.matched) })),
    payments: payments.map((p) => ({ id: num(p.id), number: String(p.number), at: ts(p.at), total: num(p.total), method: String(p.method) })),
  };
}

/* ── Audit log & team ────────────────────────────────────────────────────── */

export async function auditTrail(options: { limit?: number; entity?: string; actorId?: number } = {}) {
  const clauses = [];
  if (options.entity) clauses.push(sql`a.entity = ${options.entity}`);
  if (options.actorId) clauses.push(sql`a.actor_id = ${options.actorId}`);
  const where = clauses.length ? sql`WHERE ${sql.join(clauses, sql` AND `)}` : sql``;
  const list = await rows<{ id: number; at: Date; action: string; entity: string; entityId: string | null; details: Record<string, unknown>; actor: string | null; email: string | null; role: string | null }>(sql`
    SELECT a.id, a.created_at AS at, a.action, a.entity, a.entity_id AS "entityId", a.details,
      u.first_name || ' ' || u.last_name AS actor, u.email, u.role
    FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ${where}
    ORDER BY a.created_at DESC LIMIT ${options.limit ?? 150}`);
  return list.map((a) => ({
    id: num(a.id), at: ts(a.at), action: String(a.action), entity: String(a.entity),
    entityId: (a.entityId as string | null) ?? null, details: (a.details ?? {}) as Record<string, unknown>,
    actor: (a.actor as string | null) ?? "système", email: (a.email as string | null) ?? null, role: (a.role as string | null) ?? null,
  }));
}

export async function teamOverview() {
  const list = await rows<Record<string, unknown>>(sql`
    SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at, u.locale,
      (SELECT COUNT(*)::int FROM audit_logs a WHERE a.actor_id = u.id) AS actions,
      (SELECT MAX(a.created_at) FROM audit_logs a WHERE a.actor_id = u.id) AS last_action,
      (SELECT COUNT(*)::int FROM admin_tasks t WHERE t.assignee_id = u.id AND t.status IN ('open','in_progress')) AS open_tasks
    FROM users u WHERE u.role IN ('admin','support') ORDER BY u.role, u.first_name`);
  const sessions = await rows<{ user_id: number; n: number; last: Date | null }>(sql`
    SELECT user_id, COUNT(*)::int AS n, MAX(created_at) AS last FROM sessions WHERE expires_at > now() GROUP BY 1`);
  return list.map((u) => ({
    id: num(u.id), firstName: String(u.first_name), lastName: String(u.last_name), email: String(u.email),
    role: String(u.role), locale: String(u.locale), createdAt: ts(u.created_at),
    actions: num(u.actions), lastAction: tsOrNull(u.last_action),
    openTasks: num(u.open_tasks),
    activeSessions: num(sessions.find((s) => num(s.user_id) === num(u.id))?.n),
  }));
}

/* ── Content overview ────────────────────────────────────────────────────── */

export async function contentOverview() {
  const articles = await rows<Record<string, unknown>>(sql`
    SELECT a.id, a.title, a.slug, a.tag, a.author, a.read_minutes, a.is_published, a.published_at,
      (SELECT COUNT(*)::int FROM article_products ap WHERE ap.article_id = a.id) AS products
    FROM articles a ORDER BY a.published_at DESC`);
  const [shelves] = await rows<Record<string, unknown>>(sql`
    SELECT (SELECT COUNT(*)::int FROM shelves WHERE is_active) AS shelves,
      (SELECT COUNT(*)::int FROM duos WHERE is_active) AS duos,
      (SELECT COUNT(*)::int FROM concerns) AS concerns,
      (SELECT COUNT(*)::int FROM routine_steps) AS routine_steps,
      (SELECT COUNT(*)::int FROM query_landings) AS landings,
      (SELECT COUNT(*)::int FROM product_pairs) AS pairs,
      (SELECT COUNT(*)::int FROM product_substitutes) AS substitutes`);
  const stores = await rows<{ id: number; name: string; city: string; phone: string; hours: string; isActive: boolean }>(sql`
    SELECT id, name, city, phone, hours, is_active FROM stores ORDER BY name`);
  return {
    articles: articles.map((a) => ({
      id: num(a.id), title: String(a.title), slug: String(a.slug), tag: (a.tag as string | null) ?? null,
      author: (a.author as string | null) ?? null, readMinutes: num(a.read_minutes), published: Boolean(a.is_published),
      publishedAt: ts(a.published_at), products: num(a.products),
    })),
    counts: {
      shelves: num(shelves?.shelves), duos: num(shelves?.duos), concerns: num(shelves?.concerns),
      routineSteps: num(shelves?.routine_steps), landings: num(shelves?.landings),
      pairs: num(shelves?.pairs), substitutes: num(shelves?.substitutes),
    },
    stores: stores.map((s) => ({ id: num(s.id), name: String(s.name), city: String(s.city), phone: String(s.phone), hours: String(s.hours), isActive: Boolean(s.isActive) })),
  };
}

/** Config surfaces the settings screen may show without inventing values. */
export async function storeSettings() {
  const [row] = await rows<Record<string, unknown>>(sql`
    SELECT (SELECT COUNT(*)::int FROM newsletter_subscribers) AS newsletter,
      (SELECT COUNT(*)::int FROM rate_limits) AS rate_keys,
      (SELECT COUNT(*)::int FROM sessions WHERE expires_at > now()) AS sessions,
      (SELECT COUNT(*)::int FROM query_landings) AS landings`);
  return {
    newsletter: num(row?.newsletter),
    rateKeys: num(row?.rate_keys),
    sessions: num(row?.sessions),
    landings: num(row?.landings),
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    emailFrom: env.EMAIL_FROM,
    emailReplyTo: env.EMAIL_REPLY_TO,
    payments: enabledPaymentMethods(),
    database: (process.env.DATABASE_URL ?? "").startsWith("pglite") ? "PGlite (fichier local)" : "PostgreSQL",
    trustProxy: Boolean(process.env.TRUST_PROXY === "true"),
    framing: process.env.ALLOW_FRAMING === "true",
    resend: Boolean(env.RESEND_API_KEY),
    cron: Boolean(process.env.CRON_SECRET),
  };
}
