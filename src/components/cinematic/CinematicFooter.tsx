"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MapPinIcon, PhoneIcon, ArrowUpRightIcon } from "@/components/icons";
import { subscribeNewsletterAction } from "@/actions/shop";
import { useLocale } from "@/lib/i18n/client";

/* ══════════════════════════════════════════════════════════════════════════
   LES CRÉDITS — the end of the page.
   ──────────────────────────────────────────────────────────────────────────
   The house closes on obsidian, the way a film closes on black. A statement
   set in the Didone, four indices of hairline links, the two counters by
   name, the letter — and then the wordmark, huge, sitting on the bottom edge
   of the viewport like a signature on a print.

   It is the one place where the display face is allowed to be enormous
   without a message to carry: the name is the message.
   ══════════════════════════════════════════════════════════════════════════ */

export type FooterStore = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
};

const RAYONS: [string, string][] = [
  ["/univers/visage", "Visage"],
  ["/univers/cheveux", "Cheveux"],
  ["/univers/corps", "Corps"],
  ["/univers/solaire", "Solaire"],
  ["/univers/bebe-maman", "Bébé & Maman"],
  ["/boutique", "Toute la boutique"],
];

const MAISON: [string, string][] = [
  ["/marques", "Les maisons"],
  ["/journal", "Le journal"],
  ["/boutiques", "Nos boutiques"],
  ["/promotions", "Promotions"],
  ["/diagnostic", "Diagnostic peau"],
  ["/carte-cadeau", "Carte cadeau"],
];

const SERVICE: [string, string][] = [
  ["/livraison", "Livraison & paiement"],
  ["/suivi", "Suivi de commande"],
  ["/aide", "Service client"],
  ["/compte/rituels", "Mes rituels"],
  ["/compte/fidelite", "Cercle de fidélité"],
  ["/compte/abonnement", "Mon abonnement"],
];

export function CinematicFooter({ stores }: { stores: FooterStore[] }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, null);
  const { copy } = useLocale();
  const f = copy.footer;
  const year = new Date().getFullYear();
  const ok = state?.ok === true;

  return (
    <footer className="relative overflow-hidden bg-obsidian text-alabaster">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="night-field opacity-60" />
        <div className="absolute inset-0 [background-image:repeating-linear-gradient(to_right,rgba(244,243,240,0.05)_0_1px,transparent_1px_12.5%)]" />
        <div className="grain absolute inset-0 opacity-40" />
      </div>

      {/* ── The statement ────────────────────────────────────────────────── */}
      <div className="relative container-wide grid gap-12 pt-20 lg:grid-cols-12 lg:pt-28">
        <div className="lg:col-span-7">
          <p className="flex items-center gap-3 font-mono text-[0.625rem] uppercase tracking-[0.24em] text-haze-2">
            <span aria-hidden className="h-px w-6 bg-cinabre-3" />
            {f.promiseOfficial}
          </p>
          <h2 className="mt-6 font-display text-[clamp(2.1rem,5.2vw,4.4rem)] leading-[0.95] tracking-[-0.03em] text-alabaster">
            {typeof f.statement === "string" ? f.statement.split("\n").map((line: string, i: number) => (
              <span key={i} className="block">
                {i === 1 ? <em className="italic text-cinabre-3">{line}</em> : line}
              </span>
            )) : f.statement}
          </h2>
        </div>

        <div className="lg:col-span-5 lg:pt-4">
          <p className="max-w-md text-[0.9375rem] leading-[1.72] text-haze">{f.intro}</p>

          {/* The letter — one field, one line, no box. */}
          <form action={action} className="mt-9">
            <label htmlFor="newsletter" className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-haze-2">
              La lettre de la maison
            </label>
            <div className="mt-3 flex items-end gap-4 border-b border-film-line pb-2 focus-within:border-cinabre-3">
              <input
                id="newsletter"
                name="email"
                type="email"
                required
                placeholder="vous@exemple.tn"
                autoComplete="email"
                className="min-h-10 w-full bg-transparent text-[0.9375rem] text-alabaster outline-none placeholder:text-haze-2"
              />
              <button
                type="submit"
                disabled={pending || ok}
                className="shrink-0 pb-1 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-alabaster transition-colors hover:text-cinabre-3 disabled:opacity-50"
              >
                {ok ? "Reçue" : pending ? "…" : "S’inscrire"}
              </button>
            </div>
            <p className="mt-3 text-[0.75rem] text-haze-2" role="status">
              {ok ? "Merci — vous êtes sur la liste." : "Une lettre par mois. Jamais plus."}
            </p>
          </form>
        </div>
      </div>

      {/* ── The indices ──────────────────────────────────────────────────── */}
      <div className="relative container-wide mt-16 grid gap-10 border-t border-film-line py-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:py-16">
        {(
          [
            ["Boutique", RAYONS],
            ["La maison", MAISON],
            ["Service", SERVICE],
          ] as const
        ).map(([heading, links]) => (
          <nav key={heading} aria-label={heading}>
            <p className="mb-6 font-mono text-[0.625rem] uppercase tracking-[0.24em] text-cinabre-3">{heading}</p>
            <ul className="space-y-3">
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-[0.875rem] text-haze transition-colors hover:text-alabaster"
                  >
                    <span className="h-px w-0 bg-cinabre-3 transition-all duration-500 group-hover:w-4" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="mb-6 font-mono text-[0.625rem] uppercase tracking-[0.24em] text-cinabre-3">Venir nous voir</p>
          <ul className="space-y-5">
            {stores.map((s) => (
              <li key={s.id}>
                <p className="font-display text-[1.05rem] text-alabaster">{s.name}</p>
                <p className="mt-1 flex items-start gap-2 text-[0.8125rem] text-haze-2">
                  <MapPinIcon size={13} className="mt-1 shrink-0" />
                  {s.address}, {s.city}
                </p>
                <a
                  href={`tel:+216${s.phone}`}
                  className="mt-1 inline-flex items-center gap-2 font-mono text-[0.75rem] text-haze transition-colors hover:text-alabaster"
                >
                  <PhoneIcon size={13} /> {s.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── The legal rail ───────────────────────────────────────────────── */}
      <div className="relative container-wide flex flex-wrap items-center justify-between gap-5 border-t border-film-line py-6 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-haze-2">
        <p>© {year} Cléopâtre — Espace Santé Beauté</p>
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/cgv" className="transition-colors hover:text-alabaster">
            CGV
          </Link>
          <Link href="/confidentialite" className="transition-colors hover:text-alabaster">
            Confidentialité
          </Link>
          <Link href="/livraison" className="transition-colors hover:text-alabaster">
            Livraison
          </Link>
          <a
            href="https://www.instagram.com/cleopatre.tn"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-alabaster"
          >
            Instagram <ArrowUpRightIcon size={11} />
          </a>
        </div>
      </div>

      {/* ── The signature ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <p
          aria-hidden
          className="select-none px-4 text-center font-display leading-[0.78] tracking-[-0.04em] text-alabaster/[0.07]"
          style={{ fontSize: "clamp(4rem, 19vw, 17rem)" }}
        >
          Cléopâtre
        </p>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cinabre to-transparent opacity-60" />
      </div>
    </footer>
  );
}
