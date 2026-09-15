import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { automationRuns, automations, adminTasks } from "@/db/schema";

async function rows<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] }).rows ?? []) as T[];
}
const num = (v: unknown) => Number(v ?? 0);

/* ══════════════════════════════════════════════════════════════════════════
   MOTEUR D'AUTOMATISATION
   ──────────────────────────────────────────────────────────────────────────
   A trigger is a *query against the live shop*, not a placeholder. When the
   editor says "Stock bas → créer une tâche", the objects it lists are the
   products that are low right now, and pressing TEST shows exactly what a real
   run would touch — because it is the same function.

   The scheduler is the existing `/api/cron/outbox` route: it calls
   `runScheduledAutomations()` on every tick, so an automation written in the
   admin actually fires in production without a second job runner.
   ══════════════════════════════════════════════════════════════════════════ */

export type TriggerValue = Record<string, number | string | boolean | null>;
export type TriggerObject = {
  /** Stable identity of the object: used to avoid opening the same task twice. */
  key: string;
  title: string;
  detail: string;
  href: string;
  values: TriggerValue;
};

export type TriggerDef = {
  key: string;
  label: string;
  entity: string;
  question: string;
  /** Fields an operator may put a condition on, with the operator's unit. */
  fields: { key: string; label: string; type: "number" | "string"; hint?: string }[];
  select: () => Promise<TriggerObject[]>;
};

const n = (v: unknown) => Number(v ?? 0);

export const AUTOMATION_TRIGGERS: TriggerDef[] = [
  {
    key: "stock_out",
    label: "Référence épuisée",
    entity: "product",
    question: "Quelles références publiées n'ont plus une seule unité ?",
    fields: [
      { key: "wishes", label: "Personnes en attente", type: "number" },
      { key: "sales_count", label: "Ventes cumulées", type: "number" },
      { key: "price", label: "Prix (millimes)", type: "number" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT p.id, p.name, p.sku, p.stock, p.sales_count, p.price_millimes, COALESCE(w.n,0)::int AS wishes, c.name AS category
      FROM products p LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN (SELECT product_id, COUNT(*)::int AS n FROM wishlist_items GROUP BY 1) w ON w.product_id = p.id
      WHERE p.status = 'active' AND p.stock = 0 ORDER BY wishes DESC LIMIT 500`)).map((r) => ({
      key: `product:${n(r.id)}`,
      title: String(r.name),
      detail: `${n(r.wishes)} personne(s) attendent son retour · ${String(r.category ?? "sans rayon")}`,
      href: `/admin/produits/${n(r.id)}`,
      values: { stock: n(r.stock), wishes: n(r.wishes), sales_count: n(r.sales_count), price: n(r.price_millimes), sku: String(r.sku) },
    })),
  },
  {
    key: "stock_low",
    label: "Stock sous le seuil",
    entity: "product",
    question: "Quelles références sont sous leur seuil d'alerte ?",
    fields: [
      { key: "stock", label: "Stock restant", type: "number" },
      { key: "threshold", label: "Seuil de la fiche", type: "number" },
      { key: "wishes", label: "Personnes en attente", type: "number" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT p.id, p.name, p.stock, p.low_stock_threshold, COALESCE(w.n,0)::int AS wishes
      FROM products p LEFT JOIN (SELECT product_id, COUNT(*)::int AS n FROM wishlist_items GROUP BY 1) w ON w.product_id = p.id
      WHERE p.status = 'active' AND p.stock > 0 AND p.stock <= p.low_stock_threshold ORDER BY p.stock ASC LIMIT 500`)).map((r) => ({
      key: `product:${n(r.id)}`,
      title: String(r.name),
      detail: `${n(r.stock)} unité(s) — seuil ${n(r.low_stock_threshold)}`,
      href: `/admin/produits/${n(r.id)}`,
      values: { stock: n(r.stock), threshold: n(r.low_stock_threshold), wishes: n(r.wishes) },
    })),
  },
  {
    key: "order_pending_aged",
    label: "Commande en attente",
    entity: "order",
    question: "Quelles commandes attendent encore une confirmation ?",
    fields: [
      { key: "hours", label: "Heures depuis la commande", type: "number" },
      { key: "total", label: "Montant (millimes)", type: "number" },
      { key: "city", label: "Ville", type: "string" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT o.id, o.number, o.total_millimes, o.shipping_address->>'city' AS city, o.shipping_address->>'fullName' AS name,
        EXTRACT(EPOCH FROM (now() - o.created_at))/3600 AS hours
      FROM orders o WHERE o.status = 'pending' ORDER BY o.created_at ASC LIMIT 500`)).map((r) => ({
      key: `order:${n(r.id)}`,
      title: `Commande ${String(r.number)}`,
      detail: `${String(r.name)} · ${String(r.city)} · ${Math.round(n(r.hours))} h d'attente`,
      href: `/admin/commandes/${n(r.id)}`,
      values: { hours: Math.round(n(r.hours)), total: n(r.total_millimes), city: String(r.city) },
    })),
  },
  {
    key: "payment_failed",
    label: "Règlement en échec",
    entity: "order",
    question: "Quels règlements ont été refusés ?",
    fields: [
      { key: "total", label: "Montant (millimes)", type: "number" },
      { key: "hours", label: "Heures depuis la commande", type: "number" },
      { key: "method", label: "Moyen de paiement", type: "string" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT o.id, o.number, o.total_millimes, o.payment_method, EXTRACT(EPOCH FROM (now() - o.created_at))/3600 AS hours
      FROM orders o WHERE o.payment_status = 'failed' ORDER BY o.created_at DESC LIMIT 500`)).map((r) => ({
      key: `order:${n(r.id)}`,
      title: `Règlement refusé — ${String(r.number)}`,
      detail: `${String(r.payment_method)} · ${(n(r.total_millimes) / 1000).toFixed(3)} DT`,
      href: `/admin/commandes/${n(r.id)}`,
      values: { total: n(r.total_millimes), hours: Math.round(n(r.hours)), method: String(r.payment_method) },
    })),
  },
  {
    key: "cart_unsettled",
    label: "Commande non réglée",
    entity: "order",
    question: "Quelles commandes sont parties sans règlement ?",
    fields: [
      { key: "hours", label: "Heures depuis la commande", type: "number" },
      { key: "total", label: "Montant (millimes)", type: "number" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT o.id, o.number, o.total_millimes, EXTRACT(EPOCH FROM (now() - o.created_at))/3600 AS hours
      FROM orders o WHERE o.payment_status = 'pending' AND o.status NOT IN ('cancelled','returned')
      ORDER BY o.created_at ASC LIMIT 500`)).map((r) => ({
      key: `order:${n(r.id)}`,
      title: `Non réglée — ${String(r.number)}`,
      detail: `${(n(r.total_millimes) / 1000).toFixed(3)} DT · ${Math.round(n(r.hours))} h`,
      href: `/admin/commandes/${n(r.id)}`,
      values: { hours: Math.round(n(r.hours)), total: n(r.total_millimes) },
    })),
  },
  {
    key: "reviews_pending",
    label: "Avis en modération",
    entity: "review",
    question: "Quels avis attendent une décision ?",
    fields: [
      { key: "rating", label: "Note", type: "number" },
      { key: "days", label: "Jours d'attente", type: "number" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT r.id, r.rating, r.author_name, p.name AS product,
        EXTRACT(EPOCH FROM (now() - r.created_at))/86400 AS days
      FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.status = 'pending' ORDER BY r.created_at ASC LIMIT 500`)).map((r) => ({
      key: `review:${n(r.id)}`,
      title: `Avis ${n(r.rating)}/5 — ${String(r.product)}`,
      detail: `${String(r.author_name)} · ${Math.round(n(r.days))} jour(s) d'attente`,
      href: `/admin/avis`,
      values: { rating: n(r.rating), days: Math.round(n(r.days)) },
    })),
  },
  {
    key: "wishlist_gap",
    label: "Écart liste d'envie / ventes",
    entity: "product",
    question: "Quelles références sont désirées bien plus qu'achetées ?",
    fields: [
      { key: "gap", label: "Écart (envies − ventes)", type: "number" },
      { key: "wishes", label: "Envies", type: "number" },
      { key: "stock", label: "Stock", type: "number" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT p.id, p.name, p.stock, COUNT(w.user_id)::int AS wishes, COALESCE(s.units, 0)::int AS units
      FROM products p JOIN wishlist_items w ON w.product_id = p.id
      LEFT JOIN (SELECT product_id, SUM(quantity)::int AS units FROM order_items GROUP BY 1) s ON s.product_id = p.id
      GROUP BY 1,2,3, s.units HAVING COUNT(w.user_id) - COALESCE(s.units,0) >= 3 ORDER BY (COUNT(w.user_id) - COALESCE(s.units,0)) DESC LIMIT 500`)).map((r) => ({
      key: `product:${n(r.id)}`,
      title: String(r.name),
      detail: `${n(r.wishes)} envies pour ${n(r.units)} vendues`,
      href: `/admin/produits/${n(r.id)}`,
      values: { gap: n(r.wishes) - n(r.units), wishes: n(r.wishes), stock: n(r.stock), units: n(r.units) },
    })),
  },
  {
    key: "promo_expiring",
    label: "Promotion qui expire",
    entity: "promotion",
    question: "Quels codes arrivent à échéance ?",
    fields: [
      { key: "days_left", label: "Jours restants", type: "number" },
      { key: "usage_count", label: "Utilisations", type: "number" },
      { key: "usage_limit", label: "Limite d'utilisation", type: "number" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT id, code, label, ends_at, usage_count, COALESCE(usage_limit, 0) AS usage_limit,
        EXTRACT(EPOCH FROM (ends_at - now()))/86400 AS days_left
      FROM promotions WHERE is_active AND ends_at IS NOT NULL AND ends_at > now() AND ends_at < now() + interval '21 days'
      ORDER BY ends_at ASC LIMIT 500`)).map((r) => ({
      key: `promotion:${n(r.id)}`,
      title: `${String(r.code)} — ${String(r.label)}`,
      detail: `${Math.max(0, Math.round(n(r.days_left)))} jour(s) restant(s) · ${n(r.usage_count)} utilisation(s)`,
      href: `/admin/promotions`,
      values: { days_left: Math.round(n(r.days_left)), usage_count: n(r.usage_count), usage_limit: n(r.usage_limit) },
    })),
  },
  {
    key: "customer_inactive",
    label: "Cliente fidèle inactive",
    entity: "user",
    question: "Quelles clientes n'ont plus commandé depuis longtemps ?",
    fields: [
      { key: "days", label: "Jours sans commande", type: "number" },
      { key: "orders", label: "Commandes passées", type: "number" },
      { key: "spent", label: "Total dépensé (millimes)", type: "number" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT u.id, u.first_name || ' ' || u.last_name AS name, COUNT(o.id)::int AS orders, SUM(o.total_millimes) AS spent,
        EXTRACT(EPOCH FROM (now() - MAX(o.created_at)))/86400 AS days
      FROM users u JOIN orders o ON o.user_id = u.id AND o.status <> 'cancelled'
      GROUP BY 1,2 HAVING MAX(o.created_at) < now() - interval '60 days' ORDER BY SUM(o.total_millimes) DESC LIMIT 500`)).map((r) => ({
      key: `user:${n(r.id)}`,
      title: String(r.name),
      detail: `${n(r.orders)} commande(s) · ${Math.round(n(r.days))} jours sans achat`,
      href: `/admin/clients/${n(r.id)}`,
      values: { days: Math.round(n(r.days)), orders: n(r.orders), spent: n(r.spent) },
    })),
  },
  {
    key: "ticket_open",
    label: "Message client ouvert",
    entity: "ticket",
    question: "Quels messages attendent une réponse ?",
    fields: [
      { key: "hours", label: "Heures d'attente", type: "number" },
      { key: "priority", label: "Priorité", type: "string" },
      { key: "type", label: "Type", type: "string" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT id, subject, name, priority, type, EXTRACT(EPOCH FROM (now() - created_at))/3600 AS hours
      FROM support_tickets WHERE status = 'open' ORDER BY created_at ASC LIMIT 500`)).map((r) => ({
      key: `ticket:${n(r.id)}`,
      title: String(r.subject),
      detail: `${String(r.name)} · ${String(r.type)} · ${Math.round(n(r.hours))} h`,
      href: `/admin/support?ticket=${n(r.id)}`,
      values: { hours: Math.round(n(r.hours)), priority: String(r.priority), type: String(r.type) },
    })),
  },
  {
    key: "return_pending",
    label: "Retour à statuer",
    entity: "return",
    question: "Quels retours attendent une décision ?",
    fields: [
      { key: "days", label: "Jours d'attente", type: "number" },
      { key: "status", label: "Statut", type: "string" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT id, number, reason, status, EXTRACT(EPOCH FROM (now() - created_at))/86400 AS days
      FROM return_requests WHERE status IN ('pending','in_review') ORDER BY created_at ASC LIMIT 500`)).map((r) => ({
      key: `return:${n(r.id)}`,
      title: `Retour ${String(r.number)}`,
      detail: `${String(r.reason)} · ${Math.round(n(r.days))} jour(s)`,
      href: `/admin/support?tab=retours`,
      values: { days: Math.round(n(r.days)), status: String(r.status) },
    })),
  },
  {
    key: "product_incomplete",
    label: "Fiche incomplète",
    entity: "product",
    question: "Quelles fiches publiées manquent de contenu ?",
    fields: [
      { key: "description_length", label: "Longueur de description", type: "number" },
      { key: "images", label: "Nombre d'images", type: "number" },
    ],
    select: async () => (await rows<Record<string, unknown>>(sql`
      SELECT id, name, COALESCE(LENGTH(description), 0)::int AS description_length,
        COALESCE(jsonb_array_length(images), 0)::int AS images
      FROM products WHERE status = 'active'
        AND (image IS NULL OR image = '' OR description IS NULL OR LENGTH(description) < 200)
      ORDER BY description_length ASC LIMIT 500`)).map((r) => ({
      key: `product:${n(r.id)}`,
      title: String(r.name),
      detail: `${n(r.description_length)} caractères de description · ${n(r.images)} image(s)`,
      href: `/admin/produits/${n(r.id)}`,
      values: { description_length: n(r.description_length), images: n(r.images) },
    })),
  },
];

export function triggerDef(key: string): TriggerDef | undefined {
  return AUTOMATION_TRIGGERS.find((t) => t.key === key);
}

export type Condition = { field: string; op: string; value: string | number };
export type AutomationAction = { type: string; value?: string };

export const OPS: { key: string; label: string; hint: string }[] = [
  { key: "gt", label: "supérieur à", hint: ">" },
  { key: "gte", label: "supérieur ou égal", hint: "≥" },
  { key: "lt", label: "inférieur à", hint: "<" },
  { key: "lte", label: "inférieur ou égal", hint: "≤" },
  { key: "eq", label: "égal à", hint: "=" },
  { key: "neq", label: "différent de", hint: "≠" },
  { key: "contains", label: "contient", hint: "∋" },
];

export const ACTIONS: { key: string; label: string; hint: string }[] = [
  { key: "create_task", label: "Créer une tâche", hint: "Une tâche nominative dans la file de travail" },
  { key: "alert", label: "Ouvrir une alerte prioritaire", hint: "Tâche de priorité haute, rattachée à l'objet" },
  { key: "assign", label: "Assigner à l'équipe", hint: "La tâche créée est attribuée au responsable" },
];

function matches(obj: TriggerObject, conditions: Condition[]): boolean {
  return conditions.every((c) => {
    const raw = obj.values[c.field];
    if (raw === undefined) return true;
    if (typeof raw === "number") {
      const v = Number(c.value);
      if (Number.isNaN(v)) return true;
      switch (c.op) {
        case "gt": return raw > v;
        case "gte": return raw >= v;
        case "lt": return raw < v;
        case "lte": return raw <= v;
        case "neq": return raw !== v;
        default: return raw === v;
      }
    }
    const a = String(raw).toLowerCase();
    const b = String(c.value).toLowerCase();
    switch (c.op) {
      case "neq": return a !== b;
      case "contains": return a.includes(b);
      default: return a === b;
    }
  });
}

export type Evaluation = {
  trigger: TriggerDef;
  matched: TriggerObject[];
  scanned: number;
  error?: string;
};

/** Evaluate a trigger (with its conditions) against live data. No side effects. */
export async function evaluate(triggerKey: string, conditions: Condition[]): Promise<Evaluation> {
  const trigger = triggerDef(triggerKey);
  if (!trigger) return { trigger: AUTOMATION_TRIGGERS[0], matched: [], scanned: 0, error: "Déclencheur inconnu." };
  try {
    const all = await trigger.select();
    return { trigger, matched: all.filter((o) => matches(o, conditions)), scanned: all.length };
  } catch (e) {
    return { trigger, matched: [], scanned: 0, error: e instanceof Error ? e.message : "Erreur d'évaluation." };
  }
}

async function existingTaskKeys(entity: string): Promise<Set<string>> {
  const r = await rows<{ entity_id: string }>(sql`
    SELECT entity_id FROM admin_tasks WHERE entity = ${entity} AND status IN ('open','in_progress')`);
  return new Set(r.map((x) => String(x.entity_id)));
}

/** Run one automation for real: evaluate, act, then write the run to the ledger. */
export async function runAutomation(
  automation: { id: number; trigger: string; conditions: Condition[]; actions: AutomationAction[]; name: string },
  mode: "test" | "manual" | "schedule" = "manual",
  actorId?: number | null,
): Promise<{ ok: boolean; matched: number; affected: number; detail: string; items: TriggerObject[] }> {
  const evaluation = await evaluate(automation.trigger, automation.conditions ?? []);
  const already = await existingTaskKeys(evaluation.trigger.entity);
  const created: TriggerObject[] = [];
  let affected = 0;

  if (evaluation.error) {
    await db.insert(automationRuns).values({ automationId: automation.id, mode, matched: 0, affected: 0, status: "error", detail: evaluation.error });
    return { ok: false, matched: 0, affected: 0, detail: evaluation.error, items: [] };
  }

  if (mode !== "test") {
    for (const obj of evaluation.matched) {
      if (already.has(obj.key.split(":")[1] ?? "")) continue;
      const wantsTask = automation.actions.some((a) => a.type === "create_task" || a.type === "alert");
      const priority = automation.actions.some((a) => a.type === "alert") ? "high" : "normal";
      if (wantsTask) {
        const title = automation.actions.find((a) => a.type === "create_task" || a.type === "alert")?.value?.trim();
        await db.insert(adminTasks).values({
          title: title ? `${title} — ${obj.title}` : `${automation.name} — ${obj.title}`,
          detail: obj.detail,
          priority: priority as never,
          source: "automation",
          entity: evaluation.trigger.entity,
          entityId: obj.key.split(":")[1] ?? null,
          href: obj.href,
          assigneeId: automation.actions.some((a) => a.type === "assign") ? (actorId ?? null) : null,
          createdById: actorId ?? null,
        });
        created.push(obj);
        affected += 1;
      }
    }
    await db
      .update(automations)
      .set({ runCount: sql`${automations.runCount} + 1`, lastRunAt: new Date(), updatedAt: new Date() })
      .where(sql`${automations.id} = ${automation.id}`);
  }

  const detail = mode === "test"
    ? `${evaluation.matched.length} élément(s) correspondant(s) sur ${evaluation.scanned} analysé(s) — aucun effet appliqué (mode test).`
    : `${created.length} tâche(s) créée(s) sur ${evaluation.matched.length} correspondance(s) (${evaluation.scanned} analysés).`;
  await db.insert(automationRuns).values({
    automationId: automation.id, mode, matched: evaluation.matched.length, affected,
    status: "ok", detail,
  });
  return { ok: true, matched: evaluation.matched.length, affected, detail, items: evaluation.matched.slice(0, 40) };
}

export async function listAutomations() {
  const list = await db.select().from(automations).orderBy(sql`${automations.isActive} DESC, ${automations.id} DESC`);
  const runs = await rows<{ automation_id: number; n: number; last: Date | null; errors: number }>(sql`
    SELECT automation_id, COUNT(*)::int AS n, MAX(created_at) AS last, COUNT(*) FILTER (WHERE status = 'error')::int AS errors
    FROM automation_runs GROUP BY 1`);
  return list.map((a) => {
    const r = runs.find((x) => num(x.automation_id) === a.id);
    return {
      ...a,
      conditions: (a.conditions ?? []) as Condition[],
      actions: (a.actions ?? []) as AutomationAction[],
      runCount: num(r?.n ?? a.runCount),
      lastRunAt: r?.last ?? a.lastRunAt,
      errors: num(r?.errors),
      triggerLabel: triggerDef(a.trigger)?.label ?? a.trigger,
    };
  });
}

export async function automationRunsFor(id?: number, limit = 40) {
  const list = await db
    .select({
      id: automationRuns.id, automationId: automationRuns.automationId, mode: automationRuns.mode,
      matched: automationRuns.matched, affected: automationRuns.affected, status: automationRuns.status,
      detail: automationRuns.detail, createdAt: automationRuns.createdAt, name: automations.name,
    })
    .from(automationRuns)
    .leftJoin(automations, sql`${automations.id} = ${automationRuns.automationId}`)
    .where(id ? sql`${automationRuns.automationId} = ${id}` : sql`true`)
    .orderBy(sql`${automationRuns.createdAt} DESC`)
    .limit(limit);
  return list;
}

/** Called by the cron route: every active automation, once per pass. */
export async function runScheduledAutomations() {
  const list = await db.select().from(automations).where(sql`${automations.isActive} = true`);
  let created = 0;
  let examined = 0;
  for (const a of list) {
    const r = await runAutomation(
      { id: a.id, trigger: a.trigger, conditions: (a.conditions ?? []) as Condition[], actions: (a.actions ?? []) as AutomationAction[], name: a.name },
      "schedule",
      a.createdById,
    );
    created += r.affected;
    examined += r.matched;
  }
  return { automations: list.length, examined, created };
}
