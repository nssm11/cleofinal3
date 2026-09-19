import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategoryBySlug, getUniverses, listProducts } from "@/lib/catalog";
import { Listing, type SP } from "@/components/catalog/listing";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { EditorialProductGrid } from "@/components/catalog/editorial-product-card";
import { Chapter } from "@/components/kit/surfaces";
import { Mask } from "@/components/kit/motion";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  return c
    ? {
        title: c.name,
        description: c.description ?? undefined,
        alternates: { canonical: `/categorie/${c.slug}` },
        openGraph: { images: c.image ? [c.image] : [] },
      }
    : {};
}

/**
 * LE RAYON — one room of the counter.
 *
 * A full-bleed still of the parent universe opens it, the room's name cut
 * across the frame in poster caps; then the room's best-sellers as a short
 * ruled row; then the room's siblings as an index; then the shelf itself.
 * The data contract is unchanged — same category, same filters, same listing.
 */
export default async function CategoriePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [c, unis] = await Promise.all([getCategoryBySlug(slug), getUniverses()]);
  if (!c || c.isUniverse) notFound();

  const parent = unis.find((x) => x.slug === c.parent?.slug) ?? null;
  const siblings = parent?.children ?? [];
  const heroImage = parent?.image ?? c.image;
  const curated = (await listProducts({ categoryId: c.id, sort: "bestsellers", perPage: 4 })).items;

  return (
    <div>
      {/* ══ THE STILL ═══════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="relative h-[52vh] min-h-[400px] w-full overflow-hidden bg-petrol lg:h-[64vh]">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={parent?.name ?? c.name}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-80"
            />
          ) : (
            <div aria-hidden className="blueprint absolute inset-0 opacity-20" />
          )}
          <div aria-hidden className="cine-scrim-band absolute inset-x-0 bottom-0 h-[46%]" />

          <div className="cine-type absolute inset-x-0 bottom-0">
            <div className="shell-wide pb-10 lg:pb-14">
              <nav aria-label="Fil d'Ariane" className="mb-5">
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href="/boutique" className="kicker-xs text-chalk-faint hover:text-chalk">
                      Boutique
                    </Link>
                  </li>
                  {parent && (
                    <>
                      <li aria-hidden className="kicker-xs text-chalk-faint">
                        /
                      </li>
                      <li>
                        <Link href={`/univers/${parent.slug}`} className="kicker-xs text-chalk-faint hover:text-chalk">
                          {parent.name}
                        </Link>
                      </li>
                    </>
                  )}
                </ol>
              </nav>

              <div className="flex items-center gap-4">
                <span aria-hidden className="marker bg-iodine" />
                <span className="kicker text-chalk-muted">
                  {parent?.name ?? "La maison"} — rayon {String(siblings.findIndex((s) => s.id === c.id) + 1).padStart(2, "0")}
                </span>
              </div>

              <Mask delay={0.05}>
                <h1 className="mt-4 max-w-[24ch] font-ant text-[clamp(2.6rem,8vw,7rem)] uppercase leading-[0.86] text-chalk">
                  {c.name}
                </h1>
              </Mask>
              {c.description && (
                <p className="mt-5 max-w-[54ch] text-lead text-chalk-muted">{c.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ THE ROOM'S OWN BEST-SELLERS ════════════════════════════════ */}
      {curated.length > 0 && (
        <section className="shell-wide py-block lg:py-block-lg">
          <Chapter
            index="01"
            label="Le conseil du comptoir"
            title="Ce qui part le plus vite ici"
            action={{ href: `${parent ? `/univers/${parent.slug}` : "/boutique"}`, label: parent ? `Tout ${parent.name}` : "Toute la boutique" }}
            align="between"
            className="mb-10"
          />
          <EditorialProductGrid items={curated} cols={4} priorityCount={2} />
        </section>
      )}

      {/* ══ THE SIBLINGS ═══════════════════════════════════════════════ */}
      {siblings.length > 1 && (
        <section className="border-y border-line bg-mist">
          <div className="shell-wide py-band">
            <p className="kicker-xs mb-5">Les autres rayons de {parent?.name ?? "la maison"}</p>
            <ul className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {siblings.map((s) => {
                const on = s.id === c.id;
                return (
                  <li key={s.id} className="shrink-0">
                    <Link href={`/categorie/${s.slug}`} className={on ? "chip-on" : "chip"}>
                      {s.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ══ THE SHELF ══════════════════════════════════════════════════ */}
      <section className="shell-wide py-block lg:py-block-lg">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={9} />}>
          <Listing base={{ categoryId: c.id }} sp={sp} basePath={`/categorie/${c.slug}`} hideConcerns />
        </Suspense>
      </section>
    </div>
  );
}
