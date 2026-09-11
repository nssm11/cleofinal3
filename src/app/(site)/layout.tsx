import type { ReactNode } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readLocale } from "@/lib/locale";
import { t } from "@/i18n";
import { getFeatured } from "@/lib/catalog";
import { getNavigationData } from "@/lib/navigation";
import { SiteHeader } from "@/components/shell/site-header";
import { Footer } from "@/components/shell/footer";
import { CartTray } from "@/components/shell/cart-tray";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [{ groups, universes }, user, storeRows, upsells, locale] = await Promise.all([
    getNavigationData(),
    getCurrentUser(),
    db.select().from(stores).where(eq(stores.isActive, true)),
    getFeatured(6),
    readLocale(),
  ]);
  // Le bandeau est un composant client : on lui passe des chaînes, pas la
  // langue à résoudre. Une seule source de vérité, celle du cookie.
  const facts = [
    t(locale, "strip.freeShipping"),
    t(locale, "strip.advice"),
    t(locale, "strip.cod"),
    t(locale, "strip.authentic"),
  ];
  const wishlistCount = user
    ? ((await db.select({ n: sql<number>`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.userId, user.id)))[0]?.n ?? 0)
    : 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader groups={groups} mobileGroups={universes} user={user} wishlistCount={wishlistCount} locale={locale} facts={facts} />
      {/* The header floats above the composition; the first section of every
          page makes room for it with its own top padding. The bottom padding
          clears the mobile thumb bar. */}
      <main id="contenu" className="flex-1 pb-tabbar lg:pb-0">
        {children}
      </main>
      <Footer stores={storeRows} locale={locale} />
      <CartTray upsells={upsells} />
    </div>
  );
}
