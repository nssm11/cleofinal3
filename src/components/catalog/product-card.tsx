"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, HeartIcon, PlusIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import type { ProductCard as PC } from "@/lib/catalog";
import { discountPercent, formatDT } from "@/lib/money";
import { EASE_LUXE, D } from "@/lib/motion";
import { toggleWishlistAction } from "@/actions/shop";
import { cn } from "@/lib/utils";

/**
 * LA PLANCHE — a product plate.
 *
 * A card is a composition, not a container. The photograph occupies a tinted
 * plate whose warmth deepens on approach; the text below is set as an editorial
 * caption — brand in micro-caps, name in the display face, price aligned to a
 * rule — and the action is a growing underscore rather than a button laid over
 * the image, so the packaging is never covered.
 *
 * Three formats share one anatomy: `plate` (the default rhythm), `feature`
 * (the large statement of a section) and `leaf` (a compact row for rails).
 */
export function ProductCard({
  p,
  wished = false,
  priority = false,
  isAuthed = false,
  variant = "plate",
}: {
  p: PC;
  wished?: boolean;
  priority?: boolean;
  isAuthed?: boolean;
  variant?: "plate" | "feature" | "leaf";
}) {
  const cart = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const reduce = useReducedMotion();
  const plateRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const [w, setW] = useState(wished);
  const [pending, start] = useTransition();
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
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
      plateRef.current,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    toast({ kind: "success", title: "Ajouté au plateau", description: p.name, action: { label: "Voir", onClick: cart.open } });
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

  /* ── LEAF — a compact rail item (used in recently viewed, cross-sells) ── */
  if (variant === "leaf") {
    return (
      <article className="group relative flex gap-4">
        <Link href={`/produit/${p.slug}`} className="relative h-24 w-20 shrink-0 overflow-hidden bg-marble">
          {p.image && (
            <Image
              src={p.image}
              alt=""
              fill
              sizes="80px"
              className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            />
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-2">{p.brandName}</p>
          <h3 className="mt-1 line-clamp-2 text-[14px] leading-snug text-ink">
            <Link href={`/produit/${p.slug}`}>{p.name}</Link>
          </h3>
          <p className="mt-auto pt-2 text-[14px] tabular-nums text-ink">
            {formatDT(p.priceMillimes)}
            {pct > 0 && p.compareAtMillimes && (
              <span className="ml-2 text-[12px] text-muted-2 line-through">{formatDT(p.compareAtMillimes)}</span>
            )}
          </p>
        </div>
      </article>
    );
  }

  const feature = variant === "feature";

  /* ── PLATE / FEATURE ──────────────────────────────────────────────────── */
  return (
    <motion.article
      className={cn("group relative flex h-full flex-col", feature && "lg:flex-row lg:items-center lg:gap-14")}
      initial={false}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: D.fast, ease: EASE_LUXE }}
    >
      {/* The plate */}
      <div
        ref={plateRef}
        className={cn(
          "relative overflow-hidden bg-marble transition-colors duration-700",
          feature ? "aspect-[4/5] w-full lg:aspect-[3/4] lg:w-[54%] lg:shrink-0" : "aspect-[4/5] w-full",
          out && "saturate-[0.35]",
        )}
      >
        {/* Warmth — deepens on approach, the only colour transition on the card */}
        <span
          aria-hidden
          className="absolute inset-0 z-10 bg-gradient-to-t from-champagne/16 via-champagne/4 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        />

        <Link href={`/produit/${p.slug}`} aria-label={p.name} tabIndex={-1} className="absolute inset-0 z-20">
          {p.image && (
            <Image
              src={p.image}
              alt={p.name}
              fill
              priority={priority}
              sizes={feature ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"}
              className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
            />
          )}
        </Link>

        {/* Marks — typographic, never badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-30 flex flex-col items-start gap-1">
          {pct > 0 && (
            <span className="bg-ink/85 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-paper backdrop-blur-sm">
              −{pct}%
            </span>
          )}
          {p.isNew && pct === 0 && (
            <span className="bg-cream/85 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-champagne-2 backdrop-blur-sm">
              Nouveau
            </span>
          )}
          {out && (
            <span className="border border-ink/15 bg-paper/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink/75 backdrop-blur-sm">
              Épuisé
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={wish}
          disabled={pending}
          aria-pressed={w}
          aria-label={w ? `Retirer ${p.name} des favoris` : `Ajouter ${p.name} aux favoris`}
          className={cn(
            "absolute right-2.5 top-2.5 z-30 flex h-10 w-10 items-center justify-center transition-all duration-500",
            w
              ? "text-champagne-2 opacity-100"
              : "text-ink/45 opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100",
            feature && "lg:h-11 lg:w-11",
          )}
        >
          <HeartIcon size={feature ? 20 : 18} filled={w} />
        </button>

        {/* The underscore — the only action laid on the plate, and it is a line */}
        {!out && (
          <div className="absolute inset-x-3 bottom-2.5 z-30 translate-y-2 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <button
              onClick={add}
              aria-label={`Ajouter ${p.name} au panier`}
              className="flex w-full items-center justify-between gap-3 border-b border-ink/60 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink backdrop-blur-[2px] transition-colors hover:border-champagne-2 hover:text-champagne-2"
            >
              <AnimatePresence mode="wait" initial={false}>
                {added ? (
                  <motion.span
                    key="ok"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: D.fast, ease: EASE_LUXE }}
                    className="flex items-center gap-2 text-success"
                  >
                    <CheckIcon size={13} /> Sur le plateau
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: D.fast, ease: EASE_LUXE }}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon size={12} /> Ajouter au plateau
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="tabular-nums">{formatDT(p.priceMillimes)}</span>
            </button>
          </div>
        )}
      </div>

      {/* The caption */}
      <div className={cn("flex flex-1 flex-col pt-4", feature && "lg:w-[46%] lg:pt-0")}>
        <div className="flex items-baseline justify-between gap-4">
          {p.brandName ? (
            <Link
              href={`/marque/${p.brandSlug}`}
              className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted transition-colors hover:text-champagne-2"
            >
              {p.brandName}
            </Link>
          ) : (
            <span />
          )}
          {p.volume && <span className="shrink-0 text-[10.5px] text-muted-2">{p.volume}</span>}
        </div>

        <h3 className={cn("mt-2 leading-snug text-ink", feature ? "font-display text-[clamp(1.5rem,2.4vw,2.1rem)]" : "text-[15px]")}>
          <Link href={`/produit/${p.slug}`} className="transition-colors duration-500 hover:text-champagne-2">
            {p.name}
          </Link>
        </h3>

        {feature && p.shortDescription && (
          <p className="mt-4 max-w-md text-[14.5px] leading-[1.75] text-muted">{p.shortDescription}</p>
        )}

        <div className={cn("mt-auto flex items-end justify-between gap-4 pt-3", feature && "lg:pt-6")}>
          <div className="flex items-baseline gap-2.5">
            <span className={cn("tabular-nums tracking-tight text-ink", feature ? "font-display text-[26px]" : "text-[15px]")}>
              {formatDT(p.priceMillimes)}
            </span>
            {pct > 0 && p.compareAtMillimes && (
              <span className="text-[12px] tabular-nums text-muted-2 line-through">{formatDT(p.compareAtMillimes)}</span>
            )}
          </div>
          {low ? (
            <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-[0.16em] text-warning">
              {p.stock} restant{p.stock > 1 ? "s" : ""}
            </span>
          ) : out ? (
            <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-2">Épuisé</span>
          ) : p.ratingCount > 0 ? (
            <span className="shrink-0 text-[10.5px] text-muted-2">
              {(p.ratingAvg / 100).toFixed(1)} · {p.ratingCount} avis
            </span>
          ) : null}
        </div>

        <span
          aria-hidden
          className="mt-3 block h-px w-full origin-left scale-x-0 bg-champagne-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
        />
      </div>
    </motion.article>
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
