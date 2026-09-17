import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { facetsFor, listProducts, type ListFilters } from "@/lib/catalog";
import { EditorialProductGrid } from "./editorial-product-card";
import { ActiveChips, FilterPanel, MobileFilters, SortBar } from "./filters";

export type SP = Record<string, string | string[] | undefined>;

const SORT_KEYS: ReadonlySet<string> = new Set(["featured", "price_asc", "price_desc", "newest", "rating", "bestsellers"]);

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
  const [{ items, total, page, pages }, facets, user] = await Promise.all([
    listProducts(filters),
    facetsFor(base),
    getCurrentUser(),
  ]);
  const wished = user ? (await db.select({ id: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.userId, user.id))).map((w) => w.id) : [];

  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") u.set(k, v);
    u.set("page", String(p));
    return `${basePath}?${u}`;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <aside className="hidden lg:col-span-3 lg:block">
        <div className="sticky top-[80px]">
          <FilterPanel facets={facets} hideBrands={hideBrands} hideConcerns={hideConcerns} />
        </div>
      </aside>

      <div className="lg:col-span-9">
        <SortBar total={total} />
        <div className="mt-4 flex flex-wrap gap-3 lg:hidden">
          <MobileFilters facets={facets} hideBrands={hideBrands} hideConcerns={hideConcerns} total={total} />
        </div>
        {items.length > 0 && (
          <div className="mt-4">
            <ActiveChips />
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-12 border border-dashed border-line p-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Aucune référence</p>
            <p className="mt-4 font-sans text-[20px] font-semibold tracking-[-0.02em]">Rien ne correspond.</p>
            <p className="mt-2 font-sans text-[14px] text-text-secondary">Élargissez les critères ou revenez à la boutique.</p>
            <Link href={basePath} className="btn-primary mt-6">
              Réinitialiser
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <EditorialProductGrid items={items} wishedIds={wished} isAuthed={!!user} cols={3} priorityCount={4} />
            </div>

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-12 flex items-center justify-between border-t border-line pt-6">
                {page > 1 ? (
                  <Link href={qs(page - 1)} className="btn-outline">
                    Précédent
                  </Link>
                ) : (
                  <span />
                )}
                <span className="font-mono text-[12px]">
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
