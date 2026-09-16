import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { ProductGrid } from "@/components/catalog/product-card";
import type { Facets } from "@/components/catalog/filters";
import { EmptyState } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { fmt } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { ProductCard as PC } from "@/lib/catalog";
import { activeChips, toggleConcernHref, BASE, type RawSP } from "./urls";
import { VisageFilters } from "./visage-filters";
import { VisageSort, type SortOption } from "./visage-sort";

/**
 * VisageWorkspace — the counter itself.
 *
 * One sticky ledger line (point of view, order, drawer), one quick line of
 * needs, the rayons in a single hairline strip, then the plates. Nothing is
 * a card and nothing is a column of accordions: hierarchy comes from the
 * ink line under the toolbar, the champagne tick of an active chip and the
 * measure of the type. The shelf answers with links, so it works before any
 * JavaScript has settled.
 */

export type ListResult = { items: PC[]; total: number; page: number; pages: number; fuzzy: boolean };

const SORT_OPTIONS: SortOption[] = [
  { v: "featured", l: "Notre sélection", d: "Le comptoir d’abord : conseillés, demandés, récents." },
  { v: "bestsellers", l: "Les plus demandés", d: "Ce que les clientes repartent le plus souvent." },
  { v: "newest", l: "Nouveautés", d: "Les derniers arrivages du comptoir." },
  { v: "price_asc", l: "Prix croissant", d: "Du sérum d’entrée aux soins d’exception." },
  { v: "price_desc", l: "Prix décroissant", d: "Les formats et les actifs les plus concentrés d’abord." },
  { v: "rating", l: "Mieux notés", d: "Le regard des clientes, vérifié achat après achat." },
];

function qs(sp: RawSP, patch: Record<string, string | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v !== "" && k !== "all") u.set(k, v);
  if (patch.all === "1") u.set("all", "1");
  for (const [k, v] of Object.entries(patch)) {
    if (k === "all") continue;
    if (v === null) u.delete(k);
    else u.set(k, v);
  }
  const s = u.toString();
  return `${BASE}${s ? `?${s}` : ""}`;
}

export function WorkspaceToolbar({
  mode,
  universeTotal,
  shelf,
  facets,
  sp,
}: {
  mode: "selection" | "shelf";
  universeTotal: number;
  shelf: ListResult | null;
  facets: Facets;
  sp: RawSP;
}) {
  const shown = shelf ? shelf.items.length : universeTotal;
  const filtered = !!shelf && (shelf.total < universeTotal || shelf.page > 1);
  return (
    <div className="sticky top-14 z-30 -mx-[var(--spacing-gutter)] border-b border-stone/60 bg-paper/92 backdrop-blur-xl lg:top-16 lg:-mx-[var(--spacing-gutter-lg)]">
      <div className="flex min-w-0 flex-nowrap items-center justify-between gap-x-4 px-[var(--spacing-gutter)] py-2.5 lg:px-[var(--spacing-gutter-lg)]">
        {/* Point of view — the one toggle that changes what the counter is. */}
        <div role="group" aria-label="Point de vue sur le rayon" className="flex min-w-0 items-center whitespace-nowrap border border-stone-2/60 text-[9px] font-bold uppercase tracking-[0.14em] sm:text-[9.5px] sm:tracking-[0.16em]">
          <Link
            href={BASE}
            aria-current={mode === "selection" ? "true" : undefined}
            className={cn(
              "min-h-10 shrink-0 px-2.5 transition-colors duration-300 sm:px-3.5",
              "flex items-center",
              mode === "selection" ? "bg-ink text-paper" : "text-muted hover:text-ink",
            )}
          >
            Sélection
          </Link>
          <span aria-hidden className="h-4 w-px shrink-0 bg-stone-2/70" />
          <Link
            href={qs(sp, { all: "1" })}
            aria-current={mode === "shelf" ? "true" : undefined}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-1.5 px-2.5 transition-colors duration-300 sm:gap-2 sm:px-3.5",
              mode === "shelf" ? "bg-ink text-paper" : "text-muted hover:text-ink",
            )}
          >
            Rayon<span aria-hidden className="hidden sm:inline"> complet</span>
            <span className="sr-only sm:hidden"> complet</span>
            <span className={cn("font-display text-[12.5px] italic tracking-normal", mode === "shelf" ? "text-champagne-3" : "text-muted-2")}>
              {universeTotal}
            </span>
          </Link>
        </div>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
          {mode === "shelf" && (
            <p className="hidden min-w-0 truncate text-[11px] text-muted-2 md:block" role="status" aria-live="polite">
              {filtered
                ? `${shown} affichées sur ${shelf?.total ?? 0}`
                : shelf?.pages && shelf.pages > 1
                  ? `page ${shelf.page} / ${shelf.pages}`
                  : `${universeTotal} au comptoir`}
            </p>
          )}
          <span className="hidden min-w-0 sm:block">
            <VisageSort options={SORT_OPTIONS} />
          </span>
          <span aria-hidden className="hidden h-4 w-px bg-stone-2/70 sm:block" />
          <VisageFilters facets={facets} total={shelf?.total ?? universeTotal} />
        </div>
      </div>
      {/* Phones: the order and the honest count get their own hairline row —
          nothing in the toolbar is allowed to collide. */}
      <div className="flex items-center justify-between gap-4 border-t border-stone/40 px-[var(--spacing-gutter)] pb-1.5 pt-0.5 sm:hidden lg:px-[var(--spacing-gutter-lg)]">
        <p className="min-w-0 truncate text-[10px] uppercase tracking-[0.16em] text-muted-2" aria-hidden>
          {mode === "shelf" && shelf
            ? `${shelf.items.length} affichées sur ${shelf.total}`
            : "Le choix de l’officine"}
        </p>
        <VisageSort options={SORT_OPTIONS} />
      </div>
    </div>
  );
}

/**
 * Needs, worn as the first row of the counter — quick chips that jump the
 * shelf straight into `?all=1&concerns=…`. The old universe page buried its
 * concerns inside a mega-menu; here they are the first thing you can press.
 */
export function NeedRow({
  sp,
  concerns,
}: {
  sp: RawSP;
  concerns: { slug: string; name: string; n: number }[];
}) {
  if (concerns.length === 0) return null;
  const activeSet = new Set(String(sp["concerns"] ?? "").split(",").filter(Boolean));
  return (
    <div className="border-b border-stone/50">
      <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-2.5 lg:mx-0 lg:px-0">
        <span className="shrink-0 pr-1 text-[9px] font-bold uppercase tracking-[0.24em] text-muted-2">
          Votre peau demande
        </span>
        {concerns.map((c) => {
          const on = activeSet.has(c.slug);
          return (
            <Link
              key={c.slug}
              href={toggleConcernHref(sp, c.slug)}
              aria-pressed={on}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center gap-1.5 border px-3 text-[12px] transition-all duration-300",
                on
                  ? "border-ink bg-ink text-paper"
                  : "border-stone-2/60 text-charcoal hover:-translate-y-px hover:border-ink hover:text-ink",
              )}
            >
              {c.name}
              <span className={cn("text-[10px] tabular-nums", on ? "text-paper/60" : "text-muted-2")}>{c.n}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The rayons of this universe — a hairline strip of numbered doors, inlined
 * into the workspace where the old page spent a whole ceremonial list.
 */
export function RayonStrip({
  items,
}: {
  items: { slug: string; name: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Rayons de l’univers Visage" className="border-b border-stone/50">
      <ul className="scrollbar-none -mx-4 flex items-stretch gap-0 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {items.map((c, i) => (
          <li key={c.slug} className="shrink-0">
            <Link
              href={`/categorie/${c.slug}`}
              className="group flex min-h-11 items-baseline gap-2.5 border-r border-stone/40 px-4 first:pl-0 last:border-r-0 lg:px-5"
            >
              <span className="font-display text-[11px] italic text-champagne-2/80">{String(i + 1).padStart(2, "0")}</span>
              <span className="whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.12em] text-charcoal transition-colors group-hover:text-ink">
                {c.name}
                <ArrowRightIcon size={11} className="ms-1.5 inline-block opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 rtl-mirror" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Removable words for everything in play — nothing the visitor chose hides
 *  behind a closed panel. */
export function ShelfChips({
  sp,
  facets,
  tolLabels,
}: {
  sp: RawSP;
  facets: Facets;
  tolLabels: Record<string, string>;
}) {
  const names = {
    brands: new Map(facets.brands.map((b) => [b.slug, b.name])),
    concerns: new Map(facets.concerns.map((c) => [c.slug, c.name])),
  };
  const { chips, clearHref } = activeChips(sp, names, tolLabels);
  if (chips.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link
          key={`${c.label}-${c.href}`}
          href={c.href}
          className="group inline-flex min-h-8 items-center gap-2 border border-ink/70 bg-cream/60 px-2.5 text-[11.5px] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
        >
          {c.label}
          <span aria-hidden className="text-[13px] leading-none text-muted-2 transition-colors group-hover:text-paper/80">×</span>
        </Link>
      ))}
      <Link href={clearHref} className="ms-1 text-[11px] text-muted underline decoration-stone-2 underline-offset-4 transition-colors hover:text-ink">
        Repartir du comptoir
      </Link>
    </div>
  );
}

/** Honest pagination — links, not buttons pretending to be one. */
export function ShelfPagination({ sp, shelf }: { sp: RawSP; shelf: ListResult }) {
  if (shelf.pages <= 1) return null;
  const win: number[] = [];
  for (let p = 1; p <= shelf.pages; p++) {
    if (p === 1 || p === shelf.pages || Math.abs(p - shelf.page) <= 1) win.push(p);
  }
  const pages: (number | "…")[] = [];
  let prev = 0;
  for (const p of win) {
    if (prev && p - prev > 1) pages.push("…");
    pages.push(p);
    prev = p;
  }
  return (
    <nav aria-label="Pagination du rayon" className="mt-16 flex items-center justify-center gap-2 border-t border-stone/50 pt-8">
      {shelf.page > 1 && (
        <Link href={qs(sp, { page: String(shelf.page - 1) })} className="btn-ghost min-h-10! text-[10px]">
          <ArrowRightIcon size={12} className="rotate-180 rtl-mirror" aria-hidden /> Précédent
        </Link>
      )}
      <ol className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-1.5 text-[12px] text-muted-2">…</li>
          ) : (
            <li key={p}>
              {p === shelf.page ? (
                <span aria-current="page" className="flex h-10 w-10 items-center justify-center bg-ink font-display text-[15px] italic text-paper tabular-nums">
                  {p}
                </span>
              ) : (
                <Link
                  href={qs(sp, { page: String(p) })}
                  className="flex h-10 w-10 items-center justify-center border border-transparent text-[13px] tabular-nums text-muted transition-colors hover:border-stone-2/70 hover:text-ink"
                >
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>
      {shelf.page < shelf.pages && (
        <Link href={qs(sp, { page: String(shelf.page + 1) })} className="btn-ghost min-h-10! text-[10px]">
          Suivant <ArrowRightIcon size={12} className="rtl-mirror" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
