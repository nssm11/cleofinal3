import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { facetsFor, listProducts, type ListFilters } from "@/lib/catalog";
import { EditorialProductGrid } from "./editorial-product-card";
import { ActiveChips, FilterPanel, MobileFilters, SortBar } from "./filters";
import { Empty } from "@/components/kit/surfaces";
import { itemListLd } from "@/lib/structured-data";
import { jsonLd } from "@/lib/utils";
import { SITE_URL } from "@/lib/env";
import { SearchIcon } from "@/components/icons";

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
 * LE RAYON — the shelf used by the boutique, the universes, the categories and
 * the search results.
 *
 * A ruled rail on the left (a specification panel, numbered), the references on
 * the right with the first one promoted to a double cell whenever the visitor
 * has not filtered — a filtered list should read as a comparison, not as a
 * magazine. The count, the sort and the active choices are always visible at
 * the top, so nothing the visitor has chosen can hide.
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
  const filtered = Object.keys(sp).some((k) => k !== "sort" && k !== "page");

  /* Ce que la page affirme aux moteurs, c'est ce qu'elle montre : la liste
     réelle, son rang, et le stock tel qu'il est — pas un total théorique. */
  const listLd = itemListLd({
    name: base.q ? `Recherche « ${base.q} »` : "Sélection Cléopâtre",
    path: basePath,
    total,
    page,
    site: SITE_URL,
    items: items.map((p) => ({
      name: p.name,
      url: `/produit/${p.slug}`,
      image: p.image,
      priceMillimes: p.priceMillimes,
      inStock: p.stock > 0,
    })),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      {/* The panel */}
      <aside className="hidden lg:col-span-3 lg:block">
        <div className="lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pe-2">
          <FilterPanel facets={facets} hideBrands={hideBrands} hideConcerns={hideConcerns} />
        </div>
      </aside>

      <div className="lg:col-span-9">
        <SortBar total={total} />

        {fuzzy && filters.q && (
          <p className="mt-3 flex items-baseline gap-2 border-b border-iodine/40 pb-3 text-[0.8125rem] text-muted" role="status">
            <SearchIcon size={13} className="shrink-0 text-iodine" />
            {copy.merch.fuzzyNote}&nbsp;«&nbsp;{filters.q}&nbsp;»
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 lg:hidden">
          <MobileFilters facets={facets} hideBrands={hideBrands} hideConcerns={hideConcerns} total={total} />
        </div>

        {items.length > 0 && (
          <div className="mt-4">
            <ActiveChips />
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-8">
            <Empty
              icon={<SearchIcon size={18} className="text-iodine" />}
              label="Aucune référence"
              title="Rien ne correspond à ces critères."
              body="Élargissez un critère, ou laissez-vous guider par un rayon entier — la sélection reste courte, elle se parcourt vite."
              action={{ href: basePath, label: "Réinitialiser la recherche" }}
            />
          </div>
        ) : (
          <>
            <div className="mt-8 lg:mt-10">
              <EditorialProductGrid
                items={items}
                wishedIds={wished}
                isAuthed={!!user}
                cols={3}
                priorityCount={4}
              />
            </div>

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-5">
                {page > 1 ? (
                  <Link href={qs(page - 1)} className="btn-outline">
                    Précédent
                  </Link>
                ) : (
                  <span />
                )}
                <span className="data text-[0.8125rem] text-muted">
                  {page} / {pages}
                </span>
                {page < pages ? (
                  <Link href={qs(page + 1)} className="btn-outline">
                    Suivant
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
