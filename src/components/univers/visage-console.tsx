"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useFilterParams, type Facets } from "@/components/catalog/filters";
import { CheckIcon, ChevronDownIcon, CloseIcon, FilterIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/client";
import { formatDTShort } from "@/lib/money";
import { EASE_LUXE, leave, sheetUp } from "@/lib/motion";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

/**
 * VISAGE CONSOLE — filters as a countertop, not a sidebar.
 *
 * The old shelf filtered from a sticky side rail of hairline rows. This
 * console unfolds from the top: a button row with the active choices as
 * removable pills, an expanding panel on desktop, a bottom sheet on phones.
 * The query contract is identical (same `useFilterParams` hook, same keys),
 * so URLs, sharing and back/forward behave exactly as before.
 */

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
          ? "border-ink bg-ink text-paper shadow-[0_10px_20px_-12px_rgba(28,25,23,0.6)]"
          : "border-ink/15 bg-paper text-charcoal hover:border-ink hover:text-ink",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center border transition-colors",
          checked ? "border-paper/60 text-paper" : "border-ink/25 text-transparent",
        )}
      >
        <CheckIcon size={9} strokeWidth={3} />
      </span>
      <span className="max-w-44 truncate">{label}</span>
      {count != null && <span className={cn("text-[11px] tabular-nums", checked ? "text-paper/70" : "text-muted-2")}>{count}</span>}
    </button>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 border border-ink/10 bg-paper p-4">
      <legend className="bg-paper px-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Every filter the rail offered, re-seated as console fields. */
function ConsoleFields({ facets, onDone }: { facets: Facets; onDone?: () => void }) {
  const f = useFilterParams();
  const { copy } = useLocale();
  const m = copy.merch;
  const urlMin = f.sp.get("min") ?? "";
  const urlMax = f.sp.get("max") ?? "";
  const [min, setMin] = useState(urlMin);
  const [max, setMax] = useState(urlMax);
  const [synced, setSynced] = useState(`${urlMin}\u0000${urlMax}`);
  const current = `${urlMin}\u0000${urlMax}`;
  // Same render-time draft re-sync as the rail: the URL stays the truth.
  if (current !== synced) {
    setSynced(current);
    setMin(urlMin);
    setMax(urlMax);
  }
  const toDt = (raw: string) => (raw ? String(Number(raw) / 1000) : "");
  const toMillimes = (v: string) => (v ? String(Math.round(Number(v) * 1000)) : null);

  return (
    <div className={cn("transition-opacity duration-300", f.pending && "opacity-55")}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Fieldset title="Disponibilité">
          <div className="flex flex-wrap gap-2">
            <Pill
              checked={f.sp.get("stock") === "1"}
              onToggle={() => f.set("stock", f.sp.get("stock") === "1" ? null : "1")}
              label="En stock"
            />
            <Pill
              checked={f.sp.get("promo") === "1"}
              onToggle={() => f.set("promo", f.sp.get("promo") === "1" ? null : "1")}
              label="En promotion"
            />
          </div>
        </Fieldset>

        {facets.brands.length > 0 && (
          <Fieldset title="Laboratoires">
            <div className="scrollbar-none -m-1 flex max-h-44 flex-wrap gap-2 overflow-y-auto p-1">
              {facets.brands.map((b) => (
                <Pill key={b.slug} checked={f.has("brands", b.slug)} onToggle={() => f.toggleMulti("brands", b.slug)} label={b.name} count={b.n} />
              ))}
            </div>
          </Fieldset>
        )}

        {facets.concerns.length > 0 && (
          <Fieldset title="Besoins">
            <div className="scrollbar-none -m-1 flex max-h-44 flex-wrap gap-2 overflow-y-auto p-1">
              {facets.concerns.map((c) => (
                <Pill key={c.slug} checked={f.has("concerns", c.slug)} onToggle={() => f.toggleMulti("concerns", c.slug)} label={c.name} count={c.n} />
              ))}
            </div>
          </Fieldset>
        )}

        {facets.tolerances.length > 0 && (
          <Fieldset title={m.filterTol}>
            <div className="flex flex-wrap gap-2">
              {facets.tolerances.map((t) => (
                <Pill
                  key={t.key}
                  checked={f.has("tol", t.key)}
                  onToggle={() => f.toggleMulti("tol", t.key)}
                  label={m.tol[t.key as keyof typeof m.tol] ?? t.key}
                  count={t.n}
                />
              ))}
            </div>
          </Fieldset>
        )}

        <Fieldset title="Prix">
          <p className="mb-3 text-[11.5px] text-muted-2">
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
              className="field h-11 min-h-0 min-w-0 flex-1 px-3 text-[13px]"
            />
            <span className="shrink-0 text-muted-2">–</span>
            <input
              inputMode="decimal"
              value={max ? toDt(max) : ""}
              onChange={(e) => setMax(e.target.value)}
              placeholder="Max"
              aria-label="Prix maximum en dinars"
              className="field h-11 min-h-0 min-w-0 flex-1 px-3 text-[13px]"
            />
            <button className="btn-secondary h-11 min-h-0 shrink-0 px-3.5 text-[10px]">OK</button>
          </form>
        </Fieldset>

        <Fieldset title="Note minimale">
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
        </Fieldset>
      </div>
    </div>
  );
}

/** Active choices as removable pills — the state is never hidden. */
export function VisageChips() {
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
            className="group inline-flex min-h-9 items-center gap-2 bg-ink px-3 text-[11.5px] capitalize text-paper transition-opacity duration-300 hover:opacity-85"
          >
            {c.label}
            <CloseIcon size={11} className="text-paper/70" />
          </button>
        </li>
      ))}
      <li>
        <button onClick={f.clearAll} className="ml-1 min-h-9 text-[11.5px] text-muted underline decoration-stone-2 underline-offset-4 hover:text-ink">
          Tout effacer
        </button>
      </li>
    </ul>
  );
}

export function VisageFilterConsole({ facets, total }: { facets: Facets; total: number }) {
  const f = useFilterParams();
  const reduce = useReducedMotion();
  const [panel, setPanel] = useState(false);
  const [sheet, setSheet] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, sheet);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  const countBadge =
    f.activeCount > 0 ? (
      <span className="flex h-[19px] min-w-[19px] items-center justify-center bg-champagne px-1.5 text-[10px] font-bold tabular-nums text-ink">
        {f.activeCount}
      </span>
    ) : null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Desktop: unfold the countertop panel */}
        <button
          onClick={() => setPanel((v) => !v)}
          aria-expanded={panel}
          className={cn(
            "hidden min-h-11 items-center gap-2.5 border px-4 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-300 lg:inline-flex",
            panel ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink hover:border-ink",
          )}
        >
          <FilterIcon size={14} /> Affiner {countBadge}
          <ChevronDownIcon size={13} className={cn("transition-transform duration-300", panel && "rotate-180")} />
        </button>
        {/* Phones: the sheet */}
        <button
          onClick={() => setSheet(true)}
          className="inline-flex min-h-11 items-center gap-2.5 border border-ink/20 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink lg:hidden"
        >
          <FilterIcon size={14} /> Affiner {countBadge}
        </button>
        <div className="min-w-0 flex-1">
          <VisageChips />
        </div>
      </div>

      {/* The countertop — desktop panel */}
      <AnimatePresence initial={false}>
        {panel && (
          <motion.div
            key="panel"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0, transition: leave }}
            transition={{ duration: 0.45, ease: EASE_LUXE }}
            className="hidden overflow-hidden lg:block"
          >
            <div className="mt-4 border border-ink/12 bg-cream/50 p-4 sm:p-5">
              <ConsoleFields facets={facets} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
                <p className="text-[12px] text-muted" role="status">
                  {total} référence{total > 1 ? "s" : ""} avec ces critères
                </p>
                <div className="flex items-center gap-2.5">
                  {f.activeCount > 0 && (
                    <button onClick={f.clearAll} className="btn-ghost min-h-11 px-4 text-[11px]">
                      Tout effacer
                    </button>
                  )}
                  <button onClick={() => setPanel(false)} className="btn-primary min-h-11 px-5 text-[11px]">
                    Voir les résultats
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The countertop — phone sheet */}
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
              className="fixed inset-0 z-50 cursor-default bg-ink/55 backdrop-blur-[2px] lg:hidden"
            />
            <motion.div
              key="sheet"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Affiner la sélection"
              initial={reduce ? { opacity: 0 } : sheetUp.initial}
              animate={reduce ? { opacity: 1 } : sheetUp.animate}
              exit={reduce ? { opacity: 0 } : sheetUp.exit}
              transition={{ duration: 0.45, ease: EASE_LUXE }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col border-t border-ink/15 bg-paper lg:hidden"
            >
              <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
                <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                  <FilterIcon size={14} /> Affiner {countBadge}
                </p>
                <button
                  onClick={() => setSheet(false)}
                  aria-label="Fermer les filtres"
                  className="flex h-10 w-10 items-center justify-center border border-ink/15 text-ink"
                >
                  <CloseIcon size={15} />
                </button>
              </div>
              <div className="scrollbar-none flex-1 overflow-y-auto px-5 py-5">
                <ConsoleFields facets={facets} onDone={() => setSheet(false)} />
              </div>
              <div className="flex items-center gap-2.5 border-t border-ink/10 bg-paper px-5 py-4">
                {f.activeCount > 0 && (
                  <button onClick={f.clearAll} className="btn-ghost min-h-12 flex-1 text-[11px]">
                    Tout effacer
                  </button>
                )}
                <button onClick={() => setSheet(false)} className="btn-primary min-h-12 flex-[2] text-[11px]">
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
