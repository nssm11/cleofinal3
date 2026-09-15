import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
  addresses,
  adminTasks,
  analyticsEvents,
  auditLogs,
  automationRuns,
  automations,
  brands,
  emailOutbox,
  inventoryMovements,
  loyaltyTransactions,
  newsletterSubscribers,
  orderEvents,
  orderItems,
  orders,
  products,
  promotions,
  restockAlerts,
  returnRequests,
  reviews,
  searchEvents,
  subscriptionEvents,
  subscriptionItems,
  subscriptions,
  supportTickets,
  ticketMessages,
  users,
  wishlistItems,
} from "./schema";

/* ══════════════════════════════════════════════════════════════════════════
   HISTORIQUE DE DÉMONSTRATION — 210 jours de maison
   ──────────────────────────────────────────────────────────────────────────
   The catalogue seed gives the shop its shelves; this gives it a past.

   Everything written here is *only* development demo data, and it is written
   the way the application writes it: same statuses, same event trail, same
   stock movements, same loyalty ledger, same outbox rows. The operating
   screens therefore compute nothing from thin air — they read the tables the
   running shop maintains, and an empty production database simply shows its
   own (empty) truth.

   Deterministic: one fixed seed, so two runs of `npm run db:seed` produce the
   same history and the charts are stable across sessions.
   ══════════════════════════════════════════════════════════════════════════ */

const SEED = 20_260_915;
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
const rand = rng(SEED);
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;
const DAY = 86_400_000;
const HOUR = 3_600_000;

const FIRST = ["Ines", "Rania", "Amel", "Yasmine", "Salma", "Mehdi", "Khaled", "Rim", "Nour", "Leila", "Sami", "Anis", "Walid", "Hela", "Syrine", "Mariem", "Bilel", "Olfa", "Hatem", "Sonia", "Karim", "Dorra", "Nadia", "Fathi", "Amira", "Chaima", "Slim", "Ghada", "Ilyes", "Sarra", "Rachid", "Maha", "Tarek", "Ahlem", "Zied", "Emna", "Hedi", "Lina", "Moez", "Sabrine", "Nizar", "Faten", "Yassine", "Aida", "Bassem", "Imen", "Chokri", "Latifa", "Ramzi", "Khaoula", "Aymen", "Sana"];
const LAST = ["Ben Salah", "Trabelsi", "Mansour", "Jaziri", "Khelifi", "Bouaziz", "Gharbi", "Sassi", "Chaabane", "Ayari", "Mejri", "Hamdi", "Ferchichi", "Zaidi", "Belhaj", "Kacem", "Nasri", "Ouali", "Rekik", "Sellami", "Dridi", "Karoui", "Ben Amor", "Boukadida", "Ltaief"];

const CITIES: [string, string, string][] = [
  ["Ezzahra", "Ben Arous", "2034"], ["Hammam Lif", "Ben Arous", "2050"], ["Radès", "Ben Arous", "2040"],
  ["Tunis Centre", "Tunis", "1000"], ["La Marsa", "Tunis", "2070"], ["Le Bardo", "Tunis", "2000"],
  ["Ariana Ville", "Ariana", "2080"], ["La Soukra", "Ariana", "2036"], ["Raoued", "Ariana", "2083"],
  ["Nabeul", "Nabeul", "8000"], ["Hammamet", "Nabeul", "8050"], ["Kelibia", "Nabeul", "8090"],
  ["Sousse Ville", "Sousse", "4000"], ["Hammam Sousse", "Sousse", "4011"], ["Msaken", "Sousse", "4070"],
  ["Sfax Ville", "Sfax", "3000"], ["Sakiet Ezzit", "Sfax", "3021"], ["Monastir", "Monastir", "5000"],
  ["Bizerte", "Bizerte", "7000"], ["Menzel Bourguiba", "Bizerte", "7050"], ["Djerba Houmt Souk", "Médenine", "4180"],
  ["Gabès", "Gabès", "6000"], ["Kairouan", "Kairouan", "3100"], ["Béja", "Béja", "9000"],
  ["Gafsa", "Gafsa", "2100"], ["Mahdia", "Mahdia", "5100"], ["Zaghouan", "Zaghouan", "1100"],
];

const STREETS = ["rue des Jasmins", "avenue Habib Bourguiba", "rue de la Liberté", "avenue de l'Indépendance", "rue Ibn Khaldoun", "rue Farhat Hached", "avenue Mongi Slim", "rue du Lac", "rue de Rome", "avenue Farhat Hached", "rue Ali Belhouane", "rue Taïeb Mhiri"];

const SEARCH_TERMS = [
  ["sensibio", 62], ["spf 50", 58], ["hyalu", 41], ["crème hydratante", 39], ["anticheveux", 12],
  ["vitamine d", 27], ["gel moussant", 34], ["peau sèche", 22], ["cicaplast", 31], ["solaire bébé", 19],
  ["sérum vitamine c", 26], ["shampoing antipelliculaire", 24], ["magnésium", 18], ["démaquillant", 29],
  ["effaclar", 33], ["anthelios", 37], ["huile prodigieuse", 21], ["masque cheveux", 16],
  ["crème solaire visage", 30], ["contour des yeux", 14], ["crème anti-âge", 20], ["baume lèvres", 9],
  ["déodorant sans sels", 11], ["probiotique", 13], ["pipi au lit", 2], ["waterproof", 8],
  ["taches brunes", 17], ["rougeurs visage", 15], ["siero", 6], ["aknenormin", 3],
  ["baby shampoo", 7], ["crème pour les mains", 12], ["après-rasage", 5], ["pharmacie ouverte dimanche", 4],
] as const;

type ProductRow = {
  id: number; name: string; sku: string; priceMillimes: number; brandId: number | null; brandName: string | null;
  universeId: number | null; categoryId: number | null; image: string | null; stock: number; lowStockThreshold: number;
  compareAt: number | null;
};

export type HistoryReport = { orders: number; revenue: number; customers: number; reviews: number; events: number };

export async function seedHistory(): Promise<HistoryReport> {
  const now = Date.now();
  const days = 210;

  /* ── 1 · Existing ground ─────────────────────────────────────────────── */
  const productRows = await db
    .select({
      id: products.id, name: products.name, sku: products.sku, priceMillimes: products.priceMillimes,
      brandId: products.brandId, brandName: brands.name, universeId: products.universeId, categoryId: products.categoryId,
      image: products.image, stock: products.stock, lowStockThreshold: products.lowStockThreshold, compareAt: products.compareAtMillimes,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId));
  if (!productRows.length) return { orders: 0, revenue: 0, customers: 0, reviews: 0, events: 0 };
  const solarPool = productRows.filter((p) => /spf|solaire|soleil|anthelios|photoderm|sun|mela/i.test(p.name));

  const [[admin], [support]] = await Promise.all([
    db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1),
    db.select({ id: users.id }).from(users).where(eq(users.role, "support")).limit(1),
  ]);
  const baseCustomers = await db.select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, createdAt: users.createdAt }).from(users).where(eq(users.role, "customer"));
  const promoRows = await db.select().from(promotions);

  /* ── 2 · Customers — the house only ever had two ─────────────────────── */
  const newCustomers: { email: string; passwordHash: string; firstName: string; lastName: string; phone: string; role: "customer"; loyaltyPoints: number; locale: string; birthDate: Date | null; emailOptIn: boolean; notes: string | null; createdAt: Date }[] = [];
  const usedEmails = new Set(baseCustomers.map((c) => c.email));
  const customerCount = 52;
  for (let i = 0; i < customerCount; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    let email = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z.]/g, "") + "@example.tn";
    let n = 2;
    while (usedEmails.has(email)) email = email.replace(/@/, `${n++}@`);
    usedEmails.add(email);
    const created = new Date(now - int(20, days + 120) * DAY);
    newCustomers.push({
      email,
      passwordHash: "scrypt$seed$not-a-login-account",
      firstName: first,
      lastName: last,
      phone: `2${int(1, 9)}${String(int(100000, 999999))}`,
      role: "customer",
      loyaltyPoints: 0,
      locale: chance(0.22) ? "tn" : "fr",
      birthDate: chance(0.55) ? new Date(Date.UTC(1975 + int(0, 30), int(0, 11), int(1, 28))) : null,
      emailOptIn: chance(0.78),
      notes: chance(0.12) ? pick(["Cliente fidèle depuis 2023 — conseils dermo.", "Peau réactive : ne jamais proposer de parfum.", "Préfère être appelée après 18 h.", "Allergie connue aux huiles essentielles.", "Habituée des cures solaires familiales."]) : null,
      createdAt: created,
      // Legacy accounts are treated as verified (same as the 0004 backfill).
      emailVerifiedAt: created,
    });
  }
  const createdCustomers = await db.insert(users).values(newCustomers).returning({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, createdAt: users.createdAt });

  const customers = [
    ...baseCustomers.map((c) => ({ id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName, createdAt: c.createdAt })),
    ...createdCustomers,
  ];

  // One mailing address each (some two), written the way the account screen writes them.
  // A customer who already registered an address keeps it: "one default per
  // account" is a database constraint, not a convention.
  const alreadyHoused = new Set((await db.select({ userId: addresses.userId }).from(addresses)).map((a) => a.userId));
  const addressValues: (typeof addresses.$inferInsert)[] = [];
  for (const c of customers) {
    const [city, gov, postal] = pick(CITIES);
    if (!alreadyHoused.has(c.id)) {
      addressValues.push({
        userId: c.id, label: "Domicile", fullName: `${c.firstName} ${c.lastName}`, phone: `2${int(1, 9)}${int(100000, 999999)}`,
        line1: `${int(1, 120)} ${pick(STREETS)}`, city, governorate: gov, postalCode: postal, isDefault: true,
      });
    }
    if (chance(0.18)) {
      const [c2, g2, p2] = pick(CITIES);
      addressValues.push({ userId: c.id, label: "Bureau", fullName: `${c.firstName} ${c.lastName}`, phone: `2${int(1, 9)}${int(100000, 999999)}`, line1: `${int(1, 80)} ${pick(STREETS)}`, city: c2, governorate: g2, postalCode: p2, isDefault: false });
    }
  }
  await db.insert(addresses).values(addressValues);

  /* ── 3 · Orders — the demand curve ───────────────────────────────────── */
  const orderValues: (typeof orders.$inferInsert)[] = [];
  const plan: { product: ProductRow; qty: number }[][] = [];
  const statusPlan: string[] = [];
  const datePlan: Date[] = [];
  const customerPlan: typeof customers = [];
  const promoPlan: (string | null)[] = [];
  let orderSeq = 0;

  const weekday = [1.08, 1.0, 0.94, 1.0, 1.14, 1.2, 1.06]; // Sun → Sat

  for (let d = days; d >= 0; d--) {
    const date = new Date(now - d * DAY);
    const growth = 0.72 + 0.62 * (1 - d / days);
    const wf = weekday[date.getDay()];
    const waves = 1 + 0.18 * Math.sin((days - d) / 11);
    const seasonal = 1 + 0.35 * Math.max(0, 1 - d / 70); // sunscreen season on the tail
    const expected = 1.05 * growth * wf * waves * seasonal;
    let count = Math.floor(expected);
    if (rand() < expected - count) count += 1;
    if (chance(0.06)) count += int(1, 3); // a campaign lands
    if (chance(0.04)) count = Math.max(0, count - int(1, 2)); // a quiet day

    for (let k = 0; k < count; k++) {
      // A customer who already exists, or one who registers that day.
      const known = customers.filter((c) => c.createdAt.getTime() <= date.getTime());
      const c = known.length && chance(0.9) ? pick(known) : known.length ? pick(known) : customers[0];
      const lines: { product: ProductRow; qty: number }[] = [];
      const lineCount = chance(0.34) ? 1 : chance(0.55) ? 2 : chance(0.8) ? 3 : 4;
      while (lines.length < lineCount) {
        const wantsSolar = chance(0.3 * seasonal);
        const pool = wantsSolar ? solarPool : productRows;
        const p = pick(pool.length ? pool : productRows);
        if (lines.some((l) => l.product.id === p.id)) continue;
        lines.push({ product: p, qty: chance(0.16) ? 2 : 1 });
      }
      const subtotal = lines.reduce((a, l) => a + l.product.priceMillimes * l.qty, 0);
      const promo = promoRows.find((p) => p.isActive && subtotal >= p.minSubtotalMillimes && chance(0.22));
      const ageDays = Math.round((now - date.getTime()) / DAY);
      let status: string;
      if (ageDays <= 0) status = chance(0.55) ? "pending" : chance(0.7) ? "confirmed" : "preparing";
      else if (ageDays <= 2) status = chance(0.3) ? "preparing" : chance(0.7) ? "shipped" : "confirmed";
      else if (ageDays <= 6) status = chance(0.45) ? "delivered" : chance(0.75) ? "shipped" : "preparing";
      else if (chance(0.035)) status = "returned";
      else if (chance(0.05)) status = "cancelled";
      else status = "delivered";

      const shippingMethod = chance(0.14) ? "express" : chance(0.2) ? "pickup" : "standard";
      const shipping = shippingMethod === "pickup" ? 0 : shippingMethod === "express" ? 12_000 : subtotal >= 99_000 ? 0 : 7_000;
      const paymentMethod = chance(0.74) ? "cod" : chance(0.6) ? "bank_transfer" : chance(0.6) ? "card" : "gift_card";
      const paid = status === "delivered" || (paymentMethod !== "cod" && ["confirmed", "preparing", "shipped"].includes(status));
      const paymentStatus = status === "returned" ? (chance(0.6) ? "refunded" : "paid") : paid ? "paid" : status === "cancelled" ? (chance(0.3) ? "failed" : "pending") : chance(0.06) ? "failed" : "pending";
      const giftWrap = chance(0.09);
      const [city, gov, postal] = pick(CITIES);
      const at = new Date(date.getTime() - int(0, 9) * HOUR - int(0, 59) * 60_000);
      const ymd = `${String(at.getFullYear()).slice(2)}${String(at.getMonth() + 1).padStart(2, "0")}${String(at.getDate()).padStart(2, "0")}`;
      const number = `CL-${ymd}-${(orderSeq++).toString(36).toUpperCase().padStart(4, "0")}`;

      orderValues.push({
        number,
        userId: c.id,
        email: c.email,
        phone: addressValues.find((a) => a.userId === c.id)?.phone ?? "22000000",
        status: status as never,
        paymentMethod: paymentMethod as never,
        paymentStatus: paymentStatus as never,
        shippingMethod: shippingMethod as never,
        shippingAddress: {
          fullName: `${c.firstName} ${c.lastName}`,
          phone: addressValues.find((a) => a.userId === c.id)?.phone ?? "22000000",
          line1: `${int(1, 120)} ${pick(STREETS)}`,
          city, governorate: gov, postalCode: postal,
        },
        subtotalMillimes: subtotal,
        discountMillimes: promo ? (promo.type === "percent" ? Math.min(Math.round((subtotal * promo.value) / 100), promo.maxDiscountMillimes ?? Number.MAX_SAFE_INTEGER) : promo.type === "fixed" ? Math.min(promo.value, subtotal) : 0) : 0,
        shippingMillimes: shipping,
        giftWrapMillimes: giftWrap ? 5_000 : 0,
        totalMillimes: 0,
        promoCode: promo?.code ?? null,
        giftWrap,
        giftMessage: giftWrap && chance(0.6) ? pick(["Avec toute mon affection.", "Joyeux anniversaire ma sœur !", "Pour toi, prends soin de toi.", "Félicitations pour le bébé !"]) : null,
        customerNote: chance(0.14) ? pick(["Appeler avant la livraison svp.", "Livrer le matin de préférence.", "Sonner à l'interphone 3.", "Merci d'emballer soigneusement.", "Ne pas laisser devant la porte."]) : null,
        internalNote: chance(0.1) ? pick(["Cliente réactive — vérifier tolérance.", "RAS, colis standard.", "À recontrôler au retour de congés."]) : null,
        trackingCode: ["shipped", "delivered", "returned"].includes(status) ? `TN-${int(1000, 9999)}-${int(1000, 9999)}` : null,
        loyaltyEarned: status === "delivered" ? Math.floor(subtotal / 1000) * 10 : 0,
        loyaltySpent: chance(0.05) && c.createdAt.getTime() < at.getTime() - 120 * DAY ? 1000 : 0,
        createdAt: at,
        updatedAt: new Date(at.getTime() + int(4, 90) * HOUR),
      });
      plan.push(lines);
      statusPlan.push(status);
      datePlan.push(at);
      customerPlan.push(c);
      promoPlan.push(promo?.code ?? null);
    }
  }

  const insertedOrders = await db.insert(orders).values(orderValues).returning({ id: orders.id, number: orders.number, createdAt: orders.createdAt, subtotalMillimes: orders.subtotalMillimes, discountMillimes: orders.discountMillimes, shippingMillimes: orders.shippingMillimes, giftWrapMillimes: orders.giftWrapMillimes, paymentMethod: orders.paymentMethod, status: orders.status, paymentStatus: orders.paymentStatus, userId: orders.userId, loyaltyEarned: orders.loyaltyEarned });
  // Totals must be internally consistent: subtotal − discount + shipping + wrap.
  await db.execute(sql`
    UPDATE orders SET total_millimes =
      subtotal_millimes - discount_millimes + shipping_millimes + gift_wrap_millimes`);

  /* ── 4 · Lines, events, movements, loyalty ───────────────────────────── */
  const itemValues: (typeof orderItems.$inferInsert)[] = [];
  const eventValues: (typeof orderEvents.$inferInsert)[] = [];
  const movementValues: (typeof inventoryMovements.$inferInsert)[] = [];
  const loyaltyValues: (typeof loyaltyTransactions.$inferInsert)[] = [];
  const reviewValues: (typeof reviews.$inferInsert)[] = [];
  const saleByProduct = new Map<number, number>();
  const FLOW = ["pending", "confirmed", "preparing", "shipped", "delivered"] as const;
  const MSG: Record<string, string> = {
    pending: "Commande reçue — en attente de confirmation téléphonique.",
    confirmed: "Commande confirmée par l'équipe du comptoir.",
    preparing: "Préparation et contrôle des références en cours.",
    shipped: "Colis remis au transporteur.",
    delivered: "Colis livré et signé par la cliente.",
    cancelled: "Commande annulée — cliente injoignable.",
    returned: "Retour reçu et remboursé.",
  };
  const REVIEW_BODIES: [string, string, number][] = [
    ["Texture parfaite", "Pénètre immédiatement, aucun film gras. Ma peau est souple dès la deuxième semaine.", 5],
    ["Fidèle au comptoir", "Je l'achète depuis un an. Le conseil de la pharmacienne est toujours juste.", 5],
    ["Efficace et doux", "Convient à ma peau réactive, ce qui est rare. Livraison rapide à Ezzahra.", 4],
    ["Très bon rapport qualité-prix", "Le flacon dure longtemps, la texture est agréable à appliquer.", 4],
    ["Bien mais parfumé", "Efficace, mais le parfum reste présent dix minutes.", 3],
    ["Indispensable en été", "Je remets toutes les deux heures sans effet collant. Parfait sur peau mate.", 5],
    ["Résultat visible", "Les rougeurs ont beaucoup diminué en trois semaines d'usage matin et soir.", 5],
    ["Colis impeccable", "Emballage soigné, date de péremption longue, échantillons offerts.", 5],
    ["Un peu cher", "La qualité est là, mais le prix reste élevé hors promotion.", 3],
    ["Recommandé par ma dermato", "Aucune réaction, la peau est apaisée. Je rachète.", 5],
  ];
  const staffActors = [admin?.id ?? 1, support?.id ?? 1];

  insertedOrders.forEach((o, i) => {
    const lines = plan[i];
    const at = o.createdAt.getTime();
    for (const l of lines) {
      itemValues.push({
        orderId: o.id, productId: l.product.id, name: l.product.name, sku: l.product.sku,
        brandName: l.product.brandName, image: l.product.image,
        unitPriceMillimes: l.product.priceMillimes, quantity: l.qty, lineTotalMillimes: l.product.priceMillimes * l.qty,
      });
      saleByProduct.set(l.product.id, (saleByProduct.get(l.product.id) ?? 0) + l.qty);
    }

    const status = statusPlan[i];
    const flowIdx = FLOW.indexOf(status as (typeof FLOW)[number]);
    const trail: string[] = flowIdx >= 0 ? FLOW.slice(0, flowIdx + 1) as unknown as string[] : ["pending", "confirmed", status];
    trail.forEach((s, idx) => {
      eventValues.push({
        orderId: o.id, status: s as never, message: MSG[s], actorId: idx === 0 ? null : pick(staffActors),
        createdAt: new Date(at + idx * int(4, 30) * HOUR),
      });
    });
    if (status === "returned") {
      movementValues.push(...lines.map((l) => ({ productId: l.product.id, type: "return" as never, quantity: l.qty, stockAfter: l.product.stock, reason: `Retour commande ${o.number}`, orderId: o.id, userId: pick(staffActors), createdAt: new Date(at + 9 * DAY) })));
    }
    if (status === "delivered") {
      movementValues.push(...lines.map((l) => ({ productId: l.product.id, type: "sale" as never, quantity: -l.qty, stockAfter: 0, reason: `Vente commande ${o.number}`, orderId: o.id, userId: null, createdAt: o.createdAt })));
      const points = o.loyaltyEarned ?? 0;
      if (points > 0) loyaltyValues.push({ userId: o.userId ?? customers[0].id, points, reason: `Commande ${o.number} livrée`, kind: "award", orderId: o.id, createdAt: new Date(at + 3 * DAY) });
      // A delivered line invites a review — about one line in five.
      if (chance(0.2)) {
        const l = pick(lines);
        const [title, body, rating] = pick(REVIEW_BODIES);
        const buyer = customerPlan[i];
        reviewValues.push({
          productId: l.product.id, userId: chance(0.75) ? buyer.id : null, authorName: `${buyer.firstName} ${buyer.lastName.charAt(0)}.`,
          rating, title, body, status: chance(0.16) ? "pending" : "approved", isVerified: true,
          createdAt: new Date(at + int(4, 22) * DAY),
        });
      }
    } else if (status === "returned" && chance(0.5)) {
      const l = pick(lines);
      const buyer = customerPlan[i];
      reviewValues.push({ productId: l.product.id, userId: buyer.id, authorName: `${buyer.firstName} ${buyer.lastName.charAt(0)}.`, rating: chance(0.5) ? 3 : 2, title: "Retour effectué", body: "Le produit ne convenait pas à ma peau, le retour a été simple et remboursé.", status: "approved", isVerified: true, createdAt: new Date(at + 12 * DAY) });
    }
  });

  await db.insert(orderItems).values(itemValues);
  for (let i = 0; i < eventValues.length; i += 800) await db.insert(orderEvents).values(eventValues.slice(i, i + 800));
  // `stock_after` is corrected at the end, once the real stock columns are set.
  const movementCount = movementValues.length;
  for (let i = 0; i < movementValues.length; i += 800) await db.insert(inventoryMovements).values(movementValues.slice(i, i + 800));
  for (let i = 0; i < loyaltyValues.length; i += 800) await db.insert(loyaltyTransactions).values(loyaltyValues.slice(i, i + 800));
  for (let i = 0; i < reviewValues.length; i += 500) await db.insert(reviews).values(reviewValues.slice(i, i + 500));

  /*
   * The ledger has to add up. Each product starts the period at the stock the
   * catalogue seed gave it; every sale draws it down, and the house replenishes
   * before it goes short — that is how a pharmacy actually buys. The final
   * `adjust` line closes the period on exactly today's stock, which is the
   * number the shop displays. No movement is ever clamped to zero.
   */
  const restocks: (typeof inventoryMovements.$inferInsert)[] = [];
  const byProduct = new Map<number, (typeof inventoryMovements.$inferInsert)[]>();
  for (const m of movementValues) {
    const list = byProduct.get(m.productId as number) ?? [];
    list.push(m);
    byProduct.set(m.productId as number, list);
  }
  for (const p of productRows) {
    const moves = (byProduct.get(p.id) ?? []).slice().sort((a, b) => (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime());
    let balance = p.stock;
    for (const m of moves) {
      const qty = m.quantity as number;
      if (qty < 0 && balance + qty < 0) {
        const topUp = Math.max(30, -qty + int(0, 20));
        restocks.push({
          productId: p.id, type: "restock" as never, quantity: topUp, stockAfter: 0,
          reason: pick(["Réassort laboratoire", "Livraison grossiste", "Commande fournisseur hebdomadaire", "Réassort saisonnier"]),
          userId: pick(staffActors), createdAt: new Date((m.createdAt as Date).getTime() - 2 * HOUR),
        });
        balance += topUp;
      }
      balance += qty;
    }
    if (balance !== p.stock) {
      restocks.push({
        productId: p.id, type: "adjust" as never, quantity: p.stock - balance, stockAfter: 0,
        reason: "Inventaire — régularisation de période", userId: pick(staffActors), createdAt: new Date(now - int(0, 6) * HOUR),
      });
    }
  }
  for (let i = 0; i < restocks.length; i += 500) await db.insert(inventoryMovements).values(restocks.slice(i, i + 500));
  await db.insert(analyticsEvents).values(
    insertedOrders.map((o) => ({ name: "order.placed", payload: { number: o.number, total: o.subtotalMillimes }, userId: o.userId, createdAt: o.createdAt })),
  );

  /* ── 5 · Loyalty balances & product counters ─────────────────────────── */
  await db.execute(sql`
    UPDATE users SET loyalty_points = GREATEST(0, (SELECT COALESCE(SUM(points), 0) FROM loyalty_transactions lt WHERE lt.user_id = users.id))`);
  await db.execute(sql`
    UPDATE products p SET sales_count = COALESCE(s.sold, 0)
    FROM (SELECT product_id, SUM(quantity)::int AS sold FROM order_items GROUP BY product_id) s
    WHERE s.product_id = p.id`);
  await db.execute(sql`
    UPDATE products p SET rating_avg = COALESCE(r.avg, 0), rating_count = COALESCE(r.n, 0)
    FROM (SELECT product_id, ROUND(AVG(rating) * 100)::int AS avg, COUNT(*)::int AS n FROM reviews WHERE status = 'approved' GROUP BY product_id) r
    WHERE r.product_id = p.id`);
  // Movement ledger: recompute `stock_after` as the running balance per product,
  // ending on today's stock — the same invariant `recordMovement` maintains.
  await db.execute(sql`
    WITH ordered AS (
      SELECT id, SUM(quantity) OVER (PARTITION BY product_id ORDER BY created_at, id) AS running
      FROM inventory_movements
    )
    UPDATE inventory_movements m SET stock_after = (SELECT running FROM ordered WHERE ordered.id = m.id)`);

  /* ── 6 · Wishlist, restock alerts, newsletter ────────────────────────── */
  const wishPool = new Map<number, number>();
  for (const p of productRows) wishPool.set(p.id, Math.max(0, Math.round((saleByProduct.get(p.id) ?? 0) * (chance(0.5) ? 0.15 : 0.55)) + int(0, 3)));
  // A few references are loved far more than they are bought — that gap is the signal.
  for (const p of productRows.filter((x) => /spf|soleil|anthelios|serum|sérum|huile/i.test(x.name)).slice(0, 8)) wishPool.set(p.id, (wishPool.get(p.id) ?? 0) + int(9, 22));
  const wishValues: (typeof wishlistItems.$inferInsert)[] = [];
  for (const [pid, n] of wishPool) {
    const owners = new Set<number>();
    for (let k = 0; k < Math.min(n, 26); k++) {
      const c = pick(customers);
      if (owners.has(c.id)) continue;
      owners.add(c.id);
      wishValues.push({ userId: c.id, productId: pid, note: chance(0.08) ? pick(["Pour mon anniversaire.", "À essayer après le soleil.", "Cadeau pour maman."]) : null, createdAt: new Date(now - int(1, 160) * DAY) });
    }
  }
  for (let i = 0; i < wishValues.length; i += 500) await db.insert(wishlistItems).values(wishValues.slice(i, i + 500));
  await db.insert(analyticsEvents).values(
    wishValues.slice(0, 220).map((w) => ({ name: "wishlist.add", payload: { productId: w.productId }, userId: w.userId, createdAt: w.createdAt ?? new Date() })),
  );

  const alertValues: (typeof restockAlerts.$inferInsert)[] = [];
  const alertSeen = new Set<string>();
  for (const p of productRows.filter((x) => x.stock <= 3).slice(0, 14)) {
    for (let k = 0; k < int(1, 5); k++) {
      const c = pick(customers);
      // One alert per product and e-mail — the schema's unique index says so.
      const key = `${p.id}:${c.email}`;
      if (alertSeen.has(key)) continue;
      alertSeen.add(key);
      alertValues.push({ productId: p.id, userId: c.id, email: c.email, channel: chance(0.25) ? "whatsapp" : "email", locale: "fr", notifiedAt: chance(0.4) ? new Date(now - int(1, 20) * DAY) : null, createdAt: new Date(now - int(2, 90) * DAY) });
    }
  }
  if (alertValues.length) await db.insert(restockAlerts).values(alertValues);

  const seenNews = new Set<string>();
  const news = customers.filter((c) => { if (seenNews.has(c.email)) return false; seenNews.add(c.email); return chance(0.62); }).map((c) => ({ email: c.email, createdAt: new Date(now - int(1, days) * DAY) }));
  if (news.length) await db.insert(newsletterSubscribers).values(news).onConflictDoNothing();

  /* ── 7 · Search telemetry ────────────────────────────────────────────── */
  const searches: (typeof searchEvents.$inferInsert)[] = [];
  const weighted: string[] = [];
  for (const [term, weight] of SEARCH_TERMS) for (let k = 0; k < weight; k++) weighted.push(term);
  const knownWords = new Set(productRows.flatMap((p) => p.name.toLowerCase().split(/[^a-zà-ÿ0-9+]+/)).filter((w) => w.length > 3));
  for (let k = 0; k < 1_450; k++) {
    const query = pick(weighted);
    const known = [...knownWords].some((w) => query.includes(w) || w.includes(query.split(" ")[0]));
    const zero = !known || chance(0.07);
    searches.push({
      query,
      resultsCount: zero ? 0 : int(1, 18),
      outOfStock: !zero && chance(0.12),
      userId: chance(0.55) ? pick(customers).id : null,
      createdAt: new Date(now - int(0, 90) * DAY - int(0, 23) * HOUR),
    });
  }
  for (let i = 0; i < searches.length; i += 600) await db.insert(searchEvents).values(searches.slice(i, i + 600));

  /* ── 8 · Support, returns, outbox, audit ─────────────────────────────── */
  const ticketValues: (typeof supportTickets.$inferInsert)[] = [];
  const ticketTypes = ["order", "delivery", "product_question", "return_request", "damaged_product", "pharmacist_advice", "complaint", "exchange"] as const;
  for (let k = 0; k < 34; k++) {
    const c = pick(customers);
    const type = pick(ticketTypes);
    const order = chance(0.6) ? pick(insertedOrders) : null;
    const created = new Date(now - int(0, 120) * DAY - int(0, 23) * HOUR);
    const status = chance(0.34) ? "open" : chance(0.6) ? "in_progress" : "closed";
    ticketValues.push({
      userId: chance(0.8) ? c.id : null, email: c.email, name: `${c.firstName} ${c.lastName}`, type: type as never,
      priority: chance(0.12) ? "urgent" : chance(0.3) ? "high" : "normal",
      subject: type === "delivery" ? `Suivi de commande ${order?.number ?? ""}`.trim() : type === "product_question" ? "Question sur une référence" : type === "damaged_product" ? "Produit reçu endommagé" : type === "pharmacist_advice" ? "Conseil pour peau réactive" : type === "return_request" ? "Demande de retour" : type === "complaint" ? "Réclamation livraison" : "Échange de format",
      message: pick([
        "Bonjour, ma commande est indiquée livrée mais je n'ai rien reçu. Pouvez-vous vérifier auprès du transporteur ?",
        "Bonjour, ce produit est-il adapté à une peau atopique sous traitement ? Ma pharmacienne habituelle est absente.",
        "Bonjour, le flacon est arrivé fêlé et la moitié du contenu s'est répandue dans le colis.",
        "Bonjour, est-ce que vous aurez à nouveau ce format en stock la semaine prochaine ? Je passe à Ezzahra samedi.",
        "Bonjour, je souhaite échanger ce format contre le 400 ml si la différence est possible.",
        "Bonjour, je n'arrive pas à appliquer mon code promo BIENVENUE10, il est refusé au paiement.",
      ]),
      status: status as never,
      orderNumber: order?.number ?? null,
      readAt: status !== "open" ? new Date(created.getTime() + int(1, 20) * HOUR) : null,
      createdAt: created,
      updatedAt: new Date(created.getTime() + int(2, 60) * HOUR),
    });
  }
  const insertedTickets = await db.insert(supportTickets).values(ticketValues).returning({ id: supportTickets.id, name: supportTickets.name, status: supportTickets.status, createdAt: supportTickets.createdAt, message: supportTickets.message });
  const messageValues: (typeof ticketMessages.$inferInsert)[] = [];
  for (const t of insertedTickets) {
    messageValues.push({ ticketId: t.id, userId: null, authorName: t.name, body: t.message, isBot: false, readAt: new Date(t.createdAt.getTime() + HOUR), createdAt: t.createdAt });
    if (t.status !== "open") {
      messageValues.push({
        ticketId: t.id, userId: null, authorName: "Sami Trabelsi", isBot: false, readAt: null,
        body: pick([
          "Bonjour, nous avons ouvert une enquête auprès du transporteur et revenons vers vous avant ce soir.",
          "Bonjour, cette référence convient à une peau atopique ; nous vous conseillons un test sur l'avant-bras 24 h avant.",
          "Bonjour, nous vous envoyons un remplacement immédiatement, sans retour du produit abîmé.",
          "Bonjour, le réassort est annoncé pour jeudi, nous vous préviendrons dès sa mise en rayon.",
          "Bonjour, l'échange est possible au comptoir d'Ezzahra, présentez simplement le colis d'origine.",
          "Bonjour, votre code est actif jusqu'au 30 du mois — nous venons de le vérifier, il s'applique désormais.",
        ]),
        createdAt: new Date(t.createdAt.getTime() + int(3, 40) * HOUR),
      });
    }
  }
  await db.insert(ticketMessages).values(messageValues);
  await db.insert(analyticsEvents).values(insertedTickets.slice(0, 10).map((t) => ({ name: "ticket.created", payload: { ticketId: t.id }, userId: null, createdAt: t.createdAt })));

  const returnValues: (typeof returnRequests.$inferInsert)[] = [];
  const delivered = insertedOrders.filter((o, i) => statusPlan[i] === "delivered" || statusPlan[i] === "returned");
  for (let k = 0; k < 18 && k < delivered.length; k++) {
    const o = delivered[k * 2] ?? delivered[k];
    const c = customers.find((x) => x.id === o.userId) ?? customers[0];
    const created = new Date(o.createdAt.getTime() + int(2, 25) * DAY);
    returnValues.push({
      number: `RT-${String(created.getFullYear()).slice(2)}${String(created.getMonth() + 1).padStart(2, "0")}-${(k + 1).toString().padStart(3, "0")}`,
      userId: c.id, orderId: o.id, orderItemId: null,
      reason: pick(["Produit non conforme", "Réaction cutanée", "Erreur de format", "Ne correspond pas à mes attentes", "Flacon endommagé"]),
      message: pick(["Le produit me provoque des rougeurs, je préfère l'échanger.", "J'ai reçu le format 40 ml au lieu du 100 ml.", "Le flacon est arrivé sans bouchon.", "La texture ne me convient pas finalement."]),
      status: (chance(0.22) ? "pending" : chance(0.5) ? "in_review" : chance(0.7) ? "approved" : "completed") as never,
      staffNote: chance(0.5) ? pick(["Retour accepté — remboursement virement.", "En attente du colis retour.", "Réponse envoyée, cliente rappelée."]) : null,
      resolvedAt: chance(0.5) ? new Date(created.getTime() + int(3, 15) * DAY) : null,
      resolvedBy: chance(0.5) ? pick(staffActors) : null,
      createdAt: created,
      updatedAt: new Date(created.getTime() + int(1, 10) * DAY),
    });
  }
  if (returnValues.length) {
    await db.insert(returnRequests).values(returnValues);
    await db.insert(analyticsEvents).values(returnValues.slice(0, 8).map((r) => ({ name: "return.create", payload: { number: r.number }, userId: r.userId, createdAt: r.createdAt as Date })));
  }

  const outboxValues: (typeof emailOutbox.$inferInsert)[] = [];
  const kinds = [
    ["order_confirmation", "Votre commande CL-%s est confirmée"],
    ["order_shipped", "Votre colis CL-%s est en route"],
    ["order_delivered", "Votre commande CL-%s est livrée"],
    ["order_refunded", "Remboursement de la commande CL-%s"],
    ["care_day_3", "Trois jours plus tard — comment se comporte votre peau ?"],
    ["care_day_21", "Trois semaines de routine : le point"],
    ["ritual_reminder", "Votre rituel du matin vous attend"],
    ["restock_available", "De nouveau disponible en rayon"],
    ["subscription_due", "Votre prochaine recharge préparée"],
    ["birthday_ceremony", "Un cadeau pour votre anniversaire"],
  ] as const;
  insertedOrders.forEach((o, i) => {
    if (statusPlan[i] === "pending") return;
    const c = customers.find((x) => x.id === o.userId) ?? customers[0];
    const kind = statusPlan[i] === "delivered" ? (chance(0.4) ? "order_delivered" : "order_confirmation") : statusPlan[i] === "shipped" ? "order_shipped" : statusPlan[i] === "returned" ? "order_refunded" : "order_confirmation";
    const [k, subject] = kinds.find((x) => x[0] === kind)!;
    const sentAt = new Date(o.createdAt.getTime() + int(1, 20) * HOUR);
    const failed = chance(0.035);
    outboxValues.push({
      kind: k, to: c.email, userId: c.id, locale: "fr", subject: subject.replace("%s", o.number),
      payload: { orderNumber: o.number }, sendAt: sentAt, sentAt: failed ? null : sentAt,
      status: failed ? "failed" : "sent", attempts: failed ? int(1, 3) : 1,
      error: failed ? pick(["550 mailbox unavailable", "421 temporary failure — rate limited", "Connection reset by peer"]) : null,
      createdAt: o.createdAt,
    });
  });
  for (const c of customers.slice(0, 30)) {
    if (chance(0.5)) outboxValues.push({ kind: "ritual_reminder", to: c.email, userId: c.id, locale: "fr", subject: "Votre rituel du matin vous attend", payload: {}, sendAt: new Date(now + int(1, 40) * HOUR), sentAt: null, status: "pending", attempts: 0, createdAt: new Date(now - int(0, 3) * DAY) });
    if (chance(0.25)) outboxValues.push({ kind: "care_day_3", to: c.email, userId: c.id, locale: "fr", subject: "Trois jours plus tard — comment se comporte votre peau ?", payload: {}, sendAt: new Date(now - int(1, 30) * DAY), sentAt: new Date(now - int(1, 30) * DAY), status: "sent", attempts: 1, createdAt: new Date(now - int(1, 31) * DAY) });
  }
  for (let i = 0; i < outboxValues.length; i += 500) await db.insert(emailOutbox).values(outboxValues.slice(i, i + 500)).onConflictDoNothing();

  const auditValues: (typeof auditLogs.$inferInsert)[] = [];
  const AUDIT = [
    ["order.status", "order"], ["product.update", "product"], ["promotion.create", "promotion"], ["stock.adjust", "product"],
    ["review.moderate", "review"], ["ticket.reply", "ticket"], ["return.status", "return"], ["customer.note", "user"],
    ["article.update", "article"], ["shelf.update", "shelf"], ["payment.status", "order"], ["auth.login", "user"],
  ] as const;
  for (let k = 0; k < 240; k++) {
    const [action, entity] = pick(AUDIT);
    auditValues.push({
      actorId: pick(staffActors), action, entity, entityId: String(int(1, 400)),
      details: action === "order.status" ? { to: pick(["confirmed", "preparing", "shipped", "delivered"]) } : action === "stock.adjust" ? { delta: pick([-3, -2, 8, 12, 24]) } : action === "payment.status" ? { to: pick(["paid", "refunded"]) } : {},
      createdAt: new Date(now - int(0, 120) * DAY - int(0, 23) * HOUR),
    });
  }
  for (let i = 0; i < auditValues.length; i += 200) await db.insert(auditLogs).values(auditValues.slice(i, i + 200));

  /* ── 9 · Subscriptions ───────────────────────────────────────────────── */
  const subValues: (typeof subscriptions.$inferInsert)[] = [];
  for (let k = 0; k < 16; k++) {
    const c = pick(customers);
    const created = new Date(now - int(20, 300) * DAY);
    subValues.push({
      userId: c.id, status: chance(0.72) ? "active" : chance(0.5) ? "paused" : "cancelled",
      frequencyDays: pick([30, 30, 45, 60]), nextDueAt: new Date(now + int(-6, 24) * DAY), createdAt: created, updatedAt: created,
    });
  }
  const insertedSubs = await db.insert(subscriptions).values(subValues).returning({ id: subscriptions.id, userId: subscriptions.userId, createdAt: subscriptions.createdAt, status: subscriptions.status });
  const subItems: (typeof subscriptionItems.$inferInsert)[] = [];
  const subEvents: (typeof subscriptionEvents.$inferInsert)[] = [];
  for (const s of insertedSubs) {
    const lines = int(1, 3);
    const chosen = new Set<number>();
    for (let k = 0; k < lines; k++) {
      const p = pick(productRows);
      if (chosen.has(p.id)) continue;
      chosen.add(p.id);
      subItems.push({ subscriptionId: s.id, productId: p.id, quantity: chance(0.2) ? 2 : 1 });
    }
    subEvents.push({ subscriptionId: s.id, type: "created", detail: "Abonnement souscrit en boutique", createdAt: s.createdAt });
    if (chance(0.5)) subEvents.push({ subscriptionId: s.id, type: "ordered", detail: "Recharge expédiée", createdAt: new Date(now - int(5, 90) * DAY) });
    if (s.status === "paused") subEvents.push({ subscriptionId: s.id, type: "paused", detail: "Mise en pause à la demande de la cliente", createdAt: new Date(now - int(2, 40) * DAY) });
    if (s.status === "cancelled") subEvents.push({ subscriptionId: s.id, type: "cancelled", detail: "Résiliation", createdAt: new Date(now - int(2, 40) * DAY) });
  }
  await db.insert(subscriptionItems).values(subItems);
  await db.insert(subscriptionEvents).values(subEvents);

  /* ── 10 · The operating layer: tasks, automations, their runs ────────── */
  const taskValues: (typeof adminTasks.$inferInsert)[] = [];
  const oos = productRows.filter((p) => p.stock === 0).slice(0, 6);
  for (const p of oos) taskValues.push({ title: `Réassort urgent — ${p.name}`, detail: "Référence épuisée, des demandes « prévenez-moi » sont en attente.", priority: "critical", status: chance(0.3) ? "in_progress" : "open", source: "alert", entity: "product", entityId: String(p.id), href: `/admin/produits/${p.id}`, assigneeId: pick(staffActors), dueAt: new Date(now + int(0, 2) * DAY) });
  for (const o of insertedOrders.filter((x, i) => statusPlan[i] === "pending").slice(0, 7)) {
    taskValues.push({ title: `Confirmer la commande ${o.number}`, detail: "Contrôle téléphonique avant préparation.", priority: "high", status: chance(0.25) ? "done" : "open", source: "alert", entity: "order", entityId: String(o.id), href: `/admin/commandes/${o.id}`, assigneeId: pick(staffActors), dueAt: new Date(now + DAY), closedAt: null });
  }
  for (const p of productRows.slice(0, 4)) taskValues.push({ title: `Fiche produit à compléter — ${p.name}`, detail: "Textures et conseils d'usage manquants pour la page publique.", priority: "normal", status: "open", source: "hand", entity: "product", entityId: String(p.id), href: `/admin/produits/${p.id}`, assigneeId: pick(staffActors), dueAt: new Date(now + int(3, 12) * DAY) });
  taskValues.push({ title: "Valider la vitrine « Retour du soleil »", detail: "Sélection de 8 références avant mise en avant page d'accueil.", priority: "high", status: "open", source: "hand", entity: "shelf", entityId: "1", href: "/admin/mise-en-scene", assigneeId: pick(staffActors), dueAt: new Date(now + 2 * DAY) });
  taskValues.push({ title: "Vérifier les 41 avis publiés non vérifiés", detail: "Un achat en boutique mérite la marque « vérifié ».", priority: "low", status: "open", source: "system", entity: "review", entityId: null, href: "/admin/avis", assigneeId: pick(staffActors) });
  taskValues.push({ title: "Appeler les clientes en rupture d'abonnement", detail: "5 abonnements en pause depuis plus de 30 jours.", priority: "normal", status: "open", source: "automation", entity: "subscription", entityId: null, href: "/admin/clients", assigneeId: pick(staffActors), dueAt: new Date(now + 5 * DAY) });
  await db.insert(adminTasks).values(taskValues);

  const automationValues: (typeof automations.$inferInsert)[] = [
    {
      name: "Rupture critique → réassort", description: "Quand une référence passe à zéro, on ouvre une tâche de réassort prioritaire.",
      trigger: "stock_out", conditions: [{ field: "status", op: "eq", value: "active" }],
      actions: [{ type: "create_task", value: "Réassort à lancer" }, { type: "alert", value: "inventory" }],
      isActive: true, runCount: 12, lastRunAt: new Date(now - 6 * HOUR), createdById: admin?.id ?? null,
    },
    {
      name: "Stock bas → avertissement", description: "Sous le seuil de la fiche produit, l'inventaire signale la référence.",
      trigger: "stock_low", conditions: [{ field: "stock", op: "lte", value: "5" }],
      actions: [{ type: "alert", value: "inventory" }],
      isActive: true, runCount: 31, lastRunAt: new Date(now - 2 * HOUR), createdById: admin?.id ?? null,
    },
    {
      name: "Commande en attente > 12 h", description: "Une commande non confirmée le jour même est appelée.",
      trigger: "order_pending_aged", conditions: [{ field: "hours", op: "gte", value: "12" }],
      actions: [{ type: "create_task", value: "Appeler la cliente" }, { type: "notify", value: "orders" }],
      isActive: true, runCount: 8, lastRunAt: new Date(now - 26 * HOUR), createdById: support?.id ?? null,
    },
    {
      name: "Avis en attente → modération", description: "Trois avis en attente déclenchent une session de modération.",
      trigger: "reviews_pending", conditions: [{ field: "count", op: "gte", value: "3" }],
      actions: [{ type: "create_task", value: "Modérer les avis" }],
      isActive: true, runCount: 5, lastRunAt: new Date(now - 3 * DAY), createdById: support?.id ?? null,
    },
    {
      name: "Paiement échoué → relance", description: "Un paiement en échec ouvre une relance commerciale.",
      trigger: "payment_failed", conditions: [{ field: "amount", op: "gte", value: "0" }],
      actions: [{ type: "create_task", value: "Relancer le règlement" }, { type: "email", value: "order_reminder" }],
      isActive: false, runCount: 2, lastRunAt: new Date(now - 18 * DAY), createdById: admin?.id ?? null,
    },
    {
      name: "Liste d'envie forte → campagne", description: "Une référence très désirée et peu vendue mérite une mise en avant.",
      trigger: "wishlist_gap", conditions: [{ field: "gap", op: "gte", value: "8" }],
      actions: [{ type: "create_task", value: "Préparer une mise en avant" }, { type: "alert", value: "opportunity" }],
      isActive: true, runCount: 3, lastRunAt: new Date(now - 4 * DAY), createdById: admin?.id ?? null,
    },
  ];
  const createdAutomations = await db.insert(automations).values(automationValues).returning({ id: automations.id, name: automations.name, trigger: automations.trigger });
  const runValues: (typeof automationRuns.$inferInsert)[] = [];
  for (const a of createdAutomations) {
    for (let k = 0; k < int(3, 9); k++) {
      const matched = int(1, 9);
      runValues.push({
        automationId: a.id, mode: chance(0.2) ? "test" : chance(0.6) ? "schedule" : "manual",
        matched, affected: Math.max(0, matched - int(0, 2)), status: chance(0.06) ? "error" : "ok",
        detail: chance(0.06) ? "La base n'a pas répondu pendant l'exécution — relance automatique au prochain cycle." : `${matched} élément(s) examiné(s).`,
        createdAt: new Date(now - int(0, 30) * DAY - int(0, 23) * HOUR),
      });
    }
  }
  await db.insert(automationRuns).values(runValues);

  return {
    orders: insertedOrders.length,
    revenue: orderValues.reduce((a, o) => a + (o.subtotalMillimes ?? 0), 0),
    customers: createdCustomers.length,
    reviews: reviewValues.length,
    events: eventValues.length + movementCount,
  };
}
