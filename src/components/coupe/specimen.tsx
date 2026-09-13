"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import { fmt } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";
import { formatDT } from "@/lib/money";
import { Niche, CoupeCaption, CoupePrice } from "./parts";
import type { ProductCard } from "@/lib/catalog";

/**
 * THE SPECIMEN — one object standing in one niche.
 *
 * The homepage's answer to "the product card": the object is never boxed.
 * It stands in an arched niche on a shared line of stone; the caption is an
 * engraving under the arch; the commerce act (add to the tray) is a small
 * brass ticket that lives *with* the object, not over it. Same cart contract
 * as the catalogue's card — payload, stock bounds, toast, flight animation.
 */
export function Specimen({
  p,
  tone = "plaster",
  priority = false,
  sizes = "320px",
  feature = false,
  overline,
  className = "",
  aspect = "aspect-[4/5]",
  tight = false,
}: {
  p: ProductCard;
  tone?: "plaster" | "deep" | "glass";
  priority?: boolean;
  sizes?: string;
  feature?: boolean;
  /** Section-specific tag engraved above the brand ("CHOIX DU COMPTOIR"…). */
  overline?: string | null;
  className?: string;
  aspect?: string;
  /** Narrow columns (the vitrine's four-up): price and ticket stack. */
  tight?: boolean;
}) {
  const cart = useCart();
  const { toast } = useToast();
  const { copy } = useLocale();
  const nicheRef = useRef<HTMLAnchorElement>(null);
  const [added, setAdded] = useState(false);
  const light = tone === "deep";
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockThreshold;

  const add = () => {
    if (out) return;
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
      nicheRef.current?.firstElementChild as HTMLElement | null,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    toast({
      kind: "success",
      title: copy.product.gave,
      description: fmt(copy.product.gaveDesc, { n: 1, name: p.name }),
      action: { label: copy.product.seeCart, onClick: cart.open },
    });
  };

  return (
    <figure className={`group relative flex min-w-0 flex-col ${className}`}>
      <Link ref={nicheRef} href={`/produit/${p.slug}`} aria-label={p.name}>
        <Niche src={p.image} alt={p.name} sizes={sizes} priority={priority} tone={tone === "deep" ? "deep" : tone === "glass" ? "glass" : "plaster"} className={`${aspect} w-full`}>
          {overline ? (
            <span className={`absolute inset-x-0 top-[13%] z-10 block text-center text-[8px] font-extrabold uppercase tracking-[0.3em] ${light ? "text-brass-2" : "text-brass"}`}>
              {overline}
            </span>
          ) : null}
          {out ? (
            <span className={`absolute inset-x-0 bottom-3 z-10 mx-auto w-fit border px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.26em] ${light ? "border-paper/25 text-paper/60" : "border-stone-2/50 bg-cream/80 text-muted"}`}>
              {copy.product.outOfStock}
            </span>
          ) : null}
        </Niche>
      </Link>

      {/* The stone line every specimen stands on. */}
      <span aria-hidden className={`mt-0 h-px w-full ${light ? "bg-paper/12" : "bg-stone-2/40"}`} />

      <figcaption className="mt-3.5 flex min-w-0 flex-col gap-2">
        <CoupeCaption
          light={light}
          overline={p.brandName}
          title={<span className={feature ? "text-[clamp(1.15rem,1.5vw,1.45rem)]" : undefined}>{p.name}</span>}
          meta={p.volume ?? undefined}
        />
        {feature && p.shortDescription ? (
          <p className={`line-clamp-2 text-[12.5px] leading-relaxed ${light ? "text-paper/55" : "text-muted"}`}>{p.shortDescription}</p>
        ) : null}
        {low ? (
          <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${light ? "text-brass-2/90" : "text-warning"}`}>
            {fmt(copy.product.lowStock, { n: p.stock })}
          </p>
        ) : null}

        <div className={`mt-auto flex border-t pt-2.5 ${tight ? "flex-col items-start gap-2" : "items-end justify-between gap-3"}`} style={{ borderColor: light ? "rgba(244,236,216,0.12)" : "rgba(195,183,156,0.35)" }}>
          <CoupePrice light={light} price={formatDT(p.priceMillimes)} compareAt={p.compareAtMillimes ? formatDT(p.compareAtMillimes) : null} className={tight ? "text-[15px]" : undefined} />
          <button
            type="button"
            onClick={add}
            disabled={out}
            aria-label={`${copy.product.add} — ${p.name}`}
            className={`relative shrink-0 overflow-hidden border px-3 py-2 text-[8.5px] font-extrabold uppercase tracking-[0.24em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              light
                ? "border-paper/25 text-paper/80 hover:bg-paper hover:text-ink"
                : "border-ink/25 text-ink hover:border-brass hover:text-brass"
            } ${tight ? "w-full text-center" : ""}`}
          >
            <span className="relative">
              {added ? copy.product.added : copy.product.add}
            </span>
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
