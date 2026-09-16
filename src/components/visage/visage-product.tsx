"use client";

import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { useFiche } from "@/components/catalog/product-card";
import { MEDIA_SIZES } from "@/lib/media";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { formatDT } from "@/lib/money";
import { useLocale } from "@/lib/i18n/client";
import type { ProductCard as PC } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * VISAGE PRODUCT — the hero's compact rows.
 *
 * Grid plates moved to the one editorial card; this module keeps only
 * `CineQuick`, the hero counter's thumb rows with instant quick-add —
 * the same fiche logic, a list context, never a grid.
 */

export function CineQuick({
  p,
  isAuthed = false,
  priority = false,
}: {
  p: PC;
  isAuthed?: boolean;
  priority?: boolean;
}) {
  const { copy, plateRef, added, add } = useFiche(p, isAuthed, false);
  return (
    <article className="group/q flex min-w-0 items-center gap-4" aria-label={p.name}>
      <Link
        href={`/produit/${p.slug}`}
        tabIndex={-1}
        className="relative h-20 w-16 shrink-0 overflow-hidden bg-cine-noir-2 sm:h-24 sm:w-[4.5rem]"
      >
        <span ref={plateRef} className="absolute inset-0">
          <ProductImage
            src={p.image}
            alt=""
            priority={priority}
            sizes={MEDIA_SIZES.thumb}
            className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/q:scale-[1.07]"
          />
        </span>
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[8.5px] font-bold uppercase tracking-[0.24em] text-cine-faint">{p.brandName}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-light leading-snug text-cine-ivory">
          <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 group-hover/q:text-cine-gold">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1 text-[13px] tabular-nums text-cine-mist">{formatDT(p.priceMillimes)}</p>
      </div>
      {p.stock > 0 && (
        <button
          type="button"
          onClick={add}
          data-done={added}
          aria-label={`${copy.product.quickAdd} — ${p.name}`}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500",
            added
              ? "border-cine-gold bg-cine-gold text-cine-noir"
              : "border-cine-ivory/30 text-cine-ivory hover:border-cine-gold hover:bg-cine-gold hover:text-cine-noir",
          )}
        >
          {added ? <CheckIcon size={13} /> : <PlusIcon size={13} />}
        </button>
      )}
    </article>
  );
}
