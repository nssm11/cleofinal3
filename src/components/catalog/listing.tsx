import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { facetsFor, listProducts, type ListFilters } from "@/lib/catalog";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/primitives";
import { EditorialProductGrid } from "./editorial-product-card";
import { ActiveChips, FilterPanel, MobileFilters, SortBar } from "./filters";

export type SP = Record<string, string | string[] | undefined>;

const SORT_KEYS: ReadonlySet<string> = new Set(["featured", "price_asc", "price_desc", "newest", "rating", "bestsellers"]);

/**
 * Query-string numbers are attacker-controlled: `?min=abc` must never put a
 * NaN into a SQL comparison. Non-finite values are dropped, not coerced.
 */
function paramInt(v: string | undefined): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

export function parseFilters(sp: SP): Partial<ListFilters> {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const list = (k: string) => s(k)?.split(",").filter(Boolean);
  const sort = s("sort");
  return {
    q: s("q"),
    brandSlugs: list("brands"),
    concernSlugs: list("concerns"),
    minPrice: paramInt(s("min")),
    maxPrice: paramInt(s("max")),
    inStock: s("stock") === "1",
    promo: s("promo") === "1",
    minRating: paramInt(s("rating")),
    tolerances: (list("tol") ?? []).filter((k): k is "sansParfum" | "grossesse" | "peauAtopique" | "yeuxSensibles" =>
      ["sansParfum", "grossesse", "peauAtopique", "yeuxSensibles"].includes(k),
    ),
    sort: sort && SORT_KEYS.has(sort) ? (sort as ListFilters["sort"]) : "featured",
    page: paramInt(s("page")) ?? 1,
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
}: {
  base: ListFilters;
  sp: SP;
  hideBrands?: boolean;
  hideConcerns?: boolean;
  basePath: string;
}) {
  const filters = { ...base, ...parseFilters(sp) };
  const [{ items, total, page, pages, fuzzy }, facets, user, copy] = await Promise.all([
    listProducts(filters),
    facetsFor(base),
    getCurrentUser(),
    getCopy(),
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

        {fuzzy && filters.q && (
          <p className="mt-3 flex items-baseline gap-2 border-b border-cinabre/30 pb-3 text-[12.5px] italic text-graphite" role="status">
            <SearchIcon size={13} className="shrink-0 translate-y-[2px] text-cinabre-2" />
            {copy.merch.fuzzyNote}&nbsp;«&nbsp;{filters.q}&nbsp;»
          </p>
        )}

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
              <EditorialProductGrid items={items} wishedIds={wished} isAuthed={!!user} cols={3} priorityCount={4} />
            </div>

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link href={qs(page - 1)} className="btn-ghost">
                    <ArrowRightIcon size={13} className="rotate-180 rtl-mirror" /> {copy.common.previous}
                  </Link>
                )}
                <span className="px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-graphite">
                  {page} / {pages}
                </span>
                {page < pages && (
                  <Link href={qs(page + 1)} className="btn-ghost">
                    {copy.common.following} <ArrowRightIcon size={13} className="rtl-mirror" />
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
