import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Listing, type SP } from "@/components/catalog/listing";
import { getUniverses } from "@/lib/catalog";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { PageIntro } from "@/components/shell/page-intro";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "La boutique",
  description:
    "Toute la sélection Cléopâtre : dermo-cosmétique, solaire, cheveux, bébé & maman, compléments — produits authentiques conseillés par nos pharmaciens à Ezzahra et Hammam-Lif.",
  alternates: { canonical: "/boutique" },
};

export const dynamic = "force-dynamic";

export default async function BoutiquePage({ searchParams }: { searchParams: Promise<SP> }) {
  const [sp, universes] = await Promise.all([searchParams, getUniverses()]);
  const filtered = Object.keys(sp).some((k) => k !== "sort" && k !== "page");

  return (
    <div className="relative">
      <PageIntro
        kicker="La boutique"
        rail="Toute la sélection"
        title={
          <>
            Quatre-vingts références,
            <br />
            <span className="italic text-champagne-2">choisies une à une.</span>
          </>
        }
        intro="Chaque produit est retenu par nos pharmaciens pour sa tolérance, son efficacité et son authenticité. Filtrez par rayon, laboratoire, besoin ou prix — la sélection reste humaine."
        breadcrumbs={[{ label: "La boutique" }]}
        right={
          <>
            <Link href="/promotions" className="btn-primary">
              Offres du moment
            </Link>
            <Link href="/marques" className="btn-ghost">
              Les laboratoires
            </Link>
          </>
        }
      >
        {/* The rayons, as a horizontal index under the chapter opening */}
        <Reveal className="mt-16 lg:mt-20" y={12}>
          <p className="eyebrow mb-5 text-muted-2">Aller droit à un rayon</p>
          <ul className="scrollbar-none -mx-1 flex gap-x-8 gap-y-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:gap-x-12">
            {universes.map((u) => (
              <li key={u.id} className="shrink-0">
                <Link
                  href={`/univers/${u.slug}`}
                  className="group inline-flex items-baseline gap-2 whitespace-nowrap font-display text-[clamp(1.1rem,1.8vw,1.5rem)] text-charcoal transition-colors duration-500 hover:text-champagne-2"
                >
                  {u.name}
                  <ArrowRightIcon
                    size={13}
                    className="translate-y-0 text-champagne opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </PageIntro>

      <div className="container-wide py-rhythm lg:py-rhythm-lg">
        <Suspense
          key={JSON.stringify(sp)}
          fallback={<ProductGridSkeleton n={9} rhythm={filtered ? "dense" : "editorial"} />}
        >
          <Listing base={{}} sp={sp} basePath="/boutique" />
        </Suspense>
      </div>
    </div>
  );
}
