import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { CartStockGuard } from "@/components/next-features/customer-workflows";

export const metadata: Metadata = {
  title: "Surveillance panier",
  description: "Vérifiez si les quantités de votre panier restent disponibles.",
};

export default function PanierSurveillancePage() {
  return (
    <div>
      <FeatureHero
        eyebrow="Panier"
        title="Surveiller le stock du panier"
        description="Une couche de protection signale les lignes qui dépassent le stock live ou deviennent indisponibles."
      />
      <section className="shell-wide py-14 lg:py-20">
        <CartStockGuard />
      </section>
    </div>
  );
}
