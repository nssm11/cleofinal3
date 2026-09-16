import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { EditorialProductGrid } from "@/components/catalog/editorial-product-card";
import { CineFilterBar, CineToolbar } from "./visage-filters";
import type { Facets } from "@/components/catalog/filters";
import type { ProductCard as PC } from "@/lib/catalog";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

/**
 * THE EXPLORER — the whole shelf, staged for the film.
 *
 * The whole shelf, directly: toolbar, dropdown console, then the one
 * editorial grid. Pagination as quiet index gestures, never buttons.
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
  wishedIds = [],
  isAuthed = false,
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
  wishedIds?: number[];
  isAuthed?: boolean;
  copy: Copy;
}) {
  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") u.set(k, v);
    u.set("page", String(p));
    return `${basePath}?${u}`;
  };

  return (
    <section id="selection" aria-label={copy.univers.selection} className="scroll-mt-16 bg-cine-noir">
      <div className="container-wide py-20 lg:py-28">
        <p className="flex items-center gap-4">
          <span className="cine-index">02</span>
          <span className="h-px w-10 bg-cine-line" aria-hidden />
          <span className="cine-kicker">{copy.merch.roomEyebrow}</span>
        </p>
        <h2 className="cine-title mt-6">{copy.univers.selection}</h2>

        <div className="mt-10">
          <CineToolbar total={total} />
        </div>

        {fuzzy && q && (
          <p className="mt-5 flex items-baseline gap-2.5 border border-cine-gold/30 bg-cine-gold/[0.06] px-4 py-3 text-[12.5px] italic text-cine-mist" role="status">
            <SearchIcon size={13} className="shrink-0 translate-y-[2px] text-cine-gold" />
            <span>
              {copy.merch.fuzzyNote}&nbsp;«&nbsp;{q}&nbsp;»
            </span>
          </p>
        )}

        <CineFilterBar facets={facets} total={total} />

        {items.length === 0 ? (
          <div className="mt-14 flex flex-col items-start gap-5 border border-cine-line px-6 py-14 sm:px-12">
            <SearchIcon size={26} className="text-cine-gold" />
            <h3 className="cine-title max-w-[22ch]! text-[clamp(1.5rem,3vw,2.1rem)]!">
              Aucune référence ne correspond
            </h3>
            <p className="max-w-md text-[13.5px] leading-[1.85] text-cine-mist">
              Élargissez un critère, ou laissez-vous guider par un rayon entier — la sélection reste courte, elle se
              parcourt vite.
            </p>
            <Link href={basePath} className="cine-cta">
              Réinitialiser la recherche
              <ArrowRightIcon size={14} strokeWidth={1.5} className="rtl-mirror" aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-14">
              <EditorialProductGrid items={items} wishedIds={wishedIds} isAuthed={isAuthed} tone="dark" priorityCount={4} />
            </div>

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-8">
                {page > 1 ? (
                  <Link href={qs(page - 1)} className="cine-cta">
                    <ArrowRightIcon size={14} strokeWidth={1.5} className="rotate-180 rtl-mirror" aria-hidden />
                    {copy.common.previous}
                  </Link>
                ) : (
                  <span aria-hidden className="w-24" />
                )}
                <span className="cine-index text-[12px]!">
                  {page} / {pages}
                </span>
                {page < pages ? (
                  <Link href={qs(page + 1)} className="cine-cta">
                    {copy.common.following}
                    <ArrowRightIcon size={14} strokeWidth={1.5} className="rtl-mirror" aria-hidden />
                  </Link>
                ) : (
                  <span aria-hidden className="w-24" />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
