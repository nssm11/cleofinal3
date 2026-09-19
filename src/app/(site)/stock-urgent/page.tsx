import type { Metadata } from "next";
import { FeatureHero, MetricStrip } from "@/components/next-features/public-shell";
import { LowStockWall } from "@/components/next-features/stock-tools";
import { restockRows } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Dernières unités",
  description: "Produits avec badges stock bas, rupture et réassort estimé.",
};

export default async function StockUrgentPage() {
  const rows = await restockRows();
  return (
    <div>
      <FeatureHero
        eyebrow="Stock bas"
        title="Dernières unités et ruptures"
        description="Un mur public qui rend visibles les produits à stock fragile : dernière unité, rupture ou retour bientôt."
      />
      <section className="shell-wide space-y-8 py-14 lg:py-20">
        <MetricStrip items={[{ label: "Références", value: rows.length }, { label: "Épuisées", value: rows.filter((row) => row.stock <= 0).length }, { label: "Dernières unités", value: rows.filter((row) => row.stock > 0).length }, { label: "Badge", value: "live" }]} />
        <LowStockWall rows={rows} />
      </section>
    </div>
  );
}
