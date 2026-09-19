import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "support", "admin"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["cod", "bank_transfer", "card", "gift_card"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded", "failed"]);
export const shippingMethodEnum = pgEnum("shipping_method", ["standard", "express", "pickup"]);
export const promoTypeEnum = pgEnum("promo_type", ["percent", "fixed", "free_shipping"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const movementTypeEnum = pgEnum("movement_type", ["in", "out", "adjust", "sale", "restock", "return"]);
/**
 * A lot is the real unit of stock in an officine — not the product row. A
 * product has a stock; a lot has a number, a date, and a place.
 * `sale` is the only status FEFO will pick from; `quarantine` is what a lot
 * becomes the day it expires (or the day nobody can vouch for its date).
 */
export const lotStatusEnum = pgEnum("lot_status", ["sale", "quarantine", "destroyed", "returned"]);
/** What happened to a lot. Stock that moves without an event is stock nobody can explain. */
export const lotEventTypeEnum = pgEnum("lot_event_type", ["received", "sold", "returned", "moved", "quarantined", "destroyed", "adjusted", "dated"]);
// 'answered' is legacy (migrated to 'in_progress' in 0003) — kept so old rows stay readable.
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "answered", "in_progress", "resolved", "closed"]);
export const ticketTypeEnum = pgEnum("ticket_type", [
  "product_question",
  "return_request",
  "exchange",
  "order",
  "delivery",
  "damaged_product",
  "complaint",
  "pharmacist_advice",
  "other",
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "normal", "high", "urgent"]);
export const returnStatusEnum = pgEnum("return_status", [
  "pending",
  "in_review",
  "awaiting_customer",
  "approved",
  "rejected",
  "completed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

// Users & auth
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").default("customer").notNull(),
    loyaltyPoints: integer("loyalty_points").default(0).notNull(),
    notes: text("notes"),
    /** UI language of the house: "fr", "tn" (darija, latin script) or "tn-arab". */
    locale: varchar("locale", { length: 10 }).default("fr").notNull(),
    /** Birth date — the VIP birthday ceremony reads it. */
    birthDate: timestamp("birth_date", { withTimezone: true }),
    /** Customer opted in to care / advice e-mails (transactional always pass). */
    emailOptIn: boolean("email_opt_in").default(true).notNull(),
    /**
     * When the owner proved this address their own (6-digit code). NULL on
     * freshly registered accounts — the door stays ajar until then.
     */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_role_idx").on(t.role)],
);

/**
 * One-use password-reset tokens. Only the SHA-256 hash of the URL token is
 * stored: a database leak can never be replayed as a valid reset link.
 */
export const passwordResets = pgTable(
  "password_resets",
  {
    tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("password_resets_user_idx").on(t.userId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    label: varchar("label", { length: 60 }).default("Domicile").notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    line1: varchar("line1", { length: 200 }).notNull(),
    line2: varchar("line2", { length: 200 }),
    city: varchar("city", { length: 100 }).notNull(),
    governorate: varchar("governorate", { length: 60 }).notNull(),
    postalCode: varchar("postal_code", { length: 10 }),
    isDefault: boolean("is_default").default(false).notNull(),
    ...timestamps,
  },
  (t) => [
    index("addresses_user_idx").on(t.userId),
    /*
     * Enforce "one default address per customer" in the database, not just in
     * application code — the clear-then-set sequence cannot leave two defaults
     * even if a writer crashes or bypasses the action.
     */
    uniqueIndex("addresses_one_default_idx").on(t.userId).where(sql`${t.isDefault}`),
  ],
);

// Catalog
export const brands = pgTable(
  "brands",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    country: varchar("country", { length: 60 }),
    story: text("story"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    /** Up to three staff-selected hero SKUs shown at the top of the brand page. */
    heroProductIds: jsonb("hero_product_ids").$type<number[]>().default([]).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("brands_slug_idx").on(t.slug)],
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    story: text("story"),
    image: varchar("image", { length: 255 }),
    isUniverse: boolean("is_universe").default(false).notNull(),
    parentId: integer("parent_id"),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("categories_slug_idx").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
    index("categories_universe_idx").on(t.isUniverse),
  ],
);

export const concerns = pgTable(
  "concerns",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    intro: text("intro"),
    ...timestamps,
  },
  (t) => [uniqueIndex("concerns_slug_idx").on(t.slug)],
);

/** One claim on a fiche: what was written, where it came from, who owns it. */
export type ProductDataClaim = {
  source: string;
  at: string;
  by?: string | null;
  /** `to-confirm` is the honest middle: filled, plausible, unchecked. */
  state: "verified" | "to-confirm" | "none";
};

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    sku: varchar("sku", { length: 40 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    shortDescription: varchar("short_description", { length: 300 }),
    description: text("description"),
    ingredients: text("ingredients"),
    howToUse: text("how_to_use"),
    brandId: integer("brand_id").references(() => brands.id, { onDelete: "set null" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    universeId: integer("universe_id").references(() => categories.id, { onDelete: "set null" }),
    priceMillimes: integer("price_millimes").notNull(),
    compareAtMillimes: integer("compare_at_millimes"),
    stock: integer("stock").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    image: varchar("image", { length: 255 }),
    images: jsonb("images").$type<string[]>().default([]).notNull(),
    /** Optional per-image alt text, parallel to `images` (falls back to the product name). */
    imageAlts: jsonb("image_alts").$type<string[]>().default([]).notNull(),
    volume: varchar("volume", { length: 40 }),
    status: productStatusEnum("status").default("active").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isNew: boolean("is_new").default(false).notNull(),
    /** Merchandising (P01) — a staff pick earns the “Conseillé au comptoir” mark. */
    isCounterPick: boolean("is_counter_pick").default(false).notNull(),
    /**
     * Honest tolerance data: a key is only ever true/false when the formula
     * was actually checked by the officine — absent means “unknown”, and
     * unknown never becomes a filter option nor a claim on the PDP.
     */
    tolerances: jsonb("tolerances").$type<Partial<Record<"sansParfum" | "grossesse" | "peauAtopique" | "yeuxSensibles", boolean>>>(),
    texture: varchar("texture", { length: 80 }),
    forWhom: varchar("for_whom", { length: 160 }),
    /** P02 — pharmacist copy blocks, typed by the office, FR first. */
    audience: text("audience"),
    precautions: text("precautions"),
    useWhen: varchar("use_when", { length: 80 }),
    useAmount: varchar("use_amount", { length: 120 }),
    useOrder: varchar("use_order", { length: 200 }),
    keyActives: jsonb("key_actives").$type<string[]>().default([]).notNull(),
    /** Per-location counts, only where the officine actually tracks them.
     *  This is a cache derived from the lots (see syncStockFromLots): the lots
     *  are the truth, this is what the pages read without a join. */
    locationStock: jsonb("location_stock").$type<{ ezzahra?: number; hammamLif?: number; entrepot?: number }>(),
    /** Below this many units *at that counter*, the shelf is called low. A
     *  single global threshold hides a local rupture — one counter can be out
     *  while the warehouse has forty. Absent key = no local alert. */
    storeThresholds: jsonb("store_thresholds").$type<Record<string, number>>(),
    /** EAN-13. What the counter scans, what the receipt prints. */
    barcode: varchar("barcode", { length: 14 }),
    /** PAO — months after opening. A different clock from the expiry date:
     *  a 30 ml serum expires in 2028 but lasts 6 months once opened. */
    paoMonths: integer("pao_months"),
    /** Youngest age the officine will sell it to, in months. Null = no
     *  restriction stated by the laboratory, which is not the same as "safe". */
    ageMinMonths: integer("age_min_months"),
    /** Where it was made, and who brought it here. Provenance, not decoration. */
    madeIn: varchar("made_in", { length: 80 }),
    distributor: varchar("distributor", { length: 120 }),
    /** Read out of the formula by the shop, never typed by hand. */
    allergens: jsonb("allergens").$type<string[]>().default([]).notNull(),
    /**
     * Provenance, field by field: `{ ingredients: { source, at, by, state } }`.
     * A value with no provenance is a value nobody can vouch for, and the
     * fiche says so out loud rather than pretending it is a laboratory fact.
     */
    dataSources: jsonb("data_sources").$type<Record<string, ProductDataClaim>>(),
    /** The day a human at the counter last checked this fiche against the
     *  notice. Null means untouched — and the fiche shows that. */
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: varchar("verified_by", { length: 120 }),
    /** Credibility window for the Nouveautés rail (14 days). */
    launchedAt: timestamp("launched_at", { withTimezone: true }),
    ratingAvg: integer("rating_avg").default(0).notNull(), // x100 (e.g. 460 = 4.6)
    ratingCount: integer("rating_count").default(0).notNull(),
    salesCount: integer("sales_count").default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    uniqueIndex("products_sku_idx").on(t.sku),
    index("products_brand_idx").on(t.brandId),
    index("products_category_idx").on(t.categoryId),
    index("products_universe_idx").on(t.universeId),
    index("products_status_idx").on(t.status),
    index("products_price_idx").on(t.priceMillimes),
    index("products_featured_idx").on(t.isFeatured),
    index("products_counter_pick_idx").on(t.isCounterPick),
  ],
);

export const productConcerns = pgTable(
  "product_concerns",
  {
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    concernId: integer("concern_id")
      .references(() => concerns.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.concernId] }), index("pc_concern_idx").on(t.concernId)],
);

// ── Merchandising (P01) ────────────────────────────────────────────────────
// A translatable snippet typed by staff in the office: French first, the two
// Tunisian tongues optional — a row without a translation simply stays French.
export type LText = { fr: string; tn?: string; tna?: string };

/** Seasonal home shelves, driven by month windows — never by manual chaos. */
export const shelves = pgTable("shelves", {
  id: serial("id").primaryKey(),
  title: jsonb("title").$type<LText>().notNull(),
  subtitle: jsonb("subtitle").$type<LText>(),
  /** 1–12; a window may wrap the year (startMonth 10 → endMonth 3 = Oct–Mar). */
  startMonth: integer("start_month").notNull().default(1),
  endMonth: integer("end_month").notNull().default(12),
  productIds: jsonb("product_ids").$type<number[]>().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

/** Fixed “duo pharmacien” bundles: two real products, one honest discount. */
export const duos = pgTable(
  "duos",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull(),
    name: jsonb("name").$type<LText>().notNull(),
    note: text("note"),
    productIdA: integer("product_a_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    productIdB: integer("product_b_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    /** Fixed amount off the sum of the two references, in millimes. */
    discountMillimes: integer("discount_millimes").notNull().default(0),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("duos_slug_idx").on(t.slug)],
);

/** “Need → routine” strips shown on concern pages: exactly three gestures. */
export const routineSteps = pgTable(
  "routine_steps",
  {
    id: serial("id").primaryKey(),
    concernId: integer("concern_id")
      .references(() => concerns.id, { onDelete: "cascade" })
      .notNull(),
    position: integer("position").notNull(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    label: jsonb("label").$type<LText>().notNull(),
    reason: jsonb("reason").$type<LText>(),
    ...timestamps,
  },
  (t) => [uniqueIndex("routine_step_pos_idx").on(t.concernId, t.position)],
);

/** Out-of-stock substitutions: staff-approved, with a reason. Never random. */
export const productSubstitutes = pgTable(
  "product_substitutes",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    substituteProductId: integer("substitute_product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    reason: jsonb("reason").$type<LText>(),
    position: integer("position").notNull().default(1),
  },
  (t) => [uniqueIndex("substitute_pair_idx").on(t.productId, t.substituteProductId)],
);

/** P02 “Souvent associé” — at most two complements per product, one-line reason. */
export const productPairs = pgTable(
  "product_pairs",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    pairProductId: integer("pair_product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    reason: varchar("reason", { length: 200 }),
    position: integer("position").notNull().default(1),
  },
  (t) => [uniqueIndex("product_pair_idx").on(t.productId, t.pairProductId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: varchar("author_name", { length: 120 }).notNull(),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 160 }),
    body: text("body").notNull(),
    status: reviewStatusEnum("status").default("pending").notNull(),
    reply: text("reply"),
    /** P02 — an invited review from a delivered order earns the mark. */
    isVerified: boolean("is_verified").default(false).notNull(),
    ...timestamps,
  },
  (t) => [index("reviews_product_idx").on(t.productId), index("reviews_status_idx").on(t.status)],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    type: movementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    stockAfter: integer("stock_after").notNull(),
    reason: varchar("reason", { length: 200 }),
    orderId: integer("order_id"),
    userId: integer("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("inv_product_idx").on(t.productId), index("inv_created_idx").on(t.createdAt)],
);

// ── Lots & dates (P03) ─────────────────────────────────────────────────────
// A pharmacy that does not know its expiry dates is not a pharmacy. Every unit
// of stock belongs to a lot: a number, a date, a place, a supplier. Stock on a
// product row is only ever the sum of its sellable lots.
/**
 * One received batch. `expiresAt` is nullable on purpose: a lot nobody has
 * dated yet exists, and it must be visible as *undated* rather than sold as if
 * it were fine. FEFO never picks an undated lot — the counter has to date it.
 */
export const productLots = pgTable(
  "product_lots",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    storeId: integer("store_id")
      .references(() => stores.id, { onDelete: "restrict" })
      .notNull(),
    lot: varchar("lot", { length: 60 }).notNull(),
    /** Null = « DLC non communiquée » — shown, never guessed. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    quantity: integer("quantity").default(0).notNull(),
    /** Where it sits: on the shelf, or in the back. Two different counts. */
    placed: varchar("placed", { length: 10 }).$type<"shelf" | "back">().default("shelf").notNull(),
    supplier: varchar("supplier", { length: 120 }),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
    status: lotStatusEnum("status").default("sale").notNull(),
    /**
     * Remise courte date. A box that expires in six weeks is sold cheaper —
     * and the discount belongs to *that box*, never to the whole reference,
     * because the fresh stock next to it is worth its full price.
     */
    clearancePercent: integer("clearance_percent").default(0).notNull(),
    /** Why it is quarantined / destroyed — a lot never moves without a reason. */
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    index("lots_product_idx").on(t.productId),
    index("lots_expiry_idx").on(t.expiresAt),
    index("lots_store_idx").on(t.storeId),
    index("lots_status_idx").on(t.status),
    uniqueIndex("lots_unique_idx").on(t.productId, t.storeId, t.lot),
  ],
);

/** Every movement of a lot: received, sold, returned, moved, destroyed. */
export const lotEvents = pgTable(
  "lot_events",
  {
    id: serial("id").primaryKey(),
    lotId: integer("lot_id")
      .references(() => productLots.id, { onDelete: "cascade" })
      .notNull(),
    type: lotEventTypeEnum("type").notNull(),
    /** Signed: −4 leaving the shelf, +12 coming back from a return. */
    quantity: integer("quantity").default(0).notNull(),
    note: text("note"),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("lot_events_lot_idx").on(t.lotId), index("lot_events_created_idx").on(t.createdAt)],
);

export const promotions = pgTable(
  "promotions",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 40 }).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    type: promoTypeEnum("type").notNull(),
    value: integer("value").default(0).notNull(), // percent or millimes
    minSubtotalMillimes: integer("min_subtotal_millimes").default(0).notNull(),
    maxDiscountMillimes: integer("max_discount_millimes"),
    universeId: integer("universe_id").references(() => categories.id, { onDelete: "set null" }),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").default(0).notNull(),
    perUserLimit: integer("per_user_limit").default(1).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("promotions_code_idx").on(t.code), index("promotions_active_idx").on(t.isActive)],
);

// Orders
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 24 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 64 }),
    /**
     * Bearer token authorising guest access to this order (confirmation / tracking).
     * The public order `number` is NOT a credential: it is short, printable and
     * appears in e-mails, so knowing it must never reveal the order.
     * NULL on orders created before this column existed — those remain reachable
     * through /suivi with number + verified e-mail (the legacy path).
     */
    accessKey: varchar("access_key", { length: 64 }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
    shippingMethod: shippingMethodEnum("shipping_method").notNull(),
    shippingAddress: jsonb("shipping_address")
      .$type<{
        fullName: string;
        phone: string;
        line1: string;
        line2?: string;
        city: string;
        governorate: string;
        postalCode?: string;
      }>()
      .notNull(),
    storeId: integer("store_id"),
    subtotalMillimes: integer("subtotal_millimes").notNull(),
    discountMillimes: integer("discount_millimes").default(0).notNull(),
    shippingMillimes: integer("shipping_millimes").default(0).notNull(),
    giftWrapMillimes: integer("gift_wrap_millimes").default(0).notNull(),
    totalMillimes: integer("total_millimes").notNull(),
    promoCode: varchar("promo_code", { length: 40 }),
    giftWrap: boolean("gift_wrap").default(false).notNull(),
    giftMessage: varchar("gift_message", { length: 300 }),
    customerNote: text("customer_note"),
    internalNote: text("internal_note"),
    trackingCode: varchar("tracking_code", { length: 80 }),
    /** Points granted when this order settled (1 DT = 10 points). */
    loyaltyEarned: integer("loyalty_earned").default(0).notNull(),
    /** Points redeemed as a discount on this order (1000 points = 10 DT). */
    loyaltySpent: integer("loyalty_spent").default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.number),
    uniqueIndex("orders_idem_idx").on(t.idempotencyKey),
    uniqueIndex("orders_access_key_idx").on(t.accessKey),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_email_idx").on(t.email),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    // snapshot
    name: varchar("name", { length: 200 }).notNull(),
    sku: varchar("sku", { length: 40 }).notNull(),
    brandName: varchar("brand_name", { length: 120 }),
    image: varchar("image", { length: 255 }),
    unitPriceMillimes: integer("unit_price_millimes").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalMillimes: integer("line_total_millimes").notNull(),
    /** The lot that actually left the shelf, frozen on the line. An invoice
     *  that cannot say which lot was sold is not a pharmacy invoice. */
    lotNumber: varchar("lot_number", { length: 60 }),
    lotExpiresAt: timestamp("lot_expires_at", { withTimezone: true }),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    status: orderStatusEnum("status").notNull(),
    message: varchar("message", { length: 300 }),
    actorId: integer("actor_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    /** Optional private note the owner attaches to a wished product. */
    note: varchar("note", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/**
 * A shareable window onto someone's wishlist. The token is the capability:
 * anyone holding the link may read the list (never the account). Sharing can
 * be revoked; revoked rows are kept for the audit trail.
 */
export const wishlistShares = pgTable(
  "wishlist_shares",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: varchar("token", { length: 64 }).notNull(),
    label: varchar("label", { length: 120 }).default("Ma liste Cléopâtre").notNull(),
    message: varchar("message", { length: 400 }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("wishlist_shares_token_idx").on(t.token), index("wishlist_shares_user_idx").on(t.userId)],
);

/** A finished beauty diagnostic — the quiz's answer sheet, kept in the account. */
export const diagnostics = pgTable(
  "diagnostics",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    /** The chosen option ids per question key. */
    answers: jsonb("answers").$type<Record<string, string | string[]>>().notNull(),
    /** Recommended product ids, in order of confidence. */
    productIds: jsonb("product_ids").$type<number[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("diagnostics_user_idx").on(t.userId)],
);

/**
 * « Mon Rituel » — a saved morning/evening routine. `items` is the ordered
 * sequence [{ productId, note }]; the order is the ritual, so it lives in one
 * jsonb array the client re-writes on each drop.
 */
export const rituals = pgTable(
  "rituals",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    moment: varchar("moment", { length: 10 }).default("morning").notNull(), // morning | evening
    season: varchar("season", { length: 40 }), // Été · Hiver · Voyage · …
    items: jsonb("items").$type<{ productId: number; note?: string }[]>().default([]).notNull(),
    reminderEnabled: boolean("reminder_enabled").default(false).notNull(),
    /** Local hour (Africa/Tunis) of the gentle reminder e-mail. */
    reminderHour: integer("reminder_hour").default(8).notNull(),
    reminderDays: integer("reminder_days").default(127).notNull(), // bitmask Mon→Sun
    lastRemindedOn: varchar("last_reminded_on", { length: 10 }), // YYYY-MM-DD, dedupe
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("rituals_user_idx").on(t.userId)],
);

/**
 * « Prévenez-moi » — a customer asking to be told when an exhausted reference
 * returns. Priority logic: alerts tied to a user account are dispatched first
 * (and given the pre-sale window); guest e-mails follow at +24 h.
 */
export const restockAlerts = pgTable(
  "restock_alerts",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    channel: varchar("channel", { length: 12 }).default("email").notNull(), // email | whatsapp
    locale: varchar("locale", { length: 10 }).default("fr").notNull(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("restock_one_per_email_idx").on(t.productId, t.email),
    index("restock_product_idx").on(t.productId),
    index("restock_pending_idx").on(t.notifiedAt),
  ],
);

/** « Mon Abonnement Cléopâtre » — a recurring replenishment of selected refs. */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    status: varchar("status", { length: 12 }).default("active").notNull(), // active | paused | cancelled
    frequencyDays: integer("frequency_days").default(30).notNull(),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("subscriptions_user_idx").on(t.userId), index("subscriptions_due_idx").on(t.nextDueAt)],
);

export const subscriptionItems = pgTable(
  "subscription_items",
  {
    id: serial("id").primaryKey(),
    subscriptionId: integer("subscription_id")
      .references(() => subscriptions.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").default(1).notNull(),
  },
  (t) => [index("sub_items_sub_idx").on(t.subscriptionId)],
);

/** The paper trail of a subscription: pauses, skips, swaps, orders. */
export const subscriptionEvents = pgTable(
  "subscription_events",
  {
    id: serial("id").primaryKey(),
    subscriptionId: integer("subscription_id")
      .references(() => subscriptions.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 24 }).notNull(), // created | paused | resumed | skipped | swapped | cancelled | ordered
    detail: varchar("detail", { length: 300 }),
    orderId: integer("order_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sub_events_sub_idx").on(t.subscriptionId)],
);

/** One message inside a support ticket — the conversation the customer sees in the concierge chat. */
export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .references(() => supportTickets.id, { onDelete: "cascade" })
      .notNull(),
    /** null ⇒ written by the house (staff or bot). */
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: varchar("author_name", { length: 160 }).notNull(),
    body: text("body").notNull(),
    isBot: boolean("is_bot").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    /**
     * message — a normal chat message; note — internal, staff-only (never
     * broadcast to the customer, enforced server-side); system — house notice.
     */
    kind: varchar("kind", { length: 12 }).default("message").notNull(),
    /** The user who wrote it (customer id or support-agent id). */
    senderId: integer("sender_id").references(() => users.id, { onDelete: "set null" }),
    /** { name, mime, size, key } — attachment metadata; file lives in data/attachments. */
    attachment: jsonb("attachment").$type<SupportAttachmentMeta>(),
    /** sent — delivered to the other party's channel; read — they read it. */
    status: varchar("status", { length: 12 }).default("sent").notNull(),
  },
  (t) => [index("ticket_messages_ticket_idx").on(t.ticketId)],
);

/**
 * Every transactional e-mail passes through this table — it is both the outbox
 * (pending rows with a future `sendAt`) and the ledger (`sentAt` set). The
 * cron route flushes due rows; that is what makes the care sequences, ritual
 * reminders, restock priority waves and subscription orders possible without a
 * job runner.
 */
export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: serial("id").primaryKey(),
    kind: varchar("kind", { length: 48 }).notNull(),
    to: varchar("to", { length: 255 }).notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    locale: varchar("locale", { length: 10 }).default("fr").notNull(),
    subject: varchar("subject", { length: 300 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    sendAt: timestamp("send_at", { withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    status: varchar("status", { length: 12 }).default("pending").notNull(), // pending | sent | failed | cancelled
    attempts: integer("attempts").default(0).notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    /** The provider's message id (Brevo) — the key the webhook correlates on. */
    providerMessageId: varchar("provider_message_id", { length: 255 }),
    /** Delivery telemetry, reported back by the provider webhook. */
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    /** Append-only history of webhook events: [{ event, at, detail }]. */
    webhookEvents: jsonb("webhook_events").$type<{ event: string; at: string; detail?: string | null }[]>().default([]).notNull(),
  },
  (t) => [
    index("outbox_due_idx").on(t.status, t.sendAt),
    index("outbox_user_idx").on(t.userId),
    /* One given care/reminder for a given subject is scheduled at most once:
       the cron can run twice within a minute; idempotency lives in the schema. */
    uniqueIndex("outbox_dedupe_idx").on(t.kind, t.to, t.subject).where(sql`${t.status} = 'pending'`),
    index("outbox_provider_msg_idx").on(t.providerMessageId),
  ],
);

/**
 * One-time verification codes (signup). Only the SHA-256 hash of the
 * 6-digit code is stored — a leak can never be replayed as a valid code.
 * The newest unconsumed, unexpired row per (user, purpose) is the live one;
 * issuing a new code supersedes the previous by consuming it.
 */
export const emailOtps = pgTable(
  "email_otps",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    purpose: varchar("purpose", { length: 24 }).default("signup").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    failedAttempts: integer("failed_attempts").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("email_otps_user_idx").on(t.userId)],
);

/** Journal ↔ commerce: the references an article actually points at. */
export const articleProducts = pgTable(
  "article_products",
  {
    articleId: integer("article_id")
      .references(() => articles.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    note: varchar("note", { length: 200 }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.productId] }), index("ap_product_idx").on(t.productId)],
);

// Content
export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    excerpt: varchar("excerpt", { length: 400 }),
    body: text("body").notNull(),
    image: varchar("image", { length: 255 }),
    tag: varchar("tag", { length: 60 }),
    // Journal articles are signed — advice without an author is advertising.
    author: varchar("author", { length: 120 }),
    authorRole: varchar("author_role", { length: 80 }),
    readMinutes: integer("read_minutes").default(4).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("articles_slug_idx").on(t.slug), index("articles_published_idx").on(t.isPublished)],
);

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  address: varchar("address", { length: 240 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  hours: varchar("hours", { length: 160 }).notNull(),
  mapsUrl: varchar("maps_url", { length: 300 }),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

// Telemetry & ops
export const searchEvents = pgTable(
  "search_events",
  {
    id: serial("id").primaryKey(),
    query: varchar("query", { length: 200 }).notNull(),
    resultsCount: integer("results_count").notNull(),
    /** Prompt 15 — the distinct signal: the catalogue knows the word, but
     * every match is on the shelf with nothing to sell. Restock input. */
    outOfStock: boolean("out_of_stock").default(false).notNull(),
    userId: integer("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("search_query_idx").on(t.query), index("search_created_idx").on(t.createdAt)],
);

/**
 * CURED LANDINGS — the correction side of measurement. When a top query
 * returns nothing (or only empty shelves), the office pins a pharmacist
 * approved door here: a label, a link, and the shop answers « rien trouvé »
 * with « voici la place du produit ». Staff-written, never an algorithm.
 */
export const queryLandings = pgTable(
  "query_landings",
  {
    id: serial("id").primaryKey(),
    /** lowercased, trimmed — must equal the normalized search query. */
    query: varchar("query", { length: 200 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    /** relative site path or https URL (validated on save). */
    href: varchar("href", { length: 400 }).notNull(),
    /** "zero" replaces the nothing-found panel; "oos" banners an all-stock-0 result set. */
    kind: varchar("kind", { length: 8 }).default("zero").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("query_landings_query_kind_idx").on(t.query, t.kind)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    userId: integer("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("analytics_name_idx").on(t.name), index("analytics_created_idx").on(t.createdAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorId: integer("actor_id"),
    action: varchar("action", { length: 80 }).notNull(),
    entity: varchar("entity", { length: 60 }).notNull(),
    entityId: varchar("entity_id", { length: 60 }),
    details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId), index("audit_created_idx").on(t.createdAt)],
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    type: ticketTypeEnum("type").default("other").notNull(),
    priority: ticketPriorityEnum("priority").default("normal").notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    message: text("message").notNull(),
    reply: text("reply"),
    status: ticketStatusEnum("status").default("open").notNull(),
    orderNumber: varchar("order_number", { length: 24 }),
    readAt: timestamp("read_at", { withTimezone: true }),
    /** The live-conversation half of the ticket (migration 0003). */
    assignedSupportId: integer("assigned_support_id").references(() => users.id, { onDelete: "set null" }),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessageBody: text("last_message_body"),
    lastMessageAuthor: varchar("last_message_author", { length: 160 }),
    customerReadAt: timestamp("customer_read_at", { withTimezone: true }),
    supportReadAt: timestamp("support_read_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    rating: smallint("rating"),
    ratedAt: timestamp("rated_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("tickets_status_idx").on(t.status),
    index("tickets_type_idx").on(t.type),
    index("tickets_user_idx").on(t.userId),
    index("support_tickets_user_status_idx").on(t.userId, t.status),
    index("support_tickets_assigned_idx").on(t.assignedSupportId),
    index("support_tickets_last_message_idx").on(t.lastMessageAt),
  ],
);

/** A conversation is its ticket: open → in_progress → resolved → closed. ('answered' is legacy only.) */
export type SupportConversationStatus = "open" | "in_progress" | "resolved" | "closed";

/** Attachment metadata carried by a ticket message (file: data/attachments/<key>). */
export type SupportAttachmentMeta = {
  name: string;
  mime: string;
  size: number;
  key: string; // `<ticketId>/<file>`
};

export const returnRequests = pgTable(
  "return_requests",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 24 }).notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    orderItemId: integer("order_item_id").references(() => orderItems.id, { onDelete: "set null" }),
    reason: varchar("reason", { length: 100 }).notNull(),
    message: text("message"),
    status: returnStatusEnum("status").default("pending").notNull(),
    staffNote: text("staff_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
    ticketId: integer("ticket_id").references(() => supportTickets.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("returns_number_idx").on(t.number),
    // One return per order line, per customer, enforced by the database rather
    // than only by the check-then-insert in the action: two concurrent submits
    // can both pass the read, but only one can win the unique index.
    uniqueIndex("returns_one_per_item_idx")
      .on(t.orderItemId, t.userId)
      .where(sql`${t.orderItemId} is not null and ${t.userId} is not null`),
    index("returns_user_idx").on(t.userId),
    index("returns_order_idx").on(t.orderId),
    index("returns_status_idx").on(t.status),
  ],
);

export const loyaltyTransactions = pgTable(
  "loyalty_transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    points: integer("points").notNull(),
    reason: varchar("reason", { length: 160 }).notNull(),
    /**
     * Which movement this row is: `award` (order settled), `reversal` (claw-back
     * on cancel/return), `redeem` (points spent as a discount) or `restore`
     * (spent points given back when the order is cancelled/returned).
     */
    kind: varchar("kind", { length: 16 }).notNull().default("award"),
    orderId: integer("order_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("loyalty_user_idx").on(t.userId),
    index("loyalty_order_idx").on(t.orderId),
    /*
     * Database-level idempotency for loyalty accounting: at most one row of
     * each kind per order, so a retried or duplicated status transition can
     * never grant, claw back, spend or restore points twice.
     */
    uniqueIndex("loyalty_order_kind_idx").on(t.orderId, t.kind).where(sql`${t.orderId} IS NOT NULL`),
  ],
);

// ── Customer notifications ───────────────────────────────────────────────
// One ledger for everything the house tells a customer: orders, payments,
// shipping, loyalty, subscriptions, restock, support, security. Rows are only
// ever written by trusted server-side events (see `lib/notifications.ts`) —
// no customer-facing action or endpoint may insert here on a client's word.
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    /**
     * order | payment | shipping | loyalty | subscription | wishlist |
     * account | support | review | gift | retours
     */
    category: varchar("category", { length: 24 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: varchar("body", { length: 400 }),
    /**
     * Where the notification leads. Server-generated, relative paths only
     * (validated at creation — never a client-supplied URL).
     */
    href: varchar("href", { length: 300 }),
    /** info | normal | high — how loudly the house knocks. */
    priority: varchar("priority", { length: 12 }).default("normal").notNull(),
    /**
     * Idempotency key per customer: `order:412:shipped`, `loyalty:412:award`…
     * Retried transitions re-notify as no-ops instead of duplicates.
     */
    dedupeKey: varchar("dedupe_key", { length: 128 }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
    index("notifications_user_unread_idx").on(t.userId, t.readAt),
    uniqueIndex("notifications_dedupe_idx").on(t.userId, t.dedupeKey).where(sql`${t.dedupeKey} IS NOT NULL`),
  ],
);

/** A notification's category — the shelf it belongs to in the center. */
export type NotificationCategory =
  | "order"
  | "payment"
  | "shipping"
  | "loyalty"
  | "subscription"
  | "wishlist"
  | "account"
  | "support"
  | "review"
  | "gift"
  | "retours";

// ── Gift cards ─────────────────────────────────────────────────────────────
// Real stored value, issued by the house. Only the SHA-256 hash of the code is
// stored — a database leak can never be spent as a gift card. Balances are
// decremented under a row lock inside the checkout transaction; the frontend
// never decides an amount.
export const giftCards = pgTable(
  "gift_cards",
  {
    id: serial("id").primaryKey(),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    /** Last 4 characters of the code — enough to recognise, useless to spend. */
    codePrefix: varchar("code_prefix", { length: 8 }).notNull(),
    initialMillimes: integer("initial_millimes").notNull(),
    balanceMillimes: integer("balance_millimes").notNull(),
    /** active | redeemed | expired | cancelled */
    status: varchar("status", { length: 12 }).default("active").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    issuedBy: integer("issued_by").references(() => users.id, { onDelete: "set null" }),
    note: varchar("note", { length: 300 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("gift_cards_code_idx").on(t.codeHash),
    index("gift_cards_status_idx").on(t.status),
  ],
);

/** Every movement of gift-card value: issue, redeem, adjust, refund. */
export const giftCardTransactions = pgTable(
  "gift_card_transactions",
  {
    id: serial("id").primaryKey(),
    giftCardId: integer("gift_card_id")
      .references(() => giftCards.id, { onDelete: "cascade" })
      .notNull(),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    /** Negative when value leaves the card (a redemption). */
    amountMillimes: integer("amount_millimes").notNull(),
    /** issue | redeem | adjust | refund */
    kind: varchar("kind", { length: 16 }).notNull(),
    reason: varchar("reason", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("gift_tx_card_idx").on(t.giftCardId),
    index("gift_tx_order_idx").on(t.orderId),
    /*
     * At most one redemption per order: a retried checkout can never spend
     * the same card twice for the same order.
     */
    uniqueIndex("gift_tx_order_kind_idx").on(t.orderId, t.kind).where(sql`${t.orderId} IS NOT NULL`),
  ],
);

// ── Operating layer (Admin OS) ─────────────────────────────────────────────
// The work the house has to do, not the shop's own data: a task is a decision
// an operator owes someone. Tasks are created by hand, by an alert, or by an
// automation run — `source` records which, so the trail is never lost.
export const taskPriorityEnum = pgEnum("task_priority", ["critical", "high", "normal", "low"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "in_progress", "blocked", "done", "dismissed"]);

export const adminTasks = pgTable(
  "admin_tasks",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    detail: text("detail"),
    priority: taskPriorityEnum("priority").default("normal").notNull(),
    status: taskStatusEnum("status").default("open").notNull(),
    /** hand | alert | automation | system — where this task came from. */
    source: varchar("source", { length: 24 }).default("hand").notNull(),
    /** Loose pointer to the object the task is about: order 412, product 88 … */
    entity: varchar("entity", { length: 40 }),
    entityId: varchar("entity_id", { length: 60 }),
    href: varchar("href", { length: 300 }),
    assigneeId: integer("assignee_id").references(() => users.id, { onDelete: "set null" }),
    createdById: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("tasks_status_idx").on(t.status),
    index("tasks_priority_idx").on(t.priority),
    index("tasks_assignee_idx").on(t.assigneeId),
    index("tasks_due_idx").on(t.dueAt),
  ],
);

/**
 * An automation is a saved rule, not a black box: a named trigger, a list of
 * conditions evaluated against live rows, and a list of actions. The engine in
 * `lib/admin/automations.ts` is the only evaluator — the editor and the cron
 * both call it, so what an operator tests is exactly what runs.
 */
export const automations = pgTable(
  "automations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 140 }).notNull(),
    description: varchar("description", { length: 300 }),
    /** Trigger key — see AUTOMATION_TRIGGERS. */
    trigger: varchar("trigger", { length: 40 }).notNull(),
    conditions: jsonb("conditions").$type<{ field: string; op: string; value: string | number }[]>().default([]).notNull(),
    actions: jsonb("actions").$type<{ type: string; value?: string }[]>().default([]).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    runCount: integer("run_count").default(0).notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdById: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("automations_active_idx").on(t.isActive), index("automations_trigger_idx").on(t.trigger)],
);

/** Every execution of an automation — what it matched, what it created. */
export const automationRuns = pgTable(
  "automation_runs",
  {
    id: serial("id").primaryKey(),
    automationId: integer("automation_id")
      .references(() => automations.id, { onDelete: "cascade" })
      .notNull(),
    /** test | manual | schedule */
    mode: varchar("mode", { length: 12 }).default("manual").notNull(),
    matched: integer("matched").default(0).notNull(),
    affected: integer("affected").default(0).notNull(),
    status: varchar("status", { length: 12 }).default("ok").notNull(), // ok | error
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("runs_automation_idx").on(t.automationId), index("runs_created_idx").on(t.createdAt)],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Shared rate-limit counters.
 * Backed by PostgreSQL so limits hold across multiple app instances and
 * restarts; the in-memory limiter in `lib/rate-limit.ts` is only a fallback
 * for when the database is unreachable (e.g. local tooling).
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: varchar("key", { length: 190 }).primaryKey(),
    count: integer("count").default(0).notNull(),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("rate_limits_reset_idx").on(t.resetAt)],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  wishlist: many(wishlistItems),
  returns: many(returnRequests),
  tickets: many(supportTickets),
  notifications: many(notifications),
}));

export const brandsRelations = relations(brands, ({ many }) => ({ products: many(products) }));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "tree" }),
  children: many(categories, { relationName: "tree" }),
  products: many(products, { relationName: "category" }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id], relationName: "category" }),
  universe: one(categories, { fields: [products.universeId], references: [categories.id], relationName: "universe" }),
  concerns: many(productConcerns),
  reviews: many(reviews),
}));

export const productConcernsRelations = relations(productConcerns, ({ one }) => ({
  product: one(products, { fields: [productConcerns.productId], references: [products.id] }),
  concern: one(concerns, { fields: [productConcerns.concernId], references: [concerns.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  events: many(orderEvents),
  returns: many(returnRequests),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const returnRequestsRelations = relations(returnRequests, ({ one }) => ({
  user: one(users, { fields: [returnRequests.userId], references: [users.id] }),
  order: one(orders, { fields: [returnRequests.orderId], references: [orders.id] }),
  orderItem: one(orderItems, { fields: [returnRequests.orderItemId], references: [orderItems.id] }),
  ticket: one(supportTickets, { fields: [returnRequests.ticketId], references: [supportTickets.id] }),
  resolver: one(users, { fields: [returnRequests.resolvedBy], references: [users.id], relationName: "return_resolver" }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, { fields: [supportTickets.userId], references: [users.id] }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(supportTickets, { fields: [ticketMessages.ticketId], references: [supportTickets.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  items: many(subscriptionItems),
  events: many(subscriptionEvents),
}));

export const subscriptionItemsRelations = relations(subscriptionItems, ({ one }) => ({
  subscription: one(subscriptions, { fields: [subscriptionItems.subscriptionId], references: [subscriptions.id] }),
}));

export const ritualsRelations = relations(rituals, ({ one }) => ({
  user: one(users, { fields: [rituals.userId], references: [users.id] }),
}));

// Types
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Concern = typeof concerns.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type ReturnRequest = typeof returnRequests.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
export type TicketType = (typeof ticketTypeEnum.enumValues)[number];
export type ReturnStatus = (typeof returnStatusEnum.enumValues)[number];
export type Ritual = typeof rituals.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type RestockAlert = typeof restockAlerts.$inferSelect;
export type WishlistShare = typeof wishlistShares.$inferSelect;
export type EmailOutboxRow = typeof emailOutbox.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type Diagnostic = typeof diagnostics.$inferSelect;

export type AdminTask = typeof adminTasks.$inferSelect;
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type Automation = typeof automations.$inferSelect;
export type AutomationRun = typeof automationRuns.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type GiftCard = typeof giftCards.$inferSelect;
export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
