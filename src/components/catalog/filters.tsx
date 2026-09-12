"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, CloseIcon, FilterIcon, SortIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/client";
import { formatDTShort } from "@/lib/money";
import type { SortKey } from "@/lib/catalog";
import { EASE_LUXE, D, leave, sheetUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";

export type Facets = {
  brands: { slug: string; name: string; n: number }[];
  concerns: { slug: string; name: string; n: number }[];
  tolerances: { key: string; n: number }[];
  priceMin: number;
  priceMax: number;
};

const SORTS: { v: SortKey; l: string }[] = [
  { v: "featured", l: "Notre sélection" },
  { v: "bestsellers", l: "Les plus demandés" },
  { v: "newest", l: "Nouveautés" },
  { v: "price_asc", l: "Prix croissant" },
  { v: "price_desc", l: "Prix décroissant" },
  { v: "rating", l: "Mieux notés" },
];

/**
 * The filter query is the URL. Nothing is duplicated in state; the only local
 * state is the *draft* of the price fields, which is committed on submit. That
 * keeps back/forward navigation, sharing and reloading all truthful.
 */
export function useFilterParams() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const update = useCallback(
    (mut: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(sp.toString());
      mut(p);
      p.delete("page");
      start(() => router.replace(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false }));
    },
    [sp, router, pathname],
  );
  const toggleMulti = (key: string, v: string) =>
    update((p) => {
      const cur = new Set((p.get(key) ?? "").split(",").filter(Boolean));
      if (cur.has(v)) cur.delete(v);
      else cur.add(v);
      if (cur.size) p.set(key, [...cur].join(","));
      else p.delete(key);
    });
  const set = (key: string, v: string | null) => update((p) => (v ? p.set(key, v) : p.delete(key)));
  const clearAll = () => start(() => router.replace(pathname, { scroll: false }));
  const has = (key: string, v: string) => (sp.get(key) ?? "").split(",").includes(v);
  const activeCount = ["brands", "concerns", "tol", "min", "max", "stock", "promo", "rating"].filter((k) => sp.get(k)).length;
  const chips = useMemo(() => {
    const out: { key: string; value: string; label: string }[] = [];
    for (const v of (sp.get("brands") ?? "").split(",").filter(Boolean)) out.push({ key: "brands", value: v, label: v.replace(/-/g, " ") });
    for (const v of (sp.get("concerns") ?? "").split(",").filter(Boolean)) out.push({ key: "concerns", value: v, label: v.replace(/-/g, " ") });
    for (const v of (sp.get("tol") ?? "").split(",").filter(Boolean)) out.push({ key: "tol", value: v, label: v.replace(/([A-Z])/g, " $1").toLowerCase() });
    if (sp.get("stock")) out.push({ key: "stock", value: "1", label: "En stock" });
    if (sp.get("promo")) out.push({ key: "promo", value: "1", label: "En promotion" });
    if (sp.get("rating")) out.push({ key: "rating", value: sp.get("rating") as string, label: `${sp.get("rating")}★ et plus` });
    if (sp.get("min") || sp.get("max"))
      out.push({
        key: "price",
        value: "",
        label: `${sp.get("min") ? formatDTShort(Number(sp.get("min"))) : "0 DT"} – ${
          sp.get("max") ? formatDTShort(Number(sp.get("max"))) : "∞"
        }`,
      });
    return out;
  }, [sp]);
  return { sp, toggleMulti, set, clearAll, has, activeCount, pending, chips, pathname, update };
}

/** A section of the filter rail: an eyebrow, a hairline, and a quiet body. */
function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone/60">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-charcoal">{title}</span>
        <span
          aria-hidden
          className={cn(
            "text-[15px] leading-none text-muted-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open && "rotate-45",
          )}
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: leave }}
            transition={{ duration: 0.42, ease: EASE_LUXE }}
            className="overflow-hidden"
          >
            <div className="pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A filter choice — a hairline row, a quiet tick, a count. */
function Choice({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="group flex min-h-10 cursor-pointer items-center gap-3 py-0.5">
      <span
        aria-hidden
        className={cn(
          "flex h-[15px] w-[15px] shrink-0 items-center justify-center border transition-colors duration-300",
          checked ? "border-ink bg-ink text-paper" : "border-stone-2/70 text-transparent group-hover:border-ink",
        )}
      >
        <CheckIcon size={10} strokeWidth={2.4} />
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={cn("flex-1 text-[13.5px] transition-colors duration-300", checked ? "text-ink" : "text-charcoal group-hover:text-ink")}>
        {label}
      </span>
      {count != null && <span className="text-[11px] tabular-nums text-muted-2">{count}</span>}
    </label>
  );
}

export function FilterPanel({
  facets,
  hideConcerns = false,
  hideBrands = false,
}: {
  facets: Facets;
  hideConcerns?: boolean;
  hideBrands?: boolean;
}) {
  const f = useFilterParams();
  const { copy } = useLocale();
  const m = copy.merch;
  const urlMin = f.sp.get("min") ?? "";
  const urlMax = f.sp.get("max") ?? "";
  const [min, setMin] = useState(urlMin);
  const [max, setMax] = useState(urlMax);
  const [synced, setSynced] = useState(`${urlMin}\u0000${urlMax}`);
  const current = `${urlMin}\u0000${urlMax}`;
  // React's documented "adjust state when a prop changes" pattern: the draft
  // re-syncs during render when the URL changes, with no effect cascade.
  if (current !== synced) {
    setSynced(current);
    setMin(urlMin);
    setMax(urlMax);
  }
  const toDt = (raw: string) => (raw ? String(Number(raw) / 1000) : "");
  const toMillimes = (v: string) => (v ? String(Math.round(Number(v) * 1000)) : null);

  return (
    <div className={cn("transition-opacity duration-300", f.pending && "opacity-55")}>
      <div className="flex items-baseline justify-between gap-4 pb-4">
        <span className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ink">
          <FilterIcon size={14} /> Affiner
          {f.activeCount > 0 && (
            <span className="flex h-[17px] min-w-[17px] items-center justify-center bg-ink px-1 text-[9px] tabular-nums text-paper">
              {f.activeCount}
            </span>
          )}
        </span>
        {f.activeCount > 0 && (
          <button onClick={f.clearAll} className="text-[11px] text-muted underline decoration-stone-2 underline-offset-4 hover:text-ink">
            Tout effacer
          </button>
        )}
      </div>

      <Section title="Disponibilité">
        <Choice
          checked={f.sp.get("stock") === "1"}
          onChange={() => f.set("stock", f.sp.get("stock") === "1" ? null : "1")}
          label="En stock uniquement"
        />
        <Choice
          checked={f.sp.get("promo") === "1"}
          onChange={() => f.set("promo", f.sp.get("promo") === "1" ? null : "1")}
          label="En promotion"
        />
      </Section>

      {/* Tolerances appear only where the officine actually verified them —
          a zero-count key is not offered at all. This is the whole point. */}
      {facets.tolerances.length > 0 && (
        <Section title={m.filterTol}>
          {facets.tolerances.map((t) => (
            <Choice
              key={t.key}
              checked={f.has("tol", t.key)}
              onChange={() => f.toggleMulti("tol", t.key)}
              label={m.tol[t.key as keyof typeof m.tol] ?? t.key}
              count={t.n}
            />
          ))}
        </Section>
      )}

      {!hideConcerns && facets.concerns.length > 0 && (
        <Section title="Besoins">
          {facets.concerns.map((c) => (
            <Choice
              key={c.slug}
              checked={f.has("concerns", c.slug)}
              onChange={() => f.toggleMulti("concerns", c.slug)}
              label={c.name}
              count={c.n}
            />
          ))}
        </Section>
      )}

      {!hideBrands && facets.brands.length > 0 && (
        <Section title="Laboratoires">
          <div className="scrollbar-none max-h-72 space-y-0 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <Choice
                key={b.slug}
                checked={f.has("brands", b.slug)}
                onChange={() => f.toggleMulti("brands", b.slug)}
                label={b.name}
                count={b.n}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Prix">
        <p className="mb-3 text-[11.5px] text-muted-2">
          Dans ce rayon : {formatDTShort(facets.priceMin)} – {formatDTShort(facets.priceMax)}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            f.set("min", toMillimes(min));
            f.set("max", toMillimes(max));
          }}
          className="flex items-center gap-2"
        >
          <input
            inputMode="decimal"
            value={min ? toDt(min) : ""}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Min"
            aria-label="Prix minimum en dinars"
            className="field h-11 min-h-0 px-3 text-[13px]"
          />
          <span className="text-muted-2">–</span>
          <input
            inputMode="decimal"
            value={max ? toDt(max) : ""}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Max"
            aria-label="Prix maximum en dinars"
            className="field h-11 min-h-0 px-3 text-[13px]"
          />
          <button className="btn-secondary h-11 min-h-0 shrink-0 px-3.5 text-[10px]">OK</button>
        </form>
      </Section>

      <Section title="Note minimale">
        <div className="flex gap-2">
          {[4, 3].map((r) => (
            <button
              key={r}
              onClick={() => f.set("rating", f.sp.get("rating") === String(r) ? null : String(r))}
              className={cn(
                "min-h-11 border px-3.5 text-[12px] transition-colors duration-300",
                f.sp.get("rating") === String(r)
                  ? "border-ink bg-ink text-paper"
                  : "border-stone-2/60 text-charcoal hover:border-ink",
              )}
            >
              {r}★ et plus
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

/** Sorting — presented as a quiet line of words, not as a boxed select. */
export function SortBar({ total }: { total: number }) {
  const f = useFilterParams();
  const active = (f.sp.get("sort") as SortKey) ?? "featured";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-stone/60 pb-4">
      <p className="flex items-baseline gap-2.5">
        <span className="font-display text-[19px] italic text-ink">{total}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
          référence{total > 1 ? "s" : ""}
        </span>
      </p>
      <label className="flex items-center gap-2.5">
        <SortIcon size={14} className="text-muted-2" />
        <span className="sr-only">Trier par</span>
        <select
          value={active}
          onChange={(e) => f.set("sort", e.target.value === "featured" ? null : e.target.value)}
          className="min-h-11 bg-transparent pr-4 text-[12.5px] text-ink focus:outline-none"
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

/** The active filters, shown as removable words so the state is never hidden. */
export function ActiveChips() {
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
            className="group inline-flex min-h-9 items-center gap-2 border border-stone-2/55 px-3 text-[11.5px] capitalize text-charcoal transition-colors duration-300 hover:border-ink hover:text-ink"
          >
            {c.label}
            <CloseIcon size={11} className="text-muted-2 transition-colors group-hover:text-ink" />
          </button>
        </li>
      ))}
      <li>
        <button onClick={f.clearAll} className="ml-1 text-[11.5px] text-muted underline decoration-stone-2 underline-offset-4 hover:text-ink">
          Tout effacer
        </button>
      </li>
    </ul>
  );
}

/**
 * The mobile filter sheet — full height, thumb-reachable, with the count of
 * results always visible on the confirm bar so the visitor knows what the
 * choices are about to produce.
 */
export function MobileFilters(props: { facets: Facets; hideConcerns?: boolean; hideBrands?: boolean; total: number }) {
  const [open, setOpen] = useState(false);
  const f = useFilterParams();
  const reduce = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-2.5 border border-stone-2/55 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink lg:hidden"
      >
        <FilterIcon size={14} /> Affiner
        {f.activeCount > 0 && (
          <span className="flex h-[17px] min-w-[17px] items-center justify-center bg-ink px-1 text-[9px] text-paper">
            {f.activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="scrim"
              aria-label="Fermer les filtres"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: D.fast }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="sheet"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Affiner la sélection"
              variants={sheetUp}
              initial={reduce ? false : "initial"}
              animate="animate"
              exit="exit"
              className="fixed inset-x-0 bottom-0 z-[80] flex max-h-[92dvh] flex-col overflow-hidden border-t border-stone-2/30 bg-paper lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-stone/60 px-5 py-3.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink">Affiner</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="flex h-11 w-11 items-center justify-center text-muted"
                >
                  <CloseIcon size={19} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                <FilterPanel {...props} />
              </div>
              <div
                className="border-t border-stone/60 bg-cream/80 px-5 py-4 backdrop-blur-xl"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <button onClick={() => setOpen(false)} className="btn-primary w-full">
                  Voir les {props.total} référence{props.total > 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
