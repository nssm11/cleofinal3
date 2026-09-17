"use client";

import Link from "next/link";
import { ProductImage } from "./product-image";
import { useFiche } from "./product-card";
import { MEDIA_SIZES } from "@/lib/media";
import { formatDT, discountPercent } from "@/lib/money";
import type { ProductCard as PC } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

export type EditorialTone = "light" | "dark";

function Badge({ p }: { p: PC }) {
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  if (p.stock <= 0) return <span className="absolute left-0 top-0 bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper">Rupture</span>;
  if (pct > 0) return <span className="absolute left-0 top-0 bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper">-{pct}%</span>;
  if (p.isNew) return <span className="absolute left-0 top-0 border border-ink bg-bg px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink">Nouveau</span>;
  return null;
}

export function EditorialProductCard({
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
  tone?: EditorialTone;
  sizes?: string;
}) {
  const { plateRef, w, pending, wish } = useFiche(p, isAuthed, wished);
  const out = p.stock <= 0;

  return (
    <article className="group relative flex flex-col border border-line bg-bg" aria-label={p.name}>
      <div ref={plateRef} className="relative aspect-square w-full overflow-hidden bg-bg-2">
        <Link href={`/produit/${p.slug}`} className="absolute inset-0">
          <ProductImage
            src={p.image}
            alt={p.name}
            priority={priority}
            sizes={sizes}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        </Link>
        <Badge p={p} />
        <button
          type="button"
          onClick={wish}
          disabled={pending}
          aria-pressed={w}
          className={cn(
            "absolute right-2 top-2 flex h-8 w-8 items-center justify-center border bg-bg transition-colors",
            w ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
          )}
        >
          <Heart size={12} strokeWidth={1.5} className={w ? "fill-current" : ""} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {p.brandName && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted truncate">{p.brandName}</p>}
        <h3 className="mt-1 line-clamp-2 font-sans text-[14px] font-medium leading-[1.3] tracking-[-0.01em]">
          <Link href={`/produit/${p.slug}`} className="hover:underline underline-offset-4">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto pt-3 flex items-baseline justify-between gap-2">
          <p className="font-mono text-[13px] font-medium">
            {out ? <span className="text-text-muted">Indisponible</span> : formatDT(p.priceMillimes)}
          </p>
          {p.volume && <p className="font-mono text-[10px] text-text-muted">{p.volume}</p>}
        </div>
      </div>
    </article>
  );
}

export function EditorialProductGrid({
  items,
  wishedIds = [],
  isAuthed = false,
  priorityCount = 4,
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
    <div className={cn("grid gap-px bg-line border border-line", cols === 3 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4")}>
      {items.map((p, i) => (
        <EditorialProductCard key={p.id} p={p} wished={wishedIds.includes(p.id)} isAuthed={isAuthed} priority={i < priorityCount} />
      ))}
    </div>
  );
}
