import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { DupeFinder } from "@/components/next-features/product-tools";
import { productToolRows } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Dupe finder",
  description: "Trouvez des produits proches, moins chers ou disponibles à partir du catalogue réel.",
};

export default async function DupesPage() {
  const products = await productToolRows();
  return (
    <div>
      <FeatureHero
        eyebrow="Similarité produit"
        title="Trouver une alternative crédible"
        description="Choisissez une référence : le moteur compare les actifs, la catégorie, la texture, le prix et le stock pour proposer des alternatives."
      />
      <section className="shell-wide py-14 lg:py-20">
        <DupeFinder products={products} />
      </section>
    </div>
  );
}
