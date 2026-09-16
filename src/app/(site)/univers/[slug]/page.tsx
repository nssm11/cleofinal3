import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategoryBySlug, getUniverses, listProducts } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import { Listing, type SP } from "@/components/catalog/listing";
import { VisageExperience } from "@/components/visage/VisageExperience";
import { ProductGrid } from "@/components/catalog/product-card";
import { ProductGridSkeleton, Breadcrumbs } from "@/components/ui/primitives";
import { Reveal, MaskLine } from "@/components/motion/reveal";
import { CinematicUniverseHero } from "@/components/cinematic/CinematicUniverseHero";
import { ArrowRightIcon } from "@/components/icons";
import { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

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
 * A CHAPTER OF THE HOUSE — now a scene of the film.
 *
 * The universe opens exactly as its chapter does on the homepage: the
 * footage fullscreen, the statement set wide in the night. Below the frame
 * the same editorial language continues — a sentence about the room, the
 * shelf of its rayons, the house's own counter picks, and the whole shelf
 * one honest link away.
 *
 * The Visage chapter is the exception: it has its own nocturne — a fully
 * re-composed experience in `components/visage`, same functionality, new
 * skin. The shared chapter layout below serves every other universe.
 */
export default async function UniversPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [u, all, copy] = await Promise.all([getCategoryBySlug(slug), getUniverses(), getCopy()]);
  if (!u || !u.isUniverse) notFound();

  /* LE VISAGE, LA NUIT — the bespoke composition of the Visage universe. */
  if (u.slug === "visage") {
    return <VisageExperience u={u} all={all} sp={sp} />;
  }

  const t = copy.univers;

  /* A room, not a spreadsheet: with no filter in play, the universe first
     shows the house's own eight — counter picks, best-sellers, fresh
     arrivals — then the whole shelf, one honest link away. */
  const raw = sp as Record<string, string | string[] | undefined>;
  const touched = ["brands", "concerns", "tol", "stock", "promo", "rating", "min", "max", "sort", "q", "page"].some((k) => typeof raw[k] === "string" && raw[k] !== "");
  const curated = !touched && raw.all !== "1";
  const room = curated ? await listProducts({ universeId: u.id, perPage: 8 }) : null;

  const index = all.findIndex((x) => x.id === u.id);
  const others = all.filter((x) => x.id !== u.id);
  const atmo = atmosphereFor(u.slug);
  const cinema = UNIVERSE_CINEMA[u.slug];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-paper">
      {/* ── THE OPENING FRAME ─────────────────────────────────────────── */}
      <CinematicUniverseHero
        video={cinema?.video ?? "hero-main"}
        poster={cinema?.poster ?? "hero"}
        alt={`Cléopâtre — univers ${u.name}`}
        kicker={cinema?.kicker ?? u.name.toUpperCase()}
        title={cinema?.title ?? atmo.promise}
        subtitle={u.story ? atmo.promise : u.description ?? undefined}
        ctaLabel="Explore"
      />

      <div id="univers" className="scroll-mt-14">
        {/* ── THE SENTENCE ABOUT THE ROOM ─────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="container-wide py-16 lg:py-24">
            <Breadcrumbs items={[{ label: t.breadcrumb }, { label: u.name }]} />

            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <Reveal y={14} amount={0.1}>
                  <p className="mb-4 flex items-baseline gap-4">
                    <span className="font-display text-[15px] italic leading-none text-champagne-2">
                      {pad(index + 1)}
                      <span className="text-[0.6em] text-muted-2"> / {pad(all.length)}</span>
                    </span>
                    <span className="eyebrow">{t.label}</span>
                  </p>
                  <div className="overflow-hidden">
                    <MaskLine className="font-display text-[clamp(2.4rem,5.2vw,4.2rem)] leading-[0.98] tracking-[-0.024em] text-ink">
                      {u.name}
                    </MaskLine>
                  </div>
                  {u.children.length > 0 && (
                    <div className="mt-8 flex flex-wrap items-center gap-5">
                      <Link href="#rayon" className="btn-primary">
                        {fmt(t.seeCategories, { n: u.children.length })} <ArrowRightIcon size={13} className="rtl-mirror" />
                      </Link>
                      <Link href="/diagnostic" className="btn-ghost">
                        {t.askAdvice}
                      </Link>
                    </div>
                  )}
                </Reveal>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <Reveal y={16} delay={0.08}>
                  <p className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.35] text-charcoal-2">
                    “{u.story ?? u.description ?? atmo.promise}”
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── THE SHELF OF RAYONS ─────────────────────────────────────── */}
        {u.children.length > 0 && (
          <section id="rayon" className="border-t border-stone/40">
            <div className="container-wide py-12 lg:py-band">
              <Reveal>
                <p className="eyebrow mb-8 text-muted-2">{t.inUniverse}</p>
              </Reveal>
              <ul>
                {u.children.map((c, i) => (
                  <Reveal key={c.id} as="li" y={10} delay={i * 0.04}>
                    <Link
                      href={`/categorie/${c.slug}`}
                      className="group relative flex items-center justify-between gap-6 border-t border-stone/40 py-6 transition-colors duration-500 last:border-b hover:bg-cream/40 lg:py-7"
                    >
                      <span className="flex min-w-0 items-baseline gap-5 lg:gap-8">
                        <span className="shrink-0 font-display text-[13px] italic text-champagne-2/80">
                          {pad(i + 1)}
                        </span>
                        <span className="truncate font-display text-[clamp(1.6rem,3.4vw,2.8rem)] leading-none text-charcoal transition-colors duration-500 group-hover:text-ink">
                          {c.name}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center border border-stone/60 text-muted-2 transition-all duration-500 group-hover:border-champagne-3/60 group-hover:text-champagne-3"
                      >
                        <ArrowRightIcon size={15} className="transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl-mirror" />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── THE PLATES ──────────────────────────────────────────────── */}
        <section className="border-t border-stone/40">
          <div className="container-wide py-14 lg:py-band-lg">
            {room && room.items.length > 0 ? (
              <>
                <Reveal>
                  <p className="eyebrow mb-8 text-muted-2">{copy.merch.roomEyebrow}</p>
                </Reveal>
                <ProductGrid items={room.items} isAuthed={false} rhythm="editorial" priorityCount={0} />
                <div className="mt-12 flex items-center justify-between gap-6 border-t border-stone/40 pt-8">
                  <Link href={`/univers/${u.slug}?all=1`} className="btn-primary">
                    {fmt(copy.merch.roomAll, { n: room.total })} <ArrowRightIcon size={13} className="rtl-mirror" />
                  </Link>
                  <Link href="/diagnostic" className="link-underline hidden text-[13px] text-muted sm:block">
                    {copy.univers.askAdvice}
                  </Link>
                </div>
              </>
            ) : (
              <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={9} />}>
                <Listing base={{ universeId: u.id }} sp={sp} basePath={`/univers/${u.slug}`} />
              </Suspense>
            )}
          </div>
        </section>

        {/* ── THE OTHER CHAPTERS ──────────────────────────────────────── */}
        {others.length > 0 && (
          <section className="border-t border-stone/40">
            <div className="container-wide py-14 lg:py-band-lg">
              <Reveal>
                <p className="eyebrow mb-8 text-muted-2">{t.otherRooms}</p>
              </Reveal>
              <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                {others.map((o, i) => (
                  <Reveal key={o.id} as="li" y={10} delay={i * 0.05}>
                    <Link
                      href={`/univers/${o.slug}`}
                      className="group flex items-baseline gap-4"
                    >
                      <span className="font-display text-[12px] italic text-champagne-2/70">{pad(i + 1)}</span>
                      <span className="font-display text-[clamp(1.2rem,2.2vw,1.7rem)] leading-tight text-charcoal-2 transition-colors duration-500 group-hover:text-ink">
                        {o.name}
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
