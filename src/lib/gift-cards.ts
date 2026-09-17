import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { giftCards, giftCardTransactions, type GiftCard } from "@/db/schema";
import { liveStatus, normalizeGiftCardCode } from "@/lib/gift-cards-client";

/**
 * LES CARTES CADEAUX — real stored value, issued by the house.
 *
 * - Only the SHA-256 hash of the code is stored: a database leak can never
 *   be spent as a gift card. The full code is shown exactly once, at issue.
 * - Balances move only under a row lock inside a transaction; the frontend
 *   never decides an amount, a balance or an eligibility.
 * - One redemption per order (partial unique index): a retried checkout can
 *   never spend the same card twice for the same order.
 * - Full-cover redemption: the card pays the whole order or the checkout
 *   refuses with the exact shortfall — no silent partial states.
 */

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I, L

/** `CLEO-XXXX-XXXX-XXXX` — 12 random chars, ~62 bits. */
export function generateGiftCardCode(): string {
  const bytes = randomBytes(12);
  const chars = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `CLEO-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function hashGiftCardCode(normalized: string): string {
  return createHash("sha256").update(`cleo:gift:${normalized}`).digest("hex");
}

export type { GiftCardStatus } from "@/lib/gift-cards-client";

export async function issueGiftCard(args: {
  amountMillimes: number;
  expiresAt?: Date | null;
  note?: string | null;
  issuedBy: number;
}): Promise<{ card: GiftCard; code: string }> {
  const amount = Math.floor(args.amountMillimes);
  if (!Number.isInteger(amount) || amount < 1_000 || amount > 5_000_000) {
    throw new Error("Montant invalide (1 DT – 5 000 DT).");
  }
  // Retry on the (astronomically unlikely) code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGiftCardCode();
    const normalized = normalizeGiftCardCode(code);
    try {
      const [card] = await db
        .insert(giftCards)
        .values({
          codeHash: hashGiftCardCode(normalized),
          codePrefix: normalized.slice(-4),
          initialMillimes: amount,
          balanceMillimes: amount,
          status: "active",
          expiresAt: args.expiresAt ?? null,
          issuedBy: args.issuedBy,
          note: args.note?.slice(0, 300) || null,
        })
        .returning();
      await db.insert(giftCardTransactions).values({
        giftCardId: card.id,
        amountMillimes: amount,
        kind: "issue",
        reason: args.note?.slice(0, 200) || "Émission au comptoir",
      });
      return { card, code };
    } catch {
      /* collision — draw again */
    }
  }
  throw new Error("Impossible d'émettre la carte. Veuillez réessayer.");
}

/** Look a card up by its code. Returns null for unknown, with no oracle detail. */
export async function getGiftCardByCode(rawCode: string): Promise<GiftCard | null> {
  const normalized = normalizeGiftCardCode(rawCode).slice(0, 32);
  if (normalized.length < 8) return null;
  const [card] = await db.select().from(giftCards).where(eq(giftCards.codeHash, hashGiftCardCode(normalized))).limit(1);
  return card ?? null;
}

/**
 * Spend a card against an order total, inside the checkout transaction.
 * The card row is locked FOR UPDATE; balance, status and expiry are all
 * re-checked against the locked row. Throws a French, customer-safe error.
 */
export async function redeemGiftCardForOrder(
  tx: Tx,
  args: { code: string; orderId: number; orderNumber: string; totalMillimes: number },
): Promise<{ cardId: number; amountMillimes: number }> {
  const normalized = normalizeGiftCardCode(args.code).slice(0, 32);
  const rows = await tx
    .select()
    .from(giftCards)
    .where(eq(giftCards.codeHash, hashGiftCardCode(normalized)))
    .for("update")
    .limit(1);
  const card = rows[0];
  if (!card) throw new Error("Ce code de carte cadeau est inconnu. Vérifiez-le et réessayez.");
  const status = liveStatus(card);
  if (status === "cancelled") throw new Error("Cette carte cadeau a été annulée.");
  if (status === "expired") throw new Error("Cette carte cadeau est expirée.");
  if (status === "redeemed" || card.balanceMillimes <= 0) throw new Error("Cette carte cadeau est épuisée.");
  if (card.balanceMillimes < args.totalMillimes) {
    const have = (card.balanceMillimes / 1000).toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    const need = (args.totalMillimes / 1000).toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    throw new Error(`Le solde de la carte (${have} DT) ne couvre pas le total (${need} DT).`);
  }
  const remaining = card.balanceMillimes - args.totalMillimes;
  await tx
    .update(giftCards)
    .set({ balanceMillimes: remaining, status: remaining <= 0 ? "redeemed" : "active", updatedAt: new Date() })
    .where(eq(giftCards.id, card.id));
  // Idempotent: a retried checkout inserts nothing the second time, and the
  // caller treats "already redeemed for this order" as success.
  const inserted = await tx
    .insert(giftCardTransactions)
    .values({
      giftCardId: card.id,
      orderId: args.orderId,
      amountMillimes: -args.totalMillimes,
      kind: "redeem",
      reason: `Commande ${args.orderNumber}`,
    })
    .onConflictDoNothing()
    .returning({ id: giftCardTransactions.id });
  if (!inserted.length) throw new Error("Cette commande a déjà utilisé une carte cadeau.");
  return { cardId: card.id, amountMillimes: args.totalMillimes };
}

/** Staff cancellation — the remaining value dies with the card. */
export async function cancelGiftCard(cardId: number): Promise<boolean> {
  if (!Number.isInteger(cardId) || cardId <= 0) return false;
  const updated = await db
    .update(giftCards)
    .set({ status: "cancelled", balanceMillimes: 0, updatedAt: new Date() })
    .where(and(eq(giftCards.id, cardId), eq(giftCards.status, "active")))
    .returning({ id: giftCards.id });
  if (!updated.length) return false;
  await db.insert(giftCardTransactions).values({ giftCardId: cardId, amountMillimes: 0, kind: "adjust", reason: "Annulation au comptoir" });
  return true;
}

/**
 * The counter-facing row: every readable field-box except the code hash.
 * Columns are explicit so a future secret column can never leak by spread.
 */
export type GiftCardRow = Pick<GiftCard, "id" | "codePrefix" | "initialMillimes" | "balanceMillimes" | "status" | "expiresAt" | "note" | "issuedBy" | "createdAt" | "updatedAt">;

export async function listGiftCards(limit = 100): Promise<GiftCardRow[]> {
  return db
    .select({
      id: giftCards.id,
      codePrefix: giftCards.codePrefix,
      initialMillimes: giftCards.initialMillimes,
      balanceMillimes: giftCards.balanceMillimes,
      status: giftCards.status,
      expiresAt: giftCards.expiresAt,
      note: giftCards.note,
      issuedBy: giftCards.issuedBy,
      createdAt: giftCards.createdAt,
      updatedAt: giftCards.updatedAt,
    })
    .from(giftCards)
    .orderBy(desc(giftCards.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}

export async function giftCardLedger(cardId: number) {
  return db.select().from(giftCardTransactions).where(eq(giftCardTransactions.giftCardId, cardId)).orderBy(desc(giftCardTransactions.createdAt)).limit(50);
}

export async function giftCardStats(): Promise<{ active: number; outstandingMillimes: number; redeemedMillimes: number }> {
  // Scalar subqueries, not a join: a card with N ledger rows must still
  // count its balance exactly once.
  const r = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM ${giftCards} WHERE status = 'active') AS active,
      (SELECT coalesce(sum(balance_millimes), 0)::int FROM ${giftCards} WHERE status = 'active') AS outstanding,
      (SELECT coalesce(sum(-amount_millimes), 0)::int FROM ${giftCardTransactions} WHERE kind = 'redeem') AS redeemed
  `);
  const row = (r.rows as { active: number; outstanding: number; redeemed: number }[])[0];
  return { active: row?.active ?? 0, outstandingMillimes: row?.outstanding ?? 0, redeemedMillimes: row?.redeemed ?? 0 };
}
