"use client";
import { startTransition, useOptimistic } from "react";
import { setLocaleAction } from "@/actions/auth";
import { LOCALES, LOCALE_DIR, t, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * LE CURSEUR DE LANGUE — « Français | تونسي / Tounsi ».
 *
 * Deliberately quiet: it sits in the action rail like any other control and
 * never competes with the wordmark. Choosing a language writes a cookie and
 * revalidates the layout, so the shell re-renders in place. `useOptimistic`
 * flips the label the instant it is pressed — the cookie round-trip is a
 * detail the visitor should not have to wait for.
 *
 * The button keeps `dir` and `lang` of the language it names, so an Arabic
 * script label renders correctly even while the rest of the page is French.
 */
export function LocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  const [pending, setPending] = useOptimistic<Locale | null>(null);
  const active = pending ?? locale;

  function choose(next: Locale) {
    if (next === locale) return;
    const form = new FormData();
    form.set("locale", next);
    setPending(next);
    startTransition(() => setLocaleAction(form));
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)} role="group" aria-label={t(active, "locale.language")}>
      {LOCALES.map((code) => {
        const on = code === active;
        const label = code === "tn" ? "تونسي / Tounsi" : t(code, "locale.label");
        return (
          <button
            key={code}
            type="button"
            onClick={() => choose(code)}
            lang={code === "tn" ? "aeb" : "fr"}
            dir={LOCALE_DIR[code]}
            aria-pressed={on}
            aria-label={code === locale ? undefined : t(active, "locale.switchTo")}
            title={t(code, "locale.label")}
            className={cn(
              "h-11 px-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-300",
              on ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {code === "tn" ? (
              <span className="tracking-normal normal-case">{label}</span>
            ) : (
              t(code, "locale.short")
            )}
          </button>
        );
      })}
      <span aria-hidden className="mx-1 h-3 w-px bg-stone-2/40" />
    </div>
  );
}
