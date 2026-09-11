"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { CheckIcon, HeartIcon, ShieldIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { RestockForm } from "./restock-form";
import { QtyStepper } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toaster";
import { formatDT, FREE_SHIPPING_THRESHOLD } from "@/lib/money";
import { EASE_LUXE, D } from "@/lib/motion";
import { toggleWishlistAction } from "@/actions/shop";

type P = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  image: string | null;
  priceMillimes: number;
  compareAtMillimes: number | null;
  stock: number;
  lowStockThreshold: number;
  volume: string | null;
};

/**
 * LE COMPTOIR — the purchase panel.
 *
 * Sticky on desktop so the decision never scrolls away from the reader. The
 * button states its own price, the stock line is factual rather than urgent,
 * and the promises below the action are the same four the house makes
 * everywhere — no new claims are invented at the point of sale.
 */
export function BuyBox({
  p,
  wished,
  isAuthed,
  userEmail,
}: {
  p: P;
  wished: boolean;
  isAuthed: boolean;
  /** Adresse du compte : la file de réassort ne la redemande pas. */
  userEmail?: string | null;
}) {
  const cart = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const reduce = useReducedMotion();
  const plateRef = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [w, setW] = useState(wished);
  const [pending, start] = useTransition();
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockThreshold;

  const line = {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    brandName: p.brandName,
    image: p.image,
    priceMillimes: p.priceMillimes,
    stock: p.stock,
    volume: p.volume,
  };

  const add = () => {
    if (out) return;
    cart.add(line, qty, plateRef.current);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast({
      kind: "success",
      title: "Ajouté au plateau",
      description: `${qty} × ${p.name}`,
      action: { label: "Voir", onClick: cart.open },
    });
  };

  const wish = () => {
    if (!isAuthed) {
      router.push(`/connexion?next=/produit/${p.slug}`);
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

  return (
    <>
      <div ref={plateRef} className="space-y-6">
        {out ? (
          <RestockForm productId={p.id} productName={p.name} userEmail={userEmail} />
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <QtyStepper value={qty} onChange={setQty} max={Math.min(20, p.stock)} />
            {low ? (
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-warning">
                Plus que {p.stock} en stock
              </p>
            ) : (
              <p className="flex items-center gap-2 text-[12px] text-success">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" /> En stock — expédié sous 24 h
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={add} disabled={out} className="btn-primary relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="ok"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: D.fast, ease: EASE_LUXE }}
                  className="flex items-center gap-2"
                >
                  <CheckIcon size={16} /> Sur le plateau
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: D.fast, ease: EASE_LUXE }}
                  className="flex items-center gap-2"
                >
                  {out ? "Épuisé" : addLabel(p.priceMillimes * qty)}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={wish}
            disabled={pending}
            aria-pressed={w}
            aria-label={w ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center border transition-colors duration-300 ${
              w ? "border-champagne text-champagne-2" : "border-stone-2/60 text-ink hover:border-ink"
            }`}
          >
            <motion.span
              animate={w && !reduce ? { scale: [1, 1.22, 1] } : {}}
              transition={{ duration: 0.5, ease: EASE_LUXE }}
              className="flex"
            >
              <HeartIcon size={19} filled={w} />
            </motion.span>
          </button>
        </div>

        <ul className="space-y-2.5 border-t border-stone/70 pt-5 text-[13px] text-charcoal">
          <li className="flex items-center gap-3">
            <TruckIcon size={15} className="shrink-0 text-champagne-2" /> Livraison 24–72 h · offerte dès{" "}
            {formatDT(FREE_SHIPPING_THRESHOLD)}
          </li>
          <li className="flex items-center gap-3">
            <StoreIcon size={15} className="shrink-0 text-champagne-2" /> Retrait gratuit sous 2 h à Ezzahra ou
            Hammam-Lif
          </li>
          <li className="flex items-center gap-3">
            <ShieldIcon size={15} className="shrink-0 text-champagne-2" /> Produit authentique, distribution officielle
          </li>
        </ul>
      </div>

      {/* ── The mobile counter — sits above the thumb bar, never over it ── */}
      <div
        className="fixed inset-x-0 z-30 border-t border-stone-2/30 bg-cream/92 backdrop-blur-2xl lg:hidden"
        style={{ bottom: "calc(74px + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-3 mb-3 flex items-center gap-3 px-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-muted">{p.name}</p>
            <p className="text-[15px] tabular-nums text-ink">{formatDT(p.priceMillimes * qty)}</p>
          </div>
          <QtyStepper size="sm" value={qty} onChange={setQty} max={Math.min(20, p.stock)} />
          <button onClick={add} disabled={out} className="btn-primary min-h-11 px-5 text-[10px]">
            {added ? <CheckIcon size={15} /> : out ? "Épuisé" : "Ajouter"}
          </button>
        </div>
      </div>
    </>
  );
}

function addLabel(total: number) {
  return `Ajouter au plateau · ${formatDT(total)}`;
}
