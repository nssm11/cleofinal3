"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Copy } from "./copy/fr";
import { dirFor, isLocale, type Locale } from "./config";

/**
 * The same dictionary the server used, handed to the client boundary once, at
 * the root. Client components never import a locale module themselves — they
 * read it from here, so a page can never mix two tongues.
 */
const LocaleContext = createContext<{ locale: Locale; copy: Copy } | null>(null);

export function LocaleProvider({ locale, copy, children }: { locale: string; copy: Copy; children: ReactNode }) {
  const value = useMemo(() => ({ locale: isLocale(locale) ? locale : "fr", copy }), [locale, copy]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useCopy(): Copy {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useCopy() doit être utilisé sous <LocaleProvider> (installé au root layout).");
  return ctx.copy;
}

export function useLocale(): { locale: Locale; dir: "ltr" | "rtl"; copy: Copy } {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale() doit être utilisé sous <LocaleProvider> (installé au root layout).");
  return { locale: ctx.locale, dir: dirFor(ctx.locale), copy: ctx.copy };
}
