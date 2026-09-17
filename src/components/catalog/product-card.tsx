"use client";
import { ProductImage } from "./product-image";
import { MEDIA_SIZES } from "@/lib/media";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import type { ProductCard as PC } from "@/lib/catalog";
import { formatDT, discountPercent } from "@/lib/money";
import { useLocale } from "@/lib/i18n/client";
import { toggleWishlistAction } from "@/actions/shop";

export function useFiche(p: PC, isAuthed: boolean, wished: boolean) {
  const cart = useCart();
  const { toast } = useToast();
  const { copy } = useLocale();
  const router = useRouter();
  const plateRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const [w, setW] = useState(wished);
  const [pending, start] = useTransition();

  const add = () => {
    if (p.stock <= 0) return;
    cart.add(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        brandName: p.brandName,
        image: p.image,
        priceMillimes: p.priceMillimes,
        stock: p.stock,
        volume: p.volume,
      },
      1,
      plateRef.current,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    toast({ kind: "success", title: copy.product.gave, description: p.name, action: { label: copy.product.seeCart, onClick: cart.open } });
  };

  const wish = () => {
    if (!isAuthed) {
      router.push(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    start(async () => {
      const r = await toggleWishlistAction(p.id);
      if (r.ok) {
        setW(r.data.wished);
        toast({ kind: "success", title: r.message ?? "" });
      } else toast({ kind: "error", title: r.error });
    });
  };

  return { cart, copy, plateRef, added, w, pending, add, wish };
}

export function ProductCard({ p }: { p: PC }) {
  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  return (
    <article className="group flex gap-4 border border-line bg-bg p-3" aria-label={p.name}>
      <Link href={`/produit/${p.slug}`} className="relative h-20 w-20 shrink-0 bg-bg-2">
        <ProductImage src={p.image} alt="" sizes={MEDIA_SIZES.leaf} className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{p.brandName}</p>
        <h3 className="mt-1 line-clamp-2 font-sans text-[14px] font-medium leading-[1.3]">
          <Link href={`/produit/${p.slug}`} className="hover:underline underline-offset-4">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <p className="font-mono text-[13px]">{formatDT(p.priceMillimes)}</p>
          {pct > 0 && p.compareAtMillimes && <span className="font-mono text-[11px] text-text-muted line-through">{formatDT(p.compareAtMillimes)}</span>}
        </div>
      </div>
    </article>
  );
}
