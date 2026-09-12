"use client";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import { useCopy } from "@/lib/i18n/client";

/** A quiet “+ plateau” on the journal's product row. */
export function CartAddButton({ line }: { line: { productId: number; slug: string; name: string; brandName: string | null; image: string | null; priceMillimes: number; stock: number; volume: string | null } }) {
  const cart = useCart();
  const { toast } = useToast();
  const copy = useCopy();
  return (
    <button
      onClick={() => {
        cart.add(line, 1, null);
        toast({ kind: "success", title: copy.product.gave, description: line.name, action: { label: copy.product.seeCart, onClick: cart.open } });
      }}
      disabled={line.stock <= 0}
      className="shrink-0 border-b border-champagne-2/60 pb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:border-champagne-2 hover:text-champagne-2 disabled:opacity-40"
    >
      {copy.product.add}
    </button>
  );
}
