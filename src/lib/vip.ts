import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { annualRewards, loyaltyTransactions, users } from "@/db/schema";

/**
 * LE CERCLE — four levels, no confetti.
 *
 * A customer's standing is measured in *lifetime* points earned (awards and
 * birthday gifts), never in the spendable balance — redeeming must not demote
 * anyone. Thresholds and privileges below are the house's word; the account
 * dashboard and the e-mails read the same numbers.
 */

export type VipLevel = {
  /** Index in the ladder, 1-based for display. */
  n: number;
  min: number;
  /** French name; localized names live in the dictionaries (vip.levels[i].name). */
  name: string;
};

export const VIP_LEVELS: VipLevel[] = [
  { n: 1, min: 0, name: "Sable" },
  { n: 2, min: 1_000, name: "Nacre" },
  { n: 3, min: 3_000, name: "Champagne" },
  { n: 4, min: 8_000, name: "Or impérial" },
];

export function levelFor(lifetimePoints: number): VipLevel {
  let current = VIP_LEVELS[0];
  for (const l of VIP_LEVELS) if (lifetimePoints >= l.min) current = l;
  return current;
}

export type VipSummary = {
  balance: number;
  lifetime: number;
  level: VipLevel;
  next: VipLevel | null;
  toNext: number;
  recent: { id: number; points: number; reason: string; kind: string; createdAt: Date }[];
  birthdayGrantedThisYear: boolean;
};

export async function getVipSummary(userId: number): Promise<VipSummary> {
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
  // Lifetime = every point the house has ever granted (awards & gifts).
  const lifetime = ledger.filter((l) => l.points > 0).reduce((a, l) => a + l.points, 0);
  // Older awards beyond the 40 most recent rows are rare — read the full
  // positive sum directly for exactness.
  const sumRow = await db
    .select({ total: sql<number>`coalesce(sum(${loyaltyTransactions.points}), 0)::int` })
    .from(loyaltyTransactions)
    .where(and(eq(loyaltyTransactions.userId, userId), sql`${loyaltyTransactions.points} > 0`));
  const lifetimeAll = sumRow[0]?.total ?? lifetime;
  const year = new Date().getFullYear();
  const gift = await db.query.annualRewards.findFirst({
    where: and(eq(annualRewards.userId, userId), eq(annualRewards.kind, "birthday"), eq(annualRewards.year, year)),
  });
  const level = levelFor(lifetimeAll);
  const next = VIP_LEVELS.find((l) => l.min > lifetimeAll) ?? null;
  return {
    balance: me?.loyaltyPoints ?? 0,
    lifetime: lifetimeAll,
    level,
    next,
    toNext: next ? next.min - lifetimeAll : 0,
    recent: ledger,
    birthdayGrantedThisYear: !!gift,
  };
}
