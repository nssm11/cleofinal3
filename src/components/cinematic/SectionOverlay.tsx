import { cn } from "@/lib/utils";

/**
 * SectionOverlay — the light on top of the film.
 *
 * Two scrims, no cards: a gradient that keeps the header readable at the top
 * of every frame and gathers depth under the statement at the bottom, plus
 * the house grain at four percent — visible as texture to no one, felt by
 * everyone.
 */
export function SectionOverlay({ deep = false, className }: { deep?: boolean; className?: string }) {
  return (
    <>
      <div aria-hidden className={cn(deep ? "cine-scrim-hero" : "cine-scrim", className)} />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-60" />
    </>
  );
}
