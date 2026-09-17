"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useOs } from "./os-context";
import { OsButton, Skeleton } from "./primitives";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sort?: (a: T, b: T) => number;
  width?: string;
  align?: "left" | "right" | "center";
  hideable?: boolean;
  defaultHidden?: boolean;
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
  rows,
  columns,
  getRowId,
  initialSort,
  rowHref,
  onRowClick,
  bulkActions,
  searchPlaceholder = "Filtrer…",
  searchFields,
  empty,
  exportName,
  toolbar,
  filters,
  pageSize: initialPageSize = 25,
  rowTone,
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
  const { density } = useOs();
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>(columns.filter((c) => c.defaultHidden).map((c) => c.key));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const visible = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    let out = rows;
    for (const f of filters ?? []) {
      const v = activeFilters[f.key];
      if (v) out = out.filter((r) => f.match(r, v));
    }
    const needle = search.trim().toLowerCase();
    if (needle && searchFields) out = out.filter((r) => searchFields(r).some((s) => s.toLowerCase().includes(needle)));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sort) out = [...out].sort((a, b) => (sort.dir === "asc" ? col.sort!(a, b) : col.sort!(b, a)));
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
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelected(next);
  };
  const selectedRows = filtered.filter((r) => selected.has(String(getRowId(r))));

  const exportCsv = () => {
    const cols = visible.filter((c) => c.value);
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = [cols.map((c) => c.header).join(","), ...filtered.map((r) => cols.map((c) => esc(c.value!(r))).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleopatre-${exportName ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sorted = (key: string) => (sort?.key === key ? sort.dir : null);
  const cycleSort = (key: string) => {
    if (!columns.find((c) => c.key === key)?.sort) return;
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  };

  return (
    <div className="min-w-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border border-line bg-bg px-3 py-2">
        {searchFields && (
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder={searchPlaceholder} className="h-9 min-w-[200px] flex-1 border border-line bg-bg px-3 font-sans text-[13px] focus:border-ink focus:outline-none sm:max-w-xs" />
        )}
        {filters?.map((f) => (
          <select key={f.key} value={activeFilters[f.key] ?? ""} onChange={(e) => { setActiveFilters((s) => ({ ...s, [f.key]: e.target.value })); setPage(0); }} className="h-9 border border-line bg-bg px-2 font-mono text-[11px] uppercase tracking-[0.06em]">
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}{o.count != null ? ` (${o.count})` : ""}</option>)}
          </select>
        ))}
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {exportName && <OsButton size="sm" variant="ghost" onClick={exportCsv}>CSV</OsButton>}
        </div>
      </div>

      {selected.size > 0 && bulkActions && (
        <div className="flex items-center gap-3 border-x border-t border-ink bg-ink px-3 py-2 text-paper">
          <span className="font-mono text-[11px]">{selected.size} sélectionnés</span>
          {bulkActions(selectedRows, () => setSelected(new Set()))}
          <button onClick={() => setSelected(new Set())} className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] underline">Effacer</button>
        </div>
      )}

      <div className="overflow-x-auto border border-line bg-bg">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-bg-2">
            <tr className="border-b border-line text-left">
              {bulkActions && <th className="w-8 px-2 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>}
              {visible.map((c) => (
                <th key={c.key} style={{ width: c.width }} className={cn("px-3 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted", c.align === "right" && "text-right", c.align === "center" && "text-center")}>
                  {c.sort ? <button onClick={() => cycleSort(c.key)} className="inline-flex items-center gap-1 hover:text-ink">{c.header}<span className="text-[9px]">{sorted(c.key) === "asc" ? "▲" : sorted(c.key) === "desc" ? "▼" : "◇"}</span></button> : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const id = String(getRowId(row));
              const href = rowHref?.(row);
              return (
                <tr key={id} onClick={() => { if (!bulkActions) { if (href) router.push(href); else onRowClick?.(row); } }} className={cn("border-b border-line text-[13px] hover:bg-bg-2", (href || onRowClick) && !bulkActions && "cursor-pointer")}>
                  {bulkActions && <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(id)} onChange={() => toggleOne(id)} /></td>}
                  {visible.map((c) => (
                    <td key={c.key} className={cn("px-3 py-3", c.align === "right" && "text-right", c.align === "center" && "text-center", c.mono && "font-mono text-[12px]")}>{href && c.key === visible[0].key ? <Link href={href}>{c.render(row)}</Link> : c.render(row)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-6 font-sans text-[13px] text-text-muted">{empty ?? "Aucune ligne."}</div>}
      </div>

      <div className="flex items-center justify-between border-x border-b border-line bg-bg-2 px-3 py-2 font-mono text-[11px] text-text-muted">
        <span>{filtered.length} lignes{filtered.length !== rows.length && ` / ${rows.length}`}</span>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="h-7 border border-line bg-bg px-2"><option>10</option><option>25</option><option>50</option><option>100</option></select>
          <button onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} className="h-7 w-7 border border-line disabled:opacity-30">‹</button>
          <span>{safePage + 1} / {pageCount}</span>
          <button onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage >= pageCount - 1} className="h-7 w-7 border border-line disabled:opacity-30">›</button>
        </div>
      </div>
    </div>
  );
}

export function DataTableSkeleton({ rows = 8 }: { rows?: number }) {
  return <div className="border border-line bg-bg p-4 space-y-2"><Skeleton className="h-6 w-48" />{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>;
}
