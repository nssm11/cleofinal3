import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { IngredientChecker } from "@/components/next-features/ingredient-checker";

export const metadata: Metadata = {
  title: "Analyse INCI",
  description: "Collez une formule INCI et obtenez les signaux actifs, allergènes, cautions soleil ou grossesse.",
};

export default function AnalyseInciPage() {
  return (
    <div>
      <FeatureHero
        eyebrow="Analyse formule"
        title="Le vérificateur INCI"
        description="Un outil de lecture de formule pour identifier les actifs, les allergènes parfumants, les signaux peau sensible et les cautions importantes."
      />
      <section className="shell-wide py-14 lg:py-20">
        <IngredientChecker />
      </section>
    </div>
  );
}
