import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { NewsletterCapture } from "@/components/next-features/customer-workflows";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Centre de capture newsletter par intérêt.",
};

export default function NewsletterPage() {
  return (
    <div>
      <FeatureHero
        eyebrow="Lettre"
        title="S'inscrire par intérêt"
        description="Un centre de capture qui distingue guides, stock, actifs et promotions, sans dépendre d'un fournisseur externe."
      />
      <section className="shell-wide py-14 lg:py-20">
        <NewsletterCapture />
      </section>
    </div>
  );
}
