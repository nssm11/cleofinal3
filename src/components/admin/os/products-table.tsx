"use client";
import Link from "next/link";
import { DataTable, type Column } from "./data-table";
import { Money, Tag } from "./primitives";
import { cn } from "@/lib/utils";

export type ProductListRow = {
  id: number;
  name: string;
  sku: string;
  brand: string | null;
  category: string | null;
  universe: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  threshold: number;
  status: string;
  image: string | null;
  media: number;
  rating: number;
  ratings: number;
  unitsSold: number;
  revenue: number;
  wishes: number;
  lastSale: string | null;
  health: number;
  grade: string;
  bucket: string;
  coverDays: number | null;
  perDay: number;
  marginFlag: boolean;
};

const GRADE_TONE: Record<string, "good" | "warn" | "bad" | "neutral"> = {
  excellent: "good", good: "good", fragile: "warn", incomplete: "bad",
};
const BUCKET_LABEL: Record<string, string> = { rupture: "Rupture", tension: "Sous seuil", sain: "Sain", surstock: "Surstock", dormant: "Dormant" };
const BUCKET_TONE: Record<string, "bad" | "warn" | "good" | "neutral"> = { rupture: "bad", tension: "warn", sain: "good", surstock: "warn", dormant: "neutral" };

export function ProductsTable({ rows }: { rows: ProductListRow[] }) {
  const columns: Column<ProductListRow>[] = [
    {
      key: "name",
      header: "Référence",
      width: "20rem",
      sort: (a, b) => a.name.localeCompare(b.name),
      value: (r) => r.name,
      render: (r) => (
        <span className="flex min-w-0 items-center gap-2.5">
          {r.image ? (
            <img src={r.image} alt="" className="h-9 w-9 shrink-0 object-cover" loading="lazy" />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center bg-os-crit-soft text-[10px] font-bold text-os-crit" title="Aucune image">IMG</span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] text-os-text">{r.name}</span>
            <span className="block truncate text-[10.5px] text-os-faint">
              {r.sku} · {r.brand ?? "sans laboratoire"} · {r.category ?? "non classé"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "health",
      header: "Santé",
      width: "6.5rem",
      sort: (a, b) => a.health - b.health,
      value: (r) => r.health,
      render: (r) => (
        <span className="flex items-center gap-2">
          <span className="relative h-1.5 w-14 bg-os-surface-3">
            <span className={cn("absolute inset-y-0 left-0", r.health >= 78 ? "bg-os-ok" : r.health >= 55 ? "bg-os-warn" : "bg-os-crit")} style={{ width: `${r.health}%` }} />
          </span>
          <span className="os-num text-[11.5px] text-os-text">{r.health}</span>
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      width: "7rem",
      sort: (a, b) => a.stock - b.stock,
      value: (r) => r.stock,
      render: (r) => (
        <span className="flex flex-col items-end">
          <span className="os-num text-[12.5px] text-os-text">{r.stock}</span>
          <Tag tone={BUCKET_TONE[r.bucket] ?? "neutral"}>{BUCKET_LABEL[r.bucket] ?? r.bucket}</Tag>
        </span>
      ),
    },
    {
      key: "cover",
      header: "Couverture",
      align: "right",
      width: "6.5rem",
      sort: (a, b) => (a.coverDays ?? 9999) - (b.coverDays ?? 9999),
      value: (r) => (r.coverDays == null ? "" : Math.round(r.coverDays)),
      render: (r) => (
        <span className="os-num text-[11.5px] text-os-muted" title={r.perDay > 0 ? `${r.perDay.toFixed(3)} unité/jour sur 90 jours` : "aucune vente sur 90 jours"}>
          {r.coverDays == null ? "—" : `${Math.round(r.coverDays)} j`}
        </span>
      ),
    },
    {
      key: "units",
      header: "Vendus",
      align: "right",
      width: "6rem",
      sort: (a, b) => a.unitsSold - b.unitsSold,
      value: (r) => r.unitsSold,
      render: (r) => <span className="os-num text-[12px] text-os-text">{r.unitsSold}</span>,
    },
    {
      key: "revenue",
      header: "Chiffre d'affaires",
      align: "right",
      width: "8rem",
      sort: (a, b) => a.revenue - b.revenue,
      value: (r) => (r.revenue / 1000).toFixed(3),
      render: (r) => <Money millimes={r.revenue} className="text-[12.5px] text-os-text" />,
    },
    {
      key: "wishes",
      header: "Envies",
      align: "right",
      width: "5.5rem",
      sort: (a, b) => a.wishes - b.wishes,
      value: (r) => r.wishes,
      render: (r) => <span className={cn("os-num text-[12px]", r.wishes > 0 ? "text-os-gold-2" : "text-os-faint")}>{r.wishes}</span>,
    },
    {
      key: "rating",
      header: "Avis",
      align: "right",
      width: "6rem",
      sort: (a, b) => a.rating - b.rating,
      value: (r) => (r.ratings ? (r.rating / 100).toFixed(2) : ""),
      render: (r) => (r.ratings > 0 ? <span className="os-num text-[12px] text-os-text">{(r.rating / 100).toFixed(2)}<span className="ml-1 text-[10px] text-os-faint">/5 · {r.ratings}</span></span> : <span className="text-[11px] text-os-faint">aucun</span>),
    },
    {
      key: "price",
      header: "Prix",
      align: "right",
      width: "7rem",
      sort: (a, b) => a.price - b.price,
      value: (r) => (r.price / 1000).toFixed(3),
      render: (r) => (
        <span className="flex flex-col items-end">
          <Money millimes={r.price} className="text-[12.5px] text-os-text" />
          {r.compareAt != null && r.compareAt > r.price && <span className="os-num text-[10.5px] text-os-gold-2">barré {new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 3 }).format(r.compareAt / 1000)}</span>}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      width: "6.5rem",
      sort: (a, b) => a.status.localeCompare(b.status),
      value: (r) => r.status,
      render: (r) => <Tag tone={r.status === "active" ? "good" : r.status === "draft" ? "warn" : "neutral"}>{r.status === "active" ? "en ligne" : r.status === "draft" ? "brouillon" : "archivé"}</Tag>,
    },
    {
      key: "lastSale",
      header: "Dernière vente",
      defaultHidden: true,
      value: (r) => (r.lastSale ? new Date(r.lastSale).toISOString().slice(0, 10) : ""),
      render: (r) => (
        <span className="os-num text-[11.5px] text-os-muted">
          {r.lastSale ? new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", year: "2-digit" }).format(new Date(r.lastSale)) : "jamais vendu"}
        </span>
      ),
    },
    {
      key: "open",
      header: "",
      align: "right",
      width: "5rem",
      value: () => "",
      render: (r) => (
        <Link href={`/admin/produits/${r.id}`} className="text-[11px] uppercase tracking-[0.12em] text-os-gold hover:underline">Fiche</Link>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      initialSort={{ key: "revenue", dir: "desc" }}
      rowHref={(r) => `/admin/produits/${r.id}`}
      savedViewKey="products"
      exportName="catalogue"
      searchPlaceholder="Nom, SKU, laboratoire, rayon…"
      searchFields={(r) => [r.name, r.sku, r.brand ?? "", r.category ?? "", r.universe ?? ""]}
      filters={[
        { key: "bucket", label: "Stock", options: Object.entries(BUCKET_LABEL).map(([value, label]) => ({ value, label })), match: (r, v) => r.bucket === v },
        { key: "status", label: "Statut", options: [{ value: "active", label: "En ligne" }, { value: "draft", label: "Brouillon" }, { value: "archived", label: "Archivé" }], match: (r, v) => r.status === v },
        { key: "grade", label: "Santé", options: [{ value: "fragile", label: "Fragile" }, { value: "incomplete", label: "Incomplète" }, { value: "good", label: "Solide" }], match: (r, v) => (v === "good" ? r.health >= 78 : v === "fragile" ? r.health >= 55 && r.health < 78 : r.health < 55) },
      ]}
      rowTone={(r) => (r.bucket === "rupture" ? "bad" : r.bucket === "tension" ? "warn" : null)}
    />
  );
}
