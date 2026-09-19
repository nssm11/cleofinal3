import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, type ListFilters } from "@/lib/catalog";
import { CONCERN_LANDING_GROUPS, ROUTINE_STEP_FILTERS, SKIN_TYPE_FILTERS } from "@/lib/shopping-taxonomy";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";

export const metadata: Metadata = {
  title: "Résultat du quiz",
  description: "Recommandation produit détaillée issue du quiz Cléopâtre.",
  alternates: { canonical: "/quiz/result" },
};

export const dynamic = "force-dynamic";

type SP = { concern?: string; skin?: string; step?: string; max?: string };

export default async function QuizResultPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const concern = CONCERN_LANDING_GROUPS.find((entry) => entry.slug === sp.concern) ?? CONCERN_LANDING_GROUPS[0];
  const skin = SKIN_TYPE_FILTERS.find((entry) => entry.slug === sp.skin) ?? SKIN_TYPE_FILTERS[2];
  const step = ROUTINE_STEP_FILTERS.find((entry) => entry.slug === sp.step) ?? ROUTINE_STEP_FILTERS[0];
  const max = Number(sp.max ?? 100000);
  const filters: ListFilters = {
    skinTypes: [skin.slug],
    routineSteps: [step.slug],
    maxPrice: Number.isFinite(max) ? max : undefined,
    sort: "featured",
    perPage: 8,
    inStock: true,
  };
  const [{ items }, fallback] = await Promise.all([
    listProducts(filters),
    listProducts({ q: concern.query, sort: "featured", perPage: 8, inStock: true }),
  ]);
  const products = items.length ? items : fallback.items;

  return (
    <div>
      <PageIntro
        kicker="Résultat"
        index="Plan"
        rail="Quiz"
        title={
          <>
            Recommandation
            <br />
            {concern.fr.toLowerCase()}.
          </>
        }
        intro={`Profil retenu : ${skin.fr}, étape ${step.fr.toLowerCase()}, budget ${Number.isFinite(max) ? `${max / 1000} DT` : "ouvert"}.`}
        breadcrumbs={[{ href: "/", label: "Accueil" }, { href: "/quiz", label: "Quiz" }, { label: "Résultat" }]}
        right={
          <>
            <Link href={`/boutique?skin=${skin.slug}&step=${step.slug}&max=${max}`} className="btn-solid">Ouvrir le rayon filtré</Link>
            <Link href="/conseil-pharmacien" className="btn-ghost">Valider avec un pharmacien</Link>
          </>
        }
      />

      <section className="shell-wide py-block">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_1fr]">
          <Chapter index="01" label="Raisonnement" title="Une routine en trois règles" />
          <div className="grid gap-px bg-line md:grid-cols-3">
            {[
              ["Commencer simple", "Un nettoyant, un soin ciblé, un hydratant ou SPF : on ajoute le reste seulement si la peau suit."],
              ["Lire la tolérance", "Peau sensible, grossesse, parfum, âge : les filtres du rayon restent disponibles pour serrer le choix."],
              ["Mesurer la réponse", "Une photo et une note par semaine suffisent pour voir si le produit aide ou irrite."],
            ].map(([title, text]) => (
              <article key={title} className="bg-canvas p-6">
                <h2 className="font-ant text-[1.5rem] uppercase leading-none text-carbon">{title}</h2>
                <p className="mt-4 text-[14px] leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shell-wide pb-block-lg">
        <Chapter index="02" label="Produits" title="La sélection recommandée" />
        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => <EditorialProductCard key={product.id} p={product} />)}
        </div>
      </section>
    </div>
  );
}
