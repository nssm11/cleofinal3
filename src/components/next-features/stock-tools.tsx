"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/primitives";
import { formatDTShort } from "@/lib/money";

type LotRow = {
  id: number;
  lot: string;
  productName: string;
  productSlug: string;
  sku: string;
  brandName: string | null;
  storeName: string;
  expiresAt: string | null;
  quantity: number;
  status: string;
  clearancePercent: number;
};

type RestockRow = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  stock: number;
  lowStockThreshold: number;
  salesCount: number;
  priceMillimes: number;
  expectedAt: string;
};

function daysUntil(value: string | null) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export function LotExpiryChecker({ lots }: { lots: LotRow[] }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = useMemo(() => {
    if (!needle) return lots.slice(0, 12);
    return lots.filter((lot) => [lot.lot, lot.sku, lot.productName, lot.brandName, lot.storeName].join(" ").toLowerCase().includes(needle)).slice(0, 20);
  }, [lots, needle]);

  return (
    <div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SKU, nom produit ou numéro de lot" className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
      <div className="mt-6 overflow-x-auto border border-line/70 bg-porcelain">
        <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
          <thead className="border-b border-line/70 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">
            <tr>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Comptoir</th>
              <th className="px-4 py-3">DLC</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((lot) => {
              const days = daysUntil(lot.expiresAt);
              const tone = lot.status !== "sale" ? "error" : days === null ? "warning" : days < 30 ? "error" : days < 90 ? "warning" : "success";
              return (
                <tr key={lot.id}>
                  <td className="px-4 py-3 font-mono text-[12px] text-carbon">{lot.lot}</td>
                  <td className="px-4 py-3">
                    <Link href={`/produit/${lot.productSlug}`} className="font-medium text-carbon hover:text-iodine-deep">{lot.productName}</Link>
                    <p className="mt-1 text-[11px] text-faint">{lot.brandName} · {lot.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{lot.storeName} · {lot.quantity} u.</td>
                  <td className="px-4 py-3 text-muted">{lot.expiresAt ? new Date(lot.expiresAt).toLocaleDateString("fr-FR") : "non daté"}</td>
                  <td className="px-4 py-3"><Badge tone={tone}>{days === null ? "à dater" : days < 0 ? "expiré" : `${days} jours`}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RestockCalendar({ rows }: { rows: RestockRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article key={row.id} className="grid gap-4 border border-line/70 bg-porcelain p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{row.brandName}</p>
            <Link href={`/produit/${row.slug}`} className="mt-1 block font-ant uppercase text-[1.2rem] leading-tight text-carbon hover:text-iodine-deep">{row.name}</Link>
            <p className="mt-1 text-[12px] text-muted">Ventes historiques : {row.salesCount} · seuil bas {row.lowStockThreshold}</p>
          </div>
          <Badge tone={row.stock <= 0 ? "warning" : "accent"}>{row.stock <= 0 ? "rupture" : `stock ${row.stock}`}</Badge>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Réassort estimé</p>
            <p className="mt-1 font-ant text-[1.25rem] text-carbon">{new Date(row.expectedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function LowStockWall({ rows }: { rows: RestockRow[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <article key={row.id} className="border border-line/70 bg-porcelain p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{row.brandName}</p>
              <Link href={`/produit/${row.slug}`} className="mt-1 block font-ant uppercase text-[1.2rem] leading-tight text-carbon hover:text-iodine-deep">{row.name}</Link>
            </div>
            <Badge tone={row.stock <= 0 ? "error" : "warning"}>{row.stock <= 0 ? "épuisé" : `${row.stock} restants`}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="ink">{formatDTShort(row.priceMillimes)}</Badge>
            <Badge>Réassort {new Date(row.expectedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</Badge>
          </div>
        </article>
      ))}
    </div>
  );
}
