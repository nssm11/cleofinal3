"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, HeartIcon, TrashIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import { useCopy } from "@/lib/i18n/client";
import { toggleWishlistAction } from "@/actions/shop";

/** Remove from the wishlist — a hairline trash that warms on approach. */
export function RemoveWishButton({ productId }: { productId: number }) {
  const copy = useCopy();
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { await toggleWishlistAction(productId); router.refresh(); })}
      aria-label={copy.product.wishRemove}
      className="flex h-9 w-9 items-center justify-center text-faint transition-colors hover:text-crit"
    >
      <TrashIcon size={14} />
    </button>
  );
}

export function WishToList({
  line,
  plateRef,
}: {
  line: { productId: number; slug: string; name: string; brandName: string | null; image: string | null; priceMillimes: number; stock: number; volume: string | null };
  plateRef?: HTMLElement | null;
}) {
  const cart = useCart();
  const { toast } = useToast();
  const copy = useCopy();
  return (
    <button
      onClick={() => {
        if (line.stock <= 0) return;
        cart.add(line, 1, plateRef ?? null);
        toast({ kind: "success", title: copy.product.gave, description: line.name, action: { label: copy.product.seeCart, onClick: cart.open } });
      }}
      disabled={line.stock <= 0}
      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-carbon transition-colors hover:text-iodine-deep disabled:opacity-40"
    >
      <CheckIcon size={12} /> {copy.product.add}
    </button>
  );
}

/** The heart toggle used on product plates (favorites-aware). */
export function WishHeart({ productId, wished: initial }: { productId: number; wished: boolean }) {
  const [wished, setWished] = useState(initial);
  const [pending, start] = useTransition();
  void pending;
  return (
    <button
      aria-pressed={wished}
      onClick={() =>
        start(async () => {
          const r = await toggleWishlistAction(productId);
          if (r.ok) setWished(r.data.wished);
        })
      }
      className={`flex h-9 w-9 items-center justify-center transition-colors ${wished ? "text-iodine-deep" : "text-faint hover:text-carbon"}`}
    >
      <HeartIcon size={15} filled={wished} />
    </button>
  );
}
