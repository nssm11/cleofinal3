"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/client";
import { formatDTShort } from "@/lib/money";
import type { SortKey } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { X, SlidersHorizontal } from "lucide-react";

export type Facets = {
  brands: { slug: string; name: string; n: number }[];
  concerns: { slug: string; name: string; n: number }[];
  tolerances: { key: string; n: number }[];
  priceMin: number;
  priceMax: number;
};

const SORTS: { v: SortKey; l: string }[] = [
  { v: "featured", l: "Sélection" },
  { v: "bestsellers", l: "Populaires" },
  { v: "newest", l: "Nouveautés" },
  { v: "price_asc", l: "Prix ↑" },
  { v: "price_desc", l: "Prix ↓" },
  { v: "rating", l: "Mieux notés" },
];

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
  const chips: { key: string; value: string; label: string }[] = [];
  for (const v of (sp.get("brands") ?? "").split(",").filter(Boolean)) chips.push({ key: "brands", value: v, label: v });
  for (const v of (sp.get("concerns") ?? "").split(",").filter(Boolean)) chips.push({ key: "concerns", value: v, label: v });
  for (const v of (sp.get("tol") ?? "").split(",").filter(Boolean)) chips.push({ key: "tol", value: v, label: v });
  if (sp.get("stock")) chips.push({ key: "stock", value: "1", label: "En stock" });
  if (sp.get("promo")) chips.push({ key: "promo", value: "1", label: "Promo" });
  if (sp.get("rating")) chips.push({ key: "rating", value: sp.get("rating") as string, label: `${sp.get("rating")}★+` });
  if (sp.get("min") || sp.get("max")) chips.push({ key: "price", value: "", label: `${sp.get("min") ? formatDTShort(Number(sp.get("min"))) : "0"}–${sp.get("max") ? formatDTShort(Number(sp.get("max"))) : "∞"}` });

  return { sp, toggleMulti, set, clearAll, has, activeCount, pending, chips, pathname, update };
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-[48px] w-full items-center justify-between text-left">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em]">{title}</span>
        <span className={cn("font-mono text-[14px] transition-transform", open && "rotate-45")}>+</span>
      </button>
      {open && <div className="pb-5 pt-1">{children}</div>}
    </div>
  );
}

function Choice({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex h-9 cursor-pointer items-center gap-3">
      <span className={cn("flex h-[14px] w-[14px] items-center justify-center border text-[10px]", checked ? "border-ink bg-ink text-paper" : "border-line bg-bg")}>
        {checked ? "✓" : ""}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={cn("flex-1 font-sans text-[13px]", checked ? "text-ink" : "text-text-secondary")}>{label}</span>
      {count != null && <span className="font-mono text-[11px] text-text-muted">{count}</span>}
    </label>
  );
}

export function FilterPanel({ facets, hideConcerns = false, hideBrands = false }: { facets: Facets; hideConcerns?: boolean; hideBrands?: boolean }) {
  const f = useFilterParams();
  const { copy } = useLocale();
  const m = copy.merch;
  const urlMin = f.sp.get("min") ?? "";
  const urlMax = f.sp.get("max") ?? "";
  const [min, setMin] = useState(urlMin);
  const [max, setMax] = useState(urlMax);
  const [synced, setSynced] = useState(`${urlMin}\0${urlMax}`);
  const current = `${urlMin}\0${urlMax}`;
  if (current !== synced) {
    setSynced(current);
    setMin(urlMin);
    setMax(urlMax);
  }
  const toDt = (raw: string) => (raw ? String(Number(raw) / 1000) : "");
  const toMillimes = (v: string) => (v ? String(Math.round(Number(v) * 1000)) : null);

  return (
    <div className={cn("transition-opacity", f.pending && "opacity-50")}>
      <div className="flex items-center justify-between pb-4">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
          <SlidersHorizontal size={12} /> Filtres {f.activeCount > 0 && <span className="bg-ink px-1.5 py-0.5 text-paper">{f.activeCount}</span>}
        </span>
        {f.activeCount > 0 && (
          <button onClick={f.clearAll} className="font-mono text-[11px] uppercase tracking-[0.06em] underline underline-offset-4">
            Effacer
          </button>
        )}
      </div>

      <Section title="Disponibilité">
        <Choice checked={f.sp.get("stock") === "1"} onChange={() => f.set("stock", f.sp.get("stock") === "1" ? null : "1")} label="En stock" />
        <Choice checked={f.sp.get("promo") === "1"} onChange={() => f.set("promo", f.sp.get("promo") === "1" ? null : "1")} label="Promotion" />
      </Section>

      {!hideBrands && facets.brands.length > 0 && (
        <Section title="Laboratoires">
          <div className="max-h-64 space-y-0 overflow-y-auto">
            {facets.brands.map((b) => (
              <Choice key={b.slug} checked={f.has("brands", b.slug)} onChange={() => f.toggleMulti("brands", b.slug)} label={b.name} count={b.n} />
            ))}
          </div>
        </Section>
      )}

      {facets.tolerances.length > 0 && (
        <Section title={m.filterTol}>
          {facets.tolerances.map((t) => (
            <Choice key={t.key} checked={f.has("tol", t.key)} onChange={() => f.toggleMulti("tol", t.key)} label={m.tol[t.key as keyof typeof m.tol] ?? t.key} count={t.n} />
          ))}
        </Section>
      )}

      {!hideConcerns && facets.concerns.length > 0 && (
        <Section title="Besoins">
          {facets.concerns.map((c) => (
            <Choice key={c.slug} checked={f.has("concerns", c.slug)} onChange={() => f.toggleMulti("concerns", c.slug)} label={c.name} count={c.n} />
          ))}
        </Section>
      )}

      <Section title="Prix">
        <p className="mb-3 font-mono text-[11px] text-text-muted">
          {formatDTShort(facets.priceMin)} – {formatDTShort(facets.priceMax)}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            f.set("min", toMillimes(min));
            f.set("max", toMillimes(max));
          }}
          className="flex items-center gap-2"
        >
          <input value={min ? toDt(min) : ""} onChange={(e) => setMin(e.target.value)} placeholder="Min" className="field-swiss h-10" />
          <span className="text-text-muted">—</span>
          <input value={max ? toDt(max) : ""} onChange={(e) => setMax(e.target.value)} placeholder="Max" className="field-swiss h-10" />
          <button className="btn-primary h-10">OK</button>
        </form>
      </Section>

      <Section title="Note">
        <div className="flex gap-2">
          {[4, 3].map((r) => (
            <button
              key={r}
              onClick={() => f.set("rating", f.sp.get("rating") === String(r) ? null : String(r))}
              className={cn("h-10 border px-3 font-mono text-[12px]", f.sp.get("rating") === String(r) ? "border-ink bg-ink text-paper" : "border-line")}
            >
              {r}★+
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function SortBar({ total }: { total: number }) {
  const f = useFilterParams();
  const active = (f.sp.get("sort") as SortKey) ?? "featured";
  return (
    <div className="flex items-center justify-between border-b border-line py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em]">
        <span className="font-sans text-[14px] font-semibold tracking-[-0.01em]">{total}</span> réf.
      </p>
      <select value={active} onChange={(e) => f.set("sort", e.target.value === "featured" ? null : e.target.value)} className="h-10 border border-line bg-bg px-3 font-mono text-[11px] uppercase tracking-[0.06em]">
        {SORTS.map((s) => (
          <option key={s.v} value={s.v}>
            {s.l}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ActiveChips() {
  const f = useFilterParams();
  if (f.chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {f.chips.map((c) => (
        <li key={`${c.key}-${c.value}`}>
          <button
            onClick={() => (c.key === "price" ? f.update((p) => { p.delete("min"); p.delete("max"); }) : f.toggleMulti(c.key, c.value))}
            className="flex h-8 items-center gap-2 border border-line bg-bg px-3 font-mono text-[11px] uppercase tracking-[0.06em] hover:border-ink"
          >
            {c.label} <X size={10} />
          </button>
        </li>
      ))}
      <li>
        <button onClick={f.clearAll} className="h-8 px-3 font-mono text-[11px] uppercase tracking-[0.06em] underline underline-offset-4">
          Effacer
        </button>
      </li>
    </ul>
  );
}

export function MobileFilters(props: { facets: Facets; hideConcerns?: boolean; hideBrands?: boolean; total: number }) {
  const [open, setOpen] = useState(false);
  const f = useFilterParams();
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, open);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-10 items-center gap-2 border border-line bg-bg px-4 font-mono text-[11px] uppercase tracking-[0.12em] lg:hidden">
        <SlidersHorizontal size={12} /> Filtres {f.activeCount > 0 && <span className="bg-ink px-1 text-paper">{f.activeCount}</span>}
      </button>

      {open && (
        <>
          <button onClick={() => setOpen(false)} className="fixed inset-0 z-[70] bg-black/40 lg:hidden" />
          <div ref={sheetRef} className="fixed inset-x-0 bottom-0 z-[80] flex max-h-[90dvh] flex-col border-t border-ink bg-bg lg:hidden">
            <div className="flex h-[64px] items-center justify-between border-b border-line px-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Filtres</span>
              <button onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center border border-line">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <FilterPanel {...props} />
            </div>
            <div className="border-t border-line p-6">
              <button onClick={() => setOpen(false)} className="btn-primary w-full">
                Voir {props.total} résultats
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
