import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ORDER_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-constants";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/db/schema";

export function HoldSeal({ value, label, href, icon }: { value: ReactNode; label: string; href: string; icon: ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-4 border border-line bg-bg p-5 hover:border-ink transition-colors">
      <span className="flex h-10 w-10 items-center justify-center border border-line bg-bg-2 text-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-[22px] font-semibold leading-none tracking-[-0.02em]">{value}</span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted truncate">{label}</span>
      </span>
      <span className="font-mono text-[11px]">→</span>
    </Link>
  );
}

export function MiniJourney({ status, className }: { status: OrderStatus; className?: string }) {
  const terminal = status === "cancelled" || status === "returned";
  const reached = terminal ? -1 : ORDER_FLOW.indexOf(status);
  if (terminal) {
    return <span className={cn("border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]", className)}>{ORDER_STATUS_LABELS[status]}</span>;
  }
  return (
    <span className={cn("flex items-center gap-1", className)}>
      {ORDER_FLOW.map((s, i) => (
        <span key={s} className={cn("h-[2px] w-8", i <= reached ? "bg-ink" : "bg-line")} />
      ))}
    </span>
  );
}

export function statusSeal(status: OrderStatus): "success" | "error" | "warning" | "gold" {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "error";
  if (status === "returned") return "warning";
  return "gold";
}

export function InFlightCard({ number, status, createdAt, totalMillimes, items }: { number: string; status: OrderStatus; createdAt: Date; totalMillimes: number; items: { id: number; image: string | null; name: string; quantity: number; unitPriceMillimes: number }[] }) {
  const count = items.reduce((a, i) => a + i.quantity, 0);
  return (
    <article className="border border-ink bg-bg">
      <div className="grid sm:grid-cols-[1fr_220px]">
        <div className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Commande en cours — {ORDER_STATUS_LABELS[status]}</p>
          <h2 className="mt-3 font-mono text-[16px]">{number}</h2>
          <p className="mt-1 font-mono text-[11px] text-text-muted">{formatDate(createdAt)} · {count} articles</p>
          <MiniJourney status={status} className="mt-4" />
          <ul className="mt-5 flex gap-3 overflow-x-auto">
            {items.map((i) => (
              <li key={i.id} className="flex w-44 shrink-0 items-center gap-3 border border-line p-2">
                <span className="relative h-12 w-10 shrink-0 bg-bg-2 border border-line">{i.image && <Image src={i.image} alt="" fill className="object-cover" />}</span>
                <span className="min-w-0"><span className="block truncate font-sans text-[12px]">{i.name}</span><span className="font-mono text-[11px] text-text-muted">{i.quantity} × {formatDT(i.unitPriceMillimes)}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-line bg-bg-2 p-6 flex flex-col justify-center gap-4">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Montant</p><p className="mt-2 font-sans text-[22px] font-semibold">{formatDT(totalMillimes)}</p></div>
          <Link href={`/compte/commandes/${number}`} className="btn-primary text-center">Suivre</Link>
        </div>
      </div>
    </article>
  );
}

export function LedgerRow({ number, date, totalMillimes, status, items }: { number: string; date: Date; totalMillimes: number; status: OrderStatus; items: { id: number; image: string | null; name: string; quantity: number }[] }) {
  const count = items.reduce((a, i) => a + i.quantity, 0);
  return (
    <li>
      <Link href={`/compte/commandes/${number}`} className="flex items-center gap-4 border border-line bg-bg p-4 hover:border-ink transition-colors">
        <span className="relative hidden h-12 w-10 shrink-0 bg-bg-2 border border-line sm:block">{items[0]?.image && <Image src={items[0].image} alt="" fill className="object-cover" />}{count > 1 && <span className="absolute -right-1 -top-1 bg-ink px-1 font-mono text-[10px] text-paper">+{count - 1}</span>}</span>
        <span className="min-w-0 flex-1"><span className="block font-mono text-[13px]">{number}</span><span className="mt-1 block font-mono text-[11px] text-text-muted">{formatDate(date)} · {count} articles</span></span>
        <span className="hidden sm:block border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">{ORDER_STATUS_LABELS[status]}</span>
        <span className="font-mono text-[13px]">{formatDT(totalMillimes)}</span>
        <span className="font-mono text-[11px]">→</span>
      </Link>
    </li>
  );
}

export function SectionBrow({ index, eyebrow, title, description, action }: { index?: string; eyebrow: string; title: string; description?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="max-w-[60ch]">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted flex items-center gap-3">{index && <span className="text-ink">{index}</span>}{eyebrow}</p>
        <h2 className="mt-3 font-sans text-[22px] font-semibold tracking-[-0.02em]">{title}</h2>
        {description && <p className="mt-2 font-sans text-[13px] leading-[1.5] text-text-secondary">{description}</p>}
      </div>
      {action && <Link href={action.href} className="btn-ghost">{action.label} →</Link>}
    </div>
  );
}
