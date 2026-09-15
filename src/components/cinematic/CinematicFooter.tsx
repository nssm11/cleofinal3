"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MapPinIcon, PhoneIcon } from "@/components/icons";
import { subscribeNewsletterAction } from "@/actions/shop";

/**
 * CinematicFooter — the credits.
 *
 * No giant grid. The film ends the way it began: the name of the house, set
 * wide in the dark, then three quiet indices of hairline links, one line for
 * the journal, the two counters by name, and the legal hairline at the bottom.
 */

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
];

const SERVICE: [string, string][] = [
  ["/livraison", "Livraison & paiement"],
  ["/suivi", "Suivi de commande"],
  ["/aide", "Service client"],
  ["/compte/rituels", "Mes rituels"],
  ["/compte/fidelite", "Fidélité"],
];

export function CinematicFooter({ stores }: { stores: FooterStore[] }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, null);
  const year = new Date().getFullYear();
  const ok = state?.ok === true;

  return (
    <footer className="relative overflow-hidden bg-cine-noir text-cine-ivory">
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-50" />

      {/* ── The name ─────────────────────────────────────────────────── */}
      <div className="relative container-wide pt-20 text-center lg:pt-28">
        <p className="cine-wordmark select-none text-[clamp(1.9rem,5.4vw,4.2rem)]!">CLÉOPÂTRE</p>
        <p className="cine-kicker mt-6">Beauty in Ritual — Ezzahra · Hammam-Lif</p>
      </div>

      {/* ── The indices ──────────────────────────────────────────────── */}
      <div className="relative mt-16 border-t border-cine-line lg:mt-20">
        <div className="container-wide grid gap-10 py-12 sm:grid-cols-3 lg:py-16">
          {(
            [
              ["Boutique", RAYONS],
              ["La maison", MAISON],
              ["Service", SERVICE],
            ] as const
          ).map(([heading, links]) => (
            <nav key={heading} aria-label={heading}>
              <p className="cine-kicker mb-6 text-cine-faint!">{heading}</p>
              <ul className="space-y-3.5">
                {links.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] tracking-[0.04em] text-cine-mist transition-colors duration-300 hover:text-cine-ivory"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* ── The journal ──────────────────────────────────────────────── */}
      <div className="relative border-t border-cine-line">
        <div className="container-wide flex flex-col items-center gap-5 py-10 text-center">
          <p className="max-w-md text-[13px] leading-relaxed text-cine-faint">
            Une lettre, par saison — les conseils du comptoir, rien d&apos;autre.
          </p>
          <form action={action} className="flex w-full max-w-md items-center gap-4" aria-label="Bulletin">
            <label htmlFor="cine-newsletter" className="sr-only">
              Adresse e-mail
            </label>
            <input
              id="cine-newsletter"
              name="email"
              type="email"
              required
              placeholder="Votre adresse e-mail"
              className="min-h-12 w-full border-b border-cine-line bg-transparent text-[14px] text-cine-ivory placeholder:text-cine-faint/60 focus:border-cine-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.28em] text-cine-gold transition-opacity hover:opacity-70 disabled:opacity-40"
            >
              {pending ? "…" : "S’abonner"}
            </button>
          </form>
          <div className="min-h-5 text-[12px]" aria-live="polite">
            {state && (ok ? <p className="text-cine-mist">Merci — la prochaine lettre vous attend.</p> : <p className="text-cine-mist">{state.error}</p>)}
          </div>
        </div>
      </div>

      {/* ── The counters ─────────────────────────────────────────────── */}
      <div className="relative border-t border-cine-line">
        <div className="container-wide grid gap-8 py-10 sm:grid-cols-2">
          {stores.map((s) => (
            <div key={s.id} className="flex items-start gap-4">
              <MapPinIcon size={14} strokeWidth={1.4} className="mt-1 shrink-0 text-cine-gold" aria-hidden />
              <div>
                <p className="font-film text-[17px] text-cine-ivory">{s.name}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-cine-faint">
                  {s.address} — {s.city}
                  <br />
                  {s.hours}
                </p>
                <a
                  href={`tel:+216${s.phone}`}
                  className="mt-2 inline-flex items-center gap-2 text-[12.5px] text-cine-mist transition-colors hover:text-cine-ivory"
                >
                  <PhoneIcon size={12} strokeWidth={1.4} aria-hidden />
                  {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── The hairline ─────────────────────────────────────────────── */}
      <div className="relative border-t border-cine-line">
        <div className="container-wide flex flex-col items-center justify-between gap-4 py-6 text-[11px] tracking-[0.06em] text-cine-faint sm:flex-row">
          <p>© {year} Cléopâtre — Tous droits réservés</p>
          <div className="flex items-center gap-6">
            <Link href="/cgv" className="transition-colors hover:text-cine-ivory">
              CGV
            </Link>
            <Link href="/confidentialite" className="transition-colors hover:text-cine-ivory">
              Confidentialité
            </Link>
            <a
              href="https://www.instagram.com/cleopatre.tn"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cine-ivory"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
