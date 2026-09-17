"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Field, Steps } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toaster";
import { formatDT, GIFT_WRAP_FEE, EXPRESS_SHIPPING_FEE, shippingFor, type ShippingMethod } from "@/lib/money";
import { CITIES, deliveryEstimate, GOVERNORATES } from "@/lib/tunisia";
import { placeOrderAction } from "@/actions/checkout";
import { validatePromoAction } from "@/actions/shop";
import type { Address, Store } from "@/db/schema";
import type { SafeUser } from "@/lib/auth";

type Promo = { code: string; discount: number; freeShipping: boolean; label: string } | null;
const STEPS = ["Informations", "Livraison", "Paiement", "Récapitulatif"];

export function CheckoutFlow({ user, savedAddresses, stores, methods }: { user: SafeUser | null; savedAddresses: Address[]; stores: Store[]; methods: string[] }) {
  const cart = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(user?.email ?? "");
  const def = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [addr, setAddr] = useState({ fullName: def?.fullName ?? (user ? `${user.firstName} ${user.lastName}` : ""), phone: def?.phone ?? user?.phone ?? "", line1: def?.line1 ?? "", line2: def?.line2 ?? "", city: def?.city ?? "", governorate: def?.governorate ?? "Ben Arous", postalCode: def?.postalCode ?? "" });
  const [shipping, setShipping] = useState<ShippingMethod>("standard");
  const [storeId, setStoreId] = useState<number>(stores[0]?.id ?? 0);
  const [payment, setPayment] = useState<string>(() => (methods.includes("cod") ? "cod" : methods[0] ?? "cod"));
  const [promoInput, setPromoInput] = useState(cart.promoCode);
  const [promo, setPromo] = useState<Promo>(null);
  const [giftMessage, setGiftMessage] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [idem] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : String(Date.now()) + Math.random().toString(16).slice(2)));

  useEffect(() => { if (cart.hydrated && cart.lines.length === 0) router.replace("/panier"); }, [cart.hydrated, cart.lines.length, router]);

  const subtotal = cart.subtotal;
  const discount = promo?.discount ?? 0;
  const maxPoints = user ? Math.min(user.loyaltyPoints, Math.floor(Math.max(0, subtotal - discount) / 10)) : 0;
  const pointsUsed = usePoints ? maxPoints : 0;
  const pointsDiscount = pointsUsed * 10;
  const shipFee = promo?.freeShipping && shipping !== "express" ? 0 : shippingFor(subtotal - discount - pointsDiscount, shipping);
  const wrap = cart.giftWrap ? GIFT_WRAP_FEE : 0;
  const total = subtotal - discount - pointsDiscount + shipFee + wrap;
  const cities = useMemo(() => CITIES[addr.governorate as keyof typeof CITIES] ?? [], [addr.governorate]);

  const validateInfo = () => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "E-mail invalide";
    if (addr.fullName.trim().length < 3) e.fullName = "Nom requis";
    if (!/^(\\+216)?[2-9]\\d{7}$/.test(addr.phone.replace(/\s/g, ""))) e.phone = "8 chiffres";
    if (addr.line1.trim().length < 5) e.line1 = "Adresse courte";
    if (addr.city.trim().length < 2) e.city = "Ville requise";
    if (createAccount && accountPassword.length < 8) e.accountPassword = "8 car. min";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = () => { if (step === 0 && !validateInfo()) return; setStep((s) => Math.min(3, s + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const applyPromo = () => start(async () => {
    const r = await validatePromoAction(promoInput, cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
    if (r.ok) { setPromo(r.data); cart.setPromoCode(r.data.code); toast({ kind: "success", title: "Code appliqué", description: r.data.label }); }
    else { setPromo(null); toast({ kind: "error", title: r.error }); }
  });

  const submit = () => start(async () => {
    const r = await placeOrderAction({
      email: email.trim(), address: { ...addr, phone: addr.phone.replace(/\s/g, "") }, shippingMethod: shipping, storeId: shipping === "pickup" ? storeId : undefined, paymentMethod: payment,
      promoCode: promo?.code ?? "", giftWrap: cart.giftWrap, giftMessage, giftCardCode: payment === "gift_card" ? giftCardCode.trim() : "", customerNote: cart.note, createAccount, accountPassword, usePoints: usePoints && pointsUsed > 0, idempotencyKey: idem,
      lines: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, duoCode: l.duo?.code })),
    });
    if (r.ok) {
      cart.clear();
      router.push(`/commande/confirmation/${r.data.number}${r.data.accessKey ? `?k=${encodeURIComponent(r.data.accessKey)}` : ""}`);
    } else {
      setSubmitError(r.error ?? "Erreur");
      toast({ kind: "error", title: r.error });
    }
  });

  if (!cart.hydrated) return <div className="h-64 bg-bg-2 animate-pulse" />;

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Steps steps={STEPS} current={step} />
        <div className="mt-10">
          {step === 0 && (
            <section className="space-y-6">
              <h2 className="font-sans text-[22px] font-semibold tracking-[-0.02em]">Informations — 01</h2>
              <Field label="E-mail" error={errors.email}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-swiss" /></Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Nom complet" error={errors.fullName}><input value={addr.fullName} onChange={(e) => setAddr({ ...addr, fullName: e.target.value })} className="field-swiss" /></Field>
                <Field label="Téléphone" error={errors.phone}><input value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} className="field-swiss" /></Field>
              </div>
              <Field label="Adresse" error={errors.line1}><input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} className="field-swiss" /></Field>
              <Field label="Repère"><input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} placeholder="En face de…" className="field-swiss" /></Field>
              <div className="grid gap-6 sm:grid-cols-3">
                <Field label="Gouvernorat"><select value={addr.governorate} onChange={(e) => setAddr({ ...addr, governorate: e.target.value, city: "" })} className="field-swiss">{GOVERNORATES.map((g) => <option key={g}>{g}</option>)}</select></Field>
                <Field label="Ville" error={errors.city}>{cities.length ? <select value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="field-swiss"><option value="">Choisir</option>{cities.map((c) => <option key={c}>{c}</option>)}<option>Autre</option></select> : <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="field-swiss" />}</Field>
                <Field label="Code postal"><input value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} className="field-swiss" /></Field>
              </div>
              {!user && <div className="border border-line p-4"><label className="flex items-center gap-3 font-sans text-[13px]"><input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} /> Créer un compte</label>{createAccount && <Field label="Mot de passe" error={errors.accountPassword} className="mt-4"><input type="password" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} className="field-swiss" /></Field>}</div>}
            </section>
          )}
          {step === 1 && (
            <section className="space-y-6">
              <h2 className="font-sans text-[22px] font-semibold tracking-[-0.02em]">Livraison — 02</h2>
              <div className="space-y-2">
                {[
                  { v: "standard", l: "Standard", d: deliveryEstimate(addr.governorate, "standard"), p: shippingFor(subtotal - discount, "standard") },
                  { v: "express", l: "Express", d: deliveryEstimate(addr.governorate, "express"), p: EXPRESS_SHIPPING_FEE },
                  { v: "pickup", l: "Click & Collect", d: "Retrait 2h", p: 0 },
                ].map((o) => (
                  <label key={o.v} className={`flex items-center gap-4 border p-4 cursor-pointer ${shipping === o.v ? "border-ink bg-bg-2" : "border-line hover:border-ink"}`}>
                    <input type="radio" name="shipping" value={o.v} checked={shipping === o.v} onChange={() => setShipping(o.v as any)} className="sr-only" />
                    <div className="flex-1"><p className="font-sans text-[14px] font-medium">{o.l}</p><p className="font-mono text-[11px] text-text-muted">{o.d}</p></div>
                    <span className="font-mono text-[12px]">{o.p === 0 ? "Offerte" : formatDT(o.p)}</span>
                  </label>
                ))}
              </div>
              {shipping === "pickup" && <Field label="Boutique"><select value={storeId} onChange={(e) => setStoreId(Number(e.target.value))} className="field-swiss">{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>}
              <Field label="Note"><textarea value={cart.note} onChange={(e) => cart.setNote(e.target.value)} rows={2} className="field-swiss" /></Field>
            </section>
          )}
          {step === 2 && (
            <section className="space-y-6">
              <h2 className="font-sans text-[22px] font-semibold tracking-[-0.02em]">Paiement — 03</h2>
              <div className="space-y-2">
                {[
                  { v: "cod", l: "Paiement à la livraison", d: "Espèces" },
                  { v: "bank_transfer", l: "Virement bancaire", d: "RIB après validation" },
                  { v: "gift_card", l: "Carte cadeau", d: "Code" },
                ].filter((o) => methods.includes(o.v)).map((o) => (
                  <label key={o.v} className={`flex items-center gap-4 border p-4 cursor-pointer ${payment === o.v ? "border-ink bg-bg-2" : "border-line hover:border-ink"}`}>
                    <input type="radio" name="payment" value={o.v} checked={payment === o.v} onChange={() => setPayment(o.v)} className="sr-only" />
                    <div className="flex-1"><p className="font-sans text-[14px] font-medium">{o.l}</p><p className="font-mono text-[11px] text-text-muted">{o.d}</p></div>
                    {payment === o.v && <span className="font-mono text-[11px]">✓</span>}
                  </label>
                ))}
              </div>
              {payment === "gift_card" && <Field label="Code carte cadeau"><input value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())} placeholder="CLEO-XXXX" className="field-swiss font-mono uppercase" /></Field>}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-2">Code promo</p>
                <div className="flex"><input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="CODE" className="field-swiss border-r-0 font-mono uppercase" /><button type="button" onClick={applyPromo} disabled={pending || !promoInput} className="btn-outline">Appliquer</button></div>
                {promo && <p className="mt-2 font-mono text-[11px] text-success">{promo.label} <button onClick={() => { setPromo(null); setPromoInput(""); cart.setPromoCode(""); }} className="underline ml-2">Retirer</button></p>}
              </div>
              {user && maxPoints >= 100 && (
                <div className="border border-line p-4"><label className="flex items-center justify-between font-sans text-[13px]"><span>Utiliser {user.loyaltyPoints} points</span><input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} /></label>{usePoints && <p className="mt-2 font-mono text-[11px] text-success">{maxPoints} pts → -{formatDT(maxPoints * 10)}</p>}</div>
              )}
            </section>
          )}
          {step === 3 && (
            <section className="space-y-6">
              <h2 className="font-sans text-[22px] font-semibold tracking-[-0.02em]">Récapitulatif — 04</h2>
              <div className="grid gap-6 sm:grid-cols-2 border-t border-line pt-6 font-sans text-[13px]">
                <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">Livraison</p><p>{addr.fullName}<br />{addr.line1}<br />{addr.city}, {addr.governorate}<br />{addr.phone}</p><button onClick={() => setStep(0)} className="mt-2 font-mono text-[11px] underline">Modifier</button></div>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">Paiement</p><p>{{ cod: "À la livraison", bank_transfer: "Virement", gift_card: "Carte cadeau" }[payment] ?? payment}<br />{email}</p><button onClick={() => setStep(2)} className="mt-2 font-mono text-[11px] underline">Modifier</button></div>
              </div>
              <ul className="divide-y divide-line border-y border-line">
                {cart.lines.map((l) => (
                  <li key={l.productId} className="flex items-center gap-3 py-3"><div className="h-12 w-10 bg-bg-2 border border-line relative">{l.image && <Image src={l.image} alt="" fill className="object-cover" />}</div><span className="flex-1 truncate font-sans text-[13px]">{l.name}</span><span className="font-mono text-[12px]">{l.quantity}×{formatDT(l.priceMillimes)}</span></li>
                ))}
              </ul>
            </section>
          )}
        </div>
        {submitError && <div className="mt-8 border border-error bg-error-soft p-4 font-sans text-[13px] text-error">{submitError}</div>}
        <div className="mt-10 flex items-center justify-between">
          {step > 0 ? <button onClick={() => setStep((s) => s - 1)} className="btn-ghost">Retour</button> : <Link href="/panier" className="btn-ghost">Panier</Link>}
          {step < 3 ? <button onClick={next} className="btn-primary">Continuer</button> : <button onClick={submit} disabled={pending} className="btn-primary">{pending ? "Traitement…" : `Confirmer · ${formatDT(total)}`}</button>}
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="sticky top-[80px] border border-line p-6">
          <h3 className="font-sans text-[18px] font-semibold tracking-[-0.01em]">Récapitulatif</h3>
          <ul className="mt-6 max-h-64 overflow-y-auto space-y-3">
            {cart.lines.map((l) => (
              <li key={l.productId} className="flex gap-3 font-sans text-[13px]"><span className="h-10 w-8 bg-bg-2 border border-line relative shrink-0">{l.image && <Image src={l.image} alt="" fill className="object-cover" />}</span><span className="flex-1 truncate">{l.name}</span><span className="font-mono text-[12px]">{formatDT(l.priceMillimes * l.quantity)}</span></li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-line pt-4 font-mono text-[12px]">
            <div className="flex justify-between"><dt className="uppercase tracking-[0.06em] text-text-secondary">Sous-total</dt><dd>{formatDT(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-success"><dt>Remise</dt><dd>-{formatDT(discount)}</dd></div>}
            {pointsDiscount > 0 && <div className="flex justify-between text-success"><dt>Fidélité</dt><dd>-{formatDT(pointsDiscount)}</dd></div>}
            <div className="flex justify-between"><dt className="uppercase tracking-[0.06em] text-text-secondary">Livraison</dt><dd>{shipFee === 0 ? "Offerte" : formatDT(shipFee)}</dd></div>
            {wrap > 0 && <div className="flex justify-between"><dt className="uppercase tracking-[0.06em] text-text-secondary">Emballage</dt><dd>{formatDT(wrap)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-4 font-sans text-[18px] font-semibold"><dt>Total</dt><dd>{formatDT(total)}</dd></div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
