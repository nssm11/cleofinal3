"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, CloseIcon, FilterIcon } from "@/components/icons";
import { useFilterParams, type Facets } from "@/components/catalog/filters";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatDTShort } from "@/lib/money";
import { cn } from "@/lib/utils";
import { TOL_LABELS } from "./urls";
import { D, leave } from "@/lib/motion";

/**
 * VisageFilters — the counter's drawer.
 *
 * The house rail stacked accordion on accordion inside a white column, held
 * hostage beside the shelf. The Visage workspace keeps no column: refinement
 * happens in a drawer that slides from the near edge on desktop and lifts
 * from the floor on phones. The contract with the house is unchanged — the
 * query string is the state (`useFilterParams`), the server re-renders the
 * shelf — but every control is re-cut for a workspace: switch rows for the
 * two decisions people actually take (stock, promo), a searchable ledger for
 * the labs, chips for needs and tolerances, one honest price spread. The old
 * rail's boxes, accordions and hairline columns are not in here.
 */


/** One panel, two postures: drawer on the desk, sheet on the phone. Only the
 *  entrance axis is measured in JS — the layout itself stays pure CSS. */
const wideQuery = () => window.matchMedia("(min-width: 1024px)");

function subscribeWide(cb: () => void) {
  const mq = wideQuery();
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Panel placement (left drawer vs bottom sheet) tracks a media query as an
 *  external store — no setState-in-effect cascades, server snapshot is false. */
function useIsWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => wideQuery().matches,
    () => false,
  );
}

const noopSubscribe = () => () => {};
/** SSR gate for the body portal: false on the server, true once hydrated. */
const useMounted = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

function DrawerTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-6 flex items-baseline gap-3 text-[9.5px] font-bold uppercase tracking-[0.24em] text-muted">
      <span aria-hidden className="h-px w-4 shrink-0 bg-champagne-3" />
      {children}
    </p>
  );
}

function SwitchRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="group flex min-h-12 cursor-pointer items-center justify-between gap-4 border-b border-stone/50 py-1 last:border-b-0">
      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate text-[13px] transition-colors", checked ? "text-ink" : "text-charcoal group-hover:text-ink")}>
          {label}
        </span>
        {hint && <span className="truncate text-[11px] text-muted-2">{hint}</span>}
      </span>
      <span aria-hidden className="relative inline-flex shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <span
          className={cn(
            "flex h-5.5 w-10 items-center border p-[2px] transition-colors duration-300",
            checked ? "border-ink bg-ink" : "border-stone-2/70 bg-marble group-hover:border-ink/50",
          )}
        >
          <span
            className={cn(
              "h-4 w-4 bg-paper transition-transform duration-300",
              checked && "translate-x-[18px] bg-champagne-3",
            )}
          />
        </span>
      </span>
    </label>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 border px-3 text-[12px] transition-colors duration-300",
        active
          ? "border-ink bg-ink text-paper"
          : "border-stone-2/60 text-charcoal hover:border-ink hover:text-ink",
      )}
    >
      {active && <CheckIcon size={11} strokeWidth={2.6} aria-hidden />}
      {children}
      {count != null && <span className={cn("text-[10px] tabular-nums", active ? "text-paper/60" : "text-muted-2")}>{count}</span>}
    </button>
  );
}

function FilterBody({ facets }: { facets: Facets }) {
  const f = useFilterParams();
  const [labQuery, setLabQuery] = useState("");
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
  const labs = useMemo(() => {
    const q = labQuery.trim().toLowerCase();
    return q ? facets.brands.filter((b) => b.name.toLowerCase().includes(q)) : facets.brands;
  }, [facets.brands, labQuery]);

  return (
    <div className={cn("pb-2 transition-opacity duration-300", f.pending && "opacity-55")}>
      <DrawerTitle>Le comptoir, en deux gestes</DrawerTitle>
      <SwitchRow
        checked={f.sp.get("stock") === "1"}
        onChange={() => f.set("stock", f.sp.get("stock") === "1" ? null : "1")}
        label="En stock, maintenant"
        hint="Retirable à Ezzahra ou Hammam-Lif sous 2 h"
      />
      <SwitchRow
        checked={f.sp.get("promo") === "1"}
        onChange={() => f.set("promo", f.sp.get("promo") === "1" ? null : "1")}
        label="En promotion"
        hint="Le prix barré est le prix habituel du comptoir"
      />

      {facets.concerns.length > 0 && (
        <>
          <DrawerTitle>Votre peau demande</DrawerTitle>
          <div className="flex flex-wrap gap-2">
            {facets.concerns.map((c) => (
              <ToggleChip
                key={c.slug}
                active={f.has("concerns", c.slug)}
                count={c.n}
                onClick={() => f.toggleMulti("concerns", c.slug)}
              >
                {c.name}
              </ToggleChip>
            ))}
          </div>
        </>
      )}

      {facets.brands.length > 0 && (
        <>
          <DrawerTitle>Les maisons du rayon</DrawerTitle>
          <label className="mb-2 flex min-h-11 items-center gap-2.5 border-b border-stone-2/60 px-1 focus-within:border-champagne">
            <span className="sr-only">Chercher un laboratoire</span>
            <input
              value={labQuery}
              onChange={(e) => setLabQuery(e.target.value)}
              placeholder="Un nom de laboratoire…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted-2 focus:outline-none"
            />
            {labQuery && (
              <button type="button" onClick={() => setLabQuery("")} aria-label="Effacer" className="text-muted-2 hover:text-ink">
                <CloseIcon size={13} />
              </button>
            )}
          </label>
          <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {labs.map((b) => (
              <label
                key={b.slug}
                className={cn(
                  "group flex min-h-10 cursor-pointer items-center gap-3 px-1.5 transition-colors",
                  f.has("brands", b.slug) ? "bg-champagne-soft/70" : "hover:bg-cream",
                )}
              >
                <input
                  type="checkbox"
                  checked={f.has("brands", b.slug)}
                  onChange={() => f.toggleMulti("brands", b.slug)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
                    f.has("brands", b.slug) ? "border-ink bg-ink text-paper" : "border-stone-2/80 text-transparent group-hover:border-ink",
                  )}
                >
                  <CheckIcon size={10} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-charcoal group-hover:text-ink">{b.name}</span>
                <span className="text-[10.5px] tabular-nums text-muted-2">{b.n}</span>
              </label>
            ))}
            {labs.length === 0 && <p className="px-1.5 py-3 text-[12px] text-muted-2">Aucune maison ne porte ce nom ici.</p>}
          </div>
        </>
      )}

      {facets.tolerances.length > 0 && (
        <>
          <DrawerTitle>Ce que la formule ne contient pas</DrawerTitle>
          <div className="flex flex-wrap gap-2">
            {facets.tolerances.map((t) => (
              <ToggleChip key={t.key} active={f.has("tol", t.key)} count={t.n} onClick={() => f.toggleMulti("tol", t.key)}>
                {TOL_LABELS[t.key] ?? t.key}
              </ToggleChip>
            ))}
          </div>
        </>
      )}

      <DrawerTitle>Prix, dans ce rayon</DrawerTitle>
      <p className="mb-2 text-[11px] text-muted-2">
        Le comptoir pratique de {formatDTShort(facets.priceMin)} à {formatDTShort(facets.priceMax)}.
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
          className="field-line min-h-11 w-0 flex-1 text-[13px]"
        />
        <span className="text-muted-2" aria-hidden>—</span>
        <input
          inputMode="decimal"
          value={max ? toDt(max) : ""}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Max"
          aria-label="Prix maximum en dinars"
          className="field-line min-h-11 w-0 flex-1 text-[13px]"
        />
        <button type="submit" className="btn-secondary min-h-11 shrink-0 px-4 text-[10px]">
          Dire
        </button>
      </form>

      <DrawerTitle>Le regard des clientes</DrawerTitle>
      <div className="flex flex-wrap gap-2">
        {[4, 3].map((r) => (
          <ToggleChip
            key={r}
            active={f.sp.get("rating") === String(r)}
            onClick={() => f.set("rating", f.sp.get("rating") === String(r) ? null : String(r))}
          >
            {r}★ et plus
          </ToggleChip>
        ))}
      </div>
    </div>
  );
}

function DrawerHeader({ onClose, activeCount, onClear }: { onClose: () => void; activeCount: number; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone/60 bg-cream/60 px-5 py-3">
      <span className="flex items-baseline gap-3">
        <span className="eyebrow text-ink">Affiner le rayon</span>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-[11px] text-muted underline decoration-stone-2 underline-offset-4 hover:text-ink">
            Tout effacer ({activeCount})
          </button>
        )}
      </span>
      <button onClick={onClose} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink">
        <CloseIcon size={18} />
      </button>
    </div>
  );
}

export function VisageFilters({ facets, total }: { facets: Facets; total: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const wide = useIsWide();
  const f = useFilterParams();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  // The page wrapper is animated by the house veil, whose will-change
  // captures any fixed child — so the drawer is portalled to the body.
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2.5 border border-stone-2/60 px-3.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:border-ink hover:bg-cream lg:px-4"
      >
        <FilterIcon size={13} />
        <span className="lg:hidden">Affiner</span>
        <span className="hidden lg:inline">Affiner le rayon</span>
        {f.activeCount > 0 && (
          <span className="flex h-[17px] min-w-[17px] items-center justify-center bg-ink px-1 text-[9px] tabular-nums text-paper">
            {f.activeCount}
          </span>
        )}
      </button>

      {mounted ? createPortal(
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
              className="fixed inset-0 z-[70] bg-ink/45 backdrop-blur-sm"
            />
            <motion.div
              key="panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Affiner le rayon Visage"
              initial={reduce ? false : wide ? { x: "-100%" } : { y: "100%" }}
              animate={wide ? { x: 0 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : wide ? { x: "-100%", transition: leave } : { y: "100%", transition: leave }}
              transition={{ type: "spring", stiffness: 170, damping: 30, mass: 1 }}
              className={cn(
                "fixed z-[80] flex flex-col overflow-hidden bg-paper shadow-float",
                wide
                  ? "inset-y-0 left-0 w-[400px] max-w-[92vw] border-r border-stone-2/40"
                  : "inset-x-0 bottom-0 max-h-[92dvh] border-t border-stone-2/30",
              )}
            >
              <DrawerHeader onClose={() => setOpen(false)} activeCount={f.activeCount} onClear={f.clearAll} />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
                <FilterBody facets={facets} />
              </div>
              <div
                className="border-t border-stone/60 bg-cream/70 px-5 py-4 backdrop-blur-xl"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <button onClick={() => setOpen(false)} className="btn-primary w-full">
                  Voir les {total} référence{total > 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
        </AnimatePresence>, document.body) : null}
    </>
  );
}
