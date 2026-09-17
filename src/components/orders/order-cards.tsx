import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/icons";
import { ORDER_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-constants";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/db/schema";
import { Seal } from "@/components/feedback/feedback";

/* ══════════════════════════════════════════════════════════════════════════
   ORDER CARDS — the dashboard's new furniture.

   HoldSeal (what the guest holds, as a seal), InFlightCard (the travelling
   order with its road in miniature), LedgerRow (one line of the register).
   Dense by design: the first viewport carries numbers, the road and the
   doors — never a masthead.
   ══════════════════════════════════════════════════════════════════════════ */

/** What the guest holds — a seal: glyph, number, name, door. */
export function HoldSeal({
  value,
  label,
  href,
  icon,
}: {
  value: ReactNode;
  label: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 overflow-hidden border border-line/60 bg-canvas px-5 py-4 shadow-whisper transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-[2px] hover:border-iodine/50 hover:shadow-soft"
    >
      <span aria-hidden className="absolute inset-y-0 start-0 w-[2px] bg-iodine-deep/70 transition-colors duration-500 group-hover:bg-iodine" />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-iodine/40 bg-iodine-wash/60 text-iodine">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-[1.7rem] leading-none tabular-nums text-carbon">{value}</span>
        <span className="mt-1.5 block truncate text-[9.5px] font-bold uppercase tracking-[0.18em] text-faint">{label}</span>
      </span>
      <ArrowRightIcon size={13} className="shrink-0 text-faint transition-all duration-500 group-hover:translate-x-1 group-hover:text-iodine rtl:rotate-180 rtl:group-hover:-translate-x-1" />
    </Link>
  );
}

/** The road in miniature — five segments; reached ones burn champagne. */
export function MiniJourney({ status, className }: { status: OrderStatus; className?: string }) {
  const terminal = status === "cancelled" || status === "returned";
  const reached = terminal ? -1 : ORDER_FLOW.indexOf(status);
  if (terminal) {
    return (
      <span className={cn("badge", status === "cancelled" ? "badge-error" : "badge-warning", className)}>
        {ORDER_STATUS_LABELS[status]}
      </span>
    );
  }
  return (
    <span className={cn("flex items-center gap-1", className)} role="img" aria-label={ORDER_STATUS_LABELS[status]}>
      {ORDER_FLOW.map((s, i) => (
        <span
          key={s}
          aria-hidden
          className={cn("h-[4px] w-7 rounded-full sm:w-9", i <= reached ? "bg-iodine" : "bg-canvas-2/60")}
        />
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

/** The travelling order — seals, road, pieces, tally, one door. */
export function InFlightCard({
  number,
  status,
  createdAt,
  totalMillimes,
  items,
}: {
  number: string;
  status: OrderStatus;
  createdAt: Date;
  totalMillimes: number;
  items: { id: number; image: string | null; name: string; quantity: number; unitPriceMillimes: number }[];
}) {
  const count = items.reduce((a, i) => a + i.quantity, 0);
  return (
    <article className="relative overflow-hidden border border-line/60 bg-canvas shadow-soft">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-iodine" />
      <div className="grid sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 p-6 lg:p-7">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-iodine">Commande en cours</p>
            <Seal kind={statusSeal(status)}>{ORDER_STATUS_LABELS[status]}</Seal>
          </div>
          <h2 className="mt-3 truncate font-mono text-[clamp(1.1rem,2.6vw,1.4rem)] text-carbon">{number}</h2>
          <p className="mt-1.5 text-[12.5px] text-muted">
            Passée le {formatDate(createdAt)} · {count} article{count > 1 ? "s" : ""}
          </p>
          <MiniJourney status={status} className="mt-4" />
          <ul className="scrollbar-none mt-5 flex gap-4 overflow-x-auto pb-1">
            {items.map((i) => (
              <li key={i.id} className="flex w-44 shrink-0 items-center gap-3">
                <span className="relative h-14 w-12 shrink-0 overflow-hidden bg-canvas-2">
                  {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] text-steel">{i.name}</span>
                  <span className="mt-0.5 block text-[11px] tabular-nums text-faint">
                    {i.quantity} × {formatDT(i.unitPriceMillimes)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-row items-center justify-between gap-4 border-t border-line/60 bg-porcelain/50 p-6 sm:w-60 sm:flex-col sm:items-stretch sm:justify-center sm:border-s sm:border-t-0 lg:p-7">
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-faint">Montant</p>
            <p className="mt-1.5 font-sans text-[1.7rem] leading-none tabular-nums text-carbon">{formatDT(totalMillimes)}</p>
          </div>
          <Link href={`/compte/commandes/${number}`} className="btn-solid w-full whitespace-nowrap !px-4 text-center">
            Suivre
          </Link>
        </div>
      </div>
    </article>
  );
}

/** One line of the register — thumb, number, seals, tally, door. */
export function LedgerRow({
  number,
  date,
  totalMillimes,
  status,
  items,
}: {
  number: string;
  date: Date;
  totalMillimes: number;
  status: OrderStatus;
  items: { id: number; image: string | null; name: string; quantity: number }[];
}) {
  const count = items.reduce((a, i) => a + i.quantity, 0);
  return (
    <li>
      <Link
        href={`/compte/commandes/${number}`}
        className="group flex items-center gap-4 border border-line/60 bg-canvas px-4 py-3.5 shadow-whisper transition-[border-color,box-shadow] duration-500 hover:border-iodine/50 hover:shadow-soft sm:px-5"
      >
        <span className="relative hidden h-14 w-12 shrink-0 overflow-hidden bg-canvas-2 min-[420px]:block">
          {items[0]?.image && <Image src={items[0].image} alt="" fill sizes="48px" className="object-cover" />}
          {count > 1 && (
            <span className="absolute bottom-0 end-0 bg-carbon/85 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-chalk">
              +{count - 1}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[13px] text-carbon">{number}</span>
          <span className="mt-1 block text-[11.5px] text-faint">
            {formatDate(date)} · {count} article{count > 1 ? "s" : ""}
          </span>
        </span>
        <span className="hidden shrink-0 sm:block">
          <Seal kind={statusSeal(status)}>{ORDER_STATUS_LABELS[status]}</Seal>
        </span>
        <span className="shrink-0 text-[14px] tabular-nums text-carbon">{formatDT(totalMillimes)}</span>
        <ArrowRightIcon size={13} className="hidden shrink-0 text-faint transition-all duration-500 group-hover:translate-x-1 group-hover:text-iodine sm:block rtl:rotate-180 rtl:group-hover:-translate-x-1" />
      </Link>
    </li>
  );
}

/** A section's brow — numeral, kicker, statement, door. Compact by design. */
export function SectionBrow({
  index,
  eyebrow,
  title,
  description,
  action,
}: {
  index?: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="flex items-center gap-3">
          {index && <span className="font-sans text-[13px] italic leading-none text-iodine">{index}</span>}
          <span className="kicker">{eyebrow}</span>
        </p>
        <h2 className="mt-2.5 font-sans text-[clamp(1.35rem,3vw,1.8rem)] leading-tight tracking-[-0.015em] text-carbon">
          {title}
        </h2>
        {description && <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn-ghost shrink-0">
          {action.label} <ArrowRightIcon size={13} />
        </Link>
      )}
    </div>
  );
}
