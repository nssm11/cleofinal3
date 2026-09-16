import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LE SALON PARTICULIER — the visual vocabulary of the private space.

   The room (AccountCard) and the loading shapes that stand in for rooms
   while they settle. Headers, stats, journeys and rows have moved to the
   new design system (`@/components/orders`, `@/components/feedback`).
   Everything here is server-safe and unanimated — the movement belongs to
   Reveal/Stagger at the call site.
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

