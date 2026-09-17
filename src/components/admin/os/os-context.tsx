"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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
  const [density, setDensityState] = useState<Density>(initialDensity);
  const [focus, setFocusState] = useState(false);
  const [recents, setRecents] = useState<{ href: string; label: string }[]>([]);
  const [drawer, setDrawer] = useState<{ content: ReactNode; title?: string; width: "narrow" | "wide" } | null>(null);

  useEffect(() => {
    try {
      const d = localStorage.getItem("cleo.os.density") as Density | null;
      if (d) setDensityState(d);
    } catch {}
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    try { localStorage.setItem("cleo.os.density", d); } catch {}
  }, []);

  const setFocus = useCallback((f: boolean) => setFocusState(f), []);
  const remember = useCallback((href: string, label: string) => {
    setRecents((prev) => [{ href, label }, ...prev.filter((r) => r.href !== href)].slice(0, 12));
  }, []);

  const value = useMemo(() => ({
    density, setDensity, focus, setFocus, recents, remember,
    openDrawer: (content: ReactNode, opts?: { title?: string; width?: "narrow" | "wide" }) => setDrawer({ content, title: opts?.title, width: opts?.width ?? "narrow" }),
    closeDrawer: () => setDrawer(null),
  }), [density, setDensity, focus, setFocus, recents, remember]);

  return (
    <OsContext.Provider value={value}>
      {children}
      {drawer && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/25" onClick={() => setDrawer(null)} />
          <aside className="fixed inset-y-0 right-0 z-[71] w-full max-w-xl overflow-y-auto border-l border-line bg-bg">
            <header className="sticky top-0 flex items-center justify-between border-b border-line bg-bg px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{drawer.title ?? "Détail"}</p>
              <button onClick={() => setDrawer(null)} className="font-mono text-[11px]">✕</button>
            </header>
            <div className="p-4">{drawer.content}</div>
          </aside>
        </>
      )}
    </OsContext.Provider>
  );
}
