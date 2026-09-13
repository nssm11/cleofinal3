import type { ReactNode } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getFeatured } from "@/lib/catalog";
import { getNavigationData } from "@/lib/navigation";
import { SiteHeader } from "@/components/shell/site-header";
import { Footer } from "@/components/shell/footer";
import { CartTray } from "@/components/shell/cart-tray";
import { Concierge } from "@/components/experience/concierge";
import { CompareTray } from "@/components/catalog/compare";

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
    <div className="lab-public-site flex min-h-dvh flex-col">
      <SiteHeader groups={groups} mobileGroups={universes} user={user} wishlistCount={wishlistCount} />
      {/* The header floats above the composition; the first section of every
          page makes room for it with its own top padding. The bottom padding
          clears the mobile thumb bar. */}
      <main id="contenu" className="flex-1 pb-tabbar lg:pb-0">
        {children}
      </main>
      <Footer stores={storeRows} />
      <CartTray upsells={upsells} />
      <CompareTray />
      <Concierge />
    </div>
  );
}
