import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { loyaltyTransactions, orders, users } from "@/db/schema";

/**
 * LE CARNET — loyalty since Prompt 10 is points, nothing else. The ladder was
 * retired because its rungs promised privileges the till never applied; a
 * promise you don't keep is worse than a promise you never make. This module
 * reads exactly what the ledger is: spendable balance, lifetime earned, rows.
 *
 * The dashboard reads one step further: how many whole 10 DT advantages the
 * balance already holds (`blocks`), how far into the next block the customer
 * stands (`inBlock`), and which order each ledger row belongs to — all
 * derived from committed rows, never from client claims.
 */

export type LoyaltyLedgerRow = {
  id: number;
  points: number;
  reason: string;
  kind: string;
  orderId: number | null;
  orderNumber: string | null;
  createdAt: Date;
};

export type LoyaltySummary = {
  balance: number;
  lifetime: number;
  /** Whole 1 000-point blocks = 10 DT advantages ready at the till. */
  blocks: number;
  /** Points already earned toward the next block. */
  inBlock: number;
  recent: LoyaltyLedgerRow[];
};

export async function getVipSummary(userId: number): Promise<LoyaltySummary> {
  const [me] = await db.select({ loyaltyPoints: users.loyaltyPoints }).from(users).where(eq(users.id, userId)).limit(1);
  const ledger = await db
    .select({
      id: loyaltyTransactions.id,
      points: loyaltyTransactions.points,
      reason: loyaltyTransactions.reason,
      kind: loyaltyTransactions.kind,
      orderId: loyaltyTransactions.orderId,
      orderNumber: orders.number,
      createdAt: loyaltyTransactions.createdAt,
    })
    .from(loyaltyTransactions)
    .leftJoin(orders, eq(orders.id, loyaltyTransactions.orderId))
    .where(eq(loyaltyTransactions.userId, userId))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(40);
  // Lifetime = every point the house has ever granted, read exactly from the
  // sum of positive rows (older awards can sit beyond the 40 most recent).
  const sumRow = await db
    .select({ total: sql<number>`coalesce(sum(${loyaltyTransactions.points}), 0)::int` })
    .from(loyaltyTransactions)
    .where(and(eq(loyaltyTransactions.userId, userId), sql`${loyaltyTransactions.points} > 0`));
  const balance = me?.loyaltyPoints ?? 0;
  return {
    balance,
    lifetime: sumRow[0]?.total ?? 0,
    blocks: Math.floor(balance / 1000),
    inBlock: balance % 1000,
    recent: ledger.map((r) => ({ ...r, orderId: r.orderId ?? null, orderNumber: r.orderNumber ?? null })),
  };
}
