"use client";

import { useEffect, useState } from "react";

/**
 * LE SOMMAIRE DU FILM — where you are in the house, and how much is left.
 *
 * A film has a table of contents because a film is long. This page is long:
 * the projector, seven chapters, the proof, the catalogue, the counter, the
 * journal, the two addresses. So the page carries its own index — a rail down
 * the left edge on a wide screen, a hairline across the very top everywhere
 * else — and both are honest: they are computed from the scroll position of
 * the sections themselves, not from a scripted animation.
 *
 * It costs one scroll listener, throttled to the frame, and it stays out of
 * the way: the rail hides before the film starts and reappears once it has.
 */

export type Sommaire = { id: string; index: string; label: string };

export function FilmIndex({ items }: { items: Sommaire[] }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;

    const read = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      setVisible(window.scrollY > window.innerHeight * 0.5);

      // The active chapter is the last one whose top has passed the fold.
      const line = window.scrollY + window.innerHeight * 0.35;
      let current: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= line) current = item.id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  return (
    <>
      {/* La progression — a hairline across the very top of the window. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent"
      >
        <div
          className="h-full bg-iodine transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Le sommaire — the rail, on the screens that have room for one. */}
      <nav
        aria-label="Sommaire de la page"
        className={`fixed start-5 top-1/2 z-30 hidden -translate-y-1/2 transition-opacity duration-500 xl:block ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <p className="kicker-xs mb-4 text-faint">Le film</p>
        <ul className="space-y-3 border-s border-line ps-4">
          {items.map((item) => {
            const on = item.id === active;
            return (
              <li key={item.id} className="relative">
                <a
                  href={`#${item.id}`}
                  aria-current={on ? "true" : undefined}
                  className={`group flex items-baseline gap-2.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                    on ? "text-carbon" : "text-faint hover:text-muted"
                  }`}
                >
                  <span className={on ? "text-iodine-deep" : "text-line-strong"}>{item.index}</span>
                  <span className={on ? "" : "max-w-[9rem] truncate"}>{item.label}</span>
                </a>
                {/* A tick that grows out of the rule towards the live chapter. */}
                <span
                  aria-hidden
                  className={`absolute -start-4 top-1/2 h-px -translate-y-1/2 bg-iodine transition-all duration-500 ${
                    on ? "w-3" : "w-0"
                  }`}
                />
              </li>
            );
          })}
        </ul>
        <p className="kicker-xs mt-5 text-faint">
          {Math.round(progress * 100)} %
        </p>
      </nav>
    </>
  );
}
