import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Listing, type SP } from "@/components/catalog/listing";
import { getUniverses } from "@/lib/catalog";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";

export const metadata: Metadata = {
  title: "La boutique",
  description:
    "Toute la sélection Cléopâtre : dermo-cosmétique, solaire, cheveux, bébé & maman, compléments — produits authentiques conseillés par nos pharmaciens à Ezzahra et Hammam-Lif.",
  alternates: { canonical: "/boutique" },
};

export const dynamic = "force-dynamic";

/**
 * LE COMPTOIR — the whole shelf.
 *
 * The opening plate states the offer in figures (references, laboratories,
 * rayons), then the seven rayons are set as a numbered index — the way a
 * pharmacy lists its departments on the wall — and the shelf itself follows,
 * ruled, filterable, with its own count always visible.
 */
export default async function BoutiquePage({ searchParams }: { searchParams: Promise<SP> }) {
  const [sp, universes] = await Promise.all([searchParams, getUniverses()]);

  return (
    <div>
      <PageIntro
        kicker="La boutique"
        index="00 / 07"
        rail="Toute la sélection"
        title={
          <>
            Toute la sélection,
            <br />
            rayon par rayon.
          </>
        }
        intro="Dermo-cosmétique, solaire, cheveux, bébé & maman, compléments, hygiène : chaque référence est retenue par nos pharmaciens pour son authenticité, sa tolérance et son utilité réelle. Filtrez par laboratoire, besoin ou prix — la sélection reste humaine."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "La boutique" }]}
        right={
          <>
            <Link href="/promotions" className="btn-solid">
              Offres du moment
            </Link>
            <Link href="/marques" className="btn-ghost">
              Les laboratoires
            </Link>
          </>
        }
      >
        <Chapter
          index="01"
          label="Les rayons"
          title="Entrer par un rayon"
          className="mt-14 border-t border-line pt-10 lg:mt-20"
          align="between"
          action={{ href: "/diagnostic", label: "Diagnostic peau" }}
        />

        <ul className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {universes.map((u, i) => (
            <li key={u.id} className="bg-canvas">
              <Link href={`/univers/${u.slug}`} className="group flex h-full flex-col justify-between gap-8 p-6">
                <span className="flex items-start justify-between gap-4">
                  <span className="data text-[0.6875rem] text-iodine">{String(i + 1).padStart(2, "0")}</span>
                  <span aria-hidden className="marker bg-line-strong transition-colors group-hover:bg-iodine" />
                </span>
                <span>
                  <span className="block font-ant text-[1.5rem] uppercase leading-none text-carbon transition-colors group-hover:text-iodine">
                    {u.name}
                  </span>
                  {u.description && (
                    <span className="mt-2.5 block max-w-[34ch] text-[0.8125rem] leading-relaxed text-muted">
                      {u.description}
                    </span>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint transition-colors group-hover:text-carbon">
                    Voir le rayon
                    <span aria-hidden className="h-px w-4 bg-current transition-all group-hover:w-7" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PageIntro>

      <section className="shell-wide py-block lg:py-block-lg">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={9} />}>
          <Listing base={{}} sp={sp} basePath="/boutique" />
        </Suspense>
      </section>
    </div>
  );
}
