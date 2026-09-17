"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { osStandard } from "@/lib/admin/motion";
import { createManualOrderAction, lookupCustomersAction, lookupProductsAction } from "@/actions/admin-os";
import { useToast } from "@/components/ui/toaster";
import { Glyph } from "./icons";
import { OsButton, Money } from "./primitives";
import { AnimatedNumber } from "./motion";

/* ══════════════════════════════════════════════════════════════════════════
   COMMANDE MANUELLE — sept portes, une transaction
   ──────────────────────────────────────────────────────────────────────────
   A telephone order is a real order: it locks stock, validates the code,
   writes the ledger and emits the same event a shopper's order would. The
   wizard walks the operator through it in the order the house thinks, and the
   last screen shows exactly what will be written before it is written.
   ══════════════════════════════════════════════════════════════════════════ */

type Step = "customer" | "products" | "quantities" | "discount" | "delivery" | "payment" | "confirm";

const STEPS: { key: Step; label: string; hint: string }[] = [
  { key: "customer", label: "Cliente", hint: "Qui commande, et où livrer" },
  { key: "products", label: "Articles", hint: "Ce qui part" },
  { key: "quantities", label: "Quantités", hint: "Combien de chaque" },
  { key: "discount", label: "Remise", hint: "Un code, ou rien" },
  { key: "delivery", label: "Livraison", hint: "Comment cela arrive" },
  { key: "payment", label: "Paiement", hint: "Comment cela se règle" },
  { key: "confirm", label: "Confirmation", hint: "Ce qui sera écrit" },
];

type Product = { id: number; name: string; sku: string; price: number; stock: number; image: string | null };
type Customer = { id: number; name: string; email: string; phone: string | null };
type Line = { product: Product; quantity: number };

const SHIPPING: { key: "standard" | "express" | "pickup"; label: string; hint: string }[] = [
  { key: "standard", label: "Standard", hint: "Livraison à domicile, 48–72 h" },
  { key: "express", label: "Express", hint: "24 h sur le Grand Tunis" },
  { key: "pickup", label: "Retrait boutique", hint: "La cliente passe chercher" },
];

export function OrderWizard({ paymentMethods, shippingFees, freeShippingThreshold }: { paymentMethods: { key: string; label: string }[]; shippingFees: { standard: number; express: number }; freeShippingThreshold: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("customer");
  const [pending, start] = useTransition();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ email: "", phone: "", fullName: "", line1: "", line2: "", city: "", governorate: "", postalCode: "" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "pickup">("standard");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.key ?? "cod");
  const [giftWrap, setGiftWrap] = useState(false);
  const [notes, setNotes] = useState({ customer: "", internal: "" });
  const [created, setCreated] = useState<{ id: number; number: string; total: number } | null>(null);

  const search = useCallback(async (term: string) => {
    if (term.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    try { setResults(await lookupProductsAction(term)); } finally { setSearching(false); }
  }, []);

  const searchCustomers = useCallback(async (term: string) => {
    if (term.trim().length < 3) return [];
    return lookupCustomersAction(term);
  }, []);

  const subtotal = lines.reduce((a, l) => a + l.product.price * l.quantity, 0);
  const shipping = shippingMethod === "pickup" ? 0 : shippingMethod === "express" ? shippingFees.express : subtotal >= freeShippingThreshold ? 0 : shippingFees.standard;
  const gift = giftWrap ? 5000 : 0;
  const total = subtotal + shipping + gift;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const go = (dir: 1 | -1) => setStep(STEPS[Math.min(STEPS.length - 1, Math.max(0, stepIndex + dir))].key);

  const submit = () =>
    start(async () => {
      const r = await createManualOrderAction({
        customerId: customer?.id ?? null,
        email: form.email,
        phone: form.phone,
        fullName: form.fullName,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        governorate: form.governorate,
        postalCode: form.postalCode,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        shippingMethod,
        paymentMethod,
        promoCode: promoCode.trim() || null,
        customerNote: notes.customer || null,
        internalNote: notes.internal || null,
        giftWrap,
      });
      if (r.ok && r.data) {
        setCreated(r.data);
        toast({ kind: "success", title: `Commande ${r.data.number} créée` });
        router.refresh();
      } else {
        toast({ kind: "error", title: r.ok ? "Commande créée" : r.error });
      }
    });

  if (created) {
    return (
      <div className="border border-os-ok/40 bg-os-ok-soft/40 p-6">
        <p className="os-label text-os-ok">Commande écrite</p>
        <p className="os-num mt-2 font-sans text-[2rem] text-os-text">{created.number}</p>
        <p className="mt-1 text-[13px] text-os-muted">
          Le stock a été décrémenté au registre, un mouvement « vente » a été enregistré pour chaque ligne, et l&apos;événement de création figure dans la chronologie.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <OsButton variant="primary" onClick={() => router.push(`/admin/commandes/${created.id}`)}>Ouvrir la commande</OsButton>
          <OsButton variant="ghost" onClick={() => { setCreated(null); setLines([]); setPromoCode(""); setStep("customer"); }}>Saisir une autre commande</OsButton>
          <OsButton variant="quiet" onClick={() => router.push("/admin/commandes")}>Retour au livre</OsButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="border border-os-line bg-os-surface">
        {/* Rail of steps */}
        <ol className="flex flex-wrap gap-px border-b border-os-line bg-os-line">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = s.key === step;
            return (
              <li key={s.key} className="flex-1">
                <button
                  onClick={() => setStep(s.key)}
                  className={cn("flex h-full w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors", active ? "bg-os-ink text-os-onink" : done ? "bg-os-surface-2 text-os-text" : "bg-os-surface text-os-muted hover:bg-os-surface-2")}
                >
                  <span className="os-num text-[10px] tracking-[0.2em]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em]">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="p-4 sm:p-5">
          <p className="os-label text-os-faint">{STEPS[stepIndex].hint}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={osStandard}
              className="mt-3"
            >
              {step === "customer" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="os-label text-os-muted">Retrouver un compte existant</label>
                    <input
                      onChange={async (e) => {
                        const term = e.target.value;
                        const rows = await searchCustomers(term);
                        setResults(rows.map((c) => ({ id: c.id, name: c.name, sku: c.email, price: 0, stock: 0, image: null })));
                      }}
                      placeholder="Nom, e-mail ou téléphone (3 caractères minimum)"
                      className="mt-1 h-10 w-full border border-os-line bg-os-surface px-3 text-[13px] focus:border-os-line-strong focus:outline-none"
                    />
                    <ul className="mt-2 space-y-1">
                      {results.map((c) => (
                        <li key={c.id}>
                          <button
                            onClick={async () => {
                              const rows = await lookupCustomersAction(c.sku);
                              const found = rows.find((x) => x.id === c.id);
                              if (found) {
                                setCustomer(found);
                                setForm((f) => ({ ...f, email: found.email, phone: found.phone ?? "", fullName: found.name }));
                                setResults([]);
                              }
                            }}
                            className="w-full border border-os-line px-3 py-2 text-left text-[12.5px] text-os-text transition-colors hover:bg-os-surface-2"
                          >
                            {c.name} <span className="text-os-faint">· {c.sku}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {customer && <p className="mt-2 text-[12px] text-os-ok"><Glyph name="check" size={12} className="mr-1 inline" /> Compte lié : {customer.name}</p>}
                    <p className="mt-3 text-[11.5px] leading-relaxed text-os-faint">
                      Sans compte, la commande reste une commande invitée : coordonnées conservées, historique non rattaché. Les deux cas sont valides.
                    </p>
                  </div>
                  <div className="grid gap-2.5">
                    {[
                      ["fullName", "Nom complet", true],
                      ["email", "E-mail", true],
                      ["phone", "Téléphone", true],
                      ["line1", "Adresse", true],
                      ["line2", "Complément", false],
                      ["city", "Ville", true],
                      ["governorate", "Gouvernorat", true],
                      ["postalCode", "Code postal", false],
                    ].map(([key, label, required]) => (
                      <label key={String(key)} className="block">
                        <span className="os-label text-os-muted">{String(label)}{required ? " *" : ""}</span>
                        <input
                          value={(form as Record<string, string>)[String(key)]}
                          onChange={(e) => setForm((f) => ({ ...f, [String(key)]: e.target.value }))}
                          className="mt-1 h-9 w-full border border-os-line bg-os-surface px-2.5 text-[13px] text-os-text focus:border-os-line-strong focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === "products" && (
                <div>
                  <label className="os-label text-os-muted">Chercher une référence</label>
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); void search(e.target.value); }}
                    placeholder="Nom ou SKU (3 caractères minimum)"
                    className="mt-1 h-10 w-full border border-os-line bg-os-surface px-3 text-[13px] focus:border-os-line-strong focus:outline-none"
                  />
                  {searching && <p className="mt-2 text-[12px] text-os-faint">Recherche…</p>}
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => setLines((l) => (l.some((x) => x.product.id === p.id) ? l : [...l, { product: p, quantity: 1 }]))}
                          disabled={p.stock <= 0}
                          className={cn("flex w-full items-center gap-3 border p-2.5 text-left transition-colors", p.stock <= 0 ? "cursor-not-allowed border-os-line-soft opacity-60" : "border-os-line hover:border-os-line-strong hover:bg-os-surface-2")}
                        >
                          {p.image && <img src={p.image} alt="" className="h-10 w-10 shrink-0 object-cover" />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] text-os-text">{p.name}</span>
                            <span className="block truncate text-[11px] text-os-faint">{p.sku} · stock {p.stock}</span>
                          </span>
                          <Money millimes={p.price} className="shrink-0 text-[12px] text-os-text" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {query.trim().length >= 3 && !searching && results.length === 0 && (
                    <p className="mt-3 text-[12.5px] text-os-muted">Aucune référence active ne correspond. Essayez le SKU exact, ou vérifiez que la fiche n&apos;est pas archivée.</p>
                  )}
                  <p className="mt-4 os-label text-os-muted">Panier en cours</p>
                  <ul className="mt-1.5 space-y-1 text-[12.5px]">
                    {lines.map((l) => (
                      <li key={l.product.id} className="flex items-center justify-between gap-3 border-b border-dashed border-os-line-soft pb-1">
                        <span className="truncate text-os-text">{l.product.name}</span>
                        <span className="os-num text-os-muted">× {l.quantity}</span>
                      </li>
                    ))}
                    {lines.length === 0 && <li className="text-os-muted">Aucun article sélectionné.</li>}
                  </ul>
                </div>
              )}

              {step === "quantities" && (
                <ul className="space-y-2">
                  {lines.map((l) => (
                    <li key={l.product.id} className="flex flex-wrap items-center gap-3 border border-os-line-soft p-2.5">
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-os-text">{l.product.name}</span>
                      <span className="os-num text-[11.5px] text-os-muted">stock {l.product.stock}</span>
                      <span className="inline-flex items-center border border-os-line">
                        <button onClick={() => setLines((all) => all.map((x) => (x.product.id === l.product.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))} className="px-2.5 py-1 text-os-text hover:bg-os-surface-2">−</button>
                        <input
                          value={l.quantity}
                          onChange={(e) => setLines((all) => all.map((x) => (x.product.id === l.product.id ? { ...x, quantity: Math.max(1, Math.min(999, Number(e.target.value) || 1)) } : x)))}
                          className="os-num w-12 border-x border-os-line bg-os-surface py-1 text-center text-[12.5px]"
                        />
                        <button onClick={() => setLines((all) => all.map((x) => (x.product.id === l.product.id ? { ...x, quantity: x.quantity + 1 } : x)))} className="px-2.5 py-1 text-os-text hover:bg-os-surface-2">+</button>
                      </span>
                      <Money millimes={l.product.price * l.quantity} className="os-num w-24 text-right text-[12.5px] text-os-text" />
                      <button onClick={() => setLines((all) => all.filter((x) => x.product.id !== l.product.id))} className="text-[11px] uppercase tracking-[0.1em] text-os-crit">Retirer</button>
                      {l.quantity > l.product.stock && <span className="w-full text-[11.5px] text-os-crit">Le stock disponible est de {l.product.stock} — la création sera refusée au-delà.</span>}
                    </li>
                  ))}
                  {lines.length === 0 && <li className="text-[12.5px] text-os-muted">Revenez à l&apos;étape Articles pour ajouter des références.</li>}
                </ul>
              )}

              {step === "discount" && (
                <div className="max-w-md">
                  <label className="os-label text-os-muted">Code promotionnel</label>
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Ex. RENTREE20"
                    className="mt-1 h-10 w-full border border-os-line bg-os-surface px-3 font-mono text-[13px] uppercase focus:border-os-line-strong focus:outline-none"
                  />
                  <p className="mt-2 text-[11.5px] leading-relaxed text-os-faint">
                    Le code est vérifié au moment de l&apos;écriture : s&apos;il a expiré, atteint sa limite d&apos;usage ou ne s&apos;applique pas au panier, la commande n&apos;est pas créée et la raison est affichée.
                  </p>
                </div>
              )}

              {step === "delivery" && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {SHIPPING.map((s) => {
                    const fee = s.key === "pickup" ? 0 : s.key === "express" ? shippingFees.express : subtotal >= freeShippingThreshold ? 0 : shippingFees.standard;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setShippingMethod(s.key)}
                        className={cn("border p-3 text-left transition-colors", shippingMethod === s.key ? "border-os-ink bg-os-ink text-os-onink" : "border-os-line hover:bg-os-surface-2")}
                      >
                        <span className="block text-[13px]">{s.label}</span>
                        <span className={cn("mt-0.5 block text-[11.5px]", shippingMethod === s.key ? "text-os-onink-muted" : "text-os-muted")}>{s.hint}</span>
                        <span className="os-num mt-2 block text-[12px]">{fee === 0 ? "Offerte" : <Money millimes={fee} />}</span>
                      </button>
                    );
                  })}
                  <label className="flex items-center gap-2 sm:col-span-3">
                    <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="accent-[var(--color-os-gold)]" />
                    <span className="text-[12.5px] text-os-text">Emballage cadeau — 5,000 DT (ajouté au total et tracé sur la commande)</span>
                  </label>
                </div>
              )}

              {step === "payment" && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={cn("border p-3 text-left transition-colors", paymentMethod === m.key ? "border-os-ink bg-os-ink text-os-onink" : "border-os-line hover:bg-os-surface-2")}
                    >
                      <span className="block text-[13px]">{m.label}</span>
                    </button>
                  ))}
                  <div className="sm:col-span-3 grid gap-2.5">
                    <label className="block">
                      <span className="os-label text-os-muted">Note de la cliente (visible sur la commande)</span>
                      <textarea value={notes.customer} onChange={(e) => setNotes((n) => ({ ...n, customer: e.target.value }))} rows={2} className="mt-1 w-full border border-os-line bg-os-surface px-2.5 py-2 text-[13px] focus:border-os-line-strong focus:outline-none" />
                    </label>
                    <label className="block">
                      <span className="os-label text-os-muted">Note interne (jamais montrée)</span>
                      <textarea value={notes.internal} onChange={(e) => setNotes((n) => ({ ...n, internal: e.target.value }))} rows={2} className="mt-1 w-full border border-os-line bg-os-surface px-2.5 py-2 text-[13px] focus:border-os-line-strong focus:outline-none" />
                    </label>
                  </div>
                  <p className="sm:col-span-3 text-[11.5px] leading-relaxed text-os-faint">
                    Les moyens proposés sont ceux activés pour la boutique. Le module carte bancaire n&apos;étant pas branché, une commande passée par carte restera « en attente » jusqu&apos;à confirmation manuelle.
                  </p>
                </div>
              )}

              {step === "confirm" && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border border-os-line-soft p-3">
                      <p className="os-label text-os-muted">Cliente</p>
                      <p className="mt-1 text-[13px] text-os-text">{form.fullName || "—"}</p>
                      <p className="text-[11.5px] text-os-muted">{form.email} · {form.phone}</p>
                      <p className="mt-1 text-[11.5px] text-os-muted">{[form.line1, form.line2, form.postalCode, form.city, form.governorate].filter(Boolean).join(", ") || "aucune adresse"}</p>
                      {customer ? <p className="mt-1 text-[11.5px] text-os-ok">Compte lié — l&apos;historique de la cliente sera mis à jour</p> : <p className="mt-1 text-[11.5px] text-os-muted">Commande invitée — aucun historique rattaché</p>}
                    </div>
                    <div className="border border-os-line-soft p-3">
                      <p className="os-label text-os-muted">Livraison & paiement</p>
                      <p className="mt-1 text-[13px] text-os-text">{SHIPPING.find((s) => s.key === shippingMethod)?.label}</p>
                      <p className="text-[11.5px] text-os-muted">{paymentMethods.find((m) => m.key === paymentMethod)?.label}{giftWrap ? " · emballage cadeau" : ""}{promoCode ? ` · code ${promoCode}` : ""}</p>
                    </div>
                  </div>
                  <ul className="border border-os-line-soft">
                    {lines.map((l) => (
                      <li key={l.product.id} className="flex items-center justify-between gap-3 border-b border-os-line-soft px-3 py-2 text-[12.5px] last:border-0">
                        <span className="min-w-0 flex-1 truncate text-os-text">{l.product.name}</span>
                        <span className="os-num text-os-muted">× {l.quantity}</span>
                        <Money millimes={l.product.price * l.quantity} className="os-num w-24 text-right text-os-text" />
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11.5px] leading-relaxed text-os-muted">
                    À l&apos;enregistrement : les stocks seront verrouillés ligne par ligne, un mouvement « vente » sera écrit pour chaque article, le code sera validé une dernière fois, puis la commande et son premier événement seront créés dans la même transaction. Si une seule vérification échoue, rien n&apos;est écrit.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-os-line pt-3">
            <OsButton variant="quiet" onClick={() => go(-1)} disabled={stepIndex === 0}>‹ Précédent</OsButton>
            <span className="os-num text-[11.5px] text-os-faint">Étape {stepIndex + 1} / {STEPS.length}</span>
            {step === "confirm" ? (
              <OsButton variant="gold" onClick={submit} disabled={pending || lines.length === 0 || !form.email || !form.fullName}>
                {pending ? "Écriture…" : "Créer la commande"}
              </OsButton>
            ) : (
              <OsButton variant="primary" onClick={() => go(1)} disabled={step === "products" && lines.length === 0}>Continuer ›</OsButton>
            )}
          </div>
        </div>
      </div>

      {/* Running total — always visible, never a guess */}
      <aside className="h-fit border border-os-line bg-os-surface p-4 xl:sticky xl:top-[4.5rem]">
        <p className="os-label text-os-muted">Commande en cours</p>
        <p className="os-num mt-2 font-sans text-[2.2rem] leading-none text-os-text">
          <AnimatedNumber value={total} spec={{ kind: "dt", digits: 3 }} />
        </p>
        <dl className="mt-3 space-y-1.5 text-[12.5px]">
          <div className="flex justify-between gap-3"><dt className="text-os-muted">Sous-total ({lines.length} ligne{lines.length > 1 ? "s" : ""})</dt><dd className="os-num text-os-text"><Money millimes={subtotal} /></dd></div>
          <div className="flex justify-between gap-3"><dt className="text-os-muted">Livraison</dt><dd className="os-num text-os-text">{shipping === 0 ? "Offerte" : <Money millimes={shipping} />}</dd></div>
          {gift > 0 && <div className="flex justify-between gap-3"><dt className="text-os-muted">Emballage cadeau</dt><dd className="os-num text-os-text"><Money millimes={gift} /></dd></div>}
          {promoCode && <div className="flex justify-between gap-3"><dt className="text-os-muted">Code {promoCode}</dt><dd className="text-[11.5px] text-os-warn">vérifié à l&apos;écriture</dd></div>}
        </dl>
        <p className="mt-3 border-t border-os-line pt-3 text-[11.5px] leading-relaxed text-os-faint">
          Total provisoire : la remise éventuelle n&apos;est appliquée que lorsque la boutique l&apos;a validée, au moment de l&apos;écriture.
        </p>
        {lines.some((l) => l.quantity > l.product.stock) && (
          <p className="mt-2 text-[11.5px] text-os-crit">Au moins une ligne dépasse le stock : corrigez les quantités pour continuer.</p>
        )}
      </aside>
    </div>
  );
}
