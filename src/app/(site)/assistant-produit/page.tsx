import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { ProductFinderWizard } from "@/components/next-features/product-tools";
import { productToolRows } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Assistant produit",
  description: "Un choix guidé pour sélectionner un produit précis sans créer de routine.",
};

export default async function AssistantProduitPage() {
  const products = await productToolRows();
  return (
    <div>
      <FeatureHero
        eyebrow="Finder"
        title="Choisir un seul produit"
        description="Type, besoin, budget : cet assistant propose une sélection courte sans construire de routine complète."
      />
      <section className="shell-wide py-14 lg:py-20">
        <ProductFinderWizard products={products} />
      </section>
    </div>
  );
}
