import Link from "next/link";
import { SectionBrow } from "@/components/orders/order-cards";
import { ProductGrid } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/primitives";
import { VisageToolbar } from "./visage-toolbar";
import { VisageFilterConsole } from "./visage-console";
import type { Facets } from "@/components/catalog/filters";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import type { ProductCard as PC } from "@/lib/catalog";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

/**
 * VISAGE EXPLORER — the whole shelf, worked from a console.
 *
 * This is the filtered/`?all=1` state: every reference in the universe,
 * sortable, filterable, paginated. Where the generic shelf filters from a
 * side rail, the explorer works top-down — toolbar, console, plates — so
 * the grid always breathes full-width, on every viewport.
 */
export function VisageExplorer({
  items,
  total,
  page,
  pages,
  fuzzy,
  q,
  facets,
  sp,
  basePath,
  wished,
  isAuthed,
  copy,
}: {
  items: PC[];
  total: number;
  page: number;
  pages: number;
  fuzzy: boolean;
  q?: string;
  facets: Facets;
  sp: Record<string, string | string[] | undefined>;
  basePath: string;
  wished: number[];
  isAuthed: boolean;
  copy: Copy;
}) {
  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") u.set(k, v);
    u.set("page", String(p));
    return `${basePath}?${u}`;
  };
  const rhythm = page === 1 && items.length > 4 && total > 8 ? "editorial" : "dense";

  return (
    <section id="explorer" aria-label={copy.merch.roomEyebrow} className="scroll-mt-28">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <SectionBrow index="03" eyebrow={copy.merch.roomEyebrow} title={copy.univers.selection} />

        <div className="mt-8">
          <VisageToolbar total={total} />
        </div>

        {fuzzy && q && (
          <p className="mt-4 flex items-baseline gap-2 border border-champagne/40 bg-cream/60 px-4 py-3 text-[12.5px] italic text-muted" role="status">
            <SearchIcon size={13} className="shrink-0 translate-y-[2px] text-champagne-2" />
            <span>
              {copy.merch.fuzzyNote}&nbsp;«&nbsp;{q}&nbsp;»
            </span>
          </p>
        )}

        <VisageFilterConsole facets={facets} total={total} />

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
            <div className="mt-10">
              <ProductGrid items={items} wishedIds={wished} isAuthed={isAuthed} rhythm={rhythm} priorityCount={4} />
            </div>

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link href={qs(page - 1)} className="btn-ghost">
                    <ArrowRightIcon size={13} className="rotate-180 rtl-mirror" /> {copy.common.previous}
                  </Link>
                )}
                <span className="min-w-20 border border-ink/15 bg-cream/60 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
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
    </section>
  );
}
