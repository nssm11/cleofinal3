import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { getCopy } from "@/lib/i18n/server";
import { facetsFor, listProducts, type ListFilters } from "@/lib/catalog";
import { parseFilters, type SP } from "@/components/catalog/listing";
import { EmptyState } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { FilterDock } from "./FilterDock";
import { VisageCard } from "./VisageCard";

/**
 * LE RAYON ENTIER — every reference, one honest shelf.
 *
 * The same engine as the house's listings — same query language, same
 * facets, same pagination — but worn differently: a thin dock instead of
 * a sidebar, plates set on the dark, and the first reference of a fresh
 * page promoted to a statement.
 */
export async function VisageListing({
  base,
  sp,
  basePath,
  wishedIds,
  isAuthed,
}: {
  base: ListFilters;
  sp: SP;
  basePath: string;
  wishedIds: number[];
  isAuthed: boolean;
}) {
  const filters = { ...base, ...parseFilters(sp) };
  const [{ items, total, page, pages, fuzzy }, facets, copy] = await Promise.all([
    listProducts(filters),
    facetsFor(base),
    getCopy(),
  ]);

  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") u.set(k, v);
    u.set("page", String(p));
    return `${basePath}?${u}`;
  };

  /* A fresh, unfiltered page opens on its first plate set wide — the moment
     a filter plays, the shelf reads as a comparison, evenly. */
  const promote = page === 1 && !filters.q && items.length > 4 ? items[0] : null;
  const rest = promote ? items.slice(1) : items;

  return (
    <section id="rayon" className="scroll-mt-20 border-t border-cine-line bg-cine-noir">
      <FilterDock facets={facets} total={total} />

      <div className="container-wide pb-20 pt-10 lg:pb-28 lg:pt-14">
        {fuzzy && filters.q && (
          <p className="mb-6 flex items-baseline gap-2 border-b border-cine-gold/30 pb-3 text-[12.5px] italic text-cine-mist" role="status">
            <SearchIcon size={13} className="shrink-0 translate-y-[2px] text-cine-gold" />
            {copy.merch.fuzzyNote}&nbsp;«&nbsp;{filters.q}&nbsp;»
          </p>
        )}

        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              tone="dark"
              icon={<SearchIcon size={22} />}
              title="Aucune référence ne correspond"
              description="Élargissez un critère, ou laissez-vous guider par un rayon entier — la sélection reste courte, elle se parcourt vite."
              action={{ href: basePath, label: "Réinitialiser la recherche" }}
            />
          </div>
        ) : (
          <>
            {promote && (
              <Reveal amount={0.05} className="mb-14 lg:mb-20">
                <VisageCard p={promote} variant="feature" priority wished={wishedIds.includes(promote.id)} isAuthed={isAuthed} />
              </Reveal>
            )}

            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:gap-x-7 xl:grid-cols-4">
              {rest.map((p, i) => (
                <Reveal key={p.id} y={14} delay={Math.min(i % 8, 3) * 0.05} amount={0.08}>
                  <VisageCard p={p} wished={wishedIds.includes(p.id)} isAuthed={isAuthed} priority={!promote && i < 4} />
                </Reveal>
              ))}
            </div>

            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={qs(page - 1)}
                    className="inline-flex min-h-11 items-center gap-2 border border-cine-line px-5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-cine-ivory transition-colors duration-300 hover:border-cine-gold/70 hover:text-cine-gold"
                  >
                    <ArrowRightIcon size={13} className="rotate-180 rtl-mirror" /> {copy.common.previous}
                  </Link>
                )}
                <span className="px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cine-faint">
                  {page} / {pages}
                </span>
                {page < pages && (
                  <Link
                    href={qs(page + 1)}
                    className="inline-flex min-h-11 items-center gap-2 border border-cine-line px-5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-cine-ivory transition-colors duration-300 hover:border-cine-gold/70 hover:text-cine-gold"
                  >
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
