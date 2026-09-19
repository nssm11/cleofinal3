"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/primitives";
import { CONSENT_CHOICES, SEO_FAQS } from "@/lib/next-feature-data";
import { formatDTShort } from "@/lib/money";

type SelectProduct = { id: number; slug: string; name: string; brandName: string | null; priceMillimes: number; stock: number; volume: string | null };
type SelectStore = { id: number; name: string; city: string; hours: string; phone: string };

type RequestRecord = { id: string; title: string; detail: string; status: string; createdAt: string };

function ticket(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export function ReserveInStore({ products, stores }: { products: SelectProduct[]; stores: SelectStore[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? 0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [record, setRecord] = useState<RequestRecord | null>(null);
  const product = products.find((item) => item.id === productId) ?? products[0];
  const store = stores.find((item) => item.id === storeId) ?? stores[0];
  const submit = () => {
    if (!product || !store) return;
    setRecord({
      id: ticket("RSV"),
      title: product.name,
      detail: `${store.name} · ${name || "cliente"} · ${phone || "téléphone à confirmer"}`,
      status: "Pré-réservation créée, paiement au comptoir uniquement.",
      createdAt: new Date().toISOString(),
    });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="border border-line/70 bg-porcelain p-5">
        <p className="kicker-xs text-faint">Réserver sans paiement</p>
        <div className="mt-5 space-y-4">
          <select value={productId} onChange={(event) => setProductId(Number(event.target.value))} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
            {products.map((item) => <option key={item.id} value={item.id}>{item.brandName ? `${item.brandName} — ${item.name}` : item.name}</option>)}
          </select>
          <select value={storeId} onChange={(event) => setStoreId(Number(event.target.value))} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
            {stores.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.city}</option>)}
          </select>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom" className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Téléphone" className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
          <button type="button" onClick={submit} className="btn-solid w-full">Créer la réservation</button>
        </div>
      </div>
      <div className="border border-line/70 bg-canvas p-5">
        <p className="kicker-xs text-faint">Ticket comptoir</p>
        {record ? (
          <div className="mt-4">
            <p className="font-ant uppercase text-[2rem] text-carbon">{record.id}</p>
            <p className="mt-3 text-[14px] text-carbon">{record.title}</p>
            <p className="mt-2 text-[13px] text-muted">{record.detail}</p>
            <Badge tone="success" className="mt-4">{record.status}</Badge>
          </div>
        ) : (
          <p className="mt-4 text-[13px] leading-relaxed text-muted">Choisissez une référence et un comptoir. Le ticket reste côté navigateur pour la démo.</p>
        )}
        {product && <p className="mt-6 text-[12px] text-faint">Stock produit affiché : {product.stock} · prix indicatif {formatDTShort(product.priceMillimes)}</p>}
      </div>
    </div>
  );
}

export function PickupScheduler({ stores }: { stores: SelectStore[] }) {
  const [storeId, setStoreId] = useState(stores[0]?.id ?? 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState("10:00-12:00");
  const [code, setCode] = useState<string | null>(null);
  const store = stores.find((item) => item.id === storeId) ?? stores[0];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="border border-line/70 bg-porcelain p-5">
        <p className="kicker-xs text-faint">Rendez-vous retrait</p>
        <div className="mt-5 space-y-4">
          <select value={storeId} onChange={(event) => setStoreId(Number(event.target.value))} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
            {stores.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
          <select value={slot} onChange={(event) => setSlot(event.target.value)} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
            {['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <button type="button" onClick={() => setCode(ticket("PU"))} className="btn-solid w-full">Confirmer le créneau</button>
        </div>
      </div>
      <div className="border border-line/70 bg-canvas p-5">
        <p className="kicker-xs text-faint">Créneau</p>
        <h2 className="mt-2 font-ant uppercase text-[1.6rem] text-carbon">{store?.name ?? "Comptoir"}</h2>
        <p className="mt-3 text-[13px] text-muted">{date} · {slot} · {store?.hours}</p>
        {code && <Badge tone="success" className="mt-5">{code}</Badge>}
      </div>
    </div>
  );
}

export function GiftWishlistBuilder({ products }: { products: SelectProduct[] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState("Ma liste cadeau");
  const [message, setMessage] = useState("");
  const share = selected.length ? `/liste-cadeaux?ids=${selected.join(",")}&name=${encodeURIComponent(name)}` : "";
  const toggle = (id: number) => setSelected((cur) => cur.includes(id) ? cur.filter((item) => item !== id) : [...cur, id].slice(0, 12));
  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="border border-line/70 bg-porcelain p-5">
        <p className="kicker-xs text-faint">Liste cadeau rapide</p>
        <input value={name} onChange={(event) => setName(event.target.value)} className="mt-5 min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message cadeau" className="mt-3 min-h-24 w-full border border-line bg-canvas px-4 py-3 text-carbon outline-none focus:border-iodine-deep" />
        {share && <p className="mt-4 break-all border border-line/60 bg-canvas p-3 text-[12px] text-muted">Lien démo : {share}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.slice(0, 18).map((product) => (
          <button key={product.id} type="button" onClick={() => toggle(product.id)} className="border border-line/70 bg-canvas p-4 text-left transition-colors hover:border-iodine-deep/60">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{product.brandName}</span>
            <span className="mt-1 block font-ant uppercase text-[1.1rem] leading-tight text-carbon">{product.name}</span>
            <span className="mt-3 flex items-center justify-between gap-2 text-[12px] text-muted">
              {formatDTShort(product.priceMillimes)}
              {selected.includes(product.id) ? <Badge tone="success">ajouté</Badge> : <Badge>choisir</Badge>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SampleRequestCenter({ products }: { products: SelectProduct[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [reason, setReason] = useState("Tester la texture avant achat");
  const [record, setRecord] = useState<RequestRecord | null>(null);
  const product = products.find((item) => item.id === productId) ?? products[0];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="border border-line/70 bg-porcelain p-5">
        <p className="kicker-xs text-faint">Demande échantillon</p>
        <select value={productId} onChange={(event) => setProductId(Number(event.target.value))} className="mt-5 min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
          {products.map((item) => <option key={item.id} value={item.id}>{item.brandName ? `${item.brandName} — ${item.name}` : item.name}</option>)}
        </select>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-3 min-h-28 w-full border border-line bg-canvas px-4 py-3 text-carbon outline-none focus:border-iodine-deep" />
        <button type="button" onClick={() => setRecord({ id: ticket("SMP"), title: product?.name ?? "Échantillon", detail: reason, status: "File échantillons", createdAt: new Date().toISOString() })} className="btn-solid mt-4 w-full">Envoyer</button>
      </div>
      <div className="border border-line/70 bg-canvas p-5">
        <p className="kicker-xs text-faint">Suivi</p>
        {record ? (
          <div className="mt-4">
            <p className="font-ant uppercase text-[1.8rem] text-carbon">{record.id}</p>
            <p className="mt-2 text-[14px] text-carbon">{record.title}</p>
            <p className="mt-2 text-[13px] text-muted">{record.detail}</p>
            <Badge tone="accent" className="mt-4">{record.status}</Badge>
          </div>
        ) : <p className="mt-4 text-[13px] text-muted">La demande créée apparaîtra ici.</p>}
      </div>
    </div>
  );
}

export function CartStockGuard() {
  const cart = useCart();
  const [stock, setStock] = useState<Record<number, number>>({});
  const ids = cart.lines.map((line) => line.productId).join(",");
  useEffect(() => {
    if (!ids) return;
    let alive = true;
    fetch(`/api/products?ids=${ids}`).then((response) => response.json()).then((data: { items: SelectProduct[] }) => {
      if (!alive) return;
      setStock(Object.fromEntries(data.items.map((item) => [item.id, item.stock])));
    }).catch(() => {});
    return () => { alive = false; };
  }, [ids]);
  return (
    <div className="space-y-3">
      {cart.lines.map((line) => {
        const live = stock[line.productId] ?? line.stock;
        const issue = live <= 0 || line.quantity > live;
        return (
          <article key={line.productId} className="flex flex-wrap items-center justify-between gap-3 border border-line/70 bg-porcelain p-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{line.brandName}</p>
              <Link href={`/produit/${line.slug}`} className="mt-1 block font-ant uppercase text-[1.15rem] text-carbon hover:text-iodine-deep">{line.name}</Link>
              <p className="mt-1 text-[12px] text-muted">Dans le panier : {line.quantity} · stock live : {live}</p>
            </div>
            <Badge tone={issue ? "warning" : "success"}>{issue ? "à ajuster" : "protégé"}</Badge>
          </article>
        );
      })}
      {cart.lines.length === 0 && <p className="border border-dashed border-line p-8 text-[13px] text-muted">Ajoutez des produits au panier pour surveiller le stock.</p>}
    </div>
  );
}

export function CommunityVotes() {
  const [helpful, setHelpful] = useState<Record<string, number>>({ r1: 12, r2: 8, q1: 17 });
  const vote = (key: string) => setHelpful((cur) => ({ ...cur, [key]: (cur[key] ?? 0) + 1 }));
  const rows = [
    { id: "r1", type: "Avis", title: "Texture légère et pas de film blanc", body: "Utile pour choisir un SPF quotidien." },
    { id: "r2", type: "Avant / après", title: "Rougeurs moins visibles après quatre semaines", body: "Photo en attente de validation avant publication." },
    { id: "q1", type: "Question", title: "Compatible avec niacinamide ?", body: "Question remontée dans la file conseil." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {rows.map((row) => (
        <article key={row.id} className="border border-line/70 bg-porcelain p-5">
          <p className="kicker-xs text-faint">{row.type}</p>
          <h2 className="mt-2 font-ant uppercase text-[1.2rem] leading-tight text-carbon">{row.title}</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">{row.body}</p>
          <button type="button" onClick={() => vote(row.id)} className="btn-outline mt-5 min-h-10">Utile · {helpful[row.id] ?? 0}</button>
        </article>
      ))}
    </div>
  );
}

export function FaqSearch() {
  const [q, setQ] = useState("");
  const rows = SEO_FAQS.filter((item) => !q || [item.topic, item.question, item.answer].join(" ").toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Chercher stock, lot, retrait..." className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
      <div className="mt-6 space-y-3">
        {rows.map((item) => (
          <article key={item.question} className="border border-line/70 bg-porcelain p-5">
            <p className="kicker-xs text-faint">{item.topic}</p>
            <h2 className="mt-2 font-ant uppercase text-[1.2rem] text-carbon">{item.question}</h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{item.answer}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function NewsletterCapture() {
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("Guides d'achat");
  const [sent, setSent] = useState(false);
  return (
    <div className="border border-line/70 bg-porcelain p-6">
      <p className="kicker-xs text-faint">Centre newsletter</p>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" className="min-h-12 border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
        <select value={interest} onChange={(event) => setInterest(event.target.value)} className="min-h-12 border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
          {["Guides d'achat", "Stock & rappels", "Actifs", "Promotions"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <button type="button" onClick={() => setSent(Boolean(email))} className="btn-solid">Inscrire</button>
      </div>
      {sent && <p className="mt-4 text-[13px] text-iodine-deep">Inscription locale créée pour {interest}.</p>}
    </div>
  );
}

export function ConsentCenter() {
  const [choices, setChoices] = useState<Record<string, boolean>>(() => Object.fromEntries(CONSENT_CHOICES.map((item) => [item.key, Boolean(item.required)])));
  const [saved, setSaved] = useState(false);
  const toggle = (key: string, required?: boolean) => {
    if (required) return;
    setChoices((cur) => ({ ...cur, [key]: !cur[key] }));
    setSaved(false);
  };
  return (
    <div className="space-y-3">
      {CONSENT_CHOICES.map((choice) => (
        <button key={choice.key} type="button" onClick={() => toggle(choice.key, choice.required)} className="flex w-full items-center justify-between gap-4 border border-line/70 bg-porcelain p-4 text-left">
          <span>
            <span className="font-ant uppercase text-[1.15rem] text-carbon">{choice.label}</span>
            <span className="mt-1 block text-[13px] text-muted">{choice.description}</span>
          </span>
          <Badge tone={choices[choice.key] ? "success" : "neutral"}>{choice.required ? "requis" : choices[choice.key] ? "oui" : "non"}</Badge>
        </button>
      ))}
      <button type="button" onClick={() => setSaved(true)} className="btn-solid mt-3">Enregistrer mes choix</button>
      {saved && <p className="text-[13px] text-iodine-deep">Préférences mémorisées pour cette session.</p>}
    </div>
  );
}

export function DataRequestCenter() {
  const [kind, setKind] = useState("export");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string | null>(null);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="border border-line/70 bg-porcelain p-5">
        <p className="kicker-xs text-faint">Droits données</p>
        <select value={kind} onChange={(event) => setKind(event.target.value)} className="mt-5 min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
          <option value="export">Exporter mes données</option>
          <option value="delete">Demander la suppression</option>
          <option value="rectify">Corriger mes informations</option>
        </select>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email du compte" className="mt-3 min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
        <button type="button" onClick={() => setCode(email ? ticket("DATA") : null)} className="btn-solid mt-4 w-full">Créer la demande</button>
      </div>
      <div className="border border-line/70 bg-canvas p-5">
        <p className="kicker-xs text-faint">Référence</p>
        {code ? <p className="mt-4 font-ant uppercase text-[2rem] text-carbon">{code}</p> : <p className="mt-4 text-[13px] text-muted">Aucune demande créée.</p>}
        <p className="mt-3 text-[12px] leading-relaxed text-faint">Les demandes réelles nécessitent vérification d&apos;identité et traitement par l&apos;équipe.</p>
      </div>
    </div>
  );
}
