"use client";
import { DataTable, type Column } from "./data-table";
import { Money, Tag } from "./primitives";

export type ProductListRow = {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  category: string | null;
  image: string | null;
};

export function ProductsTable({ rows }: { rows: ProductListRow[] }) {
  const cols: Column<ProductListRow>[] = [
    { key: "name", header: "Produit", render: (r) => <span className="font-sans text-[13px]">{r.name}</span>, sort: (a, b) => a.name.localeCompare(b.name), value: (r) => r.name },
    { key: "cat", header: "Catégorie", render: (r) => <span className="font-mono text-[11px] text-text-muted">{r.category ?? "—"}</span>, value: (r) => r.category ?? "" },
    { key: "price", header: "Prix", align: "right", mono: true, render: (r) => <Money millimes={r.price} />, sort: (a, b) => a.price - b.price, value: (r) => String(r.price) },
    { key: "stock", header: "Stock", align: "right", mono: true, render: (r) => <span className={r.stock <= 0 ? "text-error" : ""}>{r.stock}</span>, sort: (a, b) => a.stock - b.stock, value: (r) => String(r.stock) },
    { key: "active", header: "Actif", render: (r) => <Tag tone={r.active ? "good" : "neutral"}>{r.active ? "Oui" : "Non"}</Tag>, value: (r) => String(r.active) },
  ];
  return <DataTable rows={rows} columns={cols} getRowId={(r) => r.id} rowHref={(r) => `/admin/produits/${r.slug}`} searchFields={(r) => [r.name, r.category ?? ""]} exportName="produits" />;
}
