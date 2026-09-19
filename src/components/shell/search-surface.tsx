"use client";
import { ProductImage } from "@/components/catalog/product-image";
import { MEDIA_SIZES } from "@/lib/media";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { formatDT } from "@/lib/money";
import type { ProductCard } from "@/lib/catalog";
import { useLocale } from "@/lib/i18n/client";
import {D, leave} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";
import { useFocusTrap } from "@/lib/use-focus-trap";

/**
 * L'ARCHIVE — search as a room, not as a dropdown.
 *
 * Opening it dims the house to a whisper and hands the visitor a wide field
 * with a vertical rail. Results are already positional: products keep their
 * photograph, brands and categories answer as typography. Keyboard is first
 * class — ↑↓ moves, ↵ opens, Esc leaves.
 */
type Suggestions = {
  items: ProductCard[];
  brands: { slug: string; name: string }[];
  categories: { slug: string; name: string; isUniverse: boolean }[];
  concerns: { slug: string; name: string }[];
  ingredients: { name: string }[];
};

const EMPTY: Suggestions = { items: [], brands: [], categories: [], concerns: [], ingredients: [] };
const FALLBACK_QUERIES = ["Sérum vitamine C", "Eau micellaire", "Peau sensible", "Anti-chute"];
type Trending = { queries: { q: string; n: number }[]; products: ProductCard[] };
const TRENDING_EMPTY: Trending = { queries: [], products: [] };

/** Search analytics — which suggestion a query turned into. Fire-and-forget. */
function trackClick(q: string, kind: string, ref?: string) {
  try {
    const payload = JSON.stringify({ q: q.slice(0, 120), kind, ref: ref ?? "" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/search/click", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/search/click", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
    }
  } catch {
    /* analytics never blocks the room */
  }
}
const RECENT_KEY = "cleo.recent.v1";

type SpeechRecognizer = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognizer;
  webkitSpeechRecognition?: new () => SpeechRecognizer;
};

function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(raw) ? (raw as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}
function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* storage disabled — recent searches are a convenience, never a blocker */
  }
}

export function SearchSurface({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { copy } = useLocale();
  const [q, setQ] = useState("");
  const [listening, setListening] = useState(false);
  const [cache, setCache] = useState<Record<string, Suggestions>>({});
  const [idx, setIdx] = useState(-1);
  const [trending, setTrending] = useState<Trending>(TRENDING_EMPTY);
  const [suggestError, setSuggestError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const reduce = useReducedMotion();
  useFocusTrap(surfaceRef, open);

  const recent = useMemo(() => (open ? readRecent() : []), [open]);
  const typed = q.trim().length >= 2;
  const key = typed ? q.trim().toLowerCase() : "";

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // The empty room is fed by the house: what the country asks for, and what
  // the counter sells — aggregates, cached publicly, nothing personal.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch("/api/search/trending")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        setTrending({
          queries: Array.isArray(d.queries) ? d.queries.filter((x: unknown) => x && typeof (x as { q: string }).q === "string").slice(0, 8) : [],
          products: Array.isArray(d.products) ? d.products.slice(0, 4) : [],
        });
      })
      .catch(() => {
        /* the fallback queries keep the room standing */
      });
    return () => {
      alive = false;
    };
  }, [open]);

  // Suggestions are cached per query, so backspacing is instant and a repeated
  // query never re-hits the network. No state is written synchronously here:
  // the only writes happen once a response arrives.
  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(key)}`, { signal: ctrl.signal });
        if (!r.ok) throw new Error("bad");
        const d = (await r.json()) as Suggestions;
        setCache((c) => ({
          ...c,
          [key]: { items: d.items ?? [], brands: d.brands ?? [], categories: d.categories ?? [], concerns: d.concerns ?? [], ingredients: d.ingredients ?? [] },
        }));
        setSuggestError(false);
      } catch {
        if (!ctrl.signal.aborted) setSuggestError(true);
      }
    }, 170);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [key, retryTick]);

  const res = key ? (cache[key] ?? EMPTY) : EMPTY;
  const loading = !!key && !cache[key];

  const commit = useCallback(
    (query: string) => {
      const v = query.trim();
      if (!v) return;
      writeRecent([v, ...readRecent().filter((r) => r !== v)].slice(0, 5));
      trackClick(v, "all");
      onClose();
      setQ("");
      router.push(`/recherche?q=${encodeURIComponent(v)}`);
    },
    [onClose, router],
  );

  const openProduct = useCallback(
    (slug: string) => {
      writeRecent([q.trim(), ...readRecent().filter((r) => r !== q.trim())].filter(Boolean).slice(0, 5));
      trackClick(q.trim(), "product", slug);
      onClose();
      setQ("");
      router.push(`/produit/${slug}`);
    },
    [onClose, router, q],
  );

  const startVoice = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQ(transcript);
      setIdx(-1);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(res.items.length - 1, i + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(-1, i - 1));
    }
    if (e.key === "Enter") {
      if (idx >= 0 && res.items[idx]) openProduct(res.items[idx].slug);
      else commit(q);
    }
  };

  const total = res.items.length + res.brands.length + res.categories.length + res.concerns.length + res.ingredients.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: leave }}
          transition={{ duration: D.base, ease: EASE }}
          className="fixed inset-0 z-[70] bg-carbon/35 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            ref={surfaceRef}
            role="dialog"
            aria-modal="true"
            aria-label={copy.header.searchPlaceholder}
            initial={reduce ? false : { y: "-3%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-2%", opacity: 0, transition: leave }}
            transition={{ duration: 0.55, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKey}
            className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas"
          >
            {/* Atmosphere */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="dispensary absolute inset-0 opacity-40" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, color-mix(in oklab, var(--color-line-strong) 40%, transparent) 0 1px, transparent 1px 25%)",
                }}
              />
              <div className="grain absolute inset-0" />
            </div>

            {/* The rail */}
            <div className="relative flex items-center justify-between border-b border-line/70 px-4 py-3 lg:px-10">
              <span className="kicker text-faint">
                Recherche <span className="mx-2 text-iodine">—</span> L&apos;archive Cléopâtre
              </span>
              <button
                onClick={onClose}
                aria-label="Fermer la recherche"
                className="group flex h-11 items-center gap-2 px-2 text-muted transition-colors hover:text-carbon"
              >
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] sm:inline">Fermer</span>
                <CloseIcon size={18} />
              </button>
            </div>

            {/* The field */}
            <div className="relative border-b border-line/70">
              <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-7 lg:gap-6 lg:px-10 lg:py-12">
                <SearchIcon size={26} className="shrink-0 text-iodine" strokeWidth={1.25} />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setIdx(-1);
                  }}
                  placeholder={copy.header.searchField}
                  aria-label={copy.header.search}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-transparent font-sans text-[clamp(1.5rem,4vw,3rem)] leading-tight text-carbon placeholder:text-faint/70 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={startVoice}
                  aria-label="Recherche vocale"
                  className="hidden shrink-0 border border-line px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:border-iodine hover:text-carbon sm:inline-flex"
                >
                  {listening ? "Écoute…" : "Voix"}
                </button>
                {loading && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-iodine" />}
              </div>
            </div>

            {/* The answer */}
            <div className="relative flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-10 lg:py-12">
                {!typed ? (
                  <div className="grid gap-12 lg:grid-cols-12">
                    {recent.length > 0 && (
                      <div className="lg:col-span-5">
                        <p className="kicker mb-6 text-faint">Vos recherches récentes</p>
                        <ul>
                          {recent.map((r, i) => (
                            <li key={r}>
                              <button
                                onClick={() => commit(r)}
                                className="group flex w-full items-baseline justify-between gap-4 border-b border-line/60 py-3 text-left"
                              >
                                <span className="flex items-baseline gap-4">
                                  <span className="font-sans text-xs italic text-iodine">
                                    {String(i + 1).padStart(2, "0")}
                                  </span>
                                  <span className="text-[15px] text-steel transition-colors group-hover:text-carbon">
                                    {r}
                                  </span>
                                </span>
                                <ArrowRightIcon
                                  size={13}
                                  className="shrink-0 text-faint transition-transform duration-300 group-hover:translate-x-1"
                                />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className={recent.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
                      <p className="kicker mb-6 text-faint">Ce que l&apos;on nous demande</p>
                      <ul className="flex flex-wrap gap-2.5">
                        {(trending.queries.length ? trending.queries.map((t) => t.q) : FALLBACK_QUERIES).map((p) => (
                          <li key={p}>
                            <button
                              onClick={() => commit(p)}
                              className="group relative inline-flex min-h-11 items-center overflow-hidden border border-line-strong/60 px-5 text-[13px] text-steel transition-colors duration-500 hover:border-iodine hover:text-carbon"
                            >
                              <span
                                aria-hidden
                                className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-iodine-wash transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
                              />
                              {p}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {trending.products.length > 0 && (
                        <div className="mt-12 border-t border-line/60 pt-8">
                          <p className="kicker mb-6 text-faint">Les plus demandés au comptoir</p>
                          <ul className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
                            {trending.products.map((p) => (
                              <li key={p.id}>
                                <button onClick={() => openProduct(p.slug)} className="group flex w-full items-center gap-4 text-left">
                                  <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-canvas-2">
                                    <ProductImage src={p.image} alt="" sizes={MEDIA_SIZES.thumb} className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-muted">{p.brandName}</span>
                                    <span className="mt-1 block line-clamp-2 font-sans text-[16px] leading-tight text-carbon">{p.name}</span>
                                    <span className="mt-1 block text-[13px] tabular-nums text-steel">{formatDT(p.priceMillimes)}</span>
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-12 border-t border-line/60 pt-8">
                        <p className="kicker mb-4 text-faint">Ou entrez par un rayon</p>
                        <ul className="flex flex-wrap gap-x-8 gap-y-2">
                          {[
                            ["/univers/visage", "Visage"],
                            ["/univers/corps", "Corps"],
                            ["/univers/cheveux", "Cheveux"],
                            ["/univers/solaire", "Solaire"],
                            ["/univers/bebe-maman", "Bébé & Maman"],
                            ["/univers/complements", "Compléments"],
                            ["/univers/hygiene", "Hygiène"],
                          ].map(([href, label]) => (
                            <li key={href}>
                              <Link
                                href={href}
                                onClick={onClose}
                                className="link-underline font-sans text-lg text-steel hover:text-carbon"
                              >
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : suggestError && total === 0 ? (
                  <div className="py-10 text-center" role="alert">
                    <p className="font-sans text-display-sm italic text-carbon">La recherche a trébuché</p>
                    <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                      Les suggestions n&apos;ont pas pu se charger — votre connexion, ou un instant de fatigue de la maison.
                    </p>
                    <button
                      onClick={() => {
                        setSuggestError(false);
                        setRetryTick((x) => x + 1);
                      }}
                      className="btn-outline mt-8"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : loading && total === 0 ? (
                  <div className="grid animate-pulse gap-12 lg:grid-cols-12" aria-label="Recherche en cours">
                    <div className="lg:col-span-8">
                      <div className="mb-6 h-2.5 w-28 bg-canvas-2" />
                      <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="h-24 w-20 shrink-0 bg-canvas-2" />
                            <div className="flex-1 space-y-2.5">
                              <div className="h-2 w-1/3 bg-canvas-2" />
                              <div className="h-3 w-4/5 bg-porcelain" />
                              <div className="h-2.5 w-2/5 bg-porcelain" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : total === 0 ? (
                  <div className="py-10 text-center">
                    <p className="font-sans text-display-sm italic text-carbon">
                      Rien dans nos rayons pour «&nbsp;{q}&nbsp;»
                    </p>
                    <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                      Essayez le nom du laboratoire, un besoin (« peau sensible ») ou un actif (« vitamine C »).
                    </p>
                    <button onClick={() => commit(q)} className="btn-outline mt-8">
                      Chercher dans toute la boutique
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
                    <div className="lg:col-span-8">
                      <p className="kicker mb-6 text-faint">
                        {loading && res.items.length === 0 ? "Recherche…" : `${res.items.length} produit${res.items.length > 1 ? "s" : ""}`}
                      </p>
                      <ul className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                        {res.items.map((p, i) => (
                          <li key={p.id}>
                            <button
                              onClick={() => openProduct(p.slug)}
                              onMouseEnter={() => setIdx(i)}
                              className={`group flex w-full items-center gap-4 text-left transition-colors duration-300 ${
                                idx === i ? "opacity-100" : "opacity-90"
                              }`}
                            >
                              <span className="relative h-24 w-20 shrink-0 overflow-hidden bg-canvas-2">
                                <ProductImage
                                  src={p.image}
                                  alt=""
                                  sizes={MEDIA_SIZES.leaf}
                                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-muted">
                                  {p.brandName}
                                </span>
                                <span className="mt-1 block line-clamp-2 font-sans text-[17px] leading-tight text-carbon">
                                  {p.name}
                                </span>
                                <span className="mt-1.5 block text-sm tabular-nums text-steel">
                                  {formatDT(p.priceMillimes)}
                                  {p.compareAtMillimes ? (
                                    <span className="ml-2 text-xs text-faint line-through">
                                      {formatDT(p.compareAtMillimes)}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                              <ArrowRightIcon
                                size={14}
                                className="shrink-0 text-iodine opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                              />
                            </button>
                          </li>
                        ))}
                      </ul>
                      {res.items.length > 0 && (
                        <button onClick={() => commit(q)} className="btn-ghost mt-9">
                          Tous les résultats pour «&nbsp;{q}&nbsp;» <ArrowRightIcon size={13} />
                        </button>
                      )}
                    </div>

                    <div className="lg:col-span-4 lg:border-l lg:border-line/60 lg:pl-10">
                      {res.concerns.length > 0 && (
                        <div className="mb-9">
                          <p className="kicker mb-4 text-faint">Un besoin, peut-être&nbsp;? <span className="text-iodine">· {res.concerns.length}</span></p>
                          <ul>
                            {res.concerns.map((c) => (
                              <li key={c.slug}>
                                <Link
                                  href={`/besoin/${c.slug}`}
                                  onClick={() => {
                                    trackClick(q.trim(), "concern", c.slug);
                                    onClose();
                                  }}
                                  className="link-underline block py-1 font-sans text-lg text-steel hover:text-carbon"
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {res.ingredients.length > 0 && (
                        <div className="mb-9">
                          <p className="kicker mb-4 text-faint">Actifs <span className="text-iodine">· {res.ingredients.length}</span></p>
                          <ul>
                            {res.ingredients.map((ingredient) => (
                              <li key={ingredient.name}>
                                <button
                                  onClick={() => commit(ingredient.name)}
                                  className="link-underline block py-1 text-left font-sans text-lg text-steel hover:text-carbon"
                                >
                                  {ingredient.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {res.brands.length > 0 && (
                        <div className="mb-9">
                          <p className="kicker mb-4 text-faint">Laboratoires <span className="text-iodine">· {res.brands.length}</span></p>
                          <ul>
                            {res.brands.map((b) => (
                              <li key={b.slug}>
                                <Link
                                  href={`/marque/${b.slug}`}
                                  onClick={() => {
                                    trackClick(q.trim(), "brand", b.slug);
                                    onClose();
                                  }}
                                  className="link-underline block py-1 font-sans text-lg text-steel hover:text-carbon"
                                >
                                  {b.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {res.categories.length > 0 && (
                        <div>
                          <p className="kicker mb-4 text-faint">Rayons <span className="text-iodine">· {res.categories.length}</span></p>
                          <ul>
                            {res.categories.map((c) => (
                              <li key={c.slug}>
                                <Link
                                  href={`/categorie/${c.slug}`}
                                  onClick={() => {
                                    trackClick(q.trim(), "category", c.slug);
                                    onClose();
                                  }}
                                  className="link-underline block py-1 text-[15px] text-steel hover:text-carbon"
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard legend — desktop only: no keyboards on phones. */}
            <div className="relative hidden items-center gap-6 border-t border-line/70 px-10 py-3 text-[10px] uppercase tracking-[0.2em] text-faint lg:flex">
              <kbd className="border border-line-strong/60 px-1.5 py-0.5">↑↓</kbd> naviguer
              <kbd className="border border-line-strong/60 px-1.5 py-0.5">↵</kbd> ouvrir
              <kbd className="border border-line-strong/60 px-1.5 py-0.5">esc</kbd> fermer
              <span className="ml-auto text-iodine">Cléopâtre — Espace Santé Beauté</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
