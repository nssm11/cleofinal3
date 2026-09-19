import { cn } from "@/lib/utils";

/**
 * SectionOverlay — the words on top of the film, and nothing else.
 *
 * There used to be a wash across the whole frame, a heavier band along the
 * foot, and a grain over both. All three were removed: they dimmed every scene
 * of the site so a paragraph could sit on it comfortably, which is a bad trade
 * — the film is the product here, and a veil over it is a veil over the goods.
 *
 * What is left is the smallest thing that keeps type legible: one gradient at
 * the foot, where the writing actually is, fading out long before the picture
 * ends. The words carry their own shadow (see `cine-type`), so they hold even
 * where the image is at its brightest.
 */
export function SectionOverlay({ className }: { deep?: boolean; className?: string }) {
  return <div aria-hidden className={cn("cine-scrim-band pointer-events-none absolute inset-x-0 bottom-0 h-[38%]", className)} />;
}
