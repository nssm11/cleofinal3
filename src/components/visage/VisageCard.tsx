"use client";
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
import { CompareToggle } from "@/components/catalog/compare";
import { ProductImage } from "@/components/catalog/product-image";
import { MEDIA_SIZES } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * LA PLATE NOIRE — the Visage card, cut for the nocturne.
 *
 * Functionally it is the house card, trait for trait: the same cart flight,
 * the same wishlist action, the same comparator, the same honest marks and
 * the same restock road. Only the cloth changes — the photograph hangs on a
 * marble plate against the dark wall, the caption is set in ivory, and the
 * gestures are hairlines instead of boxes.
 */

function useNoirFiche(p: PC, isAuthed: boolean, wished: boolean) {
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

/** The honest marks, re-struck for the dark. */
function NoirMarks({ p }: { p: PC }) {
  const { copy } = useLocale();
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockThreshold;
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-30 flex flex-col items-start gap-1.5">
      {pct > 0 && (
        <span className="bg-cine-gold px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cine-noir">
          −{pct}%
        </span>
      )}
      {p.isNew && pct === 0 && (
        <span className="border border-cine-ivory/25 bg-cine-noir/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cine-ivory backdrop-blur-sm">
          {copy.common.yes === "Oui" ? "Nouveau" : copy.common.yes === "Eya" ? "Jdid" : "جديد"}
        </span>
      )}
      {low && (
        <span className="border border-cine-gold/50 bg-cine-noir/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cine-gold backdrop-blur-sm">
          {copy.restock.badgeLow}
        </span>
      )}
      {out && (
        <span className="border border-cine-line bg-cine-noir/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cine-mist backdrop-blur-sm">
          {copy.restock.badgeOut}
        </span>
      )}
    </div>
  );
}

function NoirWish({
  wished,
  pending,
  onWish,
  labelAdd,
  labelRemove,
  className,
}: {
  wished: boolean;
  pending: boolean;
  onWish: () => void;
  labelAdd: string;
  labelRemove: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onWish}
      disabled={pending}
      aria-pressed={wished}
      aria-label={wished ? labelRemove : labelAdd}
      className={cn(
        "flex h-9 w-9 items-center justify-center bg-cine-noir/45 backdrop-blur-sm transition-colors duration-300",
        wished ? "text-cine-gold" : "text-cine-ivory/75 hover:text-cine-gold",
        className,
      )}
    >
      <HeartIcon size={15} filled={wished} />
    </button>
  );
}

function NoirBrand({ p, className }: { p: PC; className?: string }) {
  const cls = cn(
    "truncate text-[9px] font-bold uppercase tracking-[0.24em] text-cine-faint transition-colors hover:text-cine-gold",
    className,
  );
  if (p.brandName && p.brandSlug) {
    return (
      <Link href={`/marque/${p.brandSlug}`} className={cls}>
        {p.brandName}
      </Link>
    );
  }
  return <span className={cls}>{p.brandName}</span>;
}

function NoirRating({ p }: { p: PC }) {
  if (p.ratingCount <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-cine-faint">
      <span className="text-cine-gold">
        <StarIcon size={12} filled />
      </span>
      {(p.ratingAvg / 100).toFixed(1)}
      <span className="text-cine-faint/70">({p.ratingCount})</span>
    </span>
  );
}

export function VisageCard({
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
  const { copy, plateRef, added, w, pending, add, wish } = useNoirFiche(p, isAuthed, wished);
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;

  /* ── LEAF — the compact row, for shelves and editorial ledges ─────────── */
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
          <NoirBrand p={p} />
          <h3 className="mt-1 line-clamp-2 font-display text-[15px] leading-snug text-cine-ivory">
            <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 group-hover:text-cine-gold">
              {p.name}
            </Link>
          </h3>
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <p className="text-[14px] tabular-nums text-cine-ivory">
              {formatDT(p.priceMillimes)}
              {pct > 0 && p.compareAtMillimes && (
                <span className="ml-2 text-[12px] tabular-nums text-cine-faint line-through">{formatDT(p.compareAtMillimes)}</span>
              )}
            </p>
            <NoirRating p={p} />
          </div>
        </div>
      </article>
    );
  }

  const feature = variant === "feature";

  /* ── THE PLATE — a marble photograph hung on the dark wall ────────────── */
  const photo = (
    <figure
      ref={plateRef}
      className={cn("relative w-full overflow-hidden bg-marble", feature ? "aspect-[4/3] lg:aspect-auto lg:min-h-[430px]" : "aspect-[4/5]")}
    >
      <Link href={`/produit/${p.slug}`} aria-label={p.name} tabIndex={-1} className="absolute inset-0">
        <ProductImage
          src={p.image}
          alt={p.name}
          priority={priority}
          sizes={feature ? MEDIA_SIZES.feature : MEDIA_SIZES.card}
          className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
        />
      </Link>
      <NoirMarks p={p} />
      <span className="absolute right-2.5 top-2.5 z-30">
        <NoirWish wished={w} pending={pending} onWish={wish} labelAdd={copy.product.wishAdd} labelRemove={copy.product.wishRemove} />
      </span>
    </figure>
  );

  const priceNode = (
    <p className={cn("flex items-baseline gap-2 tabular-nums text-cine-ivory", feature ? "text-[22px]" : "text-[15px]")}>
      {formatDT(p.priceMillimes)}
      {pct > 0 && p.compareAtMillimes && (
        <span className={cn("tabular-nums text-cine-faint line-through", feature ? "text-[15px]" : "text-[11.5px]")}>
          {formatDT(p.compareAtMillimes)}
        </span>
      )}
    </p>
  );

  const caption = (
    <div className={cn(feature && "flex flex-col justify-end")}>
      {p.isCounterPick && (
        <p className="mb-3 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.24em] text-cine-gold">
          <span aria-hidden className="h-px w-5 shrink-0 bg-cine-gold/80" />
          {copy.merch.counterPick}
        </p>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <NoirBrand p={p} />
        {p.volume && <span className="shrink-0 text-[10.5px] tabular-nums text-cine-faint">{p.volume}</span>}
      </div>
      <h3
        className={cn(
          "mt-1.5 line-clamp-2 font-display text-cine-ivory",
          feature
            ? "text-[clamp(1.6rem,2.7vw,2.4rem)] leading-[1.08] tracking-[-0.015em]"
            : "min-h-[2.7em] text-[14.5px] leading-[1.35]",
        )}
      >
        <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 group-hover:text-cine-gold">
          {p.name}
        </Link>
      </h3>
      {feature && p.shortDescription && (
        <p className="mt-4 max-w-md text-[13.5px] leading-[1.85] text-cine-mist">{p.shortDescription}</p>
      )}
      <div className="mt-2">
        <NoirRating p={p} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-cine-line pt-3.5">
        {priceNode}
        {out ? (
          <Link
            href={`/produit/${p.slug}?alert=1`}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cine-gold"
          >
            <ClockIcon size={11} /> {copy.product.notifyMe}
          </Link>
        ) : feature ? (
          <span className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={add}
              data-done={added}
              className="inline-flex min-h-12 items-center gap-2.5 bg-cine-gold px-6 text-[10px] font-bold uppercase tracking-[0.18em] text-cine-noir transition-colors duration-300 hover:bg-cine-ivory"
            >
              {added ? <CheckIcon size={13} /> : <PlusIcon size={13} />}
              {added ? copy.product.added : copy.product.quickAdd}
            </button>
            <NoirWish
              wished={w}
              pending={pending}
              onWish={wish}
              labelAdd={copy.product.wishAdd}
              labelRemove={copy.product.wishRemove}
              className="border border-cine-line bg-transparent"
            />
          </span>
        ) : (
          <button
            type="button"
            onClick={add}
            data-done={added}
            aria-label={`${copy.product.quickAdd} — ${p.name}`}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center border transition-all duration-300",
              added
                ? "border-cine-gold bg-cine-gold text-cine-noir"
                : "border-cine-line text-cine-ivory hover:border-cine-gold hover:text-cine-gold",
            )}
          >
            {added ? <CheckIcon size={15} /> : <PlusIcon size={15} />}
          </button>
        )}
      </div>

      {showCompare && (
        <CompareToggle
          item={{ id: p.id, name: p.name }}
          className="mt-2.5 -mb-1 [&]:text-cine-faint [&:hover]:text-cine-ivory [&[aria-pressed=true]]:text-cine-gold"
        />
      )}
    </div>
  );

  /* ── FEATURE — the large statement of the nocturne ────────────────────── */
  if (feature) {
    return (
      <article className="group card-noir relative grid gap-7 lg:grid-cols-[7fr_5fr] lg:gap-12" aria-label={p.name}>
        {photo}
        <div className="flex flex-col justify-end pb-1">{caption}</div>
      </article>
    );
  }

  /* ── PLATE — the grid rhythm of the dark ──────────────────────────────── */
  return (
    <article className="group card-noir relative flex h-full flex-col" aria-label={p.name}>
      {photo}
      <div className="flex flex-1 flex-col pt-4">{caption}</div>
    </article>
  );
}
