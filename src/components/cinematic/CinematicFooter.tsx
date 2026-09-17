"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MapPinIcon, PhoneIcon, ArrowRightIcon } from "@/components/icons";
import { subscribeNewsletterAction } from "@/actions/shop";

export type FooterStore = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
};

const RAYONS: [string, string][] = [
  ["/univers/visage", "Visage & Soins cutanés"],
  ["/univers/cheveux", "Cheveux & Cuir chevelu"],
  ["/univers/corps", "Corps & Hydratation"],
  ["/univers/solaire", "Haute Protection Solaire"],
  ["/univers/bebe-maman", "Bébé & Maternité"],
  ["/univers/complements", "Compléments alimentaires"],
  ["/univers/hygiene", "Hygiène & Bien-être"],
  ["/boutique", "Toute la Boutique"],
];

const MAISON: [string, string][] = [
  ["/marques", "Les Maisons partenaires"],
  ["/journal", "Le Journal de l'Officine"],
  ["/boutiques", "Nos Boutiques"],
  ["/diagnostic", "Diagnostic de Peau"],
  ["/promotions", "Sélections & Promotions"],
];

const SERVICE: [string, string][] = [
  ["/livraison", "Livraison & Paiement"],
  ["/suivi", "Suivi de Commande"],
  ["/aide", "Service Client & Conseil"],
  ["/compte/rituels", "Mes Rituels"],
  ["/compte/fidelite", "Fidélité Cléopâtre"],
];

export function CinematicFooter({ stores }: { stores: FooterStore[] }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, null);
  const year = new Date().getFullYear();
  const ok = state?.ok === true;

  return (
    <footer
      id="cloture"
      data-header-theme="dark"
      className="relative overflow-hidden bg-cine-noir text-cine-ivory"
      aria-label="Fin du film et crédits de la Maison Cléopâtre"
    >
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-40" />

      {/* ── Closing Frame Statement ───────────────────────────────── */}
      <div className="relative mx-auto max-w-5xl px-6 pt-24 text-center sm:pt-32 lg:pt-36">
        <p className="cine-kicker text-[10px] tracking-[0.38em] text-cine-gold sm:text-[11px]">
          FIN DU FILM · CLÉOPÂTRE DERMO-COSMÉTIQUE
        </p>

        <h2 className="font-film mt-6 text-[clamp(2.1rem,4.4vw,3.8rem)] font-light italic leading-[1.12] tracking-[-0.01em] text-cine-ivory">
          « La beauté est une discipline de pureté. L&apos;officine en est le sanctuaire. »
        </h2>

        <p className="mt-6 text-[13.5px] font-normal tracking-[0.04em] text-cine-mist/80 sm:text-[15px]">
          Deux comptoirs au bord du golfe de Tunis — Ezzahra & Hammam-Lif.
          <br className="hidden sm:inline" />
          Expédition soignée et sécurisée dans toute la Tunisie.
        </p>
      </div>

      {/* ── Physical Boutiques ────────────────────────────────────── */}
      <div className="relative mx-auto mt-20 max-w-7xl border-t border-cine-line/40 px-6 pt-16 sm:px-10 lg:mt-24 lg:px-16">
        <p className="cine-kicker mb-8 text-[10px] tracking-[0.3em] text-cine-faint">
          NOS COMPTOIRS D&apos;OFFICINE
        </p>
        <div className="grid gap-8 sm:grid-cols-2 lg:gap-12">
          {stores.map((s) => (
            <div
              key={s.id}
              className="group border border-cine-line/30 bg-cine-noir/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cine-gold/60 hover:bg-cine-noir/70 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <MapPinIcon
                  size={16}
                  strokeWidth={1.5}
                  className="mt-1 shrink-0 text-cine-gold"
                  aria-hidden
                />
                <div>
                  <h3 className="font-film text-[20px] font-light text-cine-ivory">
                    {s.name}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-cine-mist/90">
                    {s.address} — {s.city}
                    <br />
                    <span className="text-cine-faint">{s.hours}</span>
                  </p>
                  <a
                    href={`tel:+216${s.phone}`}
                    className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-medium text-cine-gold transition-colors hover:text-cine-ivory"
                  >
                    <PhoneIcon size={13} strokeWidth={1.5} aria-hidden />
                    <span>+216 {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Newsletter — La Lettre de Saison ──────────────────────── */}
      <div className="relative mx-auto mt-16 max-w-4xl border-t border-cine-line/40 px-6 pt-16 text-center sm:px-8 lg:mt-20">
        <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-cine-gold">
          BULLETIN PHARMACEUTIQUE
        </span>
        <h3 className="font-film mt-3 text-[24px] font-light text-cine-ivory sm:text-[28px]">
          La Lettre de Saison
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-[13.5px] leading-relaxed text-cine-mist/80">
          Une lettre par saison : conseils de nos pharmaciens, analyses de formules actives et sélections exclusives. Aucun message superflu.
        </p>

        <form action={action} className="mx-auto mt-8 flex max-w-md items-center gap-3" aria-label="Abonnement bulletin">
          <label htmlFor="cine-newsletter" className="sr-only">
            Adresse e-mail
          </label>
          <input
            id="cine-newsletter"
            name="email"
            type="email"
            required
            placeholder="Votre adresse e-mail"
            className="min-h-12 w-full border-b border-cine-line bg-transparent px-2 text-[13.5px] text-cine-ivory placeholder:text-cine-faint/60 focus:border-cine-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="group inline-flex shrink-0 items-center gap-2 border border-cine-gold/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-cine-gold transition-all duration-300 hover:bg-cine-gold hover:text-cine-noir disabled:opacity-40"
          >
            <span>{pending ? "…" : "S'abonner"}</span>
            <ArrowRightIcon
              size={12}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        </form>

        <div className="min-h-6 pt-3 text-[12px]" aria-live="polite">
          {state && (
            ok ? (
              <p className="text-cine-gold">Merci — votre inscription est confirmée.</p>
            ) : (
              <p className="text-cine-mist">{state.error}</p>
            )
          )}
        </div>
      </div>

      {/* ── Indices Navigation ─────────────────────────────────────── */}
      <div className="relative mx-auto mt-16 max-w-7xl border-t border-cine-line/40 px-6 pt-16 sm:px-10 lg:mt-20 lg:px-16">
        <div className="grid gap-12 sm:grid-cols-3">
          {(
            [
              ["Rituels & Rayons", RAYONS],
              ["La Maison", MAISON],
              ["Accompagnement", SERVICE],
            ] as const
          ).map(([heading, links]) => (
            <nav key={heading} aria-label={heading}>
              <p className="cine-kicker mb-6 text-cine-gold!">{heading}</p>
              <ul className="space-y-3">
                {links.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] tracking-[0.03em] text-cine-mist/85 transition-colors duration-200 hover:text-cine-ivory"
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

      {/* ── Monumental Wordmark ───────────────────────────────────── */}
      <div className="relative mx-auto mt-20 max-w-7xl border-t border-cine-line/40 px-6 pt-16 text-center lg:mt-28 lg:pt-20">
        <p className="cine-wordmark select-none text-[clamp(2.5rem,8.5vw,6.5rem)] font-light leading-none tracking-[0.24em] text-cine-ivory/90">
          CLÉOPÂTRE
        </p>
        <p className="cine-kicker mt-5 text-[10px] tracking-[0.34em] text-cine-faint">
          BEAUTY IN RITUAL · EZZAHRA · HAMMAM-LIF
        </p>
      </div>

      {/* ── Legal Hairline ────────────────────────────────────────── */}
      <div className="relative mx-auto mt-16 max-w-7xl border-t border-cine-line/30 px-6 py-8 sm:px-10 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-4 text-[11px] tracking-[0.06em] text-cine-faint sm:flex-row">
          <p>© {year} Cléopâtre — Tous droits réservés.</p>
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
