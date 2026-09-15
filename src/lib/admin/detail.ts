import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { customerMetrics, productHealth, type CustomerMetric, type ProductRow, type Velocity } from "./metrics";

/** Postgres timestamps reach us as strings through the embedded driver: coerce. */
const ts = (v: unknown): Date => (v instanceof Date ? v : new Date(String(v)));
const tsOrNull = (v: unknown): Date | null => (v == null ? null : v instanceof Date ? v : new Date(String(v)));

async function rows<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] }).rows ?? []) as T[];
}
const num = (v: unknown) => Number(v ?? 0);

/* ══════════════════════════════════════════════════════════════════════════
   FICHES — one object, everything the house knows about it
   ──────────────────────────────────────────────────────────────────────────
   The workspace never leaves the page to show a related object: each of these
   functions returns the complete bundle for a drawer, so Order → Customer →
   Product stays one continuous movement.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Order ───────────────────────────────────────────────────────────────── */

export type OrderItemRow = {
  id: number; productId: number | null; name: string; sku: string; brandName: string | null;
  image: string | null; unitPrice: number; quantity: number; lineTotal: number;
  stock: number | null; productSlug: string | null;
};

export async function orderDetail(id: number) {
  const [order] = await rows<Record<string, unknown>>(sql`SELECT * FROM orders WHERE id = ${id} LIMIT 1`);
  return order ? await orderBundle(order) : null;
}

async function orderBundle(raw: Record<string, unknown>) {
  const id = num(raw.id);
  const items = await rows<OrderItemRow>(sql`
    SELECT oi.id, oi.product_id, oi.name, oi.sku, oi.brand_name, oi.image, oi.unit_price_millimes AS unit_price,
      oi.quantity, oi.line_total_millimes AS line_total, p.stock, p.slug AS product_slug
    FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ${id} ORDER BY oi.id`);
  const events = await rows<{ id: number; status: string; message: string | null; at: Date; actor: string | null }>(sql`
    SELECT e.id, e.status, e.message, e.created_at AS at, u.first_name || ' ' || u.last_name AS actor
    FROM order_events e LEFT JOIN users u ON u.id = e.actor_id
    WHERE e.order_id = ${id} ORDER BY e.created_at ASC`);
  const mails = await rows<{ id: number; kind: string; subject: string; status: string; at: Date | null; error: string | null; to: string }>(sql`
    SELECT id, kind, subject, status, COALESCE(sent_at, send_at) AS at, error, "to"
    FROM email_outbox WHERE payload->>'orderNumber' = ${String(raw.number)} ORDER BY COALESCE(sent_at, send_at) DESC LIMIT 20`);
  const returns = await rows<{ id: number; number: string; reason: string; status: string; at: Date; note: string | null }>(sql`
    SELECT id, number, reason, status, created_at AS at, staff_note AS note FROM return_requests WHERE order_id = ${id} ORDER BY created_at DESC`);
  const tickets = await rows<{ id: number; subject: string; status: string; at: Date; priority: string }>(sql`
    SELECT id, subject, status, created_at AS at, priority FROM support_tickets WHERE order_number = ${String(raw.number)} ORDER BY created_at DESC`);
  const tasks = await rows<{ id: number; title: string; status: string; priority: string; assignee: string | null }>(sql`
    SELECT t.id, t.title, t.status, t.priority, u.first_name || ' ' || u.last_name AS assignee
    FROM admin_tasks t LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.entity = 'order' AND t.entity_id = ${String(id)} AND t.status IN ('open','in_progress')`);
  const audits = await rows<{ id: number; action: string; at: Date; details: Record<string, unknown>; actor: string | null }>(sql`
    SELECT a.id, a.action, a.created_at AS at, a.details, u.first_name || ' ' || u.last_name AS actor
    FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
    WHERE a.entity = 'order' AND a.entity_id = ${String(id)} ORDER BY a.created_at DESC LIMIT 12`);
  const customer = raw.user_id
    ? (await rows<Record<string, unknown>>(sql`
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.loyalty_points, u.locale, u.created_at,
          (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id AND o.status <> 'cancelled') AS orders,
          (SELECT COALESCE(SUM(total_millimes),0) FROM orders o WHERE o.user_id = u.id AND o.status <> 'cancelled') AS spent,
          (SELECT COUNT(*)::int FROM wishlist_items w WHERE w.user_id = u.id) AS wishes,
          (SELECT COUNT(*)::int FROM return_requests r WHERE r.user_id = u.id) AS returns
        FROM users u WHERE u.id = ${num(raw.user_id)}`))[0]
    : null;
  const siblings = raw.user_id
    ? await rows<{ id: number; number: string; at: Date; total: number; status: string }>(sql`
        SELECT id, number, created_at AS at, total_millimes AS total, status FROM orders
        WHERE user_id = ${num(raw.user_id)} AND id <> ${id} ORDER BY created_at DESC LIMIT 6`)
    : [];
  const address = raw.shipping_address as Record<string, string> | null;

  return {
    id,
    number: String(raw.number),
    status: String(raw.status) as never,
    paymentStatus: String(raw.payment_status) as never,
    paymentMethod: String(raw.payment_method) as never,
    shippingMethod: String(raw.shipping_method) as never,
    createdAt: ts(raw.created_at),
    updatedAt: ts(raw.updated_at),
    email: String(raw.email),
    phone: String(raw.phone),
    subtotal: num(raw.subtotal_millimes),
    discount: num(raw.discount_millimes),
    shipping: num(raw.shipping_millimes),
    giftWrap: num(raw.gift_wrap_millimes),
    total: num(raw.total_millimes),
    promoCode: (raw.promo_code as string | null) ?? null,
    giftWrapEnabled: Boolean(raw.gift_wrap),
    giftMessage: (raw.gift_message as string | null) ?? null,
    customerNote: (raw.customer_note as string | null) ?? null,
    internalNote: (raw.internal_note as string | null) ?? null,
    trackingCode: (raw.tracking_code as string | null) ?? null,
    loyaltyEarned: num(raw.loyalty_earned),
    loyaltySpent: num(raw.loyalty_spent),
    address,
    items,
    events: events.map((e) => ({ ...e, at: ts(e.at) })),
    mails: mails.map((m) => ({ ...m, at: tsOrNull(m.at) })),
    returns: returns.map((r) => ({ ...r, at: ts(r.at) })),
    tickets: tickets.map((t) => ({ ...t, at: ts(t.at) })),
    tasks, audits: audits.map((a) => ({ ...a, at: ts(a.at) })),
    siblings: siblings.map((x) => ({ ...x, at: ts(x.at) })),
    customer: customer ? {
      id: num(customer.id), firstName: String(customer.first_name), lastName: String(customer.last_name),
      email: String(customer.email), phone: (customer.phone as string | null) ?? null,
      loyaltyPoints: num(customer.loyalty_points), locale: String(customer.locale), createdAt: ts(customer.created_at),
      orders: num(customer.orders), spent: num(customer.spent), wishes: num(customer.wishes), returns: num(customer.returns),
    } : null,
    stageIndex: ["pending", "confirmed", "preparing", "shipped", "delivered"].indexOf(String(raw.status)),
  };
}

export type OrderBundle = NonNullable<Awaited<ReturnType<typeof orderDetail>>>;

/* ── Customer 360 ────────────────────────────────────────────────────────── */

export async function customerDetail(id: number) {
  const metrics = await customerMetrics();
  const metric = metrics.find((m) => m.id === id);
  if (!metric) return null;
  const addresses = await rows<{ id: number; label: string; fullName: string; line1: string; line2: string | null; city: string; governorate: string; postalCode: string | null; phone: string; isDefault: boolean }>(sql`
    SELECT id, label, full_name, line1, line2, city, governorate, postal_code, phone, is_default FROM addresses WHERE user_id = ${id} ORDER BY is_default DESC`);
  const orders = await rows<{ id: number; number: string; at: Date; total: number; status: string; paymentStatus: string; items: number }>(sql`
    SELECT o.id, o.number, o.created_at AS at, o.total_millimes AS total, o.status, o.payment_status,
      (SELECT COALESCE(SUM(quantity),0)::int FROM order_items oi WHERE oi.order_id = o.id) AS items
    FROM orders o WHERE o.user_id = ${id} ORDER BY o.created_at DESC LIMIT 40`);
  const wishlist = await rows<{ id: number; name: string; image: string | null; price: number; stock: number; at: Date; note: string | null }>(sql`
    SELECT p.id, p.name, p.image, p.price_millimes AS price, p.stock, w.created_at AS at, w.note
    FROM wishlist_items w JOIN products p ON p.id = w.product_id WHERE w.user_id = ${id} ORDER BY w.created_at DESC`);
  const reviews = await rows<{ id: number; rating: number; title: string | null; status: string; at: Date; product: string }>(sql`
    SELECT r.id, r.rating, r.title, r.status, r.created_at AS at, p.name AS product
    FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.user_id = ${id} ORDER BY r.created_at DESC LIMIT 20`);
  const tickets = await rows<{ id: number; subject: string; status: string; type: string; at: Date; priority: string; messages: number }>(sql`
    SELECT t.id, t.subject, t.status, t.type, t.created_at AS at, t.priority,
      (SELECT COUNT(*)::int FROM ticket_messages m WHERE m.ticket_id = t.id) AS messages
    FROM support_tickets t WHERE t.user_id = ${id} ORDER BY t.created_at DESC LIMIT 20`);
  const returns = await rows<{ id: number; number: string; reason: string; status: string; at: Date; orderId: number | null }>(sql`
    SELECT id, number, reason, status, created_at AS at, order_id FROM return_requests WHERE user_id = ${id} ORDER BY created_at DESC`);
  const loyalty = await rows<{ id: number; points: number; reason: string; kind: string; at: Date }>(sql`
    SELECT id, points, reason, kind, created_at AS at FROM loyalty_transactions WHERE user_id = ${id} ORDER BY created_at DESC LIMIT 40`);
  const subscriptions = await rows<{ id: number; status: string; frequency: number; nextDue: Date; items: number }>(sql`
    SELECT s.id, s.status, s.frequency_days AS frequency, s.next_due_at AS nextDue,
      (SELECT COUNT(*)::int FROM subscription_items i WHERE i.subscription_id = s.id) AS items
    FROM subscriptions s WHERE s.user_id = ${id} ORDER BY s.created_at DESC`);
  const diagnostics = await rows<{ id: number; at: Date; answers: Record<string, unknown>; products: number }>(sql`
    SELECT d.id, d.created_at AS at, d.answers, COALESCE(jsonb_array_length(d.product_ids), 0)::int AS products
    FROM diagnostics d WHERE d.user_id = ${id} ORDER BY d.created_at DESC LIMIT 6`);
  const rituals = await rows<{ id: number; name: string; moment: string; season: string | null; items: number; reminder: boolean }>(sql`
    SELECT id, name, moment, season, COALESCE(jsonb_array_length(items),0)::int AS items, reminder_enabled AS reminder
    FROM rituals WHERE user_id = ${id} ORDER BY created_at DESC`);
  const timeline = await rows<{ id: string; at: Date; kind: string; title: string; detail: string | null }>(sql`
    SELECT 'order-' || e.id AS id, e.created_at AS at, 'order' AS kind,
      'Commande ' || o.number || ' — ' || COALESCE(e.message, e.status::text) AS title, NULL::text AS detail
    FROM order_events e JOIN orders o ON o.id = e.order_id WHERE o.user_id = ${id}
    UNION ALL
    SELECT 'review-' || r.id, r.created_at, 'review', 'Avis ' || r.rating || '/5 · ' || p.name, r.title
    FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.user_id = ${id}
    UNION ALL
    SELECT 'ticket-' || t.id, t.created_at, 'support', 'Message — ' || t.subject, t.type::text FROM support_tickets t WHERE t.user_id = ${id}
    UNION ALL
    SELECT 'msg-' || m.id, m.created_at, 'support', 'Réponse du comptoir', LEFT(m.body, 90)
    FROM ticket_messages m JOIN support_tickets t ON t.id = m.ticket_id WHERE t.user_id = ${id} AND m.user_id IS NULL
    UNION ALL
    SELECT 'wish-' || w.product_id || '-' || w.created_at, w.created_at, 'wishlist', 'Ajout à la liste d''envie — ' || p.name, w.note
    FROM wishlist_items w JOIN products p ON p.id = w.product_id WHERE w.user_id = ${id}
    UNION ALL
    SELECT 'loyalty-' || l.id, l.created_at, 'loyalty', 'Points ' || CASE WHEN l.points >= 0 THEN '+' ELSE '' END || l.points, l.reason
    FROM loyalty_transactions l WHERE l.user_id = ${id}
    UNION ALL
    SELECT 'account-' || u.id, u.created_at, 'account', 'Compte créé', u.email FROM users u WHERE u.id = ${id}
    ORDER BY at DESC LIMIT 60`);
  const [lifetime] = await rows<{ earned: number; spent: number; restored: number; reversed: number }>(sql`
    SELECT COALESCE(SUM(points) FILTER (WHERE kind = 'award'), 0)::int AS earned,
      COALESCE(SUM(points) FILTER (WHERE kind = 'redeem'), 0)::int AS spent,
      COALESCE(SUM(points) FILTER (WHERE kind = 'restore'), 0)::int AS restored,
      COALESCE(SUM(points) FILTER (WHERE kind = 'reversal'), 0)::int AS reversed
    FROM loyalty_transactions WHERE user_id = ${id}`);

  return {
    metric, addresses, rituals,
    orders: orders.map((o) => ({ ...o, at: ts(o.at) })),
    wishlist: wishlist.map((w) => ({ ...w, at: ts(w.at) })),
    reviews: reviews.map((r) => ({ ...r, at: ts(r.at) })),
    tickets: tickets.map((t) => ({ ...t, at: ts(t.at) })),
    returns: returns.map((r) => ({ ...r, at: ts(r.at) })),
    loyalty: loyalty.map((l) => ({ ...l, at: ts(l.at) })),
    subscriptions,
    diagnostics: diagnostics.map((d) => ({ ...d, at: ts(d.at) })),
    timeline: timeline.map((t) => ({ ...t, at: ts(t.at) })),
    lifetime: { earned: num(lifetime?.earned), spent: num(lifetime?.spent), restored: num(lifetime?.restored), reversed: num(lifetime?.reversed) },
  };
}

export type CustomerBundle = NonNullable<Awaited<ReturnType<typeof customerDetail>>>;

/* ── Product 360 ─────────────────────────────────────────────────────────── */

export async function productDetail(id: number, list: ProductRow[], velocity: Velocity[]) {
  const product = list.find((p) => p.id === id);
  if (!product) return null;
  const health = productHealth(product);
  const v = velocity.find((x) => x.productId === id);
  const movements = await rows<{ id: number; type: string; quantity: number; stockAfter: number; reason: string | null; at: Date; actor: string | null; orderNumber: string | null }>(sql`
    SELECT m.id, m.type, m.quantity, m.stock_after AS "stockAfter", m.reason, m.created_at AS at,
      u.first_name || ' ' || u.last_name AS actor, o.number AS "orderNumber"
    FROM inventory_movements m LEFT JOIN users u ON u.id = m.user_id LEFT JOIN orders o ON o.id = m.order_id
    WHERE m.product_id = ${id} ORDER BY m.created_at DESC LIMIT 60`);
  const sales = await rows<{ at: Date; units: number; revenue: number }>(sql`
    SELECT date_trunc('month', o.created_at) AS at, SUM(oi.quantity)::int AS units, SUM(oi.line_total_millimes) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = ${id} AND o.status <> 'cancelled' AND o.created_at > now() - interval '12 months'
    GROUP BY 1 ORDER BY 1`);
  const recentOrders = await rows<{ id: number; number: string; at: Date; total: number; status: string; quantity: number; buyer: string | null }>(sql`
    SELECT o.id, o.number, o.created_at AS at, o.total_millimes AS total, o.status, oi.quantity,
      COALESCE(u.first_name || ' ' || u.last_name, o.shipping_address->>'fullName') AS buyer
    FROM order_items oi JOIN orders o ON o.id = oi.order_id LEFT JOIN users u ON u.id = o.user_id
    WHERE oi.product_id = ${id} ORDER BY o.created_at DESC LIMIT 25`);
  const reviews = await rows<{ id: number; rating: number; title: string | null; body: string; author: string; status: string; at: Date; verified: boolean; reply: string | null }>(sql`
    SELECT id, rating, title, body, author_name AS author, status, created_at AS at, is_verified AS verified, reply
    FROM reviews WHERE product_id = ${id} ORDER BY created_at DESC LIMIT 30`);
  const wishlist = await rows<{ id: number; name: string; city: string | null; at: Date; note: string | null }>(sql`
    SELECT u.id, u.first_name || ' ' || u.last_name AS name, a.city, w.created_at AS at, w.note
    FROM wishlist_items w JOIN users u ON u.id = w.user_id
    LEFT JOIN addresses a ON a.user_id = u.id AND a.is_default
    WHERE w.product_id = ${id} ORDER BY w.created_at DESC LIMIT 30`);
  const restock = await rows<{ id: number; email: string; channel: string; at: Date; notified: Date | null }>(sql`
    SELECT id, email, channel, created_at AS at, notified_at AS notified FROM restock_alerts WHERE product_id = ${id} ORDER BY created_at DESC`);
  const relations = await rows<{ kind: string; id: number; name: string; image: string | null; note: string | null }>(sql`
    SELECT 'pair' AS kind, p.id, p.name, p.image, pp.reason AS note
    FROM product_pairs pp JOIN products p ON p.id = pp.pair_product_id WHERE pp.product_id = ${id}
    UNION ALL
    SELECT 'substitute', p.id, p.name, p.image, ps.reason->>'fr'
    FROM product_substitutes ps JOIN products p ON p.id = ps.substitute_product_id WHERE ps.product_id = ${id}
    UNION ALL
    SELECT 'concern', c.id, c.name, NULL, c.intro FROM product_concerns pc JOIN concerns c ON c.id = pc.concern_id WHERE pc.product_id = ${id}`);
  const bundles = await rows<{ id: number; name: string; discount: number; other: string | null }>(sql`
    SELECT d.id, d.name->>'fr' AS name, d.discount_millimes AS discount,
      (SELECT p.name FROM products p WHERE p.id = CASE WHEN d.product_a_id = ${id} THEN d.product_b_id ELSE d.product_a_id END) AS other
    FROM duos d WHERE d.product_a_id = ${id} OR d.product_b_id = ${id}`);
  const articles = await rows<{ id: number; title: string; slug: string }>(sql`
    SELECT a.id, a.title, a.slug FROM article_products ap JOIN articles a ON a.id = ap.article_id WHERE ap.product_id = ${id}`);
  const promos = await rows<{ id: number; code: string; label: string; type: string; value: number; endsAt: Date | null; state: string }>(sql`
    SELECT pr.id, pr.code, pr.label, pr.type, pr.value, pr.ends_at,
      CASE WHEN pr.is_active = false THEN 'inactive' WHEN pr.ends_at IS NOT NULL AND pr.ends_at < now() THEN 'expired' ELSE 'live' END AS state
    FROM promotions pr WHERE pr.is_active AND (pr.universe_id IS NULL OR pr.universe_id = ${product.universeId ?? -1})`);

  return {
    product, health, velocity: v ?? null,
    movements: movements.map((m) => ({
      id: num(m.id), type: String(m.type), quantity: num(m.quantity), stockAfter: num(m.stockAfter),
      reason: (m.reason as string | null) ?? null, at: ts(m.at), actor: (m.actor as string | null) ?? null,
      orderNumber: (m.orderNumber as string | null) ?? null,
    })),
    sales: sales.map((s) => ({ at: ts(s.at), units: num(s.units), revenue: num(s.revenue) })),
    recentOrders: recentOrders.map((o) => ({ id: num(o.id), number: String(o.number), at: ts(o.at), total: num(o.total), status: String(o.status), quantity: num(o.quantity), buyer: (o.buyer as string | null) ?? null })),
    reviews: reviews.map((r) => ({ id: num(r.id), rating: num(r.rating), title: (r.title as string | null) ?? null, body: String(r.body), author: String(r.author), status: String(r.status), at: ts(r.at), verified: Boolean(r.verified), reply: (r.reply as string | null) ?? null })),
    wishlist: wishlist.map((w) => ({ id: num(w.id), name: String(w.name), city: (w.city as string | null) ?? null, at: ts(w.at), note: (w.note as string | null) ?? null })),
    restock: restock.map((r) => ({ id: num(r.id), email: String(r.email), channel: String(r.channel), at: ts(r.at), notified: tsOrNull(r.notified) })),
    relations, bundles, articles, promos,
  };
}

export type ProductBundle = NonNullable<Awaited<ReturnType<typeof productDetail>>>;

/* ── Media library ───────────────────────────────────────────────────────── */

export type MediaAsset = {
  url: string;
  source: "produit" | "rayon" | "journal" | "boutique";
  role: "principale" | "galerie" | "illustration";
  ownerId: number | null;
  ownerName: string;
  href: string;
  alts: string[];
  usedByProductIds: number[];
};

/**
 * The media library reads the images the shop actually references. There is no
 * separate asset table in this codebase — a picture exists because a product, a
 * rayon or an article points at it — so the library is built from those links
 * and says so, instead of inventing a store of files that has no writer.
 */
export async function mediaLibrary(): Promise<{ assets: MediaAsset[]; sources: { key: string; label: string; count: number }[]; orphanCandidates: number }> {
  const assets: MediaAsset[] = [];
  const productMedia = await rows<{ id: number; name: string; image: string | null; images: string[] | null; alts: string[] | null; is_featured: boolean }>(sql`
    SELECT id, name, image, images, image_alts AS alts, is_featured FROM products ORDER BY name`);
  for (const p of productMedia) {
    const gallery = Array.isArray(p.images) ? p.images : [];
    const alts = Array.isArray(p.alts) ? p.alts : [];
    if (p.image) {
      assets.push({
        url: p.image, source: "produit", role: "principale", ownerId: num(p.id), ownerName: String(p.name),
        href: `/admin/produits/${num(p.id)}`, alts: [alts[0] ?? String(p.name)], usedByProductIds: [num(p.id)],
      });
    }
    gallery.forEach((url, i) => {
      if (url === p.image) return;
      assets.push({ url, source: "produit", role: "galerie", ownerId: num(p.id), ownerName: String(p.name), href: `/admin/produits/${num(p.id)}`, alts: [alts[i + 1] ?? ""], usedByProductIds: [num(p.id)] });
    });
  }
  const categoryMedia = await rows<{ id: number; name: string; image: string | null }>(sql`SELECT id, name, image FROM categories WHERE image IS NOT NULL`);
  for (const c of categoryMedia) {
    assets.push({ url: String(c.image), source: "rayon", role: "illustration", ownerId: num(c.id), ownerName: String(c.name), href: `/admin/mise-en-scene`, alts: [], usedByProductIds: [] });
  }
  const articleMedia = await rows<{ id: number; title: string; image: string | null }>(sql`SELECT id, title, image FROM articles WHERE image IS NOT NULL`);
  for (const a of articleMedia) {
    assets.push({ url: String(a.image), source: "journal", role: "illustration", ownerId: num(a.id), ownerName: String(a.title), href: `/admin/journal`, alts: [], usedByProductIds: [] });
  }
  // Group identical URLs: the same file used by several references is one asset.
  const merged = new Map<string, MediaAsset>();
  for (const a of assets) {
    const found = merged.get(a.url);
    if (!found) { merged.set(a.url, { ...a }); continue; }
    found.usedByProductIds = [...new Set([...found.usedByProductIds, ...a.usedByProductIds])];
    found.alts = [...new Set([...found.alts, ...a.alts].filter(Boolean))];
    if (found.role === "illustration") found.role = a.role;
  }
  const list = [...merged.values()];
  const sources = ["produit", "rayon", "journal"].map((key) => ({
    key,
    label: key === "produit" ? "Produits" : key === "rayon" ? "Rayons" : "Journal",
    count: list.filter((a) => a.source === key).length,
  }));
  return { assets: list, sources, orphanCandidates: list.filter((a) => a.usedByProductIds.length === 0).length };
}

/* ── Global search ───────────────────────────────────────────────────────── */

export type SearchHit = { kind: "product" | "order" | "customer" | "brand" | "category" | "review" | "rayon"; id: number; label: string; sub: string; href: string; image?: string | null };

export async function globalSearch(term: string, limit = 4): Promise<SearchHit[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const [products, orders, customers, brands, categories, reviews] = await Promise.all([
    rows<{ id: number; name: string; sku: string; image: string | null; price: number; stock: number }>(sql`
      SELECT id, name, sku, image, price_millimes AS price, stock FROM products
      WHERE unaccent(name) ILIKE unaccent(${like}) OR sku ILIKE ${like} OR unaccent(slug) ILIKE unaccent(${like})
      ORDER BY (sku ILIKE ${like}) DESC, name LIMIT ${limit}`),
    rows<{ id: number; number: string; total: number; status: string; at: Date; name: string }>(sql`
      SELECT id, number, total_millimes AS total, status, created_at AS at, shipping_address->>'fullName' AS name FROM orders
      WHERE number ILIKE ${like} OR email ILIKE ${like} OR shipping_address->>'fullName' ILIKE ${like} OR phone ILIKE ${like}
      ORDER BY created_at DESC LIMIT ${limit}`),
    rows<{ id: number; name: string; email: string; orders: number; spent: number }>(sql`
      SELECT u.id, u.first_name || ' ' || u.last_name AS name, u.email,
        (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS orders,
        (SELECT COALESCE(SUM(total_millimes),0) FROM orders o WHERE o.user_id = u.id) AS spent
      FROM users u WHERE unaccent(u.first_name || ' ' || u.last_name) ILIKE unaccent(${like}) OR u.email ILIKE ${like} OR u.phone ILIKE ${like}
      ORDER BY spent DESC LIMIT ${limit}`),
    rows<{ id: number; name: string; slug: string; country: string | null }>(sql`
      SELECT id, name, slug, country FROM brands WHERE unaccent(name) ILIKE unaccent(${like}) ORDER BY name LIMIT ${limit}`),
    rows<{ id: number; name: string; slug: string; universe: string | null }>(sql`
      SELECT c.id, c.name, c.slug, u.name AS universe FROM categories c LEFT JOIN categories u ON u.id = c.parent_id
      WHERE unaccent(c.name) ILIKE unaccent(${like}) ORDER BY c.name LIMIT ${limit}`),
    rows<{ id: number; title: string | null; author: string; product: string; rating: number }>(sql`
      SELECT r.id, r.title, r.author_name AS author, p.name AS product, r.rating FROM reviews r JOIN products p ON p.id = r.product_id
      WHERE unaccent(r.title) ILIKE unaccent(${like}) OR unaccent(r.body) ILIKE unaccent(${like}) OR unaccent(r.author_name) ILIKE unaccent(${like})
      ORDER BY r.created_at DESC LIMIT ${limit}`),
  ]);
  return [
    ...products.map((p): SearchHit => ({ kind: "product", id: num(p.id), label: String(p.name), sub: `${String(p.sku)} · ${(num(p.price) / 1000).toFixed(3)} DT · ${num(p.stock)} en stock`, href: `/admin/produits/${num(p.id)}`, image: (p.image as string | null) ?? null })),
    ...orders.map((o): SearchHit => ({ kind: "order", id: num(o.id), label: String(o.number), sub: `${String(o.name)} · ${(num(o.total) / 1000).toFixed(3)} DT · ${String(o.status)}`, href: `/admin/commandes/${num(o.id)}` })),
    ...customers.map((c): SearchHit => ({ kind: "customer", id: num(c.id), label: String(c.name), sub: `${String(c.email)} · ${num(c.orders)} commandes`, href: `/admin/clients/${num(c.id)}` })),
    ...brands.map((b): SearchHit => ({ kind: "brand", id: num(b.id), label: String(b.name), sub: (b.country as string | null) ?? "laboratoire", href: `/admin/analytique/marque/${num(b.id)}` })),
    ...categories.map((c): SearchHit => ({ kind: "category", id: num(c.id), label: String(c.name), sub: (c.universe as string | null) ?? "univers", href: `/admin/analytique/categories` })),
    ...reviews.map((r): SearchHit => ({ kind: "review", id: num(r.id), label: (r.title as string | null) ?? `Avis ${num(r.rating)}/5`, sub: `${String(r.author)} · ${String(r.product)}`, href: `/admin/avis` })),
  ];
}

/* ── Segment evaluation ──────────────────────────────────────────────────── */

export type SegmentRule = { field: string; op: string; value: string | number };

export const SEGMENT_FIELDS: { key: keyof CustomerMetric | "aov" | "recencyDays"; label: string; type: "number" | "string"; hint: string }[] = [
  { key: "spent", label: "Total dépensé (DT)", type: "number", hint: "Somme des commandes non annulées" },
  { key: "orders", label: "Nombre de commandes", type: "number", hint: "Commandes non annulées" },
  { key: "aov", label: "Panier moyen (DT)", type: "number", hint: "Total ÷ commandes" },
  { key: "recencyDays", label: "Jours depuis la dernière commande", type: "number", hint: "999 si jamais commandé" },
  { key: "wishes", label: "Références en liste d'envie", type: "number", hint: "" },
  { key: "reviews", label: "Avis déposés", type: "number", hint: "" },
  { key: "loyaltyPoints", label: "Points de fidélité", type: "number", hint: "" },
  { key: "tickets", label: "Messages support", type: "number", hint: "" },
  { key: "returns", label: "Retours", type: "number", hint: "" },
  { key: "segment", label: "Segment RFM", type: "string", hint: "champion, loyal, nouveau, à risque, perdu, prospect" },
  { key: "locale", label: "Langue", type: "string", hint: "fr, tn, tn-arab" },
  { key: "city" as never, label: "Ville (adresse par défaut)", type: "string", hint: "" },
];

export function evaluateSegment(customers: (CustomerMetric & { city?: string | null })[], rules: SegmentRule[]): CustomerMetric[] {
  return customers.filter((c) =>
    rules.every((r) => {
      const key = r.field as keyof (CustomerMetric & { city?: string | null });
      let raw: unknown = c[key];
      if (r.field === "spent" || r.field === "aov") raw = Number(raw) / 1000;
      if (r.field === "recencyDays") raw = raw == null ? 999 : raw;
      if (raw === undefined || raw === null) return false;
      if (typeof raw === "number") {
        const v = Number(r.value);
        if (Number.isNaN(v)) return true;
        switch (r.op) {
          case "gt": return raw > v;
          case "gte": return raw >= v;
          case "lt": return raw < v;
          case "lte": return raw <= v;
          case "neq": return raw !== v;
          default: return raw === v;
        }
      }
      const a = String(raw).toLowerCase();
      const b = String(r.value).toLowerCase();
      switch (r.op) {
        case "neq": return a !== b;
        case "contains": return a.includes(b);
        default: return a === b;
      }
    }),
  );
}
