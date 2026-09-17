"use client";
import { useCart } from "@/components/cart/cart-provider";

/**
 * Add-from-compare — a quiet underscore, the same gesture as the plate on a
 * card, because adding a product is still adding a product anywhere.
 */
export function CompareAddButton({ line }: { line: Parameters<ReturnType<typeof useCart>["add"]>[0] }) {
  const cart = useCart();
  const out = line.stock <= 0;
  return (
    <button
      onClick={() => cart.add(line, 1)}
      disabled={out}
      className={
        out
          ? "inline-flex min-h-9 cursor-not-allowed items-center border-b border-line/60 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-faint"
          : "inline-flex min-h-9 items-center border-b border-carbon/60 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-carbon transition-colors hover:border-iodine-deep hover:text-iodine-deep"
      }
    >
      {out ? "Épuisé" : "Ajouter"}
    </button>
  );
}
