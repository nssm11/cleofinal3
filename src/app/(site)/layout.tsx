import type { ReactNode } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getFeatured } from "@/lib/catalog";
import { getNavigationData } from "@/lib/navigation";
import { SiteHeader } from "@/components/shell/site-header";
import { CartTray } from "@/components/shell/cart-tray";
import { Concierge } from "@/components/experience/concierge";
import { CompareTray } from "@/components/catalog/compare";
import { GlobalFooter } from "@/components/cinematic/GlobalFooter";
import { PageVeil } from "@/components/cinematic/PageVeil";

/**
 * LA MAISON — the shell of the shop.
 *
 * One bar that measures itself against the page, one composition that changes
 * scene between routes, one bag that opens from any screen, one footer in
 * obsidian. The film is a *section* of the house now, not its whole weather:
 * the pages around it are porcelain, hairline and measured type.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [{ groups, universes }, user, storeRows, upsells] = await Promise.all([
    getNavigationData(),
    getCurrentUser(),
    db.select().from(stores).where(eq(stores.isActive, true)),
    getFeatured(6),
  ]);
  const wishlistCount = user
    ? ((await db.select({ n: sql<number>`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.userId, user.id)))[0]?.n ?? 0)
    : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-porcelain font-body text-slate">
      <SiteHeader groups={groups} mobileGroups={universes} user={user} wishlistCount={wishlistCount} />
      <main id="contenu" className="flex-1 pb-tabbar lg:pb-0">
        <PageVeil>{children}</PageVeil>
      </main>
      <GlobalFooter
        stores={storeRows.map((s) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          city: s.city,
          phone: s.phone,
          hours: s.hours,
        }))}
      />
      <CartTray upsells={upsells} />
      <CompareTray />
      <Concierge />
    </div>
  );
}
