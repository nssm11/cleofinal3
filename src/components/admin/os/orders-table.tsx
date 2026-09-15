"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";
import type { OrderStatus } from "@/db/schema";
import { bulkOrderStatusAction } from "@/actions/admin";
import { useToast } from "@/components/ui/toaster";
import { DataTable, type Column } from "./data-table";
import { Money, StatusTag, PaymentTag, Tag } from "./primitives";
import { cn } from "@/lib/utils";

export type OrderRow = {
  id: number;
  number: string;
  at: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingMethod: string;
  total: number;
  items: number;
  units: number;
  ageHours: number;
  tracking: string | null;
  promoCode: string | null;
};

const SHIPPING_LABEL: Record<string, string> = { standard: "Standard", express: "Express", pickup: "Retrait", store: "Retrait en boutique" };

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const columns: Column<OrderRow>[] = [
    {
      key: "number",
      header: "Commande",
      width: "9.5rem",
      sort: (a, b) => a.number.localeCompare(b.number),
      value: (r) => r.number,
      render: (r) => (
        <span className="flex flex-col">
          <span className="os-num text-[12.5px] text-os-text">{r.number}</span>
          <span className="os-num text-[10.5px] text-os-faint">
            {new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(r.at))}
          </span>
        </span>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      sort: (a, b) => a.name.localeCompare(b.name),
      value: (r) => `${r.name} ${r.email}`,
      render: (r) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px] text-os-text">{r.name}</span>
          <span className="truncate text-[10.5px] text-os-faint">{r.email}{r.city ? ` · ${r.city}` : ""}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      width: "8.5rem",
      sort: (a, b) => a.status.localeCompare(b.status),
      value: (r) => ORDER_STATUS_LABELS[r.status as OrderStatus] ?? r.status,
      render: (r) => <StatusTag status={r.status} />,
    },
    {
      key: "payment",
      header: "Paiement",
      width: "8rem",
      sort: (a, b) => a.paymentStatus.localeCompare(b.paymentStatus),
      value: (r) => r.paymentStatus,
      render: (r) => (
        <span className="flex flex-col items-start gap-0.5">
          <PaymentTag status={r.paymentStatus} />
          <span className="text-[10px] text-os-faint">{r.paymentMethod.replace("_", " ")}</span>
        </span>
      ),
    },
    {
      key: "items",
      header: "Lignes",
      align: "right",
      width: "5rem",
      sort: (a, b) => a.items - b.items,
      value: (r) => r.items,
      render: (r) => <span className="os-num">{r.items}<span className="ml-1 text-[10px] text-os-faint">/ {r.units}u</span></span>,
    },
    {
      key: "shipping",
      header: "Livraison",
      width: "7.5rem",
      value: (r) => SHIPPING_LABEL[r.shippingMethod] ?? r.shippingMethod,
      render: (r) => (
        <span className="flex flex-col">
          <span className="text-[11.5px] text-os-text">{SHIPPING_LABEL[r.shippingMethod] ?? r.shippingMethod}</span>
          {r.tracking && <span className="os-num text-[10px] text-os-faint">{r.tracking}</span>}
        </span>
      ),
    },
    {
      key: "age",
      header: "Âge",
      align: "right",
      width: "5.5rem",
      sort: (a, b) => b.ageHours - a.ageHours,
      value: (r) => Math.round(r.ageHours),
      render: (r) => (
        <span className={cn("os-num text-[12px]", r.ageHours > 72 && ["pending", "confirmed", "preparing"].includes(r.status) ? "text-os-crit" : r.ageHours > 24 ? "text-os-muted" : "text-os-muted")}>
          {r.ageHours < 1 ? "< 1 h" : `${Math.round(r.ageHours)} h`}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      width: "7rem",
      sort: (a, b) => a.total - b.total,
      value: (r) => (r.total / 1000).toFixed(3),
      render: (r) => <Money millimes={r.total} className="text-[12.5px] text-os-text" />,
    },
    {
      key: "promo",
      header: "Code",
      defaultHidden: true,
      value: (r) => r.promoCode ?? "",
      render: (r) => (r.promoCode ? <span className="os-num text-[11px] text-os-gold-2">{r.promoCode}</span> : <span className="text-os-faint">—</span>),
    },
    {
      key: "phone",
      header: "Téléphone",
      defaultHidden: true,
      value: (r) => r.phone,
      render: (r) => <span className="os-num text-[11.5px] text-os-muted">{r.phone || "—"}</span>,
    },
  ];

  const statuses: OrderStatus[] = ["confirmed", "preparing", "shipped", "delivered"];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      initialSort={{ key: "age", dir: "desc" }}
      rowHref={(r) => `/admin/commandes/${r.id}`}
      savedViewKey="orders"
      exportName="commandes"
      searchPlaceholder="Numéro, cliente, e-mail, téléphone, suivi…"
      searchFields={(r) => [r.number, r.name, r.email, r.phone, r.tracking ?? "", r.city ?? ""]}
      filters={[
        {
          key: "status",
          label: "Statut",
          options: (["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"] as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] })),
          match: (r, v) => r.status === v,
        },
        {
          key: "payment",
          label: "Paiement",
          options: [
            { value: "pending", label: "En attente" },
            { value: "paid", label: "Encaissé" },
            { value: "failed", label: "Échec" },
            { value: "refunded", label: "Remboursé" },
          ],
          match: (r, v) => r.paymentStatus === v,
        },
        {
          key: "shipping",
          label: "Livraison",
          options: [
            { value: "standard", label: "Standard" },
            { value: "express", label: "Express" },
          ],
          match: (r, v) => r.shippingMethod === v,
        },
        {
          key: "late",
          label: "Retard",
          options: [{ value: "1", label: "> 72 h non expédiées" }],
          match: (r) => r.ageHours > 72 && ["pending", "confirmed", "preparing"].includes(r.status),
        },
      ]}
      bulkActions={(selected, clear) => (
        <>
          {statuses.map((s) => (
            <button
              key={s}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await bulkOrderStatusAction(selected.map((x) => x.id), s);
                  toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? `${selected.length} commande(s) mises à jour` : r.error });
                  clear();
                  router.refresh();
                })
              }
              className="border border-os-ink-line px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-os-onink transition-colors hover:bg-os-gold hover:text-os-ink disabled:opacity-50"
            >
              {ORDER_STATUS_LABELS[s]}
            </button>
          ))}
          <a
            href={`/api/admin/export/orders?ids=${selected.map((x) => x.id).join(",")}`}
            className="border border-os-ink-line px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-os-onink transition-colors hover:bg-os-gold hover:text-os-ink"
          >
            Export
          </a>
          {selected.some((x) => x.ageHours > 72) && <Tag tone="warn">dont {selected.filter((x) => x.ageHours > 72).length} en retard</Tag>}
        </>
      )}
    />
  );
}
