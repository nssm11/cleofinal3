import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { adminTasks, orders, products, reviews, supportTickets } from "@/db/schema";
import { OsProvider } from "@/components/admin/os/os-context";
import { Shell, type ShellCounts } from "@/components/admin/os/shell";

export const metadata: Metadata = {
  title: { default: "Cléopâtre — Poste de commande", template: "%s · Cléopâtre" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["admin", "support"] as const;

/**
 * The instrument's frame.
 *
 * Authentication is unchanged: an anonymous request leaves for the front door,
 * a shopper's session leaves for their account, and only staff see the wheel.
 * What is new is the frame itself — the spine, the command line and the five
 * doors a telephone gets instead of a shrunken desktop.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/admin");
  if (!STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) redirect("/compte");

  const counts = await shellCounts(user);

  return (
    <OsProvider>
      <Shell counts={counts}>{children}</Shell>
    </OsProvider>
  );
}

async function shellCounts(user: { firstName: string; lastName: string; role: string }): Promise<ShellCounts> {
  const empty: ShellCounts = {
    attention: 0, tasks: 0, aprep: 0, reviews: 0, tickets: 0, health: "ok",
    operator: { name: `${user.firstName} ${user.lastName}`, role: user.role === "admin" ? "Administratrice" : "Support", initials: (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase() },
  };
  try {
    const [pendingOrders, failing, taskRows, reviewRows, ticketRows, lowStock, failedMail] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(orders).where(inArray(orders.status, ["pending", "confirmed", "preparing"])),
      db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.paymentStatus, "failed")),
      db.select({ n: sql<number>`count(*)::int` }).from(adminTasks).where(inArray(adminTasks.status, ["open", "in_progress", "blocked"])),
      db.select({ n: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.status, "pending")),
      db.select({ n: sql<number>`count(*)::int` }).from(supportTickets).where(eq(supportTickets.status, "open")),
      db.select({ n: sql<number>`count(*)::int` }).from(products).where(and(eq(products.status, "active"), sql`${products.stock} <= ${products.lowStockThreshold}`)),
      db.execute(sql`SELECT count(*)::int AS n FROM email_outbox WHERE status = 'failed'`).then((r) => {
        const list = (Array.isArray(r) ? r : ((r as unknown as { rows?: unknown[] }).rows ?? [])) as { n: number }[];
        return list[0]?.n ?? 0;
      }),
    ]);
    const n = (rows: { n: number }[] | number) => (typeof rows === "number" ? rows : (rows[0]?.n ?? 0));
    const attention = n(pendingOrders) + n(failing) + n(reviewRows) + n(ticketRows) + Math.min(20, n(lowStock)) + n(failedMail);
    return {
      ...empty,
      attention,
      tasks: n(taskRows),
      aprep: n(pendingOrders),
      reviews: n(reviewRows),
      tickets: n(ticketRows),
      health: n(failedMail) > 3 ? "warn" : "ok",
    };
  } catch {
    return empty;
  }
}
