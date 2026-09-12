"use client";
import { useEffect } from "react";
import { isLocale } from "@/lib/i18n/config";

/**
 * E-mail links and share links may carry `?lang=tn`. One read at mount (from
 * the raw URL — no useSearchParams, so this stays legal inside the root
 * layout), the cookie is written, the layout revalidates. After that the
 * query is forgotten: the language belongs to the visitor, not to the link.
 */
export function LangSync({ current }: { current: string }) {
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("lang");
    if (wanted && isLocale(wanted) && wanted !== current) {
      void import("@/lib/i18n/actions").then(({ setLocaleAction }) => setLocaleAction(wanted));
    }
    // Only a mismatching deep-link triggers a write — never a loop.
  }, [current]);

  return null;
}
