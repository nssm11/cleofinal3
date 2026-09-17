"use client";

import Link from "next/link";
import { ProductImage } from "./product-image";
import { useFiche } from "./product-card";
import { MEDIA_SIZES } from "@/lib/media";
import { HeartIcon, StarIcon } from "@/components/icons";
import { discountPercent, formatDT } from "@/lib/money";
import { useLocale } from "@/lib/i18n/client";
import type { ProductCard as PC } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * THE EDITORIAL PRODUCT CARD — the one product card of the house, everywhere.
 *
 * HyperUI's philosophy in Cléopâtre's voice: the photograph is the hero
 * (square, clean, barely stirring on hover), and underneath, only type —
 * brand, name, price, a whisper of metadata. No card container, no borders,
 * no shadows, no buttons shouting over the product.
 *
 * Everything it does is the house logic: the same fiche (cart flight,
 * wishlist action, toasts), the same price engine, the same routes. Cart,
 * compare and restock-alert live one click away on the product page, which
 * is why the card itself can disappear. Two tones — `light` for the day
 * pages, `dark` for the film universes — one skeleton.
 */

export type EditorialTone = "light" | "dark";

function StatusMark({ p, tone }: { p: PC; tone: EditorialTone }) {
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
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-3 top-3 z-10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm",
        tone === "dark" ? "bg-petrol/55 text-chalk" : "bg-canvas/85 text-carbon",
        !out && pct > 0 && (tone === "dark" ? "text-iodine" : "text-iodine"),
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
  const { copy, plateRef, w, pending, wish } = useFiche(p, isAuthed, wished);
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockThreshold;
  const dark = tone === "dark";

  return (
    <article className="group min-w-0" aria-label={p.name}>
      <div
        ref={plateRef}
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-sm",
          dark ? "bg-petrol-2" : "bg-canvas-2",
        )}
      >
        <Link href={`/produit/${p.slug}`} aria-label={p.name} tabIndex={-1} className="absolute inset-0">
          <ProductImage
            src={p.image}
            alt={p.name}
            priority={priority}
            sizes={sizes}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        </Link>
        <StatusMark p={p} tone={tone} />
        {/* The wishlist — noticed after the product, never before it. */}
        <span
          className={cn(
            "absolute right-2 top-2 z-10 transition-opacity duration-300",
            w
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100",
          )}
        >
          <button
            type="button"
            onClick={wish}
            disabled={pending}
            aria-pressed={w}
            aria-label={w ? copy.product.wishRemove : copy.product.wishAdd}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors duration-300",
              dark
                ? w
                  ? "bg-petrol/55 text-iodine"
                  : "bg-petrol/55 text-chalk/80 hover:text-iodine"
                : w
                  ? "bg-canvas/85 text-iodine"
                  : "bg-canvas/85 text-carbon/60 hover:text-iodine",
            )}
          >
            <HeartIcon size={14} filled={w} />
          </button>
        </span>
      </div>

      <div className="mt-3">
        {p.brandName &&
          (p.brandSlug ? (
            <Link
              href={`/marque/${p.brandSlug}`}
              className={cn(
                "truncate text-[9px] font-bold uppercase tracking-[0.22em] transition-colors",
                dark ? "text-chalk-faint hover:text-iodine" : "text-faint hover:text-iodine",
              )}
            >
              {p.brandName}
            </Link>
          ) : (
            <p className={cn("truncate text-[9px] font-bold uppercase tracking-[0.22em]", dark ? "text-chalk-faint" : "text-faint")}>
              {p.brandName}
            </p>
          ))}
        <h3
          className={cn(
            "mt-1 line-clamp-2 font-sans text-[15px] font-normal leading-snug",
            dark ? "text-chalk" : "text-carbon",
          )}
        >
          <Link href={`/produit/${p.slug}`} className="transition-colors group-hover:underline group-hover:underline-offset-4">
            {p.name}
          </Link>
        </h3>
        <p className={cn("mt-1 text-[13.5px] tabular-nums", dark ? "text-chalk-muted" : "text-steel")}>
          {out ? (
            <span className={cn("text-[11px] font-bold uppercase tracking-[0.18em]", dark ? "text-chalk-faint" : "text-faint")}>
              {copy.restock.badgeOut}
            </span>
          ) : (
            <>
              {formatDT(p.priceMillimes)}
              {pct > 0 && p.compareAtMillimes && (
                <span className={cn("ml-2 text-[11.5px] tabular-nums line-through", dark ? "text-chalk-faint" : "text-faint")}>
                  {formatDT(p.compareAtMillimes)}
                </span>
              )}
            </>
          )}
        </p>
        {(p.volume || p.ratingCount > 0 || low) && (
          <p className={cn("mt-1 flex flex-wrap items-center gap-x-2 text-[11px] tabular-nums", dark ? "text-chalk-faint" : "text-faint")}>
            {p.volume && <span>{p.volume}</span>}
            {p.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <StarIcon size={10} filled className={dark ? "text-iodine" : "text-iodine"} />
                {(p.ratingAvg / 100).toFixed(1)}
                <span>({p.ratingCount})</span>
              </span>
            )}
            {low && <span className={dark ? "text-iodine" : "text-iodine"}>{copy.restock.badgeLow}</span>}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * THE EDITORIAL GRID — the shelf's own rhythm.
 *
 * Two calm columns on phones, three or four on the wide desktop depending
 * on the room (sidebar shelves take three, full rooms four), generous air
 * between plates. Every public grid speaks it.
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
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6", cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
      {items.map((p, i) => (
        <EditorialProductCard key={p.id} p={p} wished={wishedIds.includes(p.id)} isAuthed={isAuthed} priority={i < priorityCount} tone={tone} />
      ))}
    </div>
  );
}
