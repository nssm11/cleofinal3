import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { LotExpiryChecker } from "@/components/next-features/stock-tools";
import { lotRows } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vérifier un lot",
  description: "Contrôlez un numéro de lot, SKU ou produit pour connaître sa date et son statut.",
};

export default async function VerifierLotPage() {
  const lots = await lotRows();
  return (
    <div>
      <FeatureHero
        eyebrow="Traçabilité"
        title="Vérifier un lot ou une date"
        description="Recherche publique par SKU, nom ou numéro de lot pour repérer une date courte, un lot non daté ou une quarantaine."
      />
      <section className="shell-wide py-14 lg:py-20">
        <LotExpiryChecker lots={lots} />
      </section>
    </div>
  );
}
