import { cn } from "@/lib/utils";

/**
 * SectionOverlay — the ink on top of the film.
 *
 * Two flat washes, no cards, no fades: one across the whole frame so the
 * header stays readable, a heavier one along the foot so any statement always
 * stands on solid ink, plus the house grain at four percent — visible as
 * texture to no one, felt by everyone.
 *
 * Gradients were removed on purpose: a parapharmacie reads as printed matter,
 * and a fade belongs to neither a label nor a scene.
 */
export function SectionOverlay({ deep = false, className }: { deep?: boolean; className?: string }) {
  return (
    <>
      <div aria-hidden className={cn(deep ? "cine-scrim-hero" : "cine-scrim", className)} />
      <div aria-hidden className="cine-scrim-band absolute inset-x-0 bottom-0 h-[46%]" />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-60" />
    </>
  );
}
