import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, productLots, products, stores } from "@/db/schema";
import { PageIntro } from "@/components/shell/page-intro";

export const metadata: Metadata = {
  title: "Stock live",
  description: "Disponibilité par boutique, lots et stock public.",
  alternates: { canonical: "/stock-live" },
};
export const dynamic = "force-dynamic";

function lotMonth(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr", { month: "2-digit", year: "numeric" }).format(date);
}

export default async function StockLivePage() {
  const [storeRows, rows] = await Promise.all([
    db.select().from(stores).where(eq(stores.isActive, true)),
    db
      .select({
        productId: products.id,
        slug: products.slug,
        name: products.name,
        brand: brands.name,
        image: products.image,
        storeId: productLots.storeId,
        qty: sql<number>`sum(${productLots.quantity})::int`,
        earliest: sql<Date | string | null>`min(${productLots.expiresAt})`,
      })
      .from(productLots)
      .innerJoin(products, eq(products.id, productLots.productId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(eq(products.status, "active"))
      .groupBy(products.id, brands.name, productLots.storeId)
      .orderBy(desc(sql`sum(${productLots.quantity})`))
      .limit(60),
  ]);

  return (
    <div>
      <PageIntro
        kicker="Live stock"
        index="Stores"
        rail="Availability"
        title={<>Voir le stock,<br />boutique par boutique.</>}
        intro="Un nouveau tableau public de disponibilité : quantité par point de vente, lot le plus proche et accès direct à la fiche."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Stock live" }]}
        right={
          <>
            <Link href="/scanner" className="btn-solid">Scanner</Link>
            <Link href="/alertes-produit" className="btn-ghost">Créer une alerte</Link>
          </>
        }
      />
      <section className="shell-wide py-block lg:py-block-lg">
        <div className="grid gap-6 lg:grid-cols-3">
          {storeRows.map((store) => (
            <article key={store.id} className="border border-line bg-canvas p-5">
              <p className="kicker-xs text-muted">{store.city}</p>
              <h2 className="mt-2 font-ant text-[1.8rem] uppercase leading-none text-carbon">{store.name}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                {store.address}<br />{store.hours}
              </p>
              <div className="mt-5 space-y-3">
                {rows.filter((row) => row.storeId === store.id).slice(0, 8).map((row) => {
                  const month = lotMonth(row.earliest);
                  return (
                    <Link key={`${store.id}-${row.productId}`} href={`/produit/${row.slug}`} className="block border-t border-line pt-3">
                      <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{row.brand}</span>
                      <span className="mt-1 block text-[13px] text-carbon">{row.name}</span>
                      <span className="mt-1 block text-[12px] text-muted">
                        {row.qty} unités{month ? ` · lot ${month}` : ""}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
