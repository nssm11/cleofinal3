"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useFilterParams, type Facets } from "@/components/catalog/filters";
import { CheckIcon, ChevronDownIcon, CloseIcon, FilterIcon, SortIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/client";
import { formatDTShort } from "@/lib/money";
import type { SortKey } from "@/lib/catalog";
import { EASE_LUXE, leave, sheetUp } from "@/lib/motion";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

/**
 * VISAGE FILTERS — the same query contract, drawn in light on dark.
 *
 * Desktop works a row of dropdowns (BESOIN · MARQUE · TOLÉRANCES · PRIX ·
 * NOTE · DISPO), each opening a single floating panel; phones get a bottom
 * sheet. `useFilterParams` keeps URLs, sharing and back/forward identical
 * to every other shelf in the house.
 */

const SORTS: { v: SortKey; l: string }[] = [
  { v: "featured", l: "Notre sélection" },
  { v: "bestsellers", l: "Les plus demandés" },
  { v: "newest", l: "Nouveautés" },
  { v: "price_asc", l: "Prix croissant" },
  { v: "price_desc", l: "Prix décroissant" },
  { v: "rating", l: "Mieux notés" },
];

type DropKey = "need" | "brand" | "tol" | "price" | "rating" | "avail";

const DROPS: { k: DropKey; label: string }[] = [
  { k: "need", label: "Besoin" },
  { k: "brand", label: "Marque" },
  { k: "tol", label: "Tolérances" },
  { k: "price", label: "Prix" },
  { k: "rating", label: "Note" },
  { k: "avail", label: "Dispo" },
];

function Pill({
  checked,
  onToggle,
  label,
  count,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 border px-3.5 text-[12.5px] transition-all duration-300",
        checked
          ? "border-cine-gold bg-cine-gold/15 text-cine-gold"
          : "border-cine-line text-cine-mist hover:border-cine-gold/60 hover:text-cine-ivory",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center border transition-colors",
          checked ? "border-cine-gold text-cine-gold" : "border-cine-faint text-transparent",
        )}
      >
        <CheckIcon size={9} strokeWidth={3} />
      </span>
      <span className="max-w-44 truncate">{label}</span>
      {count != null && <span className={cn("text-[11px] tabular-nums", checked ? "text-cine-gold/80" : "text-cine-faint")}>{count}</span>}
    </button>
  );
}

function PriceFields({ facets, onDone }: { facets: Facets; onDone?: () => void }) {
  const f = useFilterParams();
  const urlMin = f.sp.get("min") ?? "";
  const urlMax = f.sp.get("max") ?? "";
  const [min, setMin] = useState(urlMin);
  const [max, setMax] = useState(urlMax);
  const [synced, setSynced] = useState(`${urlMin}\u0000${urlMax}`);
  const current = `${urlMin}\u0000${urlMax}`;
  if (current !== synced) {
    setSynced(current);
    setMin(urlMin);
    setMax(urlMax);
  }
  const toDt = (raw: string) => (raw ? String(Number(raw) / 1000) : "");
  const toMillimes = (v: string) => (v ? String(Math.round(Number(v) * 1000)) : null);
  return (
    <div>
      <p className="mb-3 text-[11.5px] text-cine-faint">
        Dans ce rayon : {formatDTShort(facets.priceMin)} – {formatDTShort(facets.priceMax)}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          f.set("min", toMillimes(min));
          f.set("max", toMillimes(max));
          onDone?.();
        }}
        className="flex items-center gap-2"
      >
        <input
          inputMode="decimal"
          value={min ? toDt(min) : ""}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Min"
          aria-label="Prix minimum en dinars"
          className="h-11 min-h-0 min-w-0 flex-1 border border-cine-line bg-cine-noir px-3 text-[13px] tabular-nums text-cine-ivory placeholder:text-cine-faint focus:border-cine-gold focus:outline-none"
        />
        <span className="shrink-0 text-cine-faint">–</span>
        <input
          inputMode="decimal"
          value={max ? toDt(max) : ""}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Max"
          aria-label="Prix maximum en dinars"
          className="h-11 min-h-0 min-w-0 flex-1 border border-cine-line bg-cine-noir px-3 text-[13px] tabular-nums text-cine-ivory placeholder:text-cine-faint focus:border-cine-gold focus:outline-none"
        />
        <button className="h-11 min-h-0 shrink-0 bg-cine-gold px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-cine-noir transition-colors duration-300 hover:bg-cine-ivory">
          OK
        </button>
      </form>
    </div>
  );
}

function DropBody({ k, facets, onDone }: { k: DropKey; facets: Facets; onDone?: () => void }) {
  const f = useFilterParams();
  const { copy } = useLocale();
  if (k === "need")
    return (
      <div className="scrollbar-none flex max-h-64 flex-wrap gap-2 overflow-y-auto">
        {facets.concerns.map((c) => (
          <Pill key={c.slug} checked={f.has("concerns", c.slug)} onToggle={() => f.toggleMulti("concerns", c.slug)} label={c.name} count={c.n} />
        ))}
      </div>
    );
  if (k === "brand")
    return (
      <div className="scrollbar-none flex max-h-64 flex-wrap gap-2 overflow-y-auto">
        {facets.brands.map((b) => (
          <Pill key={b.slug} checked={f.has("brands", b.slug)} onToggle={() => f.toggleMulti("brands", b.slug)} label={b.name} count={b.n} />
        ))}
      </div>
    );
  if (k === "tol")
    return (
      <div className="flex flex-wrap gap-2">
        {facets.tolerances.map((t) => (
          <Pill
            key={t.key}
            checked={f.has("tol", t.key)}
            onToggle={() => f.toggleMulti("tol", t.key)}
            label={copy.merch.tol[t.key as keyof typeof copy.merch.tol] ?? t.key}
            count={t.n}
          />
        ))}
      </div>
    );
  if (k === "price") return <PriceFields facets={facets} onDone={onDone} />;
  if (k === "rating")
    return (
      <div className="flex flex-wrap gap-2">
        {[4, 3].map((r) => (
          <Pill
            key={r}
            checked={f.sp.get("rating") === String(r)}
            onToggle={() => f.set("rating", f.sp.get("rating") === String(r) ? null : String(r))}
            label={`${r}★ et plus`}
          />
        ))}
      </div>
    );
  return (
    <div className="flex flex-wrap gap-2">
      <Pill checked={f.sp.get("stock") === "1"} onToggle={() => f.set("stock", f.sp.get("stock") === "1" ? null : "1")} label="En stock" />
      <Pill checked={f.sp.get("promo") === "1"} onToggle={() => f.set("promo", f.sp.get("promo") === "1" ? null : "1")} label="En promotion" />
    </div>
  );
}

/** Active choices as removable gold pills — the state is never hidden. */
export function CineChips() {
  const f = useFilterParams();
  if (f.chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {f.chips.map((c) => (
        <li key={`${c.key}-${c.value}`}>
          <button
            onClick={() =>
              c.key === "price"
                ? f.update((p) => {
                    p.delete("min");
                    p.delete("max");
                  })
                : f.toggleMulti(c.key, c.value)
            }
            className="group inline-flex min-h-9 items-center gap-2 border border-cine-gold/50 bg-cine-gold/10 px-3 text-[11.5px] capitalize text-cine-gold transition-colors duration-300 hover:bg-cine-gold/20"
          >
            {c.label}
            <CloseIcon size={11} />
          </button>
        </li>
      ))}
      <li>
        <button onClick={f.clearAll} className="ml-1 min-h-9 text-[11.5px] text-cine-faint underline decoration-cine-line underline-offset-4 transition-colors hover:text-cine-ivory">
          Tout effacer
        </button>
      </li>
    </ul>
  );
}

export function CineToolbar({ total }: { total: number }) {
  const f = useFilterParams();
  const active = (f.sp.get("sort") as SortKey | null) ?? "featured";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-y border-cine-line py-4">
      <p className="flex items-baseline gap-3" role="status" aria-live="polite">
        <span className="font-display text-[30px] font-light italic leading-none text-cine-ivory">{total}</span>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-cine-faint">
          référence{total > 1 ? "s" : ""}
        </span>
      </p>
      <label className="flex min-h-12 items-center gap-2.5 border border-cine-line bg-cine-noir-2/60 px-4">
        <SortIcon size={14} className="shrink-0 text-cine-faint" />
        <span className="sr-only">Trier par</span>
        <select
          value={active}
          onChange={(e) => f.set("sort", e.target.value === "featured" ? null : e.target.value)}
          className="max-w-44 cursor-pointer truncate bg-transparent py-2.5 pe-1 text-[12.5px] text-cine-ivory focus:outline-none [&>option]:bg-cine-noir"
          aria-label="Trier par"
        >
          {SORTS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.l}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function CineFilterBar({ facets, total }: { facets: Facets; total: number }) {
  const f = useFilterParams();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<DropKey | null>(null);
  const [sheet, setSheet] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, sheet);

  // One panel at a time; Esc or an outside touch folds it away.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onTap = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onTap);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onTap);
    };
  }, [open ]);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  const dropCount = (k: DropKey): number => {
    const sp = f.sp;
    if (k === "need") return (sp.get("concerns") ?? "").split(",").filter(Boolean).length;
    if (k === "brand") return (sp.get("brands") ?? "").split(",").filter(Boolean).length;
    if (k === "tol") return (sp.get("tol") ?? "").split(",").filter(Boolean).length;
    if (k === "price") return sp.get("min") || sp.get("max") ? 1 : 0;
    if (k === "rating") return sp.get("rating") ? 1 : 0;
    return (sp.get("stock") ? 1 : 0) + (sp.get("promo") ? 1 : 0);
  };

  const available = (k: DropKey) =>
    k === "need" ? facets.concerns.length > 0
    : k === "brand" ? facets.brands.length > 0
    : k === "tol" ? facets.tolerances.length > 0
    : true;

  return (
    <div className="mt-5">
      <div ref={barRef} className="relative">
        {/* Desktop: the row of dropdowns */}
        <div className="hidden flex-wrap items-center gap-2.5 lg:flex">
          {DROPS.filter((d) => available(d.k)).map((d) => {
            const n = dropCount(d.k);
            const isOpen = open === d.k;
            return (
              <button
                key={d.k}
                onClick={() => setOpen(isOpen ? null : d.k)}
                aria-expanded={isOpen}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2.5 border px-4 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-all duration-300",
                  isOpen || n > 0
                    ? "border-cine-gold/70 bg-cine-gold/10 text-cine-gold"
                    : "border-cine-line text-cine-mist hover:border-cine-gold/50 hover:text-cine-ivory",
                )}
              >
                {d.label}
                {n > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center bg-cine-gold px-1 text-[9.5px] tabular-nums text-cine-noir">
                    {n}
                  </span>
                )}
                <ChevronDownIcon size={12} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
              </button>
            );
          })}
          <div className="ms-2 min-w-0 flex-1">
            <CineChips />
          </div>
        </div>

        {/* Phones: the sheet trigger */}
        <div className="flex flex-wrap items-center gap-3 lg:hidden">
          <button
            onClick={() => setSheet(true)}
            className="inline-flex min-h-12 items-center gap-2.5 border border-cine-line px-5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-cine-ivory"
          >
            <FilterIcon size={14} /> Filtrer
            {f.activeCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center bg-cine-gold px-1 text-[9.5px] tabular-nums text-cine-noir">
                {f.activeCount}
              </span>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <CineChips />
          </div>
        </div>

        {/* The floating panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              key={open}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: leave }}
              transition={{ duration: 0.35, ease: EASE_LUXE }}
              className="absolute start-0 top-[calc(100%+0.6rem)] z-30 hidden w-full max-w-2xl border border-cine-line bg-cine-noir-2 p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] lg:block"
            >
              <div className={cn("transition-opacity duration-300", f.pending && "opacity-55")}>
                <DropBody k={open} facets={facets} onDone={() => setOpen(null)} />
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-cine-line pt-4">
                  <p className="text-[12px] text-cine-faint" role="status">
                    {total} référence{total > 1 ? "s" : ""} avec ces critères
                  </p>
                  <div className="flex items-center gap-2.5">
                    {f.activeCount > 0 && (
                      <button onClick={f.clearAll} className="min-h-10 px-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-cine-faint underline decoration-cine-line underline-offset-4 transition-colors hover:text-cine-ivory">
                        Tout effacer
                      </button>
                    )}
                    <button onClick={() => setOpen(null)} className="min-h-10 bg-cine-gold px-5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-cine-noir transition-colors duration-300 hover:bg-cine-ivory">
                      Voir
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The phone sheet */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.button
              key="scrim"
              aria-label="Fermer les filtres"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSheet(false)}
              className="fixed inset-0 z-50 cursor-default bg-cine-noir/70 backdrop-blur-[2px] lg:hidden"
            />
            <motion.div
              key="sheet"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Filtrer la sélection"
              initial={reduce ? { opacity: 0 } : sheetUp.initial}
              animate={reduce ? { opacity: 1 } : sheetUp.animate}
              exit={reduce ? { opacity: 0 } : sheetUp.exit}
              transition={{ duration: 0.45, ease: EASE_LUXE }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col border-t border-cine-line bg-cine-noir lg:hidden"
            >
              <div className="flex items-center justify-between gap-3 border-b border-cine-line px-5 py-4">
                <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cine-ivory">
                  <FilterIcon size={14} /> Filtrer
                  {f.activeCount > 0 && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center bg-cine-gold px-1 text-[9.5px] tabular-nums text-cine-noir">
                      {f.activeCount}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setSheet(false)}
                  aria-label="Fermer les filtres"
                  className="flex h-10 w-10 items-center justify-center border border-cine-line text-cine-ivory"
                >
                  <CloseIcon size={15} />
                </button>
              </div>
              <div className={cn("scrollbar-none flex-1 space-y-7 overflow-y-auto px-5 py-6", f.pending && "opacity-55")}>
                {DROPS.filter((d) => available(d.k)).map((d) => (
                  <fieldset key={d.k}>
                    <legend className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cine-gold">
                      {d.label}
                    </legend>
                    <DropBody k={d.k} facets={facets} />
                  </fieldset>
                ))}
              </div>
              <div className="flex items-center gap-2.5 border-t border-cine-line bg-cine-noir px-5 py-4">
                {f.activeCount > 0 && (
                  <button onClick={f.clearAll} className="min-h-12 flex-1 border border-cine-line text-[10.5px] font-bold uppercase tracking-[0.16em] text-cine-mist">
                    Tout effacer
                  </button>
                )}
                <button onClick={() => setSheet(false)} className="min-h-12 flex-[2] bg-cine-gold text-[10.5px] font-bold uppercase tracking-[0.16em] text-cine-noir">
                  Voir {total} résultat{total > 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
