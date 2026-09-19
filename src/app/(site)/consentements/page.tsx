import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { ConsentCenter } from "@/components/next-features/customer-workflows";

export const metadata: Metadata = {
  title: "Centre de consentement",
  description: "Gérez les préférences fonctionnelles, sécurité, marketing et mesure.",
};

export default function ConsentementsPage() {
  return (
    <div>
      <FeatureHero
        eyebrow="Confiance"
        title="Centre de consentement"
        description="Les préférences de sécurité, stock, conseils et mesure sont présentées clairement avec les éléments indispensables séparés."
      />
      <section className="shell-wide py-14 lg:py-20">
        <ConsentCenter />
      </section>
    </div>
  );
}
