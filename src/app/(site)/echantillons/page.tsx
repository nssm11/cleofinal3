import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { SampleRequestCenter } from "@/components/next-features/customer-workflows";
import { sampleableProducts } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Demandes échantillons",
  description: "File de demandes échantillons pour tester une texture ou une tolérance.",
};

export default async function EchantillonsPage() {
  const products = await sampleableProducts();
  return (
    <div>
      <FeatureHero
        eyebrow="Échantillons"
        title="Demander un échantillon"
        description="Une demande simple pour signaler le produit à tester et la raison, prête à rejoindre une file admin."
      />
      <section className="shell-wide py-14 lg:py-20">
        <SampleRequestCenter products={products} />
      </section>
    </div>
  );
}
