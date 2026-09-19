import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { ReserveInStore } from "@/components/next-features/customer-workflows";
import { selectProducts, selectStores } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Réserver en boutique",
  description: "Pré-réservez une référence pour retrait comptoir sans paiement en ligne.",
};

export default async function ReservationBoutiquePage() {
  const [products, stores] = await Promise.all([selectProducts(), selectStores()]);
  return (
    <div>
      <FeatureHero
        eyebrow="Réservation comptoir"
        title="Réserver sans payer en ligne"
        description="Préparez une référence dans un comptoir. La confirmation sert de ticket de préparation, sans intégration paiement."
      />
      <section className="shell-wide py-14 lg:py-20">
        <ReserveInStore products={products} stores={stores} />
      </section>
    </div>
  );
}
