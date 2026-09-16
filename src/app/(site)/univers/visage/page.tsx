import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { facetsFor, getCategoryBySlug, getUniverses, listProducts, TOLERANCE_KEYS } from "@/lib/catalog";
import { parseFilters } from "@/components/catalog/listing";
import { atmosphereFor } from "@/lib/atmospheres";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import { getCopy } from "@/lib/i18n/server";
import { VisageScene } from "@/components/visage/visage-scene";
import { VisageCounter, VisageCounterSkeleton } from "@/components/visage/visage-counter";
import { VisageNextChapters } from "@/components/visage/visage-next-chapters";
import { ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * L'UNIVERS VISAGE — rebuilt as a counter, not as a poster.
 *
 * The old page opened the universe the way the homepage opens a chapter: a
 * fullscreen title card, a ceremonial sentence, a staircase of serif names,
 * a shelf of plates. Beautiful as marketing, slow as a shop. This route is
 * the same film seen from the other side of the glass — the footage stays,
 * the light stays, the typography stays, but the page now opens ON the work:
 * a compact cinematic band whose every line is either identity or action,
 * and the shelf of the house directly underneath, filling the first viewport.
 *
 * Functionally nothing moved: same universe record, same query-string
 * listing (`?all=1`, brands, concerns, tolerances, price, sort, page — the
 * exact parameters the house shelf has always spoken), same counter
 * selection, same advice routes. Only the composition was rebuilt, from zero,
 * in the house's landing language.
 */

const UNIVERSE_SLUG = "visage";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCategoryBySlug(UNIVERSE_SLUG);
  return c
    ? {
        title: `Univers ${c.name}`,
        description: c.description ?? undefined,
        alternates: { canonical: `/univers/${c.slug}` },
        openGraph: c.image ? { images: [c.image] } : undefined,
      }
    : {};
}

type SP = Record<string, string | string[] | undefined>;

export default async function VisagePage({ searchParams }: { searchParams: Promise<SP> }) {
  const u = await getCategoryBySlug(UNIVERSE_SLUG);
  if (!u || !u.isUniverse) notFound();

  const [all, copy, sp] = await Promise.all([getUniverses(), getCopy(), searchParams]);
  const t = copy.univers;

  /* The posture of the counter: the house's own eight until a filter, a
     search or ?all=1 calls for the whole shelf. The parameters below are
     exactly the ones the shared listing speaks — back, forward, reload and
     share all stay honest. */
  const touched = ["brands", "concerns", "tol", "stock", "promo", "rating", "min", "max", "sort", "q", "page"].some(
    (k) => typeof sp[k] === "string" && sp[k] !== "",
  );
  const mode: "selection" | "shelf" = !touched && sp.all !== "1" ? "selection" : "shelf";

  const [facets, room, user] = await Promise.all([
    facetsFor({ universeId: u.id }),
    listProducts({ universeId: u.id, perPage: 8 }),
    getCurrentUser(),
  ]);
  const wished = user
    ? (await db.select({ id: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.userId, user.id))).map((w) => w.id)
    : [];

  const index = all.findIndex((x) => x.id === u.id);
  const others = all.filter((x) => x.id !== u.id);
  const atmo = atmosphereFor(u.slug);
  const cinema = UNIVERSE_CINEMA[u.slug];

  return (
    <div className="bg-paper">
      {/* ── THE OPENING BAND — the film, compressed to what it can carry. ── */}
      <VisageScene
        name={u.name}
        crumb={t.breadcrumb}
        index={index}
        total={all.length}
        kicker={cinema?.kicker ?? u.name.toUpperCase()}
        story={u.story ?? u.description ?? atmo.promise}
        video={cinema?.video ?? "category-skin"}
        poster={cinema?.poster ?? "skin"}
        register={atmo.register}
        shelfHref="/univers/visage?all=1"
        adviceHref="/diagnostic"
        stats={{
          total: room.total,
          brands: facets.brands.length,
          concerns: facets.concerns.length,
          tolerances: facets.tolerances.map((tl) => ({
            key: tl.key,
            n: tl.n,
            label: copy.merch.tol[tl.key as (typeof TOLERANCE_KEYS)[number]] ?? tl.key,
          })),
          priceMin: facets.priceMin,
          priceMax: facets.priceMax,
        }}
      />

      {/* ── THE COUNTER — the work itself, above the fold. ──────────────── */}
      <div id="comptoir" className="scroll-mt-28">
        <div className="container-wide pb-14 lg:pb-20">
          <Suspense fallback={<VisageCounterSkeleton />}>
            <VisageCounter
              universeId={u.id}
              sp={sp as SP}
              filters={{ universeId: u.id, ...(mode === "shelf" ? parseFilters(sp as SP) : {}) }}
              mode={mode}
              facets={facets}
              wished={wished}
              isAuthed={!!user}
              universeTotal={room.total}
              room={mode === "selection" ? room : null}
              categories={u.children.map((c) => ({ slug: c.slug, name: c.name }))}
              fuzzyNote={copy.merch.fuzzyNote}
            />
          </Suspense>
        </div>
      </div>

      {/* ── THE OTHER ROOMS — the same house, one cut away. ─────────────── */}
      <VisageNextChapters
        others={others.map((o) => ({ slug: o.slug, name: o.name, image: o.image }))}
        currentIndex={index}
        total={all.length}
      />

      {/* A last honest door before the credits. */}
      <div className="bg-cream">
        <div className="container-wide flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-8">
          <p className="min-w-0 text-[12.5px] leading-relaxed text-muted">
            Rien ne remplace un regard : {u.name.toLowerCase()} au comptoir d’Ezzahra, du lundi au samedi.
          </p>
          <Link href="/boutiques" className="btn-ghost min-h-10 shrink-0 text-[10px]">
            Les deux boutiques <ArrowRightIcon size={12} className="rtl-mirror" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
