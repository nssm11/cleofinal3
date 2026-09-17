"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { ProductCard as PC } from "@/lib/catalog";
import { ProductCard } from "./product-card";

/**
 * "Reprenez là où vous étiez" — a rail, not a grid.
 *
 * The visitor already knows these products; showing them as a compact leaf list
 * respects that they are returning rather than discovering.
 */
export function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const { recentlyViewed, hydrated } = useCart();
  const [data, setData] = useState<{ key: string; items: PC[] } | null>(null);
  const ids = recentlyViewed.filter((i) => i !== excludeId).slice(0, 4);
  const key = ids.join(",");

  useEffect(() => {
    if (!hydrated || !key) return;
    let on = true;
    fetch(`/api/products?ids=${key}`)
      .then((r) => r.json())
      .then((d: { items: PC[] }) => {
        if (on) setData({ key, items: d.items });
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [key, hydrated]);

  const items = data && data.key === key ? data.items : [];
  if (!items.length) return null;

  return (
    <section className="relative overflow-hidden border-t border-rule/70 bg-bone/60">
      <div className="relative container-wide py-rhythm lg:py-rhythm-lg">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="rule-label mb-4">Vus récemment</p>
            <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] text-ink">Reprenez où vous étiez</h2>
          </div>
        </div>
        <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <ProductCard p={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function TrackView({ id }: { id: number }) {
  const { pushRecentlyViewed, hydrated } = useCart();
  useEffect(() => {
    if (hydrated) pushRecentlyViewed(id);
  }, [id, hydrated, pushRecentlyViewed]);
  return null;
}
