import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { loyaltyTransactions, users } from "@/db/schema";

/**
 * LE CARNET — loyalty since Prompt 10 is points, nothing else. The ladder was
 * retired because its rungs promised privileges the till never applied; a
 * promise you don't keep is worse than a promise you never make. This module
 * reads exactly what the ledger is: spendable balance, lifetime earned, rows.
 */

export type LoyaltySummary = {
  balance: number;
  lifetime: number;
  recent: { id: number; points: number; reason: string; kind: string; createdAt: Date }[];
};

export async function getVipSummary(userId: number): Promise<LoyaltySummary> {
  const [me] = await db.select({ loyaltyPoints: users.loyaltyPoints }).from(users).where(eq(users.id, userId)).limit(1);
  const ledger = await db
    .select({
      id: loyaltyTransactions.id,
      points: loyaltyTransactions.points,
      reason: loyaltyTransactions.reason,
      kind: loyaltyTransactions.kind,
      createdAt: loyaltyTransactions.createdAt,
    })
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.userId, userId))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(40);
  // Lifetime = every point the house has ever granted, read exactly from the
  // sum of positive rows (older awards can sit beyond the 40 most recent).
  const sumRow = await db
    .select({ total: sql<number>`coalesce(sum(${loyaltyTransactions.points}), 0)::int` })
    .from(loyaltyTransactions)
    .where(and(eq(loyaltyTransactions.userId, userId), sql`${loyaltyTransactions.points} > 0`));
  return {
    balance: me?.loyaltyPoints ?? 0,
    lifetime: sumRow[0]?.total ?? 0,
    recent: ledger,
  };
}
