"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { paletteIn } from "@/lib/admin/motion";
import { NAV, PALETTE_ACTIONS, NAV_ITEMS } from "./nav";
import { Glyph, SearchIcon } from "./icons";
import { useOs } from "./os-context";

/* ══════════════════════════════════════════════════════════════════════════
   PALETTE DE COMMANDES — ⌘K / Ctrl+K
   ──────────────────────────────────────────────────────────────────────────
   One line that reaches everything: the modules, the actions, the records.
   English keyboards, French keyboards and the numeric row all work; ↑↓ walks
   the list, ⏎ opens, ⌥⏎ opens in a drawer-friendly new tab, esc leaves.
   ══════════════════════════════════════════════════════════════════════════ */

type Hit = { kind: string; id: number; label: string; sub: string; href: string; image?: string | null };
type Row =
  | { type: "command"; id: string; label: string; hint: string; href?: string; run?: () => void; icon: string }
  | { type: "hit"; id: string; hit: Hit; icon: string };

const KIND_LABEL: Record<string, string> = {
  product: "Produit", order: "Commande", customer: "Cliente", brand: "Marque",
  category: "Rayon", review: "Avis", rayon: "Rayon",
};
const KIND_ICON: Record<string, string> = {
  product: "cube", order: "bag", customer: "users", brand: "tag", category: "grid", rayon: "grid", review: "star",
};

export function CommandPalette() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { recents, remember, density, setDensity, focus, setFocus } = useOs();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  // Previous-render markers: the resets below apply during render, so the
  // palette never paints a stale query, cursor or result list.
  const [wasOpen, setWasOpen] = useState(open);
  const [prevQuery, setPrevQuery] = useState(query);
  const [prevHitsLen, setPrevHitsLen] = useState(hits.length);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Global shortcut — Ctrl+K, ⌘K, and the Ctrl+K that some French keyboards
     send from the numeric row. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k" && !e.altKey) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") setOpen(false);
      if (k === "/" && !e.metaKey && !e.ctrlKey) {
        const el = document.activeElement;
        const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement)?.isContentEditable;
        if (!typing) { e.preventDefault(); setOpen(true); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setCursor(0);
    }
  }
  if (query !== prevQuery || hits.length !== prevHitsLen) {
    setPrevQuery(query);
    setPrevHitsLen(hits.length);
    if (query.trim().length < 2) {
      setHits([]);
      setLoading(false);
    }
    setCursor(0);
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), reduce ? 0 : 40);
    return () => clearTimeout(t);
  }, [open, reduce]);

  /* Debounced server search — the catalogue never leaves the server. */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ac = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: ac.signal });
        const json = (await res.json()) as { hits?: Hit[] };
        setHits(json.hits ?? []);
      } catch { /* aborted or offline: the palette still navigates */ }
      finally { setLoading(false); }
    }, 220);
    return () => { clearTimeout(t); ac.abort(); };
  }, [query]);

  const q = query.trim().toLowerCase();
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const match = (text: string) => !q || text.toLowerCase().includes(q);
    const fuzzy = (text: string, keys?: string[]) =>
      !q || text.toLowerCase().includes(q) || (keys ?? []).some((k) => k.toLowerCase().includes(q));

    if (!q) {
      for (const r of recents.slice(0, 4)) {
        out.push({ type: "command", id: `recent-${r.href}`, label: r.label, hint: "Récemment ouvert", href: r.href, icon: "clock" });
      }
      for (const a of PALETTE_ACTIONS) out.push({ type: "command", id: `act-${a.href}`, label: a.label, hint: a.hint, href: a.href, icon: "spark" });
      for (const g of NAV) for (const item of g.items) out.push({ type: "command", id: item.href, label: item.label, hint: g.label, href: item.href, icon: item.icon });
      return out;
    }

    for (const a of PALETTE_ACTIONS) if (fuzzy(a.label, a.keywords)) out.push({ type: "command", id: `act-${a.href}`, label: a.label, hint: a.hint, href: a.href, icon: "spark" });
    for (const item of NAV_ITEMS) if (fuzzy(item.label, item.keywords)) out.push({ type: "command", id: item.href, label: item.label, hint: item.hint, href: item.href, icon: item.icon });

    // In-page preferences are commands too — an operator should not have to hunt.
    if (match("densité compacte")) out.push({ type: "command", id: "dens-compact", label: "Densité compacte", hint: "Plus de lignes à l'écran", icon: "density", run: () => setDensity("compact") });
    if (match("densité confortable")) out.push({ type: "command", id: "dens-comfortable", label: "Densité confortable", hint: "Réglage par défaut", icon: "density", run: () => setDensity("comfortable") });
    if (match("densité spacieuse")) out.push({ type: "command", id: "dens-spacious", label: "Densité spacieuse", hint: "Lecture ample", icon: "density", run: () => setDensity("spacious") });
    if (match("mode concentration focus")) out.push({ type: "command", id: "focus", label: focus ? "Quitter le mode concentration" : "Mode concentration", hint: "L'interface disparaît, le travail reste", icon: "focus", run: () => setFocus(!focus) });

    for (const h of hits) out.push({ type: "hit", id: `hit-${h.kind}-${h.id}`, hit: h, icon: KIND_ICON[h.kind] ?? "cube" });
    return out;
  }, [q, hits, recents, focus, setDensity, setFocus]);

  const go = useCallback(
    (row: Row | undefined, newTab = false) => {
      if (!row) return;
      if (row.type === "command") {
        if (row.run) { row.run(); setOpen(false); return; }
        if (row.href) {
          remember(row.href, row.label);
          setOpen(false);
          if (newTab) window.open(row.href, "_blank");
          else router.push(row.href);
        }
        return;
      }
      remember(row.hit.href, row.hit.label);
      setOpen(false);
      if (newTab) window.open(row.hit.href, "_blank");
      else router.push(row.hit.href);
    },
    [remember, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(rows.length - 1, c + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); go(rows[cursor], e.altKey); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const el = listRef.current?.querySelectorAll<HTMLElement>("[data-row]");
      el?.[Math.min(cursor + (e.shiftKey ? -1 : 1), rows.length - 1)]?.scrollIntoView({ block: "nearest" });
    }
  };

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>("[data-active='true']")?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const grouped = useMemo(() => {
    const order = ["Récemment ouvert", "Action", ...NAV.map((g) => g.label)];
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const key = r.type === "hit" ? `Résultats · ${KIND_LABEL[r.hit.kind] ?? "Fiche"}` : r.hint.startsWith("Récemment") ? "Récemment ouvert" : PALETTE_ACTIONS.some((a) => `act-${a.href}` === r.id) ? "Action" : r.hint;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.entries()].sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [rows]);

  const preview = rows[cursor]?.type === "hit" ? rows[cursor].hit : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex h-9 min-w-0 flex-1 items-center gap-2 border border-os-line bg-os-surface-2/80 px-2.5 text-left transition-colors hover:border-os-line-strong hover:bg-os-surface sm:max-w-md"
        aria-label="Rechercher et commander (Ctrl+K)"
      >
        <SearchIcon size={15} className="shrink-0 text-os-muted" />
        <span className="hidden truncate text-[12px] text-os-muted sm:block">Rechercher une commande, une fiche, une action…</span>
        <span className="truncate text-[12px] text-os-muted sm:hidden">Rechercher…</span>
        <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 border border-os-line bg-os-surface px-1.5 py-0.5 text-[10px] font-semibold text-os-muted sm:flex">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[90]">
            <motion.div
              key="scrim"
              initial={reduce ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-os-ink/45 backdrop-blur-[3px]"
            />
            <motion.div
              key="panel"
              variants={reduce ? undefined : paletteIn}
              initial={reduce ? { opacity: 0 } : "initial"}
              animate={reduce ? { opacity: 1 } : "animate"}
              exit={reduce ? { opacity: 0 } : "exit"}
              role="dialog"
              aria-modal="true"
              aria-label="Palette de commandes"
              onKeyDown={onKeyDown}
              className="absolute left-1/2 top-[9vh] w-[min(94vw,44rem)] -translate-x-1/2 border border-os-line-strong bg-os-surface shadow-os-reserve"
            >
              <div className="flex items-center gap-3 border-b border-os-line px-4 py-3">
                <SearchIcon size={17} className="shrink-0 text-os-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Commander, naviguer, chercher…"
                  aria-label="Commande"
                  className="min-w-0 flex-1 bg-transparent font-sans text-[17px] text-os-text placeholder:text-os-faint focus:outline-none"
                />
                {loading && <span className="os-label shrink-0 text-os-faint">recherche…</span>}
                <kbd className="shrink-0 border border-os-line px-1.5 py-0.5 text-[10px] text-os-faint">esc</kbd>
              </div>

              <div className="flex max-h-[58vh] min-h-[8rem]">
                <div ref={listRef} className="os-scroll min-w-0 flex-1 overflow-y-auto py-1.5">
                  {rows.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-[13px] text-os-text">Rien ne correspond à « {query} ».</p>
                      <p className="mt-1 text-[12px] text-os-muted">Essayez un SKU, un numéro de commande (CMD-…), un e-mail ou le nom d&apos;une cliente.</p>
                    </div>
                  )}
                  {grouped.map(([label, items], gi) => {
                    const base = grouped.slice(0, gi).reduce((n, [, g]) => n + g.length, 0);
                    return (
                    <div key={label} className="mb-1">
                      <p className="os-label px-4 py-1.5 text-os-faint">{label}</p>
                      <ul>
                        {items.map((r, ii) => {
                          const idx = base + ii;
                          const active = idx === cursor;
                          return (
                            <li key={r.id}>
                              <button
                                data-row
                                data-active={active}
                                onMouseMove={() => setCursor(idx)}
                                onClick={() => go(r)}
                                className={cn("flex w-full items-center gap-2.5 px-4 py-2 text-left", active ? "bg-os-ink text-os-onink" : "text-os-text hover:bg-os-surface-2")}
                              >
                                <Glyph name={r.icon as never} size={15} className={cn("shrink-0", active ? "text-os-gold" : "text-os-muted")} />
                                <span className="min-w-0 flex-1 truncate text-[13px]">{r.type === "hit" ? r.hit.label : r.label}</span>
                                <span className={cn("hidden max-w-[14rem] shrink-0 truncate text-[11px] sm:block", active ? "text-os-onink-muted" : "text-os-faint")}>
                                  {r.type === "hit" ? r.hit.sub : r.hint}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    );
                  })}
                </div>

                {/* Aperture: what the operator is about to open. */}
                {preview && (
                  <aside className="hidden w-[17rem] shrink-0 border-l border-os-line bg-os-surface-2/50 p-4 lg:block">
                    <p className="os-label text-os-faint">{KIND_LABEL[preview.kind] ?? "Fiche"}</p>
                    {preview.image && <img src={preview.image} alt="" className="mt-3 aspect-square w-full object-cover" />}
                    <p className="mt-3 font-sans text-[17px] leading-tight text-os-text">{preview.label}</p>
                    <p className="mt-1 text-[12px] text-os-muted">{preview.sub}</p>
                    <div className="mt-4 space-y-1 border-t border-os-line pt-3 text-[11px] text-os-muted">
                      <p>⏎ ouvrir la fiche</p>
                      <p>⌥⏎ ouvrir dans un onglet</p>
                    </div>
                  </aside>
                )}
              </div>

              <footer className="flex items-center justify-between gap-3 border-t border-os-line px-4 py-2 text-[11px] text-os-faint">
                <span className="flex items-center gap-3">
                  <span><kbd className="border border-os-line px-1">↑</kbd><kbd className="ml-0.5 border border-os-line px-1">↓</kbd> naviguer</span>
                  <span><kbd className="border border-os-line px-1">⏎</kbd> ouvrir</span>
                </span>
                <span className="hidden sm:block">Ctrl / ⌘ + K pour fermer</span>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
