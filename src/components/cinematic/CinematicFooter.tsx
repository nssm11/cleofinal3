"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletterAction } from "@/actions/shop";

export type FooterStore = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
};

const NAV = {
  boutique: [
    ["/boutique", "Toute la boutique"],
    ["/marques", "Laboratoires"],
    ["/promotions", "Promotions"],
    ["/journal", "Journal"],
    ["/diagnostic", "Diagnostic"],
  ] as [string, string][],
  univers: [
    ["/univers/visage", "Visage"],
    ["/univers/cheveux", "Cheveux"],
    ["/univers/corps", "Corps"],
    ["/univers/solaire", "Solaire"],
    ["/univers/bebe-maman", "Bébé & Maman"],
  ] as [string, string][],
  service: [
    ["/livraison", "Livraison"],
    ["/suivi", "Suivi commande"],
    ["/aide", "Aide"],
    ["/cgv", "CGV"],
    ["/confidentialite", "Confidentialité"],
  ] as [string, string][],
};

export function CinematicFooter({ stores }: { stores: FooterStore[] }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, null);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bg text-ink">
      {/* Wordmark */}
      <div className="border-b border-line">
        <div className="shell-wide py-12 lg:py-16">
          <h2 className="font-sans text-[clamp(2.5rem,9vw,8rem)] font-bold leading-[0.85] tracking-[-0.04em]">CLÉOPÂTRE</h2>
          <div className="mt-6 flex flex-wrap gap-8 font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary">
            <span>Officine dermo-cosmétique</span>
            <span>Ezzahra · Hammam-Lif</span>
            <span>Depuis 1998</span>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="shell-wide grid gap-12 py-12 lg:grid-cols-12 lg:gap-8 lg:py-16">
        {/* Newsletter */}
        <div className="lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Newsletter — 01</p>
          <p className="mt-6 max-w-[32ch] font-sans text-[20px] font-medium leading-[1.2] tracking-[-0.02em]">
            Une lettre par saison. Les conseils du comptoir, sans bruit.
          </p>
          <form action={action} className="mt-8 max-w-sm">
            <div className="flex border-b border-ink">
              <input
                name="email"
                type="email"
                required
                placeholder="votre@email.tn"
                className="h-[44px] flex-1 bg-transparent font-sans text-[15px] text-ink placeholder:text-text-muted focus:outline-none"
              />
              <button type="submit" disabled={pending} className="btn-primary h-[44px] border-l border-ink">
                {pending ? "…" : "S'abonner"}
              </button>
            </div>
            <div className="mt-3 min-h-[20px] font-mono text-[11px]" aria-live="polite">
              {state && (state.ok ? <span className="text-text-secondary">Merci — à bientôt.</span> : <span className="text-error">{state.error}</span>)}
            </div>
          </form>
        </div>

        <div className="lg:col-span-7 lg:col-start-6 grid grid-cols-2 gap-8 lg:grid-cols-3">
          <nav aria-label="Boutique">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Boutique — 02</p>
            <ul className="mt-6 space-y-3">
              {NAV.boutique.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="font-sans text-[14px] leading-[1.4] text-text-secondary transition-colors hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Univers">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Univers — 03</p>
            <ul className="mt-6 space-y-3">
              {NAV.univers.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="font-sans text-[14px] leading-[1.4] text-text-secondary transition-colors hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Service" className="col-span-2 lg:col-span-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Service — 04</p>
            <ul className="mt-6 space-y-3">
              {NAV.service.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="font-sans text-[14px] leading-[1.4] text-text-secondary transition-colors hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Stores */}
      <div className="border-t border-line">
        <div className="shell-wide grid gap-8 py-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Comptoirs — 05</p>
          </div>
          <div className="lg:col-span-9 grid gap-8 sm:grid-cols-2">
            {stores.map((s) => (
              <div key={s.id} className="border border-line p-6">
                <p className="font-sans text-[15px] font-semibold tracking-[-0.01em]">{s.name}</p>
                <p className="mt-3 font-sans text-[13px] leading-[1.6] text-text-secondary">
                  {s.address}
                  <br />
                  {s.city}
                </p>
                <p className="mt-3 font-mono text-[11px] leading-[1.5] text-text-muted">{s.hours}</p>
                <a href={`tel:+216${s.phone}`} className="mt-4 inline-block font-mono text-[11px] tracking-[0.06em] text-ink underline underline-offset-4">
                  +216 {s.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-line">
        <div className="shell-wide flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">© {year} CLÉOPÂTRE — Tous droits réservés — TN</p>
          <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            <span>Ezzahra, Tunisie</span>
            <span className="h-px w-8 bg-line" aria-hidden />
            <span>Système de soin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
