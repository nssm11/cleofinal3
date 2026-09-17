"use client";
import { DataTable, type Column } from "./data-table";
import { StatusTag, PaymentTag, Money } from "./primitives";

export type OrderRow = {
  id: number;
  reference?: string;
  number?: string;
  email: string;
  name?: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt?: string;
  at?: string;
  itemsCount?: number;
  items?: number;
  [key: string]: any;
};

export function OrdersTable({ rows }: { rows: any[] }) {
  const normalized = rows.map((r: any) => ({
    id: r.id,
    reference: r.reference ?? r.number ?? String(r.id),
    email: r.email ?? r.name ?? "",
    total: r.total,
    status: r.status,
    paymentStatus: r.paymentStatus,
    createdAt: r.createdAt ?? r.at ?? new Date().toISOString(),
    ...r,
  }));
  const cols: Column<any>[] = [
    { key: "ref", header: "Réf", render: (r) => <span className="font-mono text-[12px]">{r.reference}</span>, sort: (a, b) => String(a.reference).localeCompare(String(b.reference)), value: (r) => r.reference },
    { key: "email", header: "Client", render: (r) => <span className="text-[13px]">{r.email}</span>, value: (r) => r.email },
    { key: "status", header: "Statut", render: (r) => <StatusTag status={r.status} />, value: (r) => r.status },
    { key: "payment", header: "Paiement", render: (r) => <PaymentTag status={r.paymentStatus} />, value: (r) => r.paymentStatus },
    { key: "total", header: "Total", align: "right", mono: true, render: (r) => <Money millimes={r.total} />, sort: (a, b) => a.total - b.total, value: (r) => String(r.total) },
    { key: "date", header: "Date", mono: true, render: (r) => <span className="font-mono text-[11px]">{new Date(r.createdAt).toLocaleDateString("fr-TN")}</span>, sort: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), value: (r) => r.createdAt },
  ];
  return <DataTable rows={normalized} columns={cols} getRowId={(r) => r.id} rowHref={(r) => `/admin/commandes/${r.id}`} searchFields={(r) => [r.reference, r.email]} exportName="commandes" />;
}
