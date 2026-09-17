"use client";
import { ProductImage } from "./product-image";
import { MEDIA_SIZES } from "@/lib/media";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { StarIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import type { ProductCard as PC } from "@/lib/catalog";
import { discountPercent, formatDT } from "@/lib/money";
import { useLocale } from "@/lib/i18n/client";
import { toggleWishlistAction } from "@/actions/shop";

/**
 * LE FOND — what remains of the old card file.
 *
 * The grid plates moved to the editorial card (`editorial-product-card`);
 * this module keeps the two things other rooms still share: `useFiche`
 * (the one commerce logic — cart flight, wishlist action, toasts) and the
 * compact `ProductCard` row for rails that are lists, not grids
 * (substitutions, recently viewed).
 */

/**
 * The fiche's commerce logic, extracted for reuse: the same cart flight, the
 * same wishlist action, the same toasts — available to any presentation, on
 * any ground, without duplicating a line of behaviour.
 */
export function useFiche(p: PC, isAuthed: boolean, wished: boolean) {
  const cart = useCart();
  const { toast } = useToast();
  const { copy } = useLocale();
  const router = useRouter();
  const plateRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const [w, setW] = useState(wished);
  const [pending, start] = useTransition();

  const add = () => {
    if (p.stock <= 0) return;
    cart.add(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        brandName: p.brandName,
        image: p.image,
        priceMillimes: p.priceMillimes,
        stock: p.stock,
        volume: p.volume,
      },
      1,
      plateRef.current,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    toast({ kind: "success", title: copy.product.gave, description: p.name, action: { label: copy.product.seeCart, onClick: cart.open } });
  };

  const wish = () => {
    if (!isAuthed) {
      router.push(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    start(async () => {
      const r = await toggleWishlistAction(p.id);
      if (r.ok) {
        setW(r.data.wished);
        toast({ kind: "success", title: r.message ?? "" });
      } else toast({ kind: "error", title: r.error });
    });
  };

  return { cart, copy, plateRef, added, w, pending, add, wish };
}

/** The compact rail row — photograph left, caption right. Never a grid card. */
export function ProductCard({ p }: { p: PC }) {
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  return (
    <article className="group relative flex gap-4" aria-label={p.name}>
      <Link href={`/produit/${p.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden bg-bone-2">
        <ProductImage
          src={p.image}
          alt=""
          sizes={MEDIA_SIZES.leaf}
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[8.5px] font-bold uppercase tracking-[0.22em] text-ash">{p.brandName}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] leading-snug text-ink">
          <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 group-hover:text-cinabre-2">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <p className="text-[14px] tabular-nums text-ink">
            {formatDT(p.priceMillimes)}
            {pct > 0 && p.compareAtMillimes && (
              <span className="ml-2 text-[12px] tabular-nums text-ash line-through">{formatDT(p.compareAtMillimes)}</span>
            )}
          </p>
          {p.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-ash">
              <span className="text-cinabre-2">
                <StarIcon size={12} filled />
              </span>
              {(p.ratingAvg / 100).toFixed(1)}
              <span className="text-ash/70">({p.ratingCount})</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
