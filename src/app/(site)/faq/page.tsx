import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { FaqSearch } from "@/components/next-features/customer-workflows";

export const metadata: Metadata = {
  title: "FAQ dermo-cosmétique",
  description: "Questions fréquentes pour stock, lots, retrait, analyse formule et conseil.",
};

export default function FaqPage() {
  return (
    <div>
      <FeatureHero
        eyebrow="FAQ SEO"
        title="Réponses utiles avant achat"
        description="Des blocs FAQ indexables et filtrables pour répondre aux recherches fréquentes autour du stock, des lots, du retrait et des formules."
      />
      <section className="shell-wide py-14 lg:py-20">
        <FaqSearch />
      </section>
    </div>
  );
}
