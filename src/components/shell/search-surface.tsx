"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { formatDT } from "@/lib/money";
import type { ProductCard } from "@/lib/catalog";
import { useLocale } from "@/lib/i18n/client";
import { EASE_LUXE, D, leave } from "@/lib/motion";
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
};

const EMPTY: Suggestions = { items: [], brands: [], categories: [], concerns: [] };
const POPULAR = ["Anthelios", "Sérum vitamine C", "Eau micellaire", "Anti-chute", "Cicaplast", "Peau sensible"];
const RECENT_KEY = "cleo.recent.v1";

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
  const [cache, setCache] = useState<Record<string, Suggestions>>({});
  const [idx, setIdx] = useState(-1);
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

  // Suggestions are cached per query, so backspacing is instant and a repeated
  // query never re-hits the network. No state is written synchronously here:
  // the only writes happen once a response arrives.
  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(key)}`, { signal: ctrl.signal });
        const d = (await r.json()) as Suggestions;
        setCache((c) => ({
          ...c,
          [key]: { items: d.items ?? [], brands: d.brands ?? [], categories: d.categories ?? [], concerns: d.concerns ?? [] },
        }));
      } catch {
        /* aborted or offline — the previous results stay on screen */
      }
    }, 170);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [key]);

  const res = key ? (cache[key] ?? EMPTY) : EMPTY;
  const loading = !!key && !cache[key];

  const commit = useCallback(
    (query: string) => {
      const v = query.trim();
      if (!v) return;
      writeRecent([v, ...readRecent().filter((r) => r !== v)].slice(0, 5));
      onClose();
      setQ("");
      router.push(`/recherche?q=${encodeURIComponent(v)}`);
    },
    [onClose, router],
  );

  const openProduct = useCallback(
    (slug: string) => {
      writeRecent([q.trim(), ...readRecent().filter((r) => r !== q.trim())].filter(Boolean).slice(0, 5));
      onClose();
      setQ("");
      router.push(`/produit/${slug}`);
    },
    [onClose, router, q],
  );

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

  const total = res.items.length + res.brands.length + res.categories.length + res.concerns.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: leave }}
          transition={{ duration: D.base, ease: EASE_LUXE }}
          className="fixed inset-0 z-[70] bg-ink/35 backdrop-blur-md"
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
            transition={{ duration: 0.55, ease: EASE_LUXE }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKey}
            className="relative flex h-dvh w-full flex-col overflow-hidden bg-paper"
          >
            {/* Atmosphere */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="marble-veil opacity-50" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, rgba(150,135,94,0.09) 0 1px, transparent 1px 25%)",
                }}
              />
              <div className="grain absolute inset-0" />
            </div>

            {/* The rail */}
            <div className="relative flex items-center justify-between border-b border-stone/70 px-4 py-3 lg:px-10">
              <span className="eyebrow text-muted-2">
                Recherche <span className="mx-2 text-champagne">—</span> L&apos;archive Cléopâtre
              </span>
              <button
                onClick={onClose}
                aria-label="Fermer la recherche"
                className="group flex h-11 items-center gap-2 px-2 text-muted transition-colors hover:text-ink"
              >
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] sm:inline">Fermer</span>
                <CloseIcon size={18} />
              </button>
            </div>

            {/* The field */}
            <div className="relative border-b border-stone/70">
              <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-7 lg:gap-6 lg:px-10 lg:py-12">
                <SearchIcon size={26} className="shrink-0 text-champagne-2" strokeWidth={1.25} />
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
                  className="w-full bg-transparent font-display text-[clamp(1.5rem,4vw,3rem)] leading-tight text-ink placeholder:text-muted-2/70 focus:outline-none"
                />
                {loading && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-champagne" />}
              </div>
            </div>

            {/* The answer */}
            <div className="relative flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-10 lg:py-12">
                {!typed ? (
                  <div className="grid gap-12 lg:grid-cols-12">
                    {recent.length > 0 && (
                      <div className="lg:col-span-5">
                        <p className="eyebrow mb-6 text-muted-2">Vos recherches récentes</p>
                        <ul>
                          {recent.map((r, i) => (
                            <li key={r}>
                              <button
                                onClick={() => commit(r)}
                                className="group flex w-full items-baseline justify-between gap-4 border-b border-stone/60 py-3 text-left"
                              >
                                <span className="flex items-baseline gap-4">
                                  <span className="font-display text-xs italic text-champagne-2">
                                    {String(i + 1).padStart(2, "0")}
                                  </span>
                                  <span className="text-[15px] text-charcoal transition-colors group-hover:text-ink">
                                    {r}
                                  </span>
                                </span>
                                <ArrowRightIcon
                                  size={13}
                                  className="shrink-0 text-sand-2 transition-transform duration-300 group-hover:translate-x-1"
                                />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className={recent.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
                      <p className="eyebrow mb-6 text-muted-2">Ce que l&apos;on nous demande</p>
                      <ul className="flex flex-wrap gap-2.5">
                        {POPULAR.map((p) => (
                          <li key={p}>
                            <button
                              onClick={() => commit(p)}
                              className="group relative inline-flex min-h-11 items-center overflow-hidden border border-stone-2/60 px-5 text-[13px] text-charcoal transition-colors duration-500 hover:border-champagne hover:text-ink"
                            >
                              <span
                                aria-hidden
                                className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-champagne-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
                              />
                              {p}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-12 border-t border-stone/60 pt-8">
                        <p className="eyebrow mb-4 text-muted-2">Ou entrez par un rayon</p>
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
                                className="link-underline font-display text-lg text-charcoal hover:text-ink"
                              >
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : total === 0 && !loading ? (
                  <div className="py-10 text-center">
                    <p className="font-display text-display-sm italic text-ink">
                      Rien dans nos rayons pour «&nbsp;{q}&nbsp;»
                    </p>
                    <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                      Essayez le nom du laboratoire, un besoin (« peau sensible ») ou un actif (« vitamine C »).
                    </p>
                    <button onClick={() => commit(q)} className="btn-secondary mt-8">
                      Chercher dans toute la boutique
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
                    <div className="lg:col-span-8">
                      <p className="eyebrow mb-6 text-muted-2">
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
                              <span className="relative h-24 w-20 shrink-0 overflow-hidden bg-marble">
                                {p.image && (
                                  <Image
                                    src={p.image}
                                    alt=""
                                    fill
                                    sizes="80px"
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                                  />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-muted">
                                  {p.brandName}
                                </span>
                                <span className="mt-1 block line-clamp-2 font-display text-[17px] leading-tight text-ink">
                                  {p.name}
                                </span>
                                <span className="mt-1.5 block text-sm tabular-nums text-charcoal">
                                  {formatDT(p.priceMillimes)}
                                  {p.compareAtMillimes ? (
                                    <span className="ml-2 text-xs text-muted-2 line-through">
                                      {formatDT(p.compareAtMillimes)}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                              <ArrowRightIcon
                                size={14}
                                className="shrink-0 text-champagne opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
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

                    <div className="lg:col-span-4 lg:border-l lg:border-stone/60 lg:pl-10">
                      {res.concerns.length > 0 && (
                        <div className="mb-9">
                          <p className="eyebrow mb-4 text-muted-2">Un besoin, peut-être&nbsp;?</p>
                          <ul>
                            {res.concerns.map((c) => (
                              <li key={c.slug}>
                                <Link
                                  href={`/besoin/${c.slug}`}
                                  onClick={onClose}
                                  className="link-underline block py-1 font-display text-lg text-charcoal hover:text-ink"
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {res.brands.length > 0 && (
                        <div className="mb-9">
                          <p className="eyebrow mb-4 text-muted-2">Laboratoires</p>
                          <ul>
                            {res.brands.map((b) => (
                              <li key={b.slug}>
                                <Link
                                  href={`/marque/${b.slug}`}
                                  onClick={onClose}
                                  className="link-underline block py-1 font-display text-lg text-charcoal hover:text-ink"
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
                          <p className="eyebrow mb-4 text-muted-2">Rayons</p>
                          <ul>
                            {res.categories.map((c) => (
                              <li key={c.slug}>
                                <Link
                                  href={`/categorie/${c.slug}`}
                                  onClick={onClose}
                                  className="link-underline block py-1 text-[15px] text-charcoal hover:text-ink"
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
            <div className="relative hidden items-center gap-6 border-t border-stone/70 px-10 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-2 lg:flex">
              <kbd className="border border-stone-2/60 px-1.5 py-0.5">↑↓</kbd> naviguer
              <kbd className="border border-stone-2/60 px-1.5 py-0.5">↵</kbd> ouvrir
              <kbd className="border border-stone-2/60 px-1.5 py-0.5">esc</kbd> fermer
              <span className="ml-auto text-champagne-2">Cléopâtre — Espace Santé Beauté</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
