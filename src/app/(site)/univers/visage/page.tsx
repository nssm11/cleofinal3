import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, concerns, productConcerns, products } from "@/db/schema";
import type { Category } from "@/db/schema";
import { getCategoryBySlug, getUniverses, getConcerns, listProducts, publiclyVisible } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { Listing, type SP } from "@/components/catalog/listing";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { VisageHeader } from "@/components/cinematic/visage/visage-header";
import { VisageNightbar } from "@/components/cinematic/visage/visage-nightbar";
import { VisageTray, VisageTrayItem, VisageMemoranda } from "@/components/cinematic/visage/visage-tray";
import { VisageAppendixStrip, VisageDirectory } from "@/components/cinematic/visage/visage-appendices";
import { Reveal } from "@/components/motion/reveal";
import { ProductGrid } from "@/components/catalog/product-card";
import { ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * VISAGE — the chapter.
 *
 * This static segment shadows the shared `univers/[slug]` route for Visage
 * alone. Around it runs the same shell, the same catalogue, the same copy:
 * the room is a redressing of its front end, never a re-implementation of
 * its business.
 *
 * The composition no longer opens the *house*; it opens the *room*.
 *
 *   1 · THE CHAPTER HEAD      — the word "Visage" inscribed up and left
 *       over a small, literal window of the chapter's own footage, its
 *       index in the seven rooms, the story and the concerns reachable
 *       without ceremony.
 *   2 · THE NIGHTBAR          — the hands-on instrument: a noir slide where
 *       the visitor chooses a concern and quick-adds what the counter
 *       actually recommends.
 *   3 · THE CENSUS            — the four gestures in order. Not a grid of
 *       category boxes: rows that read like a rota.
 *   4 · THE SHELF             — the honest catalogue, unchanged (filters,
 *       search, pagination) and reached with an honest anchor.
 *   5 · APPENDICES            — a single editorial band, then the directory
 *       to the remaining chapters.
 */

/* ── The chapter's own shelf facts (read once, shared by the decor) ─────── */
function categoryFilter(id: number) {
  return and(publiclyVisible, eq(products.universeId, id), eq(products.categoryId, sql`${categories.id}`));
}

async function universeChips(universe: Category): Promise<{
  concernSlugs: string[];
  categories: { slug: string; name: string }[];
}> {
  const [concernsRows, catRows] = await Promise.all([
    db
      .select({ slug: concerns.slug, name: concerns.name })
      .from(concerns)
      .innerJoin(productConcerns, eq(productConcerns.concernId, concerns.id))
      .innerJoin(products, and(eq(products.id, productConcerns.productId), publiclyVisible, eq(products.universeId, universe.id)))
      .groupBy(concerns.slug, concerns.name)
      .orderBy(sql`count(*) desc`, asc(concerns.name)),
    db
      .select({ slug: categories.slug, name: categories.name })
      .from(categories)
      .where(eq(categories.parentId, universe.id))
      .orderBy(asc(categories.sortOrder)),
  ]);

  return {
    concernSlugs: concernsRows.map((c) => c.slug),
    categories: catRows.map((c) => ({ slug: c.slug, name: c.name })),
  };
}

/* ── Metadata ───────────────────────────────────────────────────────────── */
export async function generateMetadata(): Promise<Metadata> {
  const c = await getCategoryBySlug("visage");
  return c
    ? {
        title: `Univers ${c.name}`,
        description: c.description ?? undefined,
        alternates: { canonical: `/univers/${c.slug}` },
        openGraph: c.image ? { images: [c.image] } : undefined,
      }
    : {};
}

export default async function VisagePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [u, all, copy] = await Promise.all([getCategoryBySlug("visage"), getUniverses(), getCopy()]);
  if (!u || !u.isUniverse) notFound();
  const t = copy.univers;

  const atmo = atmosphereFor(u.slug);
  const cinema = UNIVERSE_CINEMA[u.slug];

  const raw = sp as Record<string, string | string[] | undefined>;
  const touched = ["brands", "concerns", "tol", "stock", "promo", "rating", "min", "max", "sort", "q", "page"].some(
    (k) => typeof raw[k] === "string" && raw[k] !== "",
  );
  const curated = !touched && raw.all !== "1";
  const room = curated ? await listProducts({ universeId: u.id, perPage: 8 }) : null;

  const index = all.findIndex((x) => x.id === u.id);
  const others = all.filter((x) => x.id !== u.id);
  const pad = (n: number) => String(n).padStart(2, "0");

  /* Shelf facts used by the decor — resolved once, honest, no guessing. */
  const [{ total: shelfTotal }, chips, picks, concernsAll] = await Promise.all([
    listProducts({ universeId: u.id, perPage: 1 }),
    universeChips(u),
    listProducts({ universeId: u.id, perPage: 6, sort: "bestsellers" }).then((r) => r.items),
    getConcerns(),
  ]);

  const selectedConcerns =
    typeof raw.concerns === "string" && raw.concerns !== "" ? raw.concerns.split(",").filter((s) => chips.concernSlugs.includes(s)) : [];

  const concernNames = concernsAll
    .filter((c) => chips.concernSlugs.includes(c.slug))
    .slice(0, 6)
    .map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="bg-paper">
      {/* 01 ── THE CHAPTER HEAD ─────────────────────────────────────────── */}
      <VisageHeader
        name={u.name}
        kicker={cinema?.kicker ?? u.name.toUpperCase()}
        index={pad(index + 1)}
        total={pad(all.length)}
        story={u.story ?? atmo.promise}
        description={u.description}
        capture={u.image ?? "/images/u-visage.jpg"}
        prisms={concernNames}
        totalRef={shelfTotal}
      />

      {/* 02 ── THE NIGHTBAR ─────────────────────────────────────────────── */}
      <div id="rayon" className="scroll-mt-16">
        <VisageNightbar
          concerns={concernNames}
          picks={picks}
          selectedConcerns={selectedConcerns}
          shelfCount={shelfTotal}
        />
      </div>

      {/* 03 ── THE CENSUS ───────────────────────────────────────────────── */}
      <VisageTray>
        {chips.categories.map((c, i) => (
          <VisageTrayItem key={c.slug} index={pad(i + 1)} title={c.name} slug={c.slug} />
        ))}
      </VisageTray>

      {/* 04 ── THE SHELF ────────────────────────────────────────────────── */}
      <section id="shelf" className="scroll-mt-16 border-b border-stone/60 bg-paper">
        <div className="container-wide py-14 lg:py-20">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="rule-label mb-5">{copy.merch.roomEyebrow}</p>
                <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.6rem)] font-light leading-[1.05] text-ink">
                  Tout le rayon, une référence après l&apos;autre
                </h2>
              </div>
              {curated && room && room.total > 0 && (
                <Link href={`/univers/visage?all=1#shelf`} className="btn-ghost">
                  {fmt(copy.merch.roomAll, { n: room.total })} <ArrowRightIcon size={13} className="rtl-mirror" />
                </Link>
              )}
            </div>
          </Reveal>

          {curated && room && room.items.length > 0 ? (
            <>
              <ProductGrid items={room.items} isAuthed={false} rhythm="editorial" priorityCount={0} />
              <div className="mt-12 flex items-center justify-between gap-6 border-t border-stone/40 pt-8">
                <Link href={`/univers/visage?all=1#shelf`} className="btn-primary">
                  {fmt(copy.merch.roomAll, { n: room.total })} <ArrowRightIcon size={13} className="rtl-mirror" />
                </Link>
                <Link href="/diagnostic" className="link-underline hidden text-[13px] text-muted sm:block">
                  {t.askAdvice}
                </Link>
              </div>
            </>
          ) : (
            <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={9} />}>
              <Listing base={{ universeId: u.id }} sp={sp} basePath="/univers/visage" />
            </Suspense>
          )}
        </div>
      </section>

      {/* 05 ── MEMORANDA ────────────────────────────────────────────────── */}
      <VisageMemoranda />

      {/* 06 ── THE SIGNATURE BAND ───────────────────────────────────────── */}
      <VisageAppendixStrip />

      {/* 07 ── THE DIRECTORY ────────────────────────────────────────────── */}
      <VisageDirectory others={others} />
    </div>
  );
}
