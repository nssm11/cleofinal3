"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, CloseIcon, FilterIcon, SortIcon } from "@/components/icons";
import { formatDTShort } from "@/lib/money";
import type { SortKey } from "@/lib/catalog";
import { EASE_LUXE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Sheet, Menu, MenuItem } from "@/components/ui/kit";

/* ══════════════════════════════════════════════════════════════════════════
   LE FILTRE
   ──────────────────────────────────────────────────────────────────────────
   The query string is the only state. Nothing is duplicated in React: the URL
   *is* the filter set, which keeps back, forward, sharing and reloading all
   truthful — and lets the server render the same list the visitor is reading.

   The rail is an instrument: a hairline per section, a measured count beside
   every choice, and a price range you type rather than drag. On phones the
   same rail becomes a sheet that rises from the bottom edge.
   ══════════════════════════════════════════════════════════════════════════ */

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

const TOL_LABELS: Record<string, string> = {
  sansParfum: "Sans parfum",
  grossesse: "Compatible grossesse",
  peauAtopique: "Peaux atopiques",
  yeuxSensibles: "Yeux sensibles",
};

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
    for (const v of (sp.get("brands") ?? "").split(",").filter(Boolean))
      out.push({ key: "brands", value: v, label: v.replace(/-/g, " ") });
    for (const v of (sp.get("concerns") ?? "").split(",").filter(Boolean))
      out.push({ key: "concerns", value: v, label: v.replace(/-/g, " ") });
    for (const v of (sp.get("tol") ?? "").split(",").filter(Boolean))
      out.push({ key: "tol", value: v, label: TOL_LABELS[v] ?? v });
    if (sp.get("stock")) out.push({ key: "stock", value: "1", label: "En stock" });
    if (sp.get("promo")) out.push({ key: "promo", value: "1", label: "En promotion" });
    if (sp.get("rating")) out.push({ key: "rating", value: sp.get("rating") as string, label: `${sp.get("rating")}★ et plus` });
    if (sp.get("min") || sp.get("max"))
      out.push({
        key: "price",
        value: "",
        label: `${sp.get("min") ? formatDTShort(Number(sp.get("min"))) : "0 DT"} – ${sp.get("max") ? formatDTShort(Number(sp.get("max"))) : "∞"}`,
      });
    return out;
  }, [sp]);

  return { sp, toggleMulti, set, clearAll, has, activeCount, pending, chips, pathname, update };
}

/* ── The rail ─────────────────────────────────────────────────────────────── */

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  return (
    <div className="border-t border-rule">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex min-h-12 w-full items-center justify-between gap-4 text-start"
      >
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-graphite transition-colors group-hover:text-ink">
          {title}
        </span>
        <span
          aria-hidden
          className={cn(
            "relative h-3 w-3 shrink-0 transition-transform duration-500 ease-[var(--ease-luxe)]",
            open && "rotate-90",
          )}
        >
          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
          <span className={cn("absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink transition-opacity", open && "opacity-0")} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: EASE_LUXE }}
            className="overflow-hidden"
          >
            <div className="pb-6 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
    <label className="group flex min-h-9 cursor-pointer items-center gap-3">
      <span
        aria-hidden
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-300",
          checked ? "border-ink bg-ink text-alabaster" : "border-rule-strong text-transparent group-hover:border-ink",
        )}
      >
        <CheckIcon size={10} />
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={cn("flex-1 text-[0.8125rem] transition-colors", checked ? "text-ink" : "text-graphite group-hover:text-ink")}>
        {label}
      </span>
      {count !== undefined && <span className="num text-[0.625rem] text-faint">{count}</span>}
    </label>
  );
}

function PriceRange({ facets }: { facets: Facets }) {
  const { sp, update } = useFilterParams();
  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");
  return (
    <div>
      <div className="flex items-end gap-3">
        <label className="flex-1">
          <span className="micro mb-1.5 block text-ash">De</span>
          <input
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
            placeholder={String(Math.floor(facets.priceMin / 1000))}
            className="field num text-[0.8125rem]"
          />
        </label>
        <label className="flex-1">
          <span className="micro mb-1.5 block text-ash">À</span>
          <input
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
            placeholder={String(Math.ceil(facets.priceMax / 1000))}
            className="field num text-[0.8125rem]"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() =>
          update((p) => {
            if (min) p.set("min", String(Number(min) * 1000));
            else p.delete("min");
            if (max) p.set("max", String(Number(max) * 1000));
            else p.delete("max");
          })
        }
        className="btn-line mt-4 w-full"
      >
        Appliquer
      </button>
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-9 w-full items-center justify-between gap-3 border px-3 transition-colors",
        active ? "border-ink bg-ink text-alabaster" : "border-rule-strong text-graphite hover:border-ink hover:text-ink",
      )}
    >
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em]">{label}</span>
      <span
        aria-hidden
        className={cn("h-2 w-2 rounded-full transition-colors", active ? "bg-cinabre-3" : "bg-rule-strong")}
      />
    </button>
  );
}

export function FilterPanel({ facets, hideBrands, hideConcerns }: { facets: Facets; hideBrands?: boolean; hideConcerns?: boolean }) {
  const { sp, toggleMulti, set, has, clearAll, activeCount } = useFilterParams();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 pb-4">
        <p className="micro text-ink">Filtrer</p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-cinabre transition-colors hover:text-cinabre-2"
          >
            Effacer ({activeCount})
          </button>
        )}
      </div>

      <Section title="Disponibilité">
        <div className="flex flex-col gap-2">
          <Toggle label="En stock" active={!!sp.get("stock")} onClick={() => set("stock", sp.get("stock") ? null : "1")} />
          <Toggle label="En promotion" active={!!sp.get("promo")} onClick={() => set("promo", sp.get("promo") ? null : "1")} />
        </div>
      </Section>

      <Section title="Prix">
        <PriceRange facets={facets} />
      </Section>

      {!hideConcerns && facets.concerns.length > 0 && (
        <Section title="Par besoin">
          {facets.concerns.map((c) => (
            <Choice key={c.slug} checked={has("concerns", c.slug)} onChange={() => toggleMulti("concerns", c.slug)} label={c.name} count={c.n} />
          ))}
        </Section>
      )}

      <Section title="Tolérance">
        {facets.tolerances.map((t) => (
          <Choice key={t.key} checked={has("tol", t.key)} onChange={() => toggleMulti("tol", t.key)} label={TOL_LABELS[t.key] ?? t.key} count={t.n} />
        ))}
      </Section>

      {!hideBrands && facets.brands.length > 0 && (
        <Section title="Laboratoires" defaultOpen={false}>
          {facets.brands.map((b) => (
            <Choice key={b.slug} checked={has("brands", b.slug)} onChange={() => toggleMulti("brands", b.slug)} label={b.name} count={b.n} />
          ))}
        </Section>
      )}

      <Section title="Note" defaultOpen={false}>
        {[4, 3, 2].map((r) => (
          <Choice
            key={r}
            checked={sp.get("rating") === String(r)}
            onChange={() => set("rating", sp.get("rating") === String(r) ? null : String(r))}
            label={`${r}★ et plus`}
          />
        ))}
      </Section>
    </div>
  );
}

/* ── The sort rail ────────────────────────────────────────────────────────── */

export function SortBar({ total, basePath }: { total: number; basePath?: string }) {
  const { sp, set } = useFilterParams();
  const current = (sp.get("sort") ?? "featured") as SortKey;
  const label = SORTS.find((s) => s.v === current)?.l ?? "Notre sélection";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-3">
      <p className="num text-[0.6875rem] text-graphite">
        {total} <span className="text-ash">référence{total > 1 ? "s" : ""}</span>
      </p>
      <Menu
        align="end"
        trigger={
          <button
            type="button"
            className="flex min-h-9 items-center gap-2.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-graphite transition-colors hover:text-ink"
          >
            <SortIcon size={13} />
            {label}
          </button>
        }
      >
        {SORTS.map((s) => (
          <MenuItem key={s.v} onSelect={() => set("sort", s.v === "featured" ? null : s.v)}>
            <span className={cn("flex-1", current === s.v && "text-cinabre")}>{s.l}</span>
            {current === s.v && <CheckIcon size={12} />}
          </MenuItem>
        ))}
      </Menu>
      {basePath ? <span className="sr-only">{basePath}</span> : null}
    </div>
  );
}

/* ── The chips — what is currently applied ────────────────────────────────── */

export function ActiveChips() {
  const { chips, toggleMulti, set, clearAll } = useFilterParams();
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.key}-${c.value}`}
          type="button"
          data-active="true"
          className="chip"
          onClick={() => {
            if (c.key === "price") {
              set("min", null);
              set("max", null);
            } else if (c.key === "stock" || c.key === "promo" || c.key === "rating") {
              set(c.key, null);
            } else {
              toggleMulti(c.key, c.value);
            }
          }}
        >
          {c.label}
          <CloseIcon size={10} />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ash transition-colors hover:text-ink"
      >
        Tout effacer
      </button>
    </div>
  );
}

/* ── Phones: the same rail, rising from the bottom edge ───────────────────── */

export function MobileFilters({ facets, hideBrands, hideConcerns, total }: { facets: Facets; hideBrands?: boolean; hideConcerns?: boolean; total: number }) {
  const [open, setOpen] = useState(false);
  const { activeCount } = useFilterParams();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 flex-1 items-center justify-center gap-2.5 border border-rule-strong bg-alabaster font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink"
      >
        <FilterIcon size={13} />
        Filtrer
        {activeCount > 0 && <span className="num text-cinabre">{activeCount}</span>}
      </button>
      <span className="num flex min-h-11 items-center px-1 text-[0.625rem] text-graphite">{total} réf.</span>

      <Sheet open={open} onOpenChange={setOpen} side="bottom" title="Filtrer" description={`${total} références`}>
        <div className="px-5 pb-28 pt-2">
          <FilterPanel facets={facets} hideBrands={hideBrands} hideConcerns={hideConcerns} />
        </div>
        <div className="sticky bottom-0 border-t border-rule bg-porcelain px-5 py-4">
          <button type="button" onClick={() => setOpen(false)} className="btn-solid w-full">
            Voir les résultats
          </button>
        </div>
      </Sheet>
    </>
  );
}
