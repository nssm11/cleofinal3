import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategoryBySlug, getUniverses } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { Listing, type SP } from "@/components/catalog/listing";
import { ProductGridSkeleton, Breadcrumbs } from "@/components/ui/primitives";
import { Reveal, Curtain } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  return c
    ? {
        title: `Univers ${c.name}`,
        description: c.description ?? undefined,
        alternates: { canonical: `/univers/${c.slug}` },
        openGraph: c.image ? { images: [c.image] } : undefined,
      }
    : {};
}

/**
 * A CHAPTER OF THE HOUSE.
 *
 * Entering a universe is not entering a list — it is entering a room. The room
 * has its own light, its own architecture and its own sentence; only then does
 * the shelf appear. Seven rooms, one palette.
 */
export default async function UniversPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [u, all] = await Promise.all([getCategoryBySlug(slug), getUniverses()]);
  if (!u || !u.isUniverse) notFound();

  const index = all.findIndex((x) => x.id === u.id);
  const others = all.filter((x) => x.id !== u.id);
  const atmo = atmosphereFor(u.slug);
  const side = atmo.side;

  return (
    <div>
      {/* ── THE ROOM ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-paper pb-8 pt-24 lg:pb-12 lg:pt-32">
        <MotifLayer motif={atmo.motif} light={atmo.light} />

        <div className="relative container-wide">
          <Breadcrumbs items={[{ label: "Univers" }, { label: u.name }]} />

          <div className="mt-7 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <Reveal
              className={side === "left" ? "lg:col-span-5 lg:order-2" : "lg:col-span-5 lg:order-1 lg:col-start-8"}
              y={16}
            >
              {u.image && (
                <Curtain className="relative aspect-[4/5] w-full" from={side === "left" ? "left" : "right"}>
                  <div className="absolute inset-0 overflow-hidden bg-marble">
                    <Image
                      src={u.image}
                      alt=""
                      fill
                      priority
                      sizes="(max-width:1024px) 100vw, 42vw"
                      className="object-cover"
                    />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent" />
                  </div>
                </Curtain>
              )}
            </Reveal>

            <div className={side === "left" ? "lg:col-span-7 lg:order-1" : "lg:col-span-7 lg:order-2 lg:col-start-1"}>
              <Reveal y={14} amount={0.1}>
                <p className="mb-4 flex items-baseline gap-5">
                  <span className="font-display text-[clamp(1.5rem,2.6vw,2.4rem)] italic leading-none text-champagne-2">
                    {String(index + 1).padStart(2, "0")}
                    <span className="text-[0.5em] text-muted-2"> / {String(all.length).padStart(2, "0")}</span>
                  </span>
                  <span className="eyebrow">Univers</span>
                </p>
                <h1 className="font-display text-[clamp(2.6rem,6.2vw,5.2rem)] leading-[0.94] tracking-[-0.028em] text-ink">
                  {atmo.register === "italic" ? <em className="not-italic">{u.name}</em> : u.name}
                  <span className="block font-display text-[clamp(1.4rem,2.6vw,2.2rem)] italic text-champagne-2">
                    {atmo.promise.split(" ").slice(0, 4).join(" ")}
                  </span>
                </h1>
                <p className="mt-5 max-w-[36rem] text-[15.5px] leading-[1.85] text-muted">
                  {u.story ?? u.description ?? atmo.promise}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-5">
                  <Link href="#rayon" className="btn-primary">
                    Voir les {u.children.length || 0} catégories <ArrowRightIcon size={13} />
                  </Link>
                  <Link href="/besoin/peau-sensible" className="btn-ghost">
                    Un doute&nbsp;? Demandez conseil
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE SHELF OF CATEGORIES ───────────────────────────────────── */}
      {u.children.length > 0 && (
        <section id="rayon" className="relative overflow-hidden border-y border-stone/70 bg-cream/70">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="marble-veil opacity-30" />
          </div>
          <div className="relative container-wide py-8 lg:py-band">
            <Reveal>
              <p className="rule-label mb-5">Dans cet univers</p>
            </Reveal>
            <ul className="grid gap-px border border-stone-2/25 bg-stone-2/20 sm:grid-cols-2 lg:grid-cols-3">
              {u.children.map((c, i) => (
                <Reveal key={c.id} as="li" y={10} delay={i * 0.04}>
                  <Link
                    href={`/categorie/${c.slug}`}
                    className="group relative flex h-full min-h-[96px] items-center justify-between gap-5 overflow-hidden bg-paper px-5 py-4"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-cream transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
                    />
                    <span className="min-w-0">
                      <span className="block font-display text-[11px] italic text-champagne-2">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="mt-1.5 block font-display text-[19px] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                        {c.name}
                      </span>
                    </span>
                    <ArrowRightIcon
                      size={16}
                      className="shrink-0 text-sand-2 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-ink"
                    />
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── THE PLATES ────────────────────────────────────────────────── */}
      <div className="container-wide py-8 lg:py-band">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={9} />}>
          <Listing base={{ universeId: u.id }} sp={sp} basePath={`/univers/${u.slug}`} />
        </Suspense>
      </div>

      {/* ── THE OTHER ROOMS ───────────────────────────────────────────── */}
      {others.length > 0 && (
        <section className="relative overflow-hidden border-t border-stone/70 bg-paper-2/40">
          <div className="relative container-wide py-8 lg:py-band">
            <p className="eyebrow mb-5 text-muted-2">Les autres rayons</p>
            <ul className="flex flex-wrap gap-x-10 gap-y-4 lg:gap-x-16">
              {others.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/univers/${o.slug}`}
                    className="link-underline font-display text-[clamp(1.3rem,2.4vw,2rem)] text-charcoal transition-colors hover:text-champagne-2"
                  >
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
