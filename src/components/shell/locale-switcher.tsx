"use client";
import { useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { setLocaleAction } from "@/lib/i18n/actions";
import { LOCALES, LOCALE_META } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * LE MULTIGLOTTE — the house speaks more than one tongue; say so plainly.
 *
 * A segmented hairline control: FR / TN / تونسي. No flag, no globe icon —
 * languages labelled in their own name, the current one underlined with the
 * champagne rule the whole site uses for "you are here".
 */
export function LocaleSwitcher({ tone = "ink", size = "sm" }: { tone?: "ink" | "light"; size?: "sm" | "lg" }) {
  const { locale, copy } = useLocale();
  const [pending, start] = useTransition();
  const reduce = useReducedMotion();
  return (
    <div
      role="group"
      aria-label={copy.header.language}
      className={cn(
        "inline-flex items-center gap-0.5 border p-0.5 transition-opacity",
        tone === "light" ? "border-paper/25" : "border-stone-2/45",
        pending && "opacity-60",
      )}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => start(() => setLocaleAction(l))}
            className={cn(
              "relative rounded-xs px-2 py-1 transition-colors duration-300",
              size === "sm" ? "text-[9.5px] font-bold uppercase tracking-[0.14em]" : "text-[11px]",
              tone === "light"
                ? active
                  ? "text-noir"
                  : "text-paper/55 hover:text-paper"
                : active
                  ? "text-ink"
                  : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`locale-pill-${tone}-${size}`}
                aria-hidden
                className={cn("absolute inset-0 -z-10", tone === "light" ? "bg-champagne-3" : "bg-champagne-soft")}
                transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            {LOCALE_META[l].short}
          </button>
        );
      })}
    </div>
  );
}
