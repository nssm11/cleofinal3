import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { facetsFor, getCategoryBySlug, getUniverses, listProducts } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import { parseFilters, type SP } from "@/components/catalog/listing";
import { getCopy } from "@/lib/i18n/server";
import { VisageHero } from "./visage-hero";
import { VisageRitual } from "./visage-ritual";
import { VisageExplorer } from "./visage-explorer";
import { VisageEditorial } from "./visage-editorial";
import { VisageRayons } from "./visage-rayons";
import { VisageAdvice } from "./visage-advice";
import { VisageChapters } from "./visage-chapters";

/**
 * VISAGE — the cinematic skincare boutique.
 *
 * The same data contract as every universe (same queries, same query keys,
 * same wishlist/cart/compare roads), composed as a film rather than a page:
 * the opening scene, the ritual finder, the full shelf, an editorial
 * interlude, the rayons, the counsel, the other chapters. Served at the
 * five film universes (Visage, Cheveux, Corps, Solaire, Bébé & Maman);
 * the backend is untouched.
 */
export async function VisageCinematic({ slug, sp }: { slug: string; sp: SP }) {
  const [u, all, copy] = await Promise.all([getCategoryBySlug(slug), getUniverses(), getCopy()]);
  if (!u || !u.isUniverse) notFound();

  const atm = atmosphereFor(u.slug);
  const cinema = UNIVERSE_CINEMA[u.slug] ?? {
    video: "hero-main",
    poster: "hero",
    kicker: u.name.toUpperCase(),
    title: atm.promise,
  };
  const basePath = `/univers/${u.slug}`;
  const idx = all.findIndex((x) => x.id === u.id);

  /* The whole shelf, directly: every reference in the universe, sortable,
     filterable, paginated — no curated gate in front of it. */
  const filters = { universeId: u.id, ...parseFilters(sp) };
  const [facets, list, user] = await Promise.all([
    facetsFor({ universeId: u.id }),
    listProducts(filters),
    getCurrentUser(),
  ]);
  const wished = user
    ? (
        await db
          .select({ id: wishlistItems.productId })
          .from(wishlistItems)
          .where(eq(wishlistItems.userId, user.id))
      ).map((w) => w.id)
    : [];

  const explored = { ...list, q: filters.q };

  /* Honest counts behind every rayon door — one light query each. */
  const rayons = await Promise.all(
    u.children.map(async (c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      count: (await listProducts({ categoryId: c.id, perPage: 1 })).total,
    })),
  );

  return (
    <main className="overflow-x-clip bg-night text-alabaster">
      <VisageHero
        name={u.name}
        description={u.description}
        cinema={cinema}
        copy={copy}
        index={idx + 1}
        total={all.length}
        quick={explored.items.slice(0, 3)}
        basePath={basePath}
        productCount={explored.total}
      />

      <VisageRitual needs={facets.concerns} basePath={basePath} copy={copy} />

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
        wishedIds={wished}
        isAuthed={!!user}
        copy={copy}
      />

      <VisageEditorial image={u.image} name={u.name} story={u.story ?? u.description ?? atm.promise} copy={copy} />

      <VisageRayons rayons={rayons} image={u.image} name={u.name} copy={copy} />

      <VisageAdvice copy={copy} />

      <VisageChapters chapters={all.filter((x) => x.id !== u.id)} copy={copy} />
    </main>
  );
}
