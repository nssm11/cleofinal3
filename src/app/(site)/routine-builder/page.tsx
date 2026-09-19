import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, type ProductCard } from "@/lib/catalog";
import { PageIntro } from "@/components/shell/page-intro";
import { RoutineBuilderClient } from "@/components/experience/routine-builder-client";

export const metadata: Metadata = {
  title: "Builder routine",
  description:
    "Composez une routine matin et soir selon le type de peau, le besoin prioritaire et l'objectif de tolérance.",
  alternates: { canonical: "/routine-builder" },
};

export const dynamic = "force-dynamic";

function uniqueById(rows: ProductCard[]) {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

export default async function RoutineBuilderPage() {
  const [featured, acne, hydration, solar, sensitive] = await Promise.all([
    listProducts({ sort: "featured", perPage: 12, inStock: true }),
    listProducts({ concernSlugs: ["imperfections", "acne"], sort: "featured", perPage: 8, inStock: true }),
    listProducts({ concernSlugs: ["hydratation"], sort: "featured", perPage: 8, inStock: true }),
    listProducts({ concernSlugs: ["protection-solaire"], sort: "featured", perPage: 8, inStock: true }),
    listProducts({ concernSlugs: ["peau-sensible", "peau-seche"], sort: "featured", perPage: 8, inStock: true }),
  ]);
  const products = uniqueById([...featured.items, ...acne.items, ...hydration.items, ...solar.items, ...sensitive.items]);

  return (
    <div>
      <PageIntro
        kicker="Routine"
        index="AM / PM"
        rail="Builder"
        title={
          <>
            Une routine lisible,
            <br />
            pas une salle de bain pleine.
          </>
        }
        intro="Choisissez un type de peau, un besoin et un objectif. Le builder compose un rituel matin/soir, rappelle les associations à éviter et met en avant les fiches à regarder."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Builder routine" }]}
        right={
          <>
            <Link href="/diagnostic" className="btn-solid">
              Diagnostic guidé
            </Link>
            <Link href="/conseil-pharmacien" className="btn-ghost">
              Demander conseil
            </Link>
          </>
        }
      />

      <section className="shell-wide py-block lg:py-block-lg">
        <RoutineBuilderClient products={products} />
      </section>
    </div>
  );
}
