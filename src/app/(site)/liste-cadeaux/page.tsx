import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { GiftWishlistBuilder } from "@/components/next-features/customer-workflows";
import { selectProducts } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Liste cadeau",
  description: "Créez une liste cadeau partageable côté navigateur.",
};

export default async function ListeCadeauxPage() {
  const products = await selectProducts();
  return (
    <div>
      <FeatureHero
        eyebrow="Cadeau"
        title="Créer une liste cadeau rapide"
        description="Une wishlist de démonstration pour sélectionner des produits, préparer un message et générer un lien local."
      />
      <section className="shell-wide py-14 lg:py-20">
        <GiftWishlistBuilder products={products} />
      </section>
    </div>
  );
}
