"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toaster";
import { formatDT } from "@/lib/money";
import { toggleWishlistAction } from "@/actions/shop";
import { useCopy } from "@/lib/i18n/client";
import { createSubscriptionAction, subscribeRestockAction } from "@/actions/experience";
import { Heart, Check } from "lucide-react";

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

export function BuyBox({
  p,
  wished,
  isAuthed,
  giftMode = false,
  restockSubscribed = false,
  openAlert = false,
  subscribed = false,
}: {
  p: P;
  wished: boolean;
  isAuthed: boolean;
  giftMode?: boolean;
  restockSubscribed?: boolean;
  openAlert?: boolean;
  subscribed?: boolean;
}) {
  const cart = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const copy = useCopy();
  const t = copy.product;
  const plateRef = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [w, setW] = useState(wished);
  const [pending, start] = useTransition();
  const [alert, setAlert] = useState<"idle" | "open" | "done">(restockSubscribed ? "done" : openAlert ? "open" : "idle");
  const [alertEmail, setAlertEmail] = useState("");
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
    toast({ kind: "success", title: t.gave, description: p.name, action: { label: t.seeCart, onClick: cart.open } });
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
    <div ref={plateRef} className="space-y-6">
      {/* Stock */}
      <div className="border border-line p-4">
        {out ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-error">Rupture — 00 en stock</p>
            <p className="mt-2 font-sans text-[13px] leading-[1.5] text-text-secondary">{t.outNote}</p>
            {alert === "done" ? (
              <p className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-success"><Check size={12} /> {t.notifyMeDone}</p>
            ) : alert === "open" ? (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  start(async () => {
                    const r = await subscribeRestockAction({ productId: p.id, email: alertEmail, channel: "email" });
                    if (r.ok) { setAlert("done"); toast({ kind: "success", title: t.notifyMeDone }); }
                    else toast({ kind: "error", title: r.error ?? "Erreur" });
                  });
                }}
              >
                {!isAuthed && <input type="email" required value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder={t.notifyEmail} className="field-swiss" />}
                <button disabled={pending} className="btn-primary w-full">Prévenir</button>
              </form>
            ) : (
              <button onClick={() => (isAuthed ? setAlert("open") : router.push(`/connexion?next=/produit/${p.slug}`))} className="btn-outline mt-3">
                Alerte restock
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em]">{low ? `Plus que ${p.stock}` : "En stock"}</p>
              <div className="h-[2px] w-24 bg-bg-2"><div className="h-full bg-ink" style={{ width: `${Math.min(100, (p.stock / Math.max(1, p.lowStockThreshold * 4)) * 100)}%` }} /></div>
            </div>
            <div className="mt-4 flex items-center border border-line w-fit">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 border-r border-line hover:bg-bg-2">−</button>
              <span className="w-10 text-center font-mono text-[13px]">{qty}</span>
              <button onClick={() => setQty(Math.min(Math.min(20, p.stock), qty + 1))} className="h-10 w-10 border-l border-line hover:bg-bg-2">+</button>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={add} disabled={out} className="btn-primary flex-1">
          {added ? "Ajouté" : out ? "Indisponible" : `Ajouter — ${formatDT(p.priceMillimes * qty)}`}
        </button>
        <button onClick={wish} disabled={pending} aria-pressed={w} className={`flex h-[44px] w-[44px] items-center justify-center border ${w ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>
          <Heart size={16} className={w ? "fill-current" : ""} />
        </button>
      </div>

      {giftMode && <p className="border-l border-ink bg-bg-2 px-4 py-3 font-sans text-[13px]">{t.giftNote}</p>}

      <div className="border-t border-line pt-6 space-y-2 font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
        <div className="flex justify-between"><span>Livraison</span><span className="text-ink">24–48h Tunisie</span></div>
        <div className="flex justify-between"><span>Retours</span><span className="text-ink">14 jours</span></div>
        <div className="flex justify-between"><span>Authenticité</span><span className="text-ink">100% — Pharmacie</span></div>
      </div>
    </div>
  );
}
