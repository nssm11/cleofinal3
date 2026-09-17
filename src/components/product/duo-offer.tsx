"use client";
import { ProductImage } from "@/components/catalog/product-image";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import { formatDT } from "@/lib/money";
import {D} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";

type DuoMember = {
  id: number; slug: string; name: string; image: string | null; priceMillimes: number; stock: number; volume: string | null; brandName: string | null;
};
export type DuoOfferData = {
  slug: string; name: string; note: string | null; discountMillimes: number; duoPrice: number; sumPrice: number; members: DuoMember[];
};

/**
 * LE DUO PHARMACIEN (P01) — two fixed references, one honest discount.
 *
 * Not a upsell widget: a pair the officine actually sells together, priced a
 * few dinars under the sum. The discount lives with the lines themselves (the
 * cart carries the duo tag; checkout recomputes it from the database), so the
 * saving is real from the tray to the invoice.
 */
export function DuoOffer({ duo, labels }: { duo: DuoOfferData; labels: { eyebrow: string; together: string; save: string; add: string; added: string } }) {
  const cart = useCart();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const pct = Math.round((duo.discountMillimes / duo.sumPrice) * 100);

  const add = () => {
    for (const m of duo.members) {
      cart.add(
        {
          productId: m.id,
          slug: m.slug,
          name: m.name,
          brandName: m.brandName,
          image: m.image,
          priceMillimes: m.priceMillimes,
          stock: m.stock,
          volume: m.volume,
          duo: { code: duo.slug, label: duo.name, memberIds: duo.members.map((x) => x.id), discountMillimes: duo.discountMillimes },
        },
        1,
        ref.current,
      );
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
    toast({ kind: "success", title: labels.added, description: duo.name, action: { label: "Voir", onClick: cart.open } });
  };

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: D.base, ease: EASE }}
      className="relative mt-10 overflow-hidden border border-iodine/35 bg-iodine-wash/30 p-6"
    >
      <p className="flex items-center gap-2.5 text-[9.5px] font-bold uppercase tracking-[0.24em] text-iodine-deep">
        <span aria-hidden className="h-px w-5 bg-iodine" />
        {labels.eyebrow}
      </p>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-ant uppercase text-[19px] leading-snug text-carbon">{duo.name}</h3>
        <p className="text-[13px] tabular-nums text-muted">
          <span className="line-through">{formatDT(duo.sumPrice)}</span>{" "}
          <span className="font-ant uppercase text-[19px] text-carbon">{formatDT(duo.duoPrice)}</span>{" "}
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ok">
            −{pct}% · {labels.save.replace("{x}", formatDT(duo.discountMillimes))}
          </span>
        </p>
      </div>
      {duo.note && <p className="mt-2.5 max-w-prose text-[13px] leading-relaxed text-muted">{duo.note}</p>}

      <ul className="mt-5 space-y-3">
        {duo.members.map((m, i) => (
          <li key={m.id} className="flex items-center gap-3.5">
            <span className="font-ant uppercase text-[13px] text-iodine-deep">{i === 0 ? "1" : "2"}</span>
            <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-canvas-2">
              <ProductImage src={m.image} alt="" sizes="44px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] text-carbon">{m.name}</span>
              <span className="block text-[11px] text-faint">
                {[m.brandName, m.volume].filter(Boolean).join(" · ")} — {formatDT(m.priceMillimes)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={add}
        className="mt-6 flex w-full items-center justify-between gap-3 border-b border-iodine-deep pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-iodine-deep transition-colors hover:text-carbon"
      >
        <motion.span key={done ? "ok" : "add"} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: D.fast, ease: EASE }} className="flex items-center gap-2">
          {done ? <CheckIcon size={13} /> : <PlusIcon size={12} />}
          {done ? labels.added : labels.add}
        </motion.span>
        <span className="tabular-nums text-carbon">{labels.together} {formatDT(duo.duoPrice)}</span>
      </button>
    </motion.div>
  );
}
