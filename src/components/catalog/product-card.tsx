"use client";
import { ProductImage } from "./product-image";
import { MEDIA_SIZES } from "@/lib/media";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { CheckIcon, ClockIcon, HeartIcon, PlusIcon, StarIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import type { ProductCard as PC } from "@/lib/catalog";
import { discountPercent, formatDT } from "@/lib/money";
import { useLocale } from "@/lib/i18n/client";
import { toggleWishlistAction } from "@/actions/shop";
import { CompareToggle } from "./compare";
import { cn } from "@/lib/utils";

/**
 * LA FICHE — the one product card of the house, everywhere.
 *
 * Every grid speaks the same skeleton (the card structure, re-cut for the
 * house): `card` → `figure` (a borderless square photograph with its honest
 * marks and the wishlist orb) → `card-body` (a pure-type caption — brand,
 * name as `card-title`, rating, volume) → `card-actions` (the price and the
 * primary gesture: the ink-plus for plates, the full champagne button for
 * the feature statement). Three formats share it: `plate` (the grid
 * rhythm), `feature` (a large statement, same bones, bigger voice) and
 * `leaf` (a compact rail row, outside the grid skeleton). All commerce is
 * the house logic: the same cart flight, the same wishlist action, the same
 * toasts, the same restock road.
 */

function useFiche(p: PC, isAuthed: boolean, wished: boolean) {
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

function Marks({ p }: { p: PC }) {
  const { copy } = useLocale();
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockThreshold;
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-30 flex flex-col items-start gap-1.5">
      {pct > 0 && (
        <span className="bg-ink/85 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-paper backdrop-blur-sm">
          −{pct}%
        </span>
      )}
      {p.isNew && pct === 0 && (
        <span className="border border-ink/15 bg-cream/85 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-champagne-2 backdrop-blur-sm">
          {copy.common.yes === "Oui" ? "Nouveau" : copy.common.yes === "Eya" ? "Jdid" : "جديد"}
        </span>
      )}
      {low && (
        <span className="border border-warning/40 bg-warning-soft/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-warning backdrop-blur-sm">
          {copy.restock.badgeLow}
        </span>
      )}
      {out && (
        <span className="border border-ink/15 bg-paper/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink/75 backdrop-blur-sm">
          {copy.restock.badgeOut}
        </span>
      )}
    </div>
  );
}

function BrandLine({ p }: { p: PC }) {
  const cls = "truncate text-[8.5px] font-bold uppercase tracking-[0.22em] text-muted-2 transition-colors hover:text-champagne-2";
  if (p.brandName && p.brandSlug) {
    return (
      <Link href={`/marque/${p.brandSlug}`} className={cls}>
        {p.brandName}
      </Link>
    );
  }
  return <span className={cls}>{p.brandName}</span>;
}

function RatingLine({ p }: { p: PC }) {
  if (p.ratingCount <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-2">
      <span className="text-champagne-2">
        <StarIcon size={12} filled />
      </span>
      {(p.ratingAvg / 100).toFixed(1)}
      <span className="text-muted-2/70">({p.ratingCount})</span>
    </span>
  );
}

export function ProductCard({
  p,
  wished = false,
  priority = false,
  isAuthed = false,
  variant = "plate",
  showCompare = true,
}: {
  p: PC;
  wished?: boolean;
  priority?: boolean;
  isAuthed?: boolean;
  variant?: "plate" | "feature" | "leaf";
  showCompare?: boolean;
}) {
  const { copy, plateRef, added, w, pending, add, wish } = useFiche(p, isAuthed, wished);
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;

  /* ── LEAF — a compact rail row ────────────────────────────────────────── */
  if (variant === "leaf") {
    return (
      <article className="group relative flex gap-4" aria-label={p.name}>
        <Link href={`/produit/${p.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden bg-marble">
          <ProductImage
            src={p.image}
            alt=""
            sizes={MEDIA_SIZES.leaf}
            className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-[8.5px] font-bold uppercase tracking-[0.22em] text-muted-2">{p.brandName}</p>
          <h3 className="mt-1 line-clamp-2 font-display text-[15px] leading-snug text-ink">
            <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 group-hover:text-champagne-2">
              {p.name}
            </Link>
          </h3>
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <p className="text-[14px] tabular-nums text-ink">
              {formatDT(p.priceMillimes)}
              {pct > 0 && p.compareAtMillimes && (
                <span className="ml-2 text-[12px] tabular-nums text-muted-2 line-through">{formatDT(p.compareAtMillimes)}</span>
              )}
            </p>
            <RatingLine p={p} />
          </div>
        </div>
      </article>
    );
  }

  const feature = variant === "feature";

  /* ── THE PLATE'S FIGURE — the photograph of the house ────────────────── */
  const photo = (
    <figure
      ref={plateRef}
      className={cn(
        "relative w-full overflow-hidden bg-marble",
        feature ? "aspect-[4/3] lg:aspect-auto lg:min-h-[380px]" : "aspect-square",
      )}
    >
      <Link href={`/produit/${p.slug}`} aria-label={p.name} tabIndex={-1} className="absolute inset-0">
        <ProductImage
          src={p.image}
          alt={p.name}
          priority={priority}
          sizes={feature ? MEDIA_SIZES.feature : MEDIA_SIZES.card}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
        />
      </Link>
      <Marks p={p} />
      <span className="absolute right-2 top-2 z-30 origin-top-right scale-[0.82]">
        <button
          type="button"
          onClick={wish}
          disabled={pending}
          aria-pressed={w}
          aria-label={w ? copy.product.wishRemove : copy.product.wishAdd}
          data-loved={w}
          className="hm-love"
        >
          <HeartIcon size={16} filled={w} />
        </button>
      </span>
    </figure>
  );

  /* ── THE PRICE — tabular, honest, struck only when true ──────────────── */
  const priceNode = (
    <p className={cn("flex items-baseline gap-2 tabular-nums text-ink", feature ? "text-[22px]" : "text-[15px]")}>
      {formatDT(p.priceMillimes)}
      {pct > 0 && p.compareAtMillimes && (
        <span className={cn("tabular-nums text-muted-2 line-through", feature ? "text-[15px]" : "text-[11.5px]")}>
          {formatDT(p.compareAtMillimes)}
        </span>
      )}
    </p>
  );

  /* ── THE CARD BODY — type on the page, the primary gesture in card-actions */
  const caption = (
    <div className={cn("card-body", feature && "pt-5 lg:pt-1")}>
      {p.isCounterPick && (
        <p className="mb-2 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.22em] text-champagne-2">
          <span aria-hidden className="h-px w-4 shrink-0 bg-champagne-3" />
          {copy.merch.counterPick}
          <span aria-hidden className="h-px w-4 shrink-0 bg-champagne-3/60" />
        </p>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <BrandLine p={p} />
        {p.volume && <span className="shrink-0 text-[10.5px] tabular-nums text-muted-2">{p.volume}</span>}
      </div>
      <h3
        className={cn(
          "card-title mt-1 line-clamp-2",
          feature ? "text-[clamp(1.6rem,2.6vw,2.2rem)]" : "min-h-[2.6em] text-[14px]",
        )}
      >
        <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 group-hover:text-champagne-2">
          {p.name}
        </Link>
      </h3>
      {feature && p.shortDescription && (
        <p className="mt-3 max-w-md text-[14px] leading-[1.8] text-muted">{p.shortDescription}</p>
      )}
      <div className="mt-1.5">
        <RatingLine p={p} />
      </div>

      <div className="card-actions mt-3 justify-between border-t border-stone/50 pt-2.5">
        {priceNode}
        {out ? (
          <Link
            href={`/produit/${p.slug}?alert=1`}
            className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-champagne-2", feature && "text-[11px]")}
          >
            <ClockIcon size={11} /> {copy.product.notifyMe}
          </Link>
        ) : feature ? (
          <button type="button" onClick={add} data-done={added} className="btn-primary shrink-0">
            {added ? <CheckIcon size={13} /> : <PlusIcon size={13} />}
            {added ? copy.product.added : copy.product.quickAdd}
          </button>
        ) : (
          <button
            type="button"
            onClick={add}
            data-done={added}
            aria-label={`${copy.product.quickAdd} — ${p.name}`}
            className="card-btn"
          >
            {added ? <CheckIcon size={15} /> : <PlusIcon size={15} />}
          </button>
        )}
      </div>

      {showCompare && <CompareToggle item={{ id: p.id, name: p.name }} className="mt-2.5 -mb-1" />}
    </div>
  );

  /* ── FEATURE — the large statement, same bones, bigger voice ─────────── */
  if (feature) {
    return (
      <article className="group card relative grid gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10" aria-label={p.name}>
        {photo}
        <div className="flex flex-col justify-center">{caption}</div>
      </article>
    );
  }

  /* ── PLATE — the grid rhythm ──────────────────────────────────────────── */
  return (
    <article className="group card flex h-full flex-col" aria-label={p.name}>
      {photo}
      {caption}
    </article>
  );
}

/**
 * THE GRID — rhythm over monotony.
 *
 * `editorial` promotes the first plate to a wide statement, `rows` alternates
 * plate proportions so the eye never counts columns, and `dense` is the honest
 * grid used inside listing pages where scanning beats drama.
 */
export function ProductGrid({
  items,
  wishedIds = [],
  isAuthed = false,
  priorityCount = 4,
  rhythm = "rows",
}: {
  items: PC[];
  wishedIds?: number[];
  isAuthed?: boolean;
  priorityCount?: number;
  rhythm?: "editorial" | "rows" | "dense";
}) {
  if (rhythm === "editorial" && items.length > 0) {
    const [lead, ...rest] = items;
    return (
      <div className="space-y-16">
        <ProductCard key={lead.id} p={lead} wished={wishedIds.includes(lead.id)} isAuthed={isAuthed} priority variant="feature" />
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
            {rest.map((p, i) => (
              <ProductCard
                key={p.id}
                p={p}
                wished={wishedIds.includes(p.id)}
                isAuthed={isAuthed}
                priority={i < priorityCount - 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-x-5 gap-y-12 lg:gap-x-7",
        rhythm === "dense" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      )}
    >
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} wished={wishedIds.includes(p.id)} isAuthed={isAuthed} priority={i < priorityCount} />
      ))}
    </div>
  );
}
