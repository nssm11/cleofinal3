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
            <span className="italic text-cinabre-2">choisies une à une.</span>
          </>
        }
        intro="Chaque produit est retenu par nos pharmaciens pour sa tolérance, son efficacité et son authenticité. Filtrez par rayon, laboratoire, besoin ou prix — la sélection reste humaine."
        breadcrumbs={[{ label: "La boutique" }]}
        right={
          <>
            <Link href="/promotions" className="btn-solid">
              Offres du moment
            </Link>
            <Link href="/marques" className="btn-quiet">
              Les laboratoires
            </Link>
          </>
        }
      >
        {/* The rayons — an index, ruled like one: seven doors, one line each. */}
        <Reveal className="mt-16 lg:mt-20" y={12}>
          <p className="micro mb-5 text-ash">Aller droit à un rayon</p>
          <ul className="grid grid-cols-2 gap-px border-y border-rule bg-rule sm:grid-cols-4 lg:grid-cols-7">
            {universes.map((u, i) => (
              <li key={u.id} className="bg-porcelain">
                <Link
                  href={`/univers/${u.slug}`}
                  className="group flex min-h-[6.5rem] flex-col justify-between gap-5 px-4 py-4 transition-colors duration-500 hover:bg-alabaster"
                >
                  <span className="num text-[0.625rem] text-ash transition-colors duration-500 group-hover:text-cinabre">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex items-end justify-between gap-2">
                    <span className="font-display text-[1.0625rem] leading-[1.15] text-ink transition-colors duration-500 group-hover:text-cinabre-2">
                      {u.name}
                    </span>
                    <ArrowRightIcon
                      size={12}
                      className="-translate-x-1 text-cinabre opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 rtl-mirror"
                    />
                  </span>
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
