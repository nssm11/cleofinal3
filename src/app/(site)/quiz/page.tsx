import type { Metadata } from "next";
import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { PageIntro } from "@/components/shell/page-intro";
import { RecommendationQuiz } from "@/components/experience/recommendation-quiz";

export const metadata: Metadata = {
  title: "Quiz recommandations",
  description: "Quiz produit pour obtenir une recommandation skincare ou haircare selon le besoin, le type de peau, l'étape et le budget.",
  alternates: { canonical: "/quiz" },
};

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const [featured, rated, newest] = await Promise.all([
    listProducts({ sort: "featured", perPage: 24, inStock: true }),
    listProducts({ sort: "rating", perPage: 24, inStock: true }),
    listProducts({ sort: "newest", perPage: 24, inStock: true }),
  ]);
  const products = Array.from(new Map([...featured.items, ...rated.items, ...newest.items].map((product) => [product.id, product])).values());

  return (
    <div>
      <PageIntro
        kicker="Quiz"
        index="RX"
        rail="Recommendation"
        title={
          <>
            Répondre en 30 secondes,
            <br />
            repartir avec une routine.
          </>
        }
        intro="Le quiz combine besoin, type de peau, étape de routine et budget pour proposer une sélection immédiatement consultable. La page résultat reprend le raisonnement et les produits."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Quiz" }]}
        right={
          <>
            <Link href="/routine-builder" className="btn-solid">Builder routine</Link>
            <Link href="/besoins" className="btn-ghost">Shop by concern</Link>
          </>
        }
      />
      <section className="shell-wide py-block lg:py-block-lg">
        <RecommendationQuiz products={products} />
      </section>
    </div>
  );
}
