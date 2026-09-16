"use client";

import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { useFiche } from "@/components/catalog/product-card";
import { CompareToggle } from "@/components/catalog/compare";
import { MEDIA_SIZES } from "@/lib/media";
import { CheckIcon, ClockIcon, HeartIcon, PlusIcon, StarIcon } from "@/components/icons";
import { discountPercent, formatDT } from "@/lib/money";
import { useLocale } from "@/lib/i18n/client";
import type { ProductCard as PC } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * VISAGE PRODUCT — commerce after dark.
 *
 * The same fiche logic (`useFiche`: cart flight, wishlist action, toasts),
 * the same marks data, the same prices — dressed for the film instead of
 * the day. Borderless photographs, ivory type, gold gestures. Three voices:
 * `CinePlate` (the rail/collection unit), `CineFeature` (the large statement)
 * and `CineQuick` (the hero's compact rows).
 */

function Marks({ p }: { p: PC }) {
  const { copy } = useLocale();
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockThreshold;
  if (pct <= 0 && !p.isNew && !low && !out) return null;
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
      {pct > 0 && (
        <span className="bg-cine-gold px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cine-noir">
          −{pct}%
        </span>
      )}
      {p.isNew && pct === 0 && (
        <span className="border border-cine-ivory/30 bg-cine-noir/60 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cine-ivory backdrop-blur-sm">
          {copy.common.yes === "Oui" ? "Nouveau" : copy.common.yes === "Eya" ? "Jdid" : "جديد"}
        </span>
      )}
      {low && (
        <span className="border border-cine-gold/50 bg-cine-noir/60 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cine-gold backdrop-blur-sm">
          {copy.restock.badgeLow}
        </span>
      )}
      {out && (
        <span className="border border-cine-ivory/20 bg-cine-noir/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cine-mist backdrop-blur-sm">
          {copy.restock.badgeOut}
        </span>
      )}
    </div>
  );
}

function Rating({ p, className }: { p: PC; className?: string }) {
  if (p.ratingCount <= 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] tabular-nums text-cine-mist", className)}>
      <StarIcon size={12} filled className="text-cine-gold" />
      {(p.ratingAvg / 100).toFixed(1)}
      <span className="text-cine-faint">({p.ratingCount})</span>
    </span>
  );
}

function Price({ p, large = false }: { p: PC; large?: boolean }) {
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  return (
    <p className={cn("tabular-nums text-cine-ivory", large ? "font-display text-[26px]" : "text-[15px]")}>
      {formatDT(p.priceMillimes)}
      {pct > 0 && p.compareAtMillimes && (
        <span className={cn("ml-2 tabular-nums text-cine-faint line-through", large ? "text-[15px]" : "text-[11.5px]")}>
          {formatDT(p.compareAtMillimes)}
        </span>
      )}
    </p>
  );
}

function WishButton({ wished, pending, onWish, addLabel, removeLabel }: { wished: boolean; pending: boolean; onWish: () => void; addLabel: string; removeLabel: string }) {
  return (
    <button
      type="button"
      onClick={onWish}
      disabled={pending}
      aria-pressed={wished}
      aria-label={wished ? removeLabel : addLabel}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-500",
        wished
          ? "border-cine-gold bg-cine-gold/15 text-cine-gold"
          : "border-cine-ivory/25 bg-cine-noir/45 text-cine-ivory hover:border-cine-gold hover:text-cine-gold",
      )}
    >
      <HeartIcon size={15} filled={wished} />
    </button>
  );
}

function AddButton({ added, onAdd, label, name }: { added: boolean; onAdd: () => void; label: string; name: string }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      data-done={added}
      aria-label={`${label} — ${name}`}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-500",
        added
          ? "border-cine-gold bg-cine-gold text-cine-noir"
          : "border-cine-ivory/30 text-cine-ivory hover:border-cine-gold hover:bg-cine-gold hover:text-cine-noir",
      )}
    >
      {added ? <CheckIcon size={15} /> : <PlusIcon size={15} />}
    </button>
  );
}

function NotifyLink({ p, className }: { p: PC; className?: string }) {
  const { copy } = useLocale();
  return (
    <Link
      href={`/produit/${p.slug}?alert=1`}
      className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cine-gold", className)}
    >
      <ClockIcon size={11} /> {copy.product.notifyMe}
    </Link>
  );
}

function BrandLine({ p, className }: { p: PC; className?: string }) {
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

/* ── CINEPLATE — the rail and collection unit ─────────────────────────── */

export function CinePlate({
  p,
  wished = false,
  isAuthed = false,
  priority = false,
  sizes = MEDIA_SIZES.card,
}: {
  p: PC;
  wished?: boolean;
  isAuthed?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const { copy, plateRef, added, w, pending, add, wish } = useFiche(p, isAuthed, wished);
  const out = p.stock <= 0;
  return (
    <article className="group flex h-full min-w-0 flex-col" aria-label={p.name}>
      <div ref={plateRef} className="relative aspect-[3/4] w-full overflow-hidden bg-cine-noir-2">
        <Link href={`/produit/${p.slug}`} aria-label={p.name} tabIndex={-1} className="absolute inset-0">
          <ProductImage
            src={p.image}
            alt={p.name}
            priority={priority}
            sizes={sizes}
            className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        </Link>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cine-noir/45 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        <Marks p={p} />
        <span className="absolute right-3 top-3 z-20">
          <WishButton wished={w} pending={pending} onWish={wish} addLabel={copy.product.wishAdd} removeLabel={copy.product.wishRemove} />
        </span>
      </div>
      <div className="flex flex-1 flex-col pt-4">
        {p.isCounterPick && (
          <p className="mb-2 flex items-center gap-2 text-[8.5px] font-bold uppercase tracking-[0.22em] text-cine-gold">
            <span aria-hidden className="h-px w-4 shrink-0 bg-cine-gold" />
            {copy.merch.counterPick}
          </p>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <BrandLine p={p} />
          {p.volume && <span className="shrink-0 text-[10.5px] tabular-nums text-cine-faint">{p.volume}</span>}
        </div>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.7em] font-display text-[17px] font-light leading-snug text-cine-ivory">
          <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 group-hover:text-cine-gold">
            {p.name}
          </Link>
        </h3>
        <div className="mt-1.5">
          <Rating p={p} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-cine-line pt-3">
          <Price p={p} />
          {out ? (
            <NotifyLink p={p} />
          ) : (
            <AddButton added={added} onAdd={add} label={copy.product.quickAdd} name={p.name} />
          )}
        </div>
        <CompareToggle
          item={{ id: p.id, name: p.name }}
          className="mt-2 -mb-1 self-start text-cine-faint! hover:text-cine-gold!"
        />
      </div>
    </article>
  );
}

/* ── CINEFEATURE — the large statement ────────────────────────────────── */

export function CineFeature({
  p,
  wished = false,
  isAuthed = false,
  priority = false,
}: {
  p: PC;
  wished?: boolean;
  isAuthed?: boolean;
  priority?: boolean;
}) {
  const { copy, plateRef, added, w, pending, add, wish } = useFiche(p, isAuthed, wished);
  const out = p.stock <= 0;
  return (
    <article className="group grid items-center gap-8 lg:grid-cols-2 lg:gap-14" aria-label={p.name}>
      <div ref={plateRef} className="relative aspect-[4/5] w-full overflow-hidden bg-cine-noir-2 sm:aspect-square lg:aspect-[4/5]">
        <Link href={`/produit/${p.slug}`} aria-label={p.name} tabIndex={-1} className="absolute inset-0">
          <ProductImage
            src={p.image}
            alt={p.name}
            priority={priority}
            sizes={MEDIA_SIZES.feature}
            className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        </Link>
        <Marks p={p} />
      </div>
      <div className="min-w-0">
        {p.isCounterPick && (
          <p className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.24em] text-cine-gold">
            <span aria-hidden className="h-px w-6 shrink-0 bg-cine-gold" />
            {copy.merch.counterPick}
          </p>
        )}
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <BrandLine p={p} className="text-[10px]!" />
          <Rating p={p} />
        </div>
        <h3 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.9rem)] font-light leading-[1.05] text-cine-ivory">
          <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 hover:text-cine-gold">
            {p.name}
          </Link>
        </h3>
        {p.shortDescription && (
          <p className="mt-4 max-w-md text-[14.5px] leading-[1.85] text-cine-mist">{p.shortDescription}</p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Price p={p} large />
          {p.volume && <span className="text-[12px] tabular-nums text-cine-faint">{p.volume}</span>}
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {out ? (
            <NotifyLink p={p} className="text-[11px]!" />
          ) : (
            <button
              type="button"
              onClick={add}
              data-done={added}
              className={cn(
                "inline-flex min-h-13 items-center gap-3 px-7 text-[11px] font-bold uppercase tracking-[0.22em] transition-all duration-500",
                added ? "bg-cine-ivory text-cine-noir" : "bg-cine-gold text-cine-noir hover:bg-cine-ivory",
              )}
            >
              {added ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
              {added ? copy.product.added : copy.product.quickAdd}
            </button>
          )}
          <WishButton wished={w} pending={pending} onWish={wish} addLabel={copy.product.wishAdd} removeLabel={copy.product.wishRemove} />
        </div>
        <CompareToggle
          item={{ id: p.id, name: p.name }}
          className="mt-4 text-cine-faint! hover:text-cine-gold!"
        />
      </div>
    </article>
  );
}

/* ── CINEQUICK — the hero's compact rows ──────────────────────────────── */

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
