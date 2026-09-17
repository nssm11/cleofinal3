"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/* ══════════════════════════════════════════════════════════════════════════
   LE GLISSEMENT — the house's scroll.

   Smooth scrolling is not a gimmick here: the whole motion language is
   scroll-linked (the chapter film, the reveals, the number sleeps), and a
   native wheel fights every one of those timelines. Lenis gives one
   continuous, interpolated scroll position that the browser's own events stay
   in sync with, so a scroll-triggered reveal lands exactly where it was
   designed to land. Its own stylesheet rides along — without it the library
   is fighting the document height it also sets.

   RULES
   · Disabled entirely for `prefers-reduced-motion` — a person who asked the
     system for stillness gets the browser's own scroll, untouched.
   · Disabled for touch devices: iOS momentum is already perfect, and Lenis
     on touch costs frames for nothing.
   · It never traps the scroll: anchors, focus moves and route changes all
     scroll through Lenis, so keyboard users reach their destination too.
   ══════════════════════════════════════════════════════════════════════════ */

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    const lenis = new Lenis({
      duration: 1.05,
      // A long, calm ease — the page arrives rather than snapping.
      easing: (t: number) => 1 - Math.pow(1 - t, 3.2),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      gestureOrientation: "vertical",
      autoRaf: false,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Keep anchor navigation working: any in-page link goes through Lenis.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
