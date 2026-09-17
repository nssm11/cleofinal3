"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRightIcon, ArrowUpIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * EmblaRow — the house carousel.
 *
 * Embla under the hood (no Swiper anywhere): a row of editorial plates that
 * glides with resistance, hairline progress underneath, and two quiet
 * gestures — the arrow that glides when you reach for it.
 */
export function EmblaRow({
  children,
  ariaLabel,
  slidesPerView = 4,
  gap = "1.25rem",
  className,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  slidesPerView?: number;
  gap?: string;
  className?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, skipSnaps: false });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
      setSelected(emblaApi.selectedScrollSnap());
    };
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const count = useMemo(() => React.Children.count(children), [children]);

  return (
    <div className={className}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ gap }}>
          {React.Children.map(children, (child) => (
            <div className="min-w-0 flex-1" style={{ maxWidth: `${100 / slidesPerView}%` }}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {count > slidesPerView && (
        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2" aria-hidden>
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-px transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  i <= selected ? "w-8 bg-cinabre-2" : "w-4 bg-rule-strong/50",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              aria-label="Précédent"
              className="flex h-11 w-11 items-center justify-center text-graphite transition-all duration-300 hover:text-ink disabled:opacity-25 disabled:hover:text-graphite"
            >
              <ArrowUpIcon size={15} strokeWidth={1.5} className="rtl-mirror" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              aria-label="Suivant"
              className="flex h-11 w-11 items-center justify-center text-graphite transition-all duration-300 hover:text-ink disabled:opacity-25 disabled:hover:text-graphite"
            >
              <ArrowRightIcon size={15} strokeWidth={1.5} className="rtl-mirror" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
