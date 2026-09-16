"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpIcon, ArrowRightIcon } from "@/components/icons";

/**
 * LE RAIL — a shelf of plates that glides under the hand.
 *
 * Native snap-scroll (the thumb's own gesture on a phone), two quiet arrows
 * when a mouse is present, and a soft dark fade at the edges so the shelf
 * visibly continues beyond the frame.
 */
export function VisageRail({ children, ariaLabel }: { children: ReactNode; ariaLabel: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const glide = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" });
  };

  return (
    <div>
      <div
        className="relative"
        style={{
          maskImage: "linear-gradient(90deg, transparent, black 3%, black 97%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 3%, black 97%, transparent)",
        }}
      >
        <ul
          ref={ref}
          aria-label={ariaLabel}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 scrollbar-none lg:gap-7"
        >
          {children}
        </ul>
      </div>
      <div className="mt-7 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => glide(-1)}
          disabled={!canPrev}
          aria-label="Précédent"
          className="flex h-11 w-11 items-center justify-center border border-cine-line text-cine-mist transition-all duration-300 hover:border-cine-gold/70 hover:text-cine-gold disabled:opacity-25 disabled:hover:border-cine-line disabled:hover:text-cine-mist"
        >
          <ArrowUpIcon size={15} strokeWidth={1.5} className="rtl-mirror" />
        </button>
        <button
          type="button"
          onClick={() => glide(1)}
          disabled={!canNext}
          aria-label="Suivant"
          className="flex h-11 w-11 items-center justify-center border border-cine-line text-cine-mist transition-all duration-300 hover:border-cine-gold/70 hover:text-cine-gold disabled:opacity-25 disabled:hover:border-cine-line disabled:hover:text-cine-mist"
        >
          <ArrowRightIcon size={15} strokeWidth={1.5} className="rtl-mirror" />
        </button>
      </div>
    </div>
  );
}

/** One slide of the rail — sized so a phone sees one plate and a half. */
export function RailSlide({ children }: { children: ReactNode }) {
  return <li className="w-[74vw] max-w-[340px] shrink-0 snap-start sm:w-[320px] lg:w-[350px]">{children}</li>;
}
