"use client";

import Link from "next/link";
import { ProductImage } from "./product-image";
import { useFiche } from "./product-card";
import { MEDIA_SIZES } from "@/lib/media";
import { CheckIcon, HeartIcon, PlusIcon, StarIcon } from "@/components/icons";
import { discountPercent, formatDT } from "@/lib/money";
import { useLocale } from "@/lib/i18n/client";
import type { ProductCard as PC } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LA PLANCHE — the one product presentation of the house.
   ──────────────────────────────────────────────────────────────────────────
   A product is not a card here: it is a *plate* in a catalogue. The
   photograph is cut 4:5 with square corners, sits flush on the page with no
   frame around it, and the type below it is measured like a caption in a
   printed index — brand in monospace micro-caps, name in the Didone, price
   in tabular figures, and one mark that says whether it is alive (in stock,
   low, gone).

   On hover the plate reveals its two gestures — add to the bag, or open the
   fiche — as a bar that lifts from the bottom edge. Touch devices get both
   permanently, because a hover nobody can perform is not an action.

   All of it runs on the house logic kept in `useFiche`: the same cart
   flight, the same wishlist action, the same toasts.
   ══════════════════════════════════════════════════════════════════════════ */

export type EditorialTone = "light" | "dark";

function StatusSeal({ p, tone }: { p: PC; tone: EditorialTone }) {
  const { copy } = useLocale();
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;
  const label = out
    ? copy.restock.badgeOut
    : pct > 0
      ? `−${pct}%`
      : p.isNew
        ? copy.common.yes === "Oui"
          ? "Nouveau"
          : copy.common.yes === "Eya"
            ? "Jdid"
            : "جديد"
        : null;
  if (!label) return null;
  const accent = !out && pct > 0;
  return (
    <span
      className={cn(
        "pointer-events-none absolute start-2.5 top-2.5 z-10 border px-1.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.14em] backdrop-blur-md",
        tone === "dark"
          ? accent
            ? "border-cinabre-3/40 bg-obsidian/50 text-cinabre-3"
            : "border-film-line bg-obsidian/50 text-alabaster/80"
          : accent
            ? "border-cinabre/35 bg-alabaster/80 text-cinabre-2"
            : "border-rule-strong bg-alabaster/80 text-slate",
      )}
    >
      {label}
    </span>
  );
}

export function EditorialProductCard({
  p,
  wished = false,
  isAuthed = false,
  priority = false,
  tone = "light",
  sizes = MEDIA_SIZES.card,
}: {
  p: PC;
  wished?: boolean;
  isAuthed?: boolean;
  priority?: boolean;
  tone?: EditorialTone;
  sizes?: string;
}) {
  const { copy, plateRef, added, w, pending, add, wish } = useFiche(p, isAuthed, wished);
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockThreshold;
  const dark = tone === "dark";

  return (
    <article className="group relative min-w-0" aria-label={p.name}>
      <div ref={plateRef} className={cn("relative aspect-[4/5] w-full overflow-hidden", dark ? "bg-night-2" : "bg-bone")}>
        <Link href={`/produit/${p.slug}`} aria-label={p.name} tabIndex={-1} className="absolute inset-0">
          <ProductImage
            src={p.image}
            alt={p.name}
            priority={priority}
            sizes={sizes}
            className="object-cover transition-transform duration-[900ms] ease-[var(--ease-luxe)] group-hover:scale-[1.045]"
          />
        </Link>

        <StatusSeal p={p} tone={tone} />

        {/* The wishlist — a mark you leave, not a button that shouts. */}
        <button
          type="button"
          onClick={wish}
          disabled={pending}
          aria-pressed={w}
          aria-label={w ? copy.product.wishRemove : copy.product.wishAdd}
          className={cn(
            "absolute end-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center border backdrop-blur-md transition-all duration-300",
            dark
              ? "border-film-line bg-obsidian/50 hover:border-alabaster/40"
              : "border-rule-strong bg-alabaster/80 hover:border-ink",
            w ? "text-cinabre" : dark ? "text-alabaster/70" : "text-graphite",
            w ? "opacity-100" : "opacity-0 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
          )}
        >
          <HeartIcon size={13} filled={w} />
        </button>

        {/* The two gestures, lifted from the bottom edge. */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 flex items-stretch gap-px transition-transform duration-500 ease-[var(--ease-luxe)]",
            "translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 [@media(hover:none)]:translate-y-0",
          )}
        >
          <Link
            href={`/produit/${p.slug}`}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center font-mono text-[0.625rem] uppercase tracking-[0.16em] backdrop-blur-md transition-colors",
              dark ? "bg-obsidian/70 text-alabaster hover:text-cinabre-3" : "bg-alabaster/85 text-ink hover:text-cinabre",
            )}
          >
            Voir la fiche
          </Link>
          <button
            type="button"
            onClick={add}
            disabled={out}
            data-done={added}
            aria-label={out ? copy.restock.badgeOut : `${copy.product.add} ${p.name}`}
            className={cn(
              "flex min-h-11 w-14 shrink-0 items-center justify-center transition-colors duration-300",
              out ? "cursor-not-allowed bg-bone-2 text-faint" : added ? "bg-success text-white" : "bg-ink text-alabaster hover:bg-cinabre",
            )}
          >
            {added ? <CheckIcon size={15} /> : <PlusIcon size={15} />}
          </button>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="flex items-center justify-between gap-3">
          {p.brandName &&
            (p.brandSlug ? (
              <Link
                href={`/marque/${p.brandSlug}`}
                className={cn(
                  "truncate font-mono text-[0.5625rem] uppercase tracking-[0.2em] transition-colors",
                  dark ? "text-alabaster/50 hover:text-cinabre-3" : "text-ash hover:text-cinabre",
                )}
              >
                {p.brandName}
              </Link>
            ) : (
              <p className={cn("truncate font-mono text-[0.5625rem] uppercase tracking-[0.2em]", dark ? "text-alabaster/50" : "text-ash")}>
                {p.brandName}
              </p>
            ))}
          {p.volume && <span className={cn("num shrink-0 text-[0.625rem]", dark ? "text-alabaster/40" : "text-faint")}>{p.volume}</span>}
        </div>

        <h3 className={cn("mt-1.5 line-clamp-2 font-display text-[1.0625rem] leading-snug", dark ? "text-alabaster" : "text-ink")}>
          <Link href={`/produit/${p.slug}`} className="transition-colors duration-300 group-hover:text-cinabre">
            {p.name}
          </Link>
        </h3>

        <div className="mt-2 flex items-baseline justify-between gap-3">
          <p className={cn("num text-[0.875rem]", dark ? "text-alabaster" : "text-ink")}>
            {out ? (
              <span className={cn("font-mono text-[0.625rem] uppercase tracking-[0.16em]", dark ? "text-alabaster/40" : "text-ash")}>
                {copy.restock.badgeOut}
              </span>
            ) : (
              <>
                {formatDT(p.priceMillimes)}
                {pct > 0 && p.compareAtMillimes && (
                  <span className={cn("ms-2 text-[0.6875rem] line-through", dark ? "text-alabaster/35" : "text-faint")}>
                    {formatDT(p.compareAtMillimes)}
                  </span>
                )}
              </>
            )}
          </p>
          {p.ratingCount > 0 && (
            <span className={cn("inline-flex items-center gap-1 num text-[0.625rem]", dark ? "text-alabaster/60" : "text-graphite")}>
              <StarIcon size={10} filled className="text-cinabre" />
              {(p.ratingAvg / 100).toFixed(1)}
            </span>
          )}
        </div>

        {/* One mark of life — the accent belongs to what is available. */}
        <p className="mt-2 flex items-center gap-2">
          {out ? (
            <span className={cn("font-mono text-[0.5625rem] uppercase tracking-[0.16em]", dark ? "text-alabaster/35" : "text-faint")}>
              Épuisé
            </span>
          ) : low ? (
            <>
              <span aria-hidden className="alive-dot" />
              <span className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-cinabre">
                Plus que {p.stock}
              </span>
            </>
          ) : (
            <>
              <span aria-hidden className="h-1 w-1 rounded-full bg-success" />
              <span className={cn("font-mono text-[0.5625rem] uppercase tracking-[0.16em]", dark ? "text-alabaster/35" : "text-faint")}>
                En stock
              </span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}

/**
 * LA ÉTAGÈRE — the shelf's own rhythm. Two columns on phones, three or four on
 * the wide desktop. Every public grid speaks it.
 */
export function EditorialProductGrid({
  items,
  wishedIds = [],
  isAuthed = false,
  priorityCount = 4,
  tone = "light",
  cols = 4,
}: {
  items: PC[];
  wishedIds?: number[];
  isAuthed?: boolean;
  priorityCount?: number;
  tone?: EditorialTone;
  cols?: 3 | 4;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6", cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
      {items.map((p, i) => (
        <EditorialProductCard key={p.id} p={p} wished={wishedIds.includes(p.id)} isAuthed={isAuthed} priority={i < priorityCount} tone={tone} />
      ))}
    </div>
  );
}
