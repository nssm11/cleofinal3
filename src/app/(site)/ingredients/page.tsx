import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { IngredientDictionary } from "@/components/next-features/ingredient-checker";

export const metadata: Metadata = {
  title: "Dictionnaire ingrédients",
  description: "Encyclopédie des actifs, filtres, allergènes parfumants et cautions de formule.",
};

export default function IngredientsPage() {
  return (
    <div>
      <FeatureHero
        eyebrow="Dictionnaire"
        title="Les ingrédients, expliqués simplement"
        description="Un glossaire public pour comprendre les actifs, repérer les cautions et relier une formule à un besoin précis."
      />
      <section className="shell-wide py-14 lg:py-20">
        <IngredientDictionary />
      </section>
    </div>
  );
}
