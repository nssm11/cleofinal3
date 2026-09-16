import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { facetsFor, getCategoryBySlug, getUniverses, listProducts } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import { parseFilters, type SP } from "@/components/catalog/listing";
import { VisageMasthead } from "@/components/univers/visage-masthead";
import { VisageNeeds } from "@/components/univers/visage-needs";
import { VisageRayons } from "@/components/univers/visage-rayons";
import { VisageSelection } from "@/components/univers/visage-selection";
import { VisageExplorer } from "@/components/univers/visage-explorer";
import { VisageAdvice } from "@/components/univers/visage-advice";
import { VisageChapters } from "@/components/univers/visage-chapters";
import { getCopy } from "@/lib/i18n/server";

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
 * THE UNIVERSE COUNTER — Visage, rebuilt as a consultation desk.
 *
 * Same data contract as the page this replaces (same queries, same query
 * keys, same curated-eight-then-explorer behaviour), composed as an entirely
 * new tree: a split masthead instead of a fullscreen hero, a needs rail and
 * rayon cards instead of giant editorial rows, and a top-down filter console
 * instead of a side rail. Nothing reaches past the data layer — the backend
 * is untouched; only the furniture moved.
 */
export default async function UniversPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const [u, all, copy] = await Promise.all([getCategoryBySlug(slug), getUniverses(), getCopy()]);
  if (!u || !u.isUniverse) notFound();

  const atm = atmosphereFor(u.slug);
  const cinema = UNIVERSE_CINEMA[u.slug] ?? { video: "hero-main", poster: "hero", kicker: u.name.toUpperCase(), title: atm.promise };
  const basePath = `/univers/${u.slug}`;
  const idx = all.findIndex((x) => x.id === u.id);

  /* The same fork as before: untouched visitors meet the curated eight;
     any filter (or `?all=1`) opens the full explorer. */
  const touched = ["brands", "concerns", "tol", "stock", "promo", "rating", "min", "max", "sort", "q", "page"].some(
    (k) => typeof sp[k] === "string" && sp[k] !== "",
  );
  const curatedMode = !touched && sp.all !== "1";

  const facets = await facetsFor({ universeId: u.id });

  const curated = curatedMode ? await listProducts({ universeId: u.id, perPage: 8 }) : null;

  const explored = !curatedMode
    ? await (async () => {
        const filters = { universeId: u.id, ...parseFilters(sp) };
        const [list, user] = await Promise.all([listProducts(filters), getCurrentUser()]);
        const wished = user
          ? (
              await db
                .select({ id: wishlistItems.productId })
                .from(wishlistItems)
                .where(eq(wishlistItems.userId, user.id))
            ).map((w) => w.id)
          : [];
        return { ...list, q: filters.q, wished, isAuthed: !!user };
      })()
    : null;

  return (
    <main className="overflow-x-clip bg-paper text-ink">
      <VisageMasthead
        u={u}
        cinema={cinema}
        atm={atm}
        copy={copy}
        index={idx + 1}
        total={all.length}
        productCount={curated?.total ?? explored?.total ?? 0}
        rayonCount={u.children.length}
      />

      <VisageNeeds needs={facets.concerns} basePath={basePath} copy={copy} />

      <VisageRayons rayons={u.children} copy={copy} />

      {curated ? (
        <VisageSelection items={curated.items} total={curated.total} basePath={basePath} copy={copy} />
      ) : (
        explored && (
          <VisageExplorer
            items={explored.items}
            total={explored.total}
            page={explored.page}
            pages={explored.pages}
            fuzzy={explored.fuzzy}
            q={explored.q}
            facets={facets}
            sp={sp}
            basePath={basePath}
            wished={explored.wished}
            isAuthed={explored.isAuthed}
            copy={copy}
          />
        )
      )}

      <VisageAdvice copy={copy} />

      <VisageChapters chapters={all.filter((x) => x.id !== u.id)} copy={copy} />
    </main>
  );
}
