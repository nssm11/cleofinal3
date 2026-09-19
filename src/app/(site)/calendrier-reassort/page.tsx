import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { RestockCalendar } from "@/components/next-features/stock-tools";
import { restockRows } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Calendrier de réassort",
  description: "Dates estimées de retour pour les produits bas ou épuisés.",
};

export default async function CalendrierReassortPage() {
  const rows = await restockRows();
  return (
    <div>
      <FeatureHero
        eyebrow="Réassort"
        title="Calendrier des retours stock"
        description="Une vue publique des produits bas ou épuisés avec une estimation de retour calculée pour la démonstration."
      />
      <section className="shell-wide py-14 lg:py-20">
        <RestockCalendar rows={rows} />
      </section>
    </div>
  );
}
