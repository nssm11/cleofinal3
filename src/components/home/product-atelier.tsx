import { ProductCard } from "@/components/catalog/product-card";
import type { ProductCard as PC } from "@/lib/catalog";

/**
 * HM · L'ATELIER — the homepage buys the house card off the shelf.
 *
 * There is exactly one product card on this site, and it lives in the
 * catalogue: the homepage only asks for it without the compare toggle,
 * which belongs to the listing aisles, not to the counter.
 */
export function AtelierPetit({ p, isAuthed = false }: { p: PC; isAuthed?: boolean }) {
  return <ProductCard p={p} isAuthed={isAuthed} showCompare={false} />;
}

/** Re-exported for server sections that need only the type. */
export type { PC as AtelierProduct };
