"use client";
import { ProductImage } from "@/components/catalog/product-image";
import { MEDIA_SIZES } from "@/lib/media";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  alts,
  name,
  badge,
  sku,
  volume,
  brandName,
  out,
}: {
  images: string[];
  alts?: string[];
  name: string;
  badge?: React.ReactNode;
  sku: string;
  volume: string | null;
  brandName: string | null;
  out: boolean;
}) {
  const [index, setIndex] = useState(0);
  const list = images.length > 0 ? images : [""];
  const current = list[Math.min(index, list.length - 1)];
  const altFor = (i: number) => alts?.[i]?.trim() || `${name}${brandName ? ` — ${brandName}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("relative aspect-square w-full bg-bg-2 border border-line overflow-hidden", out && "opacity-60")}>
        <ProductImage src={current} alt={altFor(index)} priority sizes={MEDIA_SIZES.gallery} className="object-cover" />
        {badge && <div className="absolute left-0 top-0 z-10">{badge}</div>}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between border-t border-line bg-bg px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          <span>{brandName ?? "CLÉOPÂTRE"} · {sku}</span>
          <span>{volume}</span>
        </div>
      </div>

      {list.length > 1 && (
        <div className="flex gap-px bg-line border border-line">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setIndex(i)}
              className={cn("relative h-[72px] w-[72px] bg-bg-2 overflow-hidden", i === index ? "ring-1 ring-inset ring-ink" : "opacity-60 hover:opacity-100")}
            >
              <ProductImage src={src} alt="" sizes={MEDIA_SIZES.rail} className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {list.length > 1 && (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
        </p>
      )}
    </div>
  );
}
