import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/icons";
import { ORDER_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-constants";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/db/schema";

/* ══════════════════════════════════════════════════════════════════════════
   LE SALON PARTICULIER — the visual vocabulary of the private space.

   These are the account's own surfaces, cut from the same stone as the public
   site (ivory ground, hairline border, whisper→soft shadow, sharp 3px corner,
   champagne as the single accent) but organised for function: a card is a
   room, a header is a chapter heading, a stat is a number set large, a
   journey is the parcel's road in miniature. Everything here is server-safe
   and unanimated — the movement belongs to Reveal/Stagger at the call site.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * The room — the account's premium card. Ivory ground, one hairline border, a
 * shadow that deepens and the surface lifts by a few pixels on hover. Never a
 * heavy box: the corner stays sharp (3px), the accent is a single champagne
 * hairline, and the interior is given generous air.
 */
export function AccountCard({
  children,
  className,
  hover = true,
  accent = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Lift + deepen the shadow on hover. */
  hover?: boolean;
  /** A champagne hairline along the top edge. */
  accent?: boolean;
  as?: "div" | "section" | "article" | "li" | "aside";
}) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-[3px] border border-stone/60 bg-ivory shadow-whisper",
        "transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        hover && "hover:-translate-y-[3px] hover:border-stone-2/70 hover:shadow-soft",
        className,
      )}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-champagne-2/0 via-champagne-2 to-champagne-2/0"
        />
      )}
      {children}
    </Tag>
  );
}

/** Interior padding for a room — consistent air inside every card. */
export const cardPad = "p-6 sm:p-7 lg:p-8";

/**
 * The chapter heading of a page section: a kicker (with an optional numeral),
 * a display statement, an optional line of support, and a quiet invitation on
 * the right. The account's answer to the public `SectionHeading`, tuned to a
 * calmer voice.
 */
export function AccountHeader({
  eyebrow,
  title,
  description,
  action,
  index,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  index?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {(eyebrow || index) && (
          <p className="mb-4 flex items-center gap-4">
            {index && <span className="font-display text-[15px] italic leading-none text-champagne-2">{index}</span>}
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          </p>
        )}
        <h2 className="font-display text-display-sm text-ink sm:text-display-md">{title}</h2>
        {description && <p className="mt-4 max-w-xl text-[14px] leading-[1.75] text-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn-ghost shrink-0">
          {action.label} <ArrowRightIcon size={13} />
        </Link>
      )}
    </div>
  );
}

/**
 * A metric set large — the number is the content, the label its footnote.
 * Wrap the value in `CountUp` (client) where you want the digits to settle.
 */
export function StatBlock({
  value,
  label,
  sub,
  href,
  icon,
  className,
}: {
  value: ReactNode;
  label: string;
  sub?: ReactNode;
  href?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const inner = (
    <div className={cn("group/stat relative flex h-full min-h-[9.5rem] flex-col justify-between", cardPad)}>
      <div className="flex items-start justify-between">
        {icon && <span className="flex h-10 w-10 items-center justify-center border border-stone/60 bg-cream/60 text-champagne-2">{icon}</span>}
        {href && (
          <ArrowRightIcon
            size={14}
            className="text-sand-2 transition-all duration-500 group-hover/stat:translate-x-1 group-hover/stat:text-champagne-2"
          />
        )}
      </div>
      <div className="mt-8">
        <p className="font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tabular-nums text-ink transition-colors duration-500 group-hover/stat:text-champagne-2">
          {value}
        </p>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">{label}</p>
        {sub && <p className="mt-1.5 text-[12px] text-muted-2">{sub}</p>}
      </div>
    </div>
  );
  return (
    <AccountCard className={cn("h-full", className)}>
      {href ? (
        <Link href={href} className="absolute inset-0 z-10" aria-label={label} />
      ) : null}
      <div className="relative">{inner}</div>
    </AccountCard>
  );
}

/** The parcel's road in miniature — five hairline steps, the reached ones lit. */
export function OrderJourney({ status, className }: { status: OrderStatus; className?: string }) {
  const terminal = status === "cancelled" || status === "returned";
  const idx = ORDER_FLOW.indexOf(status);
  const reached = terminal ? -1 : idx;
  const labels: Record<string, string> = {
    pending: "Commandée",
    confirmed: "Confirmée",
    preparing: "En préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
  };
  if (terminal) {
    return (
      <p
        className={cn(
          "inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em]",
          status === "cancelled" ? "bg-error-soft text-error" : "bg-warning-soft text-warning",
          className,
        )}
      >
        {status === "cancelled" ? "Annulée" : "Retournée"}
      </p>
    );
  }
  return (
    <div className={cn("flex items-center gap-1", className)} role="img" aria-label={`Statut : ${labels[status]}`}>
      {ORDER_FLOW.map((s, i) => {
        const done = i < reached;
        const current = i === reached;
        return (
          <span key={s} className="flex items-center gap-1">
            <span
              className={cn(
                "h-[3px] w-6 rounded-full transition-colors duration-700 sm:w-8",
                done || current ? "bg-champagne-2" : "bg-stone-2/50",
              )}
            />
            {i < ORDER_FLOW.length - 1 && (
              <span aria-hidden className="sr-only">{labels[s]}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** A compact status sign with a living dot — the list's answer to a badge. */
export function StatusDot({
  status,
  label,
  className,
}: {
  status: OrderStatus;
  label: string;
  className?: string;
}) {
  const tone =
    status === "delivered"
      ? { dot: "bg-success", text: "text-success" }
      : status === "cancelled"
        ? { dot: "bg-error", text: "text-error" }
        : status === "returned"
          ? { dot: "bg-warning", text: "text-warning" }
          : { dot: "bg-champagne-2", text: "text-champagne-2" };
  const live = status === "pending" || status === "confirmed" || status === "preparing" || status === "shipped";
  return (
    <span className={cn("inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]", tone.text, className)}>
      <span className="relative flex h-1.5 w-1.5">
        {live && (
          <span aria-hidden className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none", tone.dot)} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", tone.dot)} />
      </span>
      {label}
    </span>
  );
}

/** A quiet door to a room — the overview's quick links, as an object. */
export function QuickDoor({
  href,
  label,
  value,
  icon,
  className,
}: {
  href: string;
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <AccountCard className="group h-full">
      <Link href={href} className="absolute inset-0 z-10" aria-label={label} />
      <div className={cn("relative flex items-center justify-between gap-4", cardPad)}>
        <div className="flex items-center gap-4">
          {icon && (
            <span className="flex h-11 w-11 items-center justify-center border border-stone/60 bg-cream/60 text-champagne-2 transition-colors duration-500 group-hover:border-champagne-2/50">
              {icon}
            </span>
          )}
          <div>
            <p className="font-display text-[19px] tabular-nums leading-none text-ink">{value}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-2 transition-colors duration-500 group-hover:text-champagne-2">
              {label}
            </p>
          </div>
        </div>
        <ArrowRightIcon
          size={15}
          className="shrink-0 text-sand-2 transition-all duration-500 group-hover:translate-x-1 group-hover:text-champagne-2"
        />
      </div>
    </AccountCard>
  );
}

/* ── LOADING SHAPES — the account never shows a bare spinner ────────────── */

/** A row of rooms settling — for the overview and the order list. */
export function CardRowSkeleton({ n = 3, tall = false }: { n?: number; tall?: boolean }) {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={cn("rounded-[3px] border border-stone/60 bg-ivory p-6", tall && "p-8")}>
          <div className="flex items-center gap-5">
            <div className="skeleton h-16 w-14 rounded-[2px]" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-3.5 w-1/4 rounded-[2px]" />
              <div className="skeleton h-3 w-1/2 rounded-[2px]" />
            </div>
            <div className="skeleton h-8 w-24 rounded-[2px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The metric trio settling. */
export function StatRowSkeleton({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-[3px] border border-stone/60 bg-ivory p-7">
          <div className="skeleton h-3 w-12 rounded-[2px]" />
          <div className="skeleton mt-10 h-9 w-20 rounded-[2px]" />
          <div className="skeleton mt-4 h-3 w-16 rounded-[2px]" />
        </div>
      ))}
    </div>
  );
}

/** A grid of fiches settling — for the wishlist. */
export function FicheGridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[4/5] rounded-[3px]" />
          <div className="skeleton mt-4 h-2.5 w-1/3 rounded-[2px]" />
          <div className="skeleton mt-3 h-4 w-4/5 rounded-[2px]" />
          <div className="skeleton mt-3 h-4 w-1/4 rounded-[2px]" />
        </div>
      ))}
    </div>
  );
}

/**
 * One line of the ledger — a room in miniature: the parcel's contents in
 * overlapping frames, the number, the live status with the road in
 * miniature, and the total. The whole card is the link.
 */
export function OrderRow({
  number,
  date,
  total,
  status,
  items,
}: {
  number: string;
  date: Date;
  total: number;
  status: OrderStatus;
  items: { id: number; image: string | null; name: string; quantity: number }[];
}) {
  const qty = items.reduce((a, i) => a + i.quantity, 0);
  return (
    <AccountCard className="group">
      <Link href={`/compte/commandes/${number}`} className="absolute inset-0" aria-label={`Commande ${number}`} />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex shrink-0 items-center -space-x-5">
          {items.slice(0, 3).map((i) => (
            <span key={i.id} className="relative h-[72px] w-[58px] overflow-hidden rounded-[2px] border-2 border-ivory bg-marble shadow-whisper">
              {i.image && <Image src={i.image} alt={i.name} fill sizes="58px" className="object-cover" />}
            </span>
          ))}
          {items.length > 3 && (
            <span className="relative z-10 flex h-[72px] w-[40px] items-center justify-center rounded-[2px] border border-stone/60 bg-cream font-display text-[13px] italic text-muted-2">
              +{items.length - 3}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-display text-[17px] text-ink transition-colors duration-500 group-hover:text-champagne-2">{number}</p>
            <StatusDot status={status} label={ORDER_STATUS_LABELS[status]} />
          </div>
          <p className="mt-1 text-[12px] text-muted-2">
            {formatDate(date)} · {qty} article{qty > 1 ? "s" : ""}
          </p>
          <OrderJourney status={status} className="mt-3.5" />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-stone/60 pt-4 sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
          <p className="font-display text-[19px] tabular-nums leading-none text-ink">{formatDT(total)}</p>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-2 transition-colors duration-500 group-hover:text-champagne-2">
            Voir la commande
            <ArrowRightIcon size={12} className="transition-transform duration-500 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </AccountCard>
  );
}
