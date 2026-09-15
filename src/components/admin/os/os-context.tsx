"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { drawerRight, fade } from "@/lib/admin/motion";
import { CloseIcon, ExpandIcon } from "./icons";

/* ══════════════════════════════════════════════════════════════════════════
   CONTEXTE DE L'INSTRUMENT
   ──────────────────────────────────────────────────────────────────────────
   Three working preferences and one spatial idea:
     · density — how much the operator wants on screen;
     · focus  — the page undressed, chrome away, work left;
     · drawers — the page stays visible underneath, always. A drawer is a
       change of *what you can touch*, not a change of place.
   ══════════════════════════════════════════════════════════════════════════ */

export type Density = "compact" | "comfortable" | "spacious";

type OsContextValue = {
  density: Density;
  setDensity: (d: Density) => void;
  focus: boolean;
  setFocus: (f: boolean) => void;
  recents: { href: string; label: string }[];
  remember: (href: string, label: string) => void;
  openDrawer: (content: ReactNode, opts?: { title?: string; width?: "narrow" | "wide" }) => void;
  closeDrawer: () => void;
};

const OsContext = createContext<OsContextValue | null>(null);

export function useOs() {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOs must be used inside <OsProvider>");
  return ctx;
}

export function OsProvider({ children, initialDensity = "comfortable" }: { children: ReactNode; initialDensity?: Density }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [density, setDensityState] = useState<Density>(initialDensity);
  const [focus, setFocusState] = useState(false);
  const [recents, setRecents] = useState<{ href: string; label: string }[]>([]);
  const [drawer, setDrawer] = useState<{ content: ReactNode; title?: string; width: "narrow" | "wide" } | null>(null);

  useEffect(() => {
    try {
      const d = localStorage.getItem("cleo.os.density") as Density | null;
      if (d) setDensityState(d);
      const r = localStorage.getItem("cleo.os.recents");
      if (r) setRecents(JSON.parse(r) as { href: string; label: string }[]);
    } catch { /* preferences are a convenience */ }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.os = density;
  }, [density]);

  useEffect(() => {
    document.documentElement.dataset.focus = focus ? "true" : "false";
  }, [focus]);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    try { localStorage.setItem("cleo.os.density", d); } catch { /* ignore */ }
  }, []);

  const setFocus = useCallback((f: boolean) => setFocusState(f), []);

  const remember = useCallback((href: string, label: string) => {
    setRecents((prev) => {
      const next = [{ href, label }, ...prev.filter((r) => r.href !== href)].slice(0, 12);
      try { localStorage.setItem("cleo.os.recents", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const value = useMemo<OsContextValue>(
    () => ({
      density, setDensity, focus, setFocus, recents, remember,
      openDrawer: (content, opts) => setDrawer({ content, title: opts?.title, width: opts?.width ?? "narrow" }),
      closeDrawer: () => setDrawer(null),
    }),
    [density, setDensity, focus, setFocus, recents, remember],
  );

  // Esc closes the drawer before anything else in the page reacts.
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setDrawer(null); } };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [drawer]);

  return (
    <OsContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              key="drawer-scrim"
              variants={reduce ? undefined : fade}
              initial={reduce ? { opacity: 0 } : "hidden"}
              animate={reduce ? { opacity: 1 } : "show"}
              exit={reduce ? { opacity: 0 } : "exit"}
              onClick={() => setDrawer(null)}
              className="fixed inset-0 z-[70] bg-os-ink/25 backdrop-blur-[1.5px]"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label={drawer.title ?? "Panneau contextuel"}
              variants={reduce ? undefined : drawerRight}
              initial={reduce ? { opacity: 0 } : "initial"}
              animate={reduce ? { opacity: 1 } : "animate"}
              exit={reduce ? { opacity: 0 } : "exit"}
              className={cn(
                "os-scroll fixed inset-y-0 right-0 z-[71] overflow-y-auto border-l border-os-line-strong bg-os-surface shadow-os-reserve",
                drawer.width === "wide" ? "w-full max-w-3xl" : "w-full max-w-xl",
              )}
            >
              <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-os-line bg-os-surface/95 px-4 py-3 backdrop-blur">
                <p className="os-label text-os-muted">{drawer.title ?? "Détail"}</p>
                <button onClick={() => setDrawer(null)} aria-label="Fermer le panneau" className="p-1 text-os-muted transition-colors hover:text-os-text">
                  <CloseIcon size={16} />
                </button>
              </header>
              <div className="px-4 py-4">{drawer.content}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <FocusToggle active={focus} onChange={setFocus} />
      <span data-os-route-hidden className="hidden" aria-hidden>{router ? "" : ""}</span>
    </OsContext.Provider>
  );
}

function FocusToggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {active && (
        <motion.button
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => onChange(false)}
          className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 border border-os-ink bg-os-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-os-onink shadow-os-reserve"
        >
          <ExpandIcon size={13} className="mr-2 inline align-[-2px]" />
          Quitter le mode concentration
        </motion.button>
      )}
    </AnimatePresence>
  );
}
