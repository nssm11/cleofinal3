"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { rowCollapse, rowIn } from "@/lib/admin/motion";
import { useOs } from "./os-context";
import { ColumnsIcon, DensityIcon, DownloadSmallIcon, PinIcon, SearchIcon } from "./icons";
import { OsButton, Skeleton } from "./primitives";

/* ══════════════════════════════════════════════════════════════════════════
   TABLE DE TRAVAIL
   ──────────────────────────────────────────────────────────────────────────
   One table, reused by every workspace, with the machinery an operator needs
   and nothing decorative: sort, filter, hide columns, choose density, select
   rows, act in bulk, keyboard navigation, sticky head, CSV export and saved
   views kept in the browser.

   Motion is limited on purpose — an analysis table that animates every row is
   slower than no animation at all. Rows enter once, exit once, and sorting is
   instantaneous.
   ══════════════════════════════════════════════════════════════════════════ */

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sort?: (a: T, b: T) => number;
  width?: string;
  align?: "left" | "right" | "center";
  hideable?: boolean;
  defaultHidden?: boolean;
  /** Value used for the CSV export and the search index. */
  value?: (row: T) => string | number;
  mono?: boolean;
};

export type SavedView = {
  name: string;
  sort?: { key: string; dir: "asc" | "desc" } | null;
  hidden?: string[];
  search?: string;
  filters?: Record<string, string>;
  pageSize?: number;
};

export function DataTable<T>({
  rows, columns, getRowId, initialSort, rowHref, onRowClick, bulkActions, searchPlaceholder = "Filtrer…",
  searchFields, empty, savedViewKey, exportName, toolbar, filters, pageSize: initialPageSize = 25, rowTone, dense: denseProp,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string | number;
  initialSort?: { key: string; dir: "asc" | "desc" };
  rowHref?: (row: T) => string;
  onRowClick?: (row: T) => void;
  bulkActions?: (rows: T[], clear: () => void) => ReactNode;
  searchPlaceholder?: string;
  searchFields?: (row: T) => string[];
  empty?: ReactNode;
  savedViewKey?: string;
  exportName?: string;
  toolbar?: ReactNode;
  filters?: { key: string; label: string; options: { value: string; label: string; count?: number }[]; match: (row: T, value: string) => boolean }[];
  pageSize?: number;
  rowTone?: (row: T) => "neutral" | "warn" | "bad" | "good" | null;
  dense?: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { density, setDensity } = useOs();
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>(columns.filter((c) => c.defaultHidden).map((c) => c.key));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [active, setActive] = useState<number>(-1);
  const [showColumns, setShowColumns] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [views, setViews] = useState<SavedView[]>([]);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  // Saved views live in the browser: they are a working habit, not shop data.
  useEffect(() => {
    if (!savedViewKey) return;
    try {
      const raw = localStorage.getItem(`cleo.os.views.${savedViewKey}`);
      if (raw) setViews(JSON.parse(raw) as SavedView[]);
    } catch { /* a corrupt view must never block the table */ }
  }, [savedViewKey]);

  const persistViews = (next: SavedView[]) => {
    setViews(next);
    if (savedViewKey) {
      try { localStorage.setItem(`cleo.os.views.${savedViewKey}`, JSON.stringify(next)); } catch { /* quota */ }
    }
  };

  const visible = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    let out = rows;
    for (const f of filters ?? []) {
      const v = activeFilters[f.key];
      if (v) out = out.filter((r) => f.match(r, v));
    }
    const needle = search.trim().toLowerCase();
    if (needle && searchFields) {
      out = out.filter((r) => searchFields(r).some((s) => s.toLowerCase().includes(needle)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sort) {
        out = [...out].sort((a, b) => (sort.dir === "asc" ? col.sort!(a, b) : col.sort!(b, a)));
      }
    }
    return out;
  }, [rows, filters, activeFilters, search, searchFields, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(String(getRowId(r))));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) pageRows.forEach((r) => next.delete(String(getRowId(r))));
    else pageRows.forEach((r) => next.add(String(getRowId(r))));
    setSelected(next);
  };
  const toggleOne = (id: string | number) => {
    const next = new Set(selected);
    const k = String(id);
    if (next.has(k)) next.delete(k); else next.add(k);
    setSelected(next);
  };
  const selectedRows = filtered.filter((r) => selected.has(String(getRowId(r))));

  const exportCsv = () => {
    const cols = visible.filter((c) => c.value);
    const esc = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const body = [cols.map((c) => c.header).join(","), ...filtered.map((r) => cols.map((c) => esc(c.value!(r))).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleopatre-${exportName ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyView = (v: SavedView) => {
    setSort(v.sort ?? null);
    setHidden(v.hidden ?? []);
    setSearch(v.search ?? "");
    setActiveFilters(v.filters ?? {});
    if (v.pageSize) setPageSize(v.pageSize);
    setPage(0);
    setShowViews(false);
  };

  const sorted = (key: string) =>
    sort?.key === key ? (sort.dir === "asc" ? "asc" : "desc") : null;
  const cycleSort = (key: string) => {
    if (!columns.find((c) => c.key === key)?.sort) return;
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  };

  // Keyboard navigation over the *page*: ↑/↓ move, Enter opens.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
      if (e.key === "Escape") { setSelected(new Set()); setActive(-1); return; }
      e.preventDefault();
      if (e.key === "Enter" && active >= 0 && pageRows[active]) {
        const href = rowHref?.(pageRows[active]);
        if (href) router.push(href);
        else onRowClick?.(pageRows[active]);
        return;
      }
      setActive((a) => {
        const next = e.key === "ArrowDown" ? Math.min(pageRows.length - 1, a + 1) : Math.max(0, a - 1);
        bodyRef.current?.querySelectorAll("tr")[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    }
  };

  const toneBg = (t: ReturnType<NonNullable<typeof rowTone>>) =>
    t === "bad" ? "bg-os-crit-soft/40" : t === "warn" ? "bg-os-warn-soft/40" : t === "good" ? "bg-os-ok-soft/30" : "";

  return (
    <div className="min-w-0" onKeyDown={onKeyDown} tabIndex={-1}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-x border-t border-os-line bg-os-surface-2/70 px-2.5 py-2">
        {searchFields && (
          <label className="relative flex min-w-[11rem] flex-1 items-center sm:max-w-xs">
            <SearchIcon size={14} className="pointer-events-none absolute left-2.5 text-os-faint" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 w-full border border-os-line bg-os-surface pl-8 pr-2 text-[13px] text-os-text placeholder:text-os-faint focus:border-os-line-strong focus:outline-none"
            />
          </label>
        )}
        {filters?.map((f) => (
          <select
            key={f.key}
            value={activeFilters[f.key] ?? ""}
            onChange={(e) => { setActiveFilters((s) => ({ ...s, [f.key]: e.target.value })); setPage(0); }}
            aria-label={f.label}
            className="h-9 border border-os-line bg-os-surface px-2 text-[12px] text-os-text focus:border-os-line-strong focus:outline-none"
          >
            <option value="">{f.label} · tous</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}{o.count != null ? ` (${o.count})` : ""}</option>)}
          </select>
        ))}
        {toolbar}
        <div className="ml-auto flex items-center gap-1.5">
          {savedViewKey && (
            <div className="relative">
              <OsButton size="sm" variant="quiet" onClick={() => setShowViews((s) => !s)} title="Vues enregistrées" aria-expanded={showViews}>
                <PinIcon size={14} /> <span className="hidden sm:inline">{views.length ? `Vues (${views.length})` : "Vues"}</span>
              </OsButton>
              {showViews && (
                <div className="absolute right-0 z-30 mt-1 w-64 border border-os-line-strong bg-os-surface shadow-os-lift">
                  <div className="border-b border-os-line px-3 py-2">
                    <p className="os-label text-os-muted">Vues enregistrées</p>
                  </div>
                  {views.length === 0 && <p className="px-3 py-3 text-[12px] text-os-muted">Aucune vue. Réglez filtres, tri et colonnes puis enregistrez — la vue est conservée dans ce navigateur.</p>}
                  <ul className="max-h-56 overflow-auto os-scroll">
                    {views.map((v) => (
                      <li key={v.name} className="flex items-center justify-between gap-2 border-b border-os-line-soft px-3 py-2 last:border-0">
                        <button onClick={() => applyView(v)} className="min-w-0 flex-1 truncate text-left text-[13px] text-os-text hover:text-os-gold">{v.name}</button>
                        <button onClick={() => persistViews(views.filter((x) => x.name !== v.name))} className="text-[11px] text-os-faint hover:text-os-crit" aria-label={`Supprimer la vue ${v.name}`}>×</button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      const name = window.prompt("Nom de la vue (ex. Commandes urgentes)");
                      if (!name) return;
                      persistViews([...views.filter((v) => v.name !== name), { name, sort, hidden, search, filters: activeFilters, pageSize }]);
                      setShowViews(false);
                    }}
                    className="w-full border-t border-os-line px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-os-gold hover:bg-os-surface-2"
                  >
                    Enregistrer la vue actuelle
                  </button>
                </div>
              )}
            </div>
          )}
          <OsButton size="sm" variant="quiet" onClick={() => setDensity(density === "compact" ? "comfortable" : density === "comfortable" ? "spacious" : "compact")} title={`Densité : ${density}`}>
            <DensityIcon size={14} />
          </OsButton>
          <div className="relative">
            <OsButton size="sm" variant="quiet" onClick={() => setShowColumns((s) => !s)} title="Colonnes" aria-expanded={showColumns}>
              <ColumnsIcon size={14} />
            </OsButton>
            {showColumns && (
              <div className="absolute right-0 z-30 mt-1 w-56 border border-os-line-strong bg-os-surface p-2 shadow-os-lift">
                {columns.filter((c) => c.hideable !== false).map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-2 px-1.5 py-1.5 text-[12px] text-os-text hover:bg-os-surface-2">
                    <input
                      type="checkbox"
                      checked={!hidden.includes(c.key)}
                      onChange={() => setHidden((h) => (h.includes(c.key) ? h.filter((k) => k !== c.key) : [...h, c.key]))}
                      className="accent-[var(--color-os-gold)]"
                    />
                    <span className="truncate">{c.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {exportName && (
            <OsButton size="sm" variant="quiet" onClick={exportCsv} title={`Exporter ${filtered.length} ligne(s)`}>
              <DownloadSmallIcon size={14} /> <span className="hidden sm:inline">CSV</span>
            </OsButton>
          )}
        </div>
      </div>

      {/* Active filters as removable chips */}
      {(Object.values(activeFilters).some(Boolean) || search) && (
        <div className="flex flex-wrap items-center gap-1.5 border-x border-os-line bg-os-surface-2/40 px-2.5 py-1.5">
          {search && (
            <button onClick={() => setSearch("")} className="inline-flex items-center gap-1.5 bg-os-ink px-2 py-0.5 text-[11px] text-os-onink">
              « {search} » <span aria-hidden>×</span>
            </button>
          )}
          {Object.entries(activeFilters).filter(([, v]) => v).map(([k, v]) => (
            <button key={k} onClick={() => setActiveFilters((s) => ({ ...s, [k]: "" }))} className="inline-flex items-center gap-1.5 bg-os-gold-soft px-2 py-0.5 text-[11px] text-os-gold-2">
              {filters?.find((f) => f.key === k)?.options.find((o) => o.value === v)?.label ?? v} <span aria-hidden>×</span>
            </button>
          ))}
          <button onClick={() => { setActiveFilters({}); setSearch(""); }} className="ml-auto text-[10px] uppercase tracking-[0.12em] text-os-faint hover:text-os-text">Tout effacer</button>
        </div>
      )}

      {/* Bulk bar */}
      <AnimatePresence>
        {selected.size > 0 && bulkActions && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap items-center gap-2 border-x border-t border-os-ink bg-os-ink px-3 py-2 text-os-onink"
          >
            <span className="os-num text-[12px]">{selected.size} sélectionné(s)</span>
            <span className="h-4 w-px bg-os-ink-line" aria-hidden />
            {bulkActions(selectedRows, () => setSelected(new Set()))}
            <button onClick={() => setSelected(new Set())} className="ml-auto text-[10px] uppercase tracking-[0.12em] text-os-onink-muted hover:text-os-onink">Désélectionner</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="os-scroll overflow-x-auto border border-os-line bg-os-surface">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-os-surface-2/95 backdrop-blur">
            <tr className="border-b border-os-line text-left">
              {bulkActions && (
                <th className="w-8 px-2 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Sélectionner la page" className="accent-[var(--color-os-gold)]" />
                </th>
              )}
              {visible.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={{ width: c.width }}
                  className={cn("os-label whitespace-nowrap px-2.5 py-2.5 text-os-muted", c.align === "right" && "text-right", c.align === "center" && "text-center")}
                >
                  {c.sort ? (
                    <button onClick={() => cycleSort(c.key)} className="inline-flex items-center gap-1 hover:text-os-text" aria-label={`Trier par ${c.header}`} aria-sort={sorted(c.key) === "asc" ? "ascending" : sorted(c.key) === "desc" ? "descending" : "none"}>
                      {c.header}
                      <span aria-hidden className={cn("text-[9px]", sorted(c.key) ? "text-os-gold" : "text-os-faint/60")}>
                        {sorted(c.key) === "asc" ? "▲" : sorted(c.key) === "desc" ? "▼" : "◇"}
                      </span>
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody ref={bodyRef} layout={!reduce}>
            <AnimatePresence initial={false}>
              {pageRows.map((row, i) => {
                const id = String(getRowId(row));
                const tone = rowTone?.(row) ?? null;
                const href = rowHref?.(row);
                return (
                  <motion.tr
                    key={id}
                    layout={!reduce}
                    variants={reduce ? undefined : rowIn}
                    initial={reduce ? undefined : "hidden"}
                    animate={reduce ? undefined : "show"}
                    exit={reduce ? undefined : "exit"}
                    onClick={() => { if (!bulkActions) { if (href) router.push(href); else onRowClick?.(row); } }}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "border-b border-os-line-soft text-[13px] text-os-text transition-colors last:border-0",
                      (href || onRowClick) && !bulkActions && "cursor-pointer",
                      active === i ? "bg-os-gold-soft/30" : tone ? toneBg(tone) : "hover:bg-os-surface-2/60",
                    )}
                  >
                    {bulkActions && (
                      <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(id)} onChange={() => toggleOne(id)} aria-label={`Sélectionner ${id}`} className="accent-[var(--color-os-gold)]" />
                      </td>
                    )}
                    {visible.map((c) => (
                      <td
                        key={c.key}
                        className={cn("px-2.5", c.align === "right" && "text-right", c.align === "center" && "text-center", c.mono && "os-num")}
                        style={{ paddingTop: "var(--os-cell-y)", paddingBottom: "var(--os-cell-y)" }}
                      >
                        {href && c.key === visible[0].key ? <Link href={href} className="block focus-visible:outline-none">{c.render(row)}</Link> : c.render(row)}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </motion.tbody>
        </table>

        {filtered.length === 0 && (
          <div className="border-t border-os-line p-6">
            {empty ?? <p className="text-[13px] text-os-muted">Aucune ligne ne correspond aux filtres en cours.</p>}
          </div>
        )}
      </div>

      {/* Footer: counts, pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-x border-b border-os-line bg-os-surface-2/70 px-2.5 py-2 text-[12px] text-os-muted">
        <span className="os-num">
          {filtered.length} ligne{filtered.length > 1 ? "s" : ""}
          {filtered.length !== rows.length && ` sur ${rows.length}`}
          {selected.size > 0 && ` · ${selected.size} sélectionnée(s)`}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5">
            <span className="os-label text-os-faint">Lignes</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="h-7 border border-os-line bg-os-surface px-1.5 text-[12px] text-os-text">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <OsButton size="sm" variant="quiet" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>‹</OsButton>
            <span className="os-num px-1">{safePage + 1} / {pageCount}</span>
            <OsButton size="sm" variant="quiet" onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage >= pageCount - 1}>›</OsButton>
          </div>
        </div>
      </div>
      {denseProp !== undefined && null}
    </div>
  );
}

export function DataTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="border border-os-line bg-os-surface p-3">
      <Skeleton className="h-8 w-52" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
      </div>
    </div>
  );
}

export { motion as tableMotion, rowCollapse };
