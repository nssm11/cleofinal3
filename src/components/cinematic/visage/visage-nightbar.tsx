"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/catalog/product-image";
import type { ProductCard } from "@/lib/catalog";
import { formatDT } from "@/lib/money";
import { ArrowRightIcon, CheckIcon, PlusIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toaster";
import { useCart } from "@/components/cart/cart-provider";
import { useLocale } from "@/lib/i18n/client";
import { Rise } from "./visage-reveal";

/**
 * THE INSTRUMENT — the hands-on rail of Visage.
 *
 * Under the title sequence the lights go on, and the room becomes an
 * instrument: a single horizontal workbench where the visitor chooses a
 * concern, quick-adds what the counter actually recommends, and can hand
 * the list to the pharmacist in store. It is deliberately not a product
 * grid — it is the page's commerce moment compressed into one measured row.
 */

export function VisageNightbar({
  concerns,
  picks,
  selectedConcerns,
  shelfCount,
}: {
  concerns: { slug: string; name: string }[];
  picks: ProductCard[];
  selectedConcerns: string[];
  shelfCount: number;
}) {
  const { copy } = useLocale();
  const cart = useCart();
  const { toast } = useToast();
  const [addedFor, setAddedFor] = useState<number[]>([]);

  const add = (p: ProductCard) => {
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
      undefined,
    );
    setAddedFor((s) => [...s, p.id]);
    window.setTimeout(() => setAddedFor((s) => s.filter((x) => x !== p.id)), 1500);
    toast({
      kind: "success",
      title: copy.product.gave,
      description: p.name,
      action: { label: copy.product.seeCart, onClick: cart.open },
    });
  };

  const shortBrand = (b: string | null) => (b ?? "").split(" ")[0] ?? (b ?? "");
  const four = picks.slice(0, 4);

  return (
    <section aria-label="L'instrument Visage" className="relative border-b border-stone/60 bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 12% 0%, rgba(203,176,120,0.10), rgba(238,226,201,0.05) 50%, transparent 78%)",
        }}
      />
      <Rise className="relative container-wide py-10 lg:py-14">
        {/* ── The instrument row: concerns, then the whole shelf ───────── */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-5 border-b border-stone/60 pb-6">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.28em] text-muted">L&apos;instrument</span>
          <div className="flex flex-wrap gap-1.5">
            {concerns.slice(0, 6).map((c) => {
              const active = selectedConcerns.includes(c.slug);
              return (
                <Link
                  key={c.slug}
                  href={`/univers/visage?concerns=${c.slug}&all=1#shelf`}
                  className={
                    active
                      ? "border border-champagne-2 bg-champagne-soft/60 px-3 py-1.5 text-[11px] text-champagne-2"
                      : "border border-stone-2/55 px-3 py-1.5 text-[11px] text-charcoal transition-colors duration-300 hover:border-champagne-2 hover:text-ink"
                  }
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
          <Link
            href="/univers/visage?all=1#shelf"
            className="group ms-auto inline-flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink transition-opacity hover:opacity-60"
          >
            Tout le rayon
            <ArrowRightIcon size={13} strokeWidth={1.5} className="rtl-mirror transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* ── The reel of house picks — measured plates, not cards ──────── */}
        <div className="mt-8 grid gap-px overflow-hidden border border-stone/70 bg-stone/70 sm:grid-cols-2 lg:grid-cols-4">
          {four.map((p, i) => {
            const done = addedFor.includes(p.id);
            return (
              <div key={p.id} className="group relative block overflow-hidden bg-marble transition-opacity duration-500" style={{ aspectRatio: "4 / 5" }}>
                <Link href={`/produit/${p.slug}`} aria-label={p.name} className="absolute inset-0 z-10" />
                <ProductImage
                  src={p.image}
                  alt=""
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  className="object-cover opacity-95 transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
                <span aria-hidden className="pointer-events-none absolute left-3 top-3 text-[10px] font-bold uppercase tracking-[0.28em] text-paper/75">
                  {String(i + 1).padStart(2, "0")} / {String(four.length).padStart(2, "0")}
                </span>
                <span className="pointer-events-none absolute right-3 top-3 text-[9px] font-bold uppercase tracking-[0.18em] text-champagne-3">
                  {p.stock <= 0
                    ? "Repos"
                    : p.isNew
                      ? "Nouveau"
                      : p.compareAtMillimes && p.compareAtMillimes > p.priceMillimes
                        ? "Promo"
                        : "Comptoir"}
                </span>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-champagne-3">{shortBrand(p.brandName)}</p>
                  <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-light leading-snug text-paper">{p.name}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[13px] tabular-nums text-paper">
                      {formatDT(p.priceMillimes)}
                      {p.compareAtMillimes && p.compareAtMillimes > p.priceMillimes ? (
                        <span className="ml-2 text-[11px] text-paper/60 line-through">{formatDT(p.compareAtMillimes)}</span>
                      ) : null}
                    </span>
                    <span className="pointer-events-auto relative z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          add(p);
                        }}
                        disabled={p.stock <= 0}
                        aria-label={`Ajouter ${p.name}`}
                        className="flex h-9 w-9 items-center justify-center border border-champagne-3/80 text-paper transition-colors duration-300 hover:bg-paper hover:text-ink disabled:opacity-40"
                      >
                        {done ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── The hand-off line ─────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone/60 pt-5">
          <p className="max-w-md text-[12.5px] leading-relaxed text-muted">
            {selectedConcerns.length > 0
              ? `${shelfCount} référence${shelfCount > 1 ? "s" : ""} répondent à votre sélection`
              : `Le rayon réunit ${shelfCount} références — en voici quatre que le comptoir conseille le plus.`}
          </p>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-2 text-[11px] text-muted sm:flex">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-champagne-2" />
              Conseillées au comptoir
            </span>
            <button
              type="button"
              onClick={() => cart.open()}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink transition-opacity hover:opacity-60"
            >
              Voir le plateau
            </button>
          </div>
        </div>
      </Rise>
    </section>
  );
}
