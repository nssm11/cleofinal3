"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import type { Title } from "@/data/types";
import { isSeries } from "@/data/types";
import { archiveIndexOf } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { cn } from "@/lib/cn";

/**
 * A film strip you can drag — the shelf for programmed rows (Keaton's
 * strip, tonight's shorts). Drag, keyboard and arrows that respect RTL
 * geometry: "next" advances toward the left.
 */
export function TitleRail({ items, className }: { items: Title[]; className?: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: "rtl",
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [arrows, setArrows] = useState({ prev: false, next: true });

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setArrows({ prev: emblaApi.canScrollPrev(), next: emblaApi.canScrollNext() });
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const raf = requestAnimationFrame(sync); // first measurement, not in the effect body
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      cancelAnimationFrame(raf);
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi, sync]);

  return (
    <div className={cn("relative", className)} role="group" aria-label="شريط أفلام قابل للتصفح">
      <div ref={emblaRef} className="overflow-hidden px-0.5 py-0.5">
        <ul className="flex list-none gap-4">
          {items.map((t) => {
            const plate = plateForTitle(t, archiveIndexOf(t.slug));
            const href = isSeries(t) ? `/series/${t.slug}` : `/films/${t.slug}`;
            return (
              <li key={t.slug} className="w-[58%] max-w-[230px] shrink-0 snap-start sm:w-[36%] lg:w-[24%] xl:w-[19%]">
                <div className="group/strip relative">
                  <Link
                    href={href}
                    className="block overflow-hidden rounded-frame border border-rule/80 transition-colors duration-(--duration-slide) hover:border-tungsten/50"
                  >
                    <TitleArt
                      plate={plate}
                      variant="poster"
                      className="block w-full transition-transform duration-(--duration-scene) ease-(--ease-projector) group-hover/strip:scale-[1.03]"
                    />
                  </Link>
                  <WatchlistButton
                    entry={{ key: t.slug, kind: t.kind, slug: t.slug }}
                    titleAr={t.titleAr} className="absolute end-2 top-2 opacity-0 focus-visible:opacity-100 group-hover/strip:opacity-100 motion-reduce:opacity-100"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="label-ar text-faint">اسحب أو استخدم الأسهم</span>
        <div className="flex gap-2">
          <RailButton dir="prev" disabled={!arrows.prev} onClick={() => emblaApi?.scrollPrev()} />
          <RailButton dir="next" disabled={!arrows.next} onClick={() => emblaApi?.scrollNext()} />
        </div>
      </div>
    </div>
  );
}

function RailButton({ dir, onClick, disabled }: { dir: "prev" | "next"; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "السابق" : "التالي"}
      className={cn(
        "grid size-10 place-items-center rounded-frame border border-rule text-ash transition-all duration-(--duration-flip)",
        "hover:border-tungsten/60 hover:text-tungsten disabled:opacity-30 disabled:hover:border-rule disabled:hover:text-ash",
      )}
    >
      <span aria-hidden className="text-lg leading-none">
        {dir === "prev" ? "→" : "←"}
      </span>
    </button>
  );
}
