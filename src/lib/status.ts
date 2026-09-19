import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * L'ÉTAT DE LA MAISON, VÉRIFIÉ ET NON AFFIRMÉ
 *
 * Each check below answers a question a person would actually ask before
 * trusting the site with an order — and each one is a query, not a promise.
 * What this page cannot see, it says it cannot see.
 */
export type CheckState = "ok" | "warn" | "bad";
export type Check = {
  key: string;
  label: string;
  state: CheckState;
  /** Ce que la mesure dit, en clair. */
  detail: string;
  /** Ce que la maison ferait si c'était rouge. */
  action?: string;
};

export type StatusReport = {
  at: string;
  state: CheckState;
  checks: Check[];
  figures: {
    products: number;
    lots: number;
    unitsInLots: number;
    orders30: number;
    reviews: number;
    articles: number;
    counters: number;
    dbMs: number;
    processUptimeS: number;
    node: string;
  };
};

const one = async (query: ReturnType<typeof sql>): Promise<number> => {
  const r = await db.execute(query);
  const row = r.rows[0] as Record<string, unknown> | undefined;
  return row ? Number(Object.values(row)[0] ?? 0) : 0;
};

/** Le même rapport est servi par la page /etat et par /api/health. */
export async function statusReport(): Promise<StatusReport> {
  const t0 = Date.now();
  await db.execute(sql`select 1`);
  const dbMs = Date.now() - t0;

  const [products, liveProducts, lots, unitsInLots, expiredOnShelf, undated, outbox, failed, orders30, reviews, articles, counters, lastJob] = await Promise.all([
    one(sql`select count(*)::int from products`),
    one(sql`select count(*)::int from products where status = 'active'`),
    one(sql`select count(*)::int from product_lots`),
    one(sql`select coalesce(sum(quantity), 0)::int from product_lots where status = 'sale' and expires_at is not null and expires_at > now()`),
    one(sql`select count(*)::int from product_lots where status = 'sale' and quantity > 0 and expires_at is not null and expires_at < now()`),
    one(sql`select count(*)::int from product_lots where status = 'sale' and quantity > 0 and expires_at is null`),
    one(sql`select count(*)::int from email_outbox where sent_at is null and failed_at is null`),
    one(sql`select count(*)::int from email_outbox where failed_at is not null and sent_at is null`),
    one(sql`select count(*)::int from orders where created_at > now() - interval '30 days'`),
    one(sql`select count(*)::int from reviews where status = 'approved'`),
    one(sql`select count(*)::int from articles where is_published = true`),
    one(sql`select count(*)::int from stores where is_active = true`),
    db.execute(sql`select max(created_at) as at from automation_runs`).then((r) => (r.rows[0] as { at: string | Date | null } | undefined)?.at ?? null).catch(() => null),
  ]);

  const checks: Check[] = [
    {
      key: "database",
      label: "Base de données",
      state: dbMs < 150 ? "ok" : dbMs < 600 ? "warn" : "bad",
      detail: `Répond en ${dbMs} ms.`,
      action: "Vérifier la machine et les connexions ouvertes.",
    },
    {
      key: "catalogue",
      label: "Catalogue",
      state: liveProducts > 0 ? "ok" : "bad",
      detail: `${liveProducts} référence(s) en ligne sur ${products} au total.`,
    },
    {
      key: "lots",
      label: "Lots datés",
      state: unitsInLots > 0 && expiredOnShelf === 0 ? "ok" : expiredOnShelf > 0 ? "bad" : "warn",
      detail:
        expiredOnShelf > 0
          ? `${expiredOnShelf} lot(s) périmé(s) encore en vente — ils partent en quarantaine cette nuit.`
          : `${lots} lot(s) suivis, ${unitsInLots} unité(s) datées et vendables.`,
      action: expiredOnShelf > 0 ? "Lancer le balayage sur /admin/lots, ou retirer le lot à la main." : undefined,
    },
    {
      key: "undated",
      label: "Lots sans date",
      state: undated === 0 ? "ok" : "warn",
      detail: undated === 0 ? "Aucune unité sans date de péremption." : `${undated} lot(s) sans DLC : présents, comptés, invendables.`,
      action: undated > 0 ? "Saisir la date au comptoir : /admin/lots." : undefined,
    },
    {
      key: "outbox",
      label: "Courrier sortant",
      state: failed > 10 ? "bad" : outbox > 200 ? "warn" : "ok",
      detail: `${outbox} message(s) en file, ${failed} en échec.`,
      action: failed > 0 ? "Regarder les erreurs dans /admin/emails." : undefined,
    },
    {
      key: "trafic",
      label: "Activité",
      state: "ok",
      detail: `${orders30} commande(s) sur 30 jours, ${reviews} avis publiés, ${articles} article(s) de journal, ${counters} comptoir(s) ouverts.`,
    },
    {
      key: "job",
      label: "Tâche quotidienne",
      state: lastJob == null ? "warn" : Date.now() - new Date(lastJob).getTime() < 36 * 3600_000 ? "ok" : "warn",
      detail: lastJob ? `Dernière exécution : ${new Date(lastJob).toLocaleString("fr-TN")}.` : "Aucune exécution enregistrée sur cette base.",
      action: "Le cron /api/cron/outbox déclenche la tournée quotidienne.",
    },
  ];

  const state: CheckState = checks.some((c) => c.state === "bad") ? "bad" : checks.some((c) => c.state === "warn") ? "warn" : "ok";

  return {
    at: new Date().toISOString(),
    state,
    checks,
    figures: {
      products: liveProducts,
      lots,
      unitsInLots,
      orders30,
      reviews,
      articles,
      counters,
      dbMs,
      processUptimeS: Math.round(process.uptime()),
      node: process.version,
    },
  };
}
