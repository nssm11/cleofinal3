import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { facetsFor, listProducts, type ListFilters } from "@/lib/catalog";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/primitives";
import { ProductGrid } from "./product-card";
import { ActiveChips, FilterPanel, MobileFilters, SortBar } from "./filters";

export type SP = Record<string, string | string[] | undefined>;

export function parseFilters(sp: SP): Partial<ListFilters> {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const list = (k: string) => s(k)?.split(",").filter(Boolean);
  return {
    q: s("q"),
    brandSlugs: list("brands"),
    concernSlugs: list("concerns"),
    minPrice: s("min") ? Number(s("min")) : undefined,
    maxPrice: s("max") ? Number(s("max")) : undefined,
    inStock: s("stock") === "1",
    promo: s("promo") === "1",
    minRating: s("rating") ? Number(s("rating")) : undefined,
    sort: (s("sort") as ListFilters["sort"]) ?? "featured",
    page: s("page") ? Number(s("page")) : 1,
  };
}

/**
 * THE SHELF — the listing used by the boutique, the universes, the categories
 * and the search results.
 *
 * Desktop gets a sticky filter rail beside the plates; phones get a full-height
 * sheet. The active filters are always visible as removable words, so nothing
 * the visitor has chosen can be hidden behind a collapsed panel.
 *
 * The first plate of a listing is promoted to a wide statement only when the
 * visitor has not filtered — a filtered list should read as a comparison, not
 * as a magazine.
 */
export async function Listing({
  base,
  sp,
  hideBrands,
  hideConcerns,
  basePath,
  rhythm,
}: {
  base: ListFilters;
  sp: SP;
  hideBrands?: boolean;
  hideConcerns?: boolean;
  basePath: string;
  rhythm?: "editorial" | "rows" | "dense";
}) {
  const filters = { ...base, ...parseFilters(sp) };
  const [{ items, total, page, pages }, facets, user] = await Promise.all([
    listProducts(filters),
    facetsFor(base),
    getCurrentUser(),
  ]);
  const wished = user
    ? (await db.select({ id: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.userId, user.id))).map((w) => w.id)
    : [];

  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") u.set(k, v);
    u.set("page", String(p));
    return `${basePath}?${u}`;
  };

  const autoRhythm: "editorial" | "rows" | "dense" =
    rhythm ?? (page === 1 && items.length > 4 && total > 8 ? "editorial" : "dense");

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
      {/* The rail */}
      <aside className="hidden lg:col-span-3 lg:block">
        <div className="sticky top-32">
          <FilterPanel facets={facets} hideBrands={hideBrands} hideConcerns={hideConcerns} />
        </div>
      </aside>

      <div className="lg:col-span-9">
        <SortBar total={total} />

        <div className="mt-5 flex flex-wrap items-center gap-4 lg:hidden">
          <MobileFilters facets={facets} hideBrands={hideBrands} hideConcerns={hideConcerns} total={total} />
        </div>

        {items.length > 0 && (
          <div className="mt-5">
            <ActiveChips />
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="Aucune référence ne correspond"
              description="Élargissez un critère, ou laissez-vous guider par un rayon entier — la sélection reste courte, elle se parcourt vite."
              action={{ href: basePath, label: "Réinitialiser la recherche" }}
            />
          </div>
        ) : (
          <>
            <div className="mt-12">
              <ProductGrid items={items} wishedIds={wished} isAuthed={!!user} rhythm={autoRhythm} priorityCount={4} />
            </div>

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link href={qs(page - 1)} className="btn-ghost">
                    <ArrowRightIcon size={13} className="rotate-180" /> Précédent
                  </Link>
                )}
                <span className="px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                  {page} / {pages}
                </span>
                {page < pages && (
                  <Link href={qs(page + 1)} className="btn-ghost">
                    Suivant <ArrowRightIcon size={13} />
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
