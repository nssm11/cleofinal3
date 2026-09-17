"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "hero", num: "01", label: "Ouverture" },
  { id: "manifeste", num: "02", label: "Vision" },
  { id: "visage", num: "03", label: "Visage" },
  { id: "atelier", num: "04", label: "Atelier" },
  { id: "chapitre-matiere", num: "05", label: "Matière" },
  { id: "univers", num: "06", label: "Univers" },
  { id: "chapitre-solaire", num: "07", label: "Solaire" },
] as const;

export function CinematicProgress() {
  const [activeId, setActiveId] = useState<string>("hero");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight * 0.4;
      let currentId: string = SECTIONS[0].id;
      let darkTheme = true;

      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            currentId = s.id;
            const theme = el.getAttribute("data-header-theme");
            darkTheme = theme !== "light";
          }
        }
      }

      setActiveId(currentId);
      setIsDark(darkTheme);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      aria-label="Progression du film"
      className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-4 select-none xl:flex"
    >
      <div className="flex flex-col items-center gap-3">
        {SECTIONS.map((s) => {
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="group relative flex items-center justify-end py-1.5 focus:outline-none"
              aria-label={`Aller au chapitre ${s.num} : ${s.label}`}
              aria-current={isActive ? "step" : undefined}
            >
              {/* Tooltip Label on Hover */}
              <span
                className={cn(
                  "pointer-events-none absolute right-7 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.22em] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-x-1",
                  isDark ? "text-cine-ivory" : "text-[#211B12]",
                )}
              >
                {s.num} · {s.label}
              </span>

              {/* Indicator Dot / Bar */}
              <span
                className={cn(
                  "h-1.5 transition-all duration-300",
                  isActive
                    ? isDark
                      ? "w-6 bg-cine-gold"
                      : "w-6 bg-[#A3803F]"
                    : isDark
                    ? "w-2 bg-cine-line/50 group-hover:w-3.5 group-hover:bg-cine-mist"
                    : "w-2 bg-[#211B12]/20 group-hover:w-3.5 group-hover:bg-[#211B12]/50",
                )}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
