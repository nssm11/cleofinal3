import type { ReactNode } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getFeatured, getGapFillers } from "@/lib/catalog";
import { getNavigationData } from "@/lib/navigation";
import { SiteHeader } from "@/components/shell/site-header";
import { CartTray } from "@/components/shell/cart-tray";
import { Concierge } from "@/components/experience/concierge";
import { CompareTray } from "@/components/catalog/compare";
import { GlobalFooter } from "@/components/cinematic/GlobalFooter";
import { PageVeil } from "@/components/cinematic/PageVeil";

/**
 * THE SHEET — the shell of the house.
 *
 * One bar at the top (tickered, ruled, with its own progress hairline), the
 * composition, the credits, and the tray held open at the side of the page.
 * Everything inside the shell is a page of the same ledger.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [{ groups, universes }, user, storeRows, upsells, fillers] = await Promise.all([
    getNavigationData(),
    getCurrentUser(),
    db.select().from(stores).where(eq(stores.isActive, true)),
    getFeatured(6),
    getGapFillers(30),
  ]);
  const wishlistCount = user
    ? ((await db.select({ n: sql<number>`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.userId, user.id)))[0]?.n ?? 0)
    : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SiteHeader groups={groups} mobileGroups={universes} user={user} wishlistCount={wishlistCount} />
      <main id="contenu" className="flex-1 pb-tabbar lg:pb-0">
        <PageVeil>{children}</PageVeil>
      </main>
      <GlobalFooter
        rayons={universes.map((u) => ({ label: u.name, href: `/univers/${u.slug}` }))}
        stores={storeRows.map((s) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          city: s.city,
          phone: s.phone,
          hours: s.hours,
        }))}
      />
      <CartTray upsells={upsells} fillers={fillers} />
      <CompareTray />
      <Concierge />
    </div>
  );
}
