"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowUpRightIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { subscribeNewsletterAction } from "@/actions/shop";
import { Marquee } from "@/components/kit/motion";
import { HouseSettings } from "@/components/shell/house-settings";
import { CounterClock } from "@/components/kit/counter-clock";
import { HousePlan } from "./house-plan";

/* ══════════════════════════════════════════════════════════════════════════
   LA PAGE DE GARDE — the ending of the house.

   The page closes the way a specification sheet closes: the name set at
   poster scale across the full width, then the indices — the rayons, the
   house, the service — ruled into columns, the two counters stated with their
   hours and their numbers, the letter offered on a ruled field-box, and the legal
   hairline at the very bottom.

   Ground: petrol. Type: chalk. Accent: the signal, only where something can
   actually be done.
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
  ["/marques", "Les laboratoires"],
  ["/journal", "Le journal"],
  ["/actifs", "Glossaire des actifs"],
  ["/boutiques", "Nos comptoirs"],
  ["/promotions", "Promotions"],
  ["/diagnostic", "Diagnostic peau"],
];

const SERVICE: [string, string][] = [
  ["/livraison", "Livraison & paiement"],
  ["/suivi", "Suivi de commande"],
  ["/aide", "Aide & contact"],
  ["/compte/rituels", "Mes rituels"],
  ["/compte/fidelite", "Fidélité"],
];

const LABS = ["Avène", "Bioderma", "La Roche-Posay", "Ducray", "Klorane", "Caudalie", "Eucerin", "Filorga", "Isdin", "Arkopharma"];

/** A numbered index column — the recurring navigation pattern of the footer. */
function Index({ heading, links, start = 1 }: { heading: string; links: [string, string][]; start?: number }) {
  return (
    <nav aria-label={heading}>
      <p className="kicker-xs text-chalk-faint">{heading}</p>
      <ul className="mt-5 space-y-0">
        {links.map(([href, label], i) => (
          <li key={href} className="border-b border-night-line/60">
            <Link
              href={href}
              className="group flex items-baseline gap-3 py-2.5 text-[0.875rem] text-chalk-muted transition-colors hover:text-chalk"
            >
              <span className="data text-[0.625rem] text-chalk-faint transition-colors group-hover:text-iodine">
                {String(start + i).padStart(2, "0")}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type FooterRayon = { label: string; href: string };

export function CinematicFooter({
  stores,
  rayons,
}: {
  stores: FooterStore[];
  /** The seven rayons, so the plan at the foot names what is on the walls. */
  rayons?: FooterRayon[];
}) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, null);
  const year = new Date().getFullYear();
  const ok = state?.ok === true;

  return (
    <footer className="relative overflow-hidden bg-petrol text-chalk">
      <div aria-hidden className="blueprint pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-40" />
      <div aria-hidden className="dispensary pointer-events-none absolute inset-0 opacity-[0.16]" />

      {/* The laboratories, as a running index along the top edge. */}
      <div className="relative border-b border-night-line py-3.5">
        <Marquee
          slow
          items={LABS.map((l) => (
            <span key={l} className="kicker text-chalk-faint">
              {l}
            </span>
          ))}
        />
      </div>

      {/* The name */}
      <div className="relative shell-wide pt-14 lg:pt-20">
        <p className="font-ant select-none text-[clamp(3.2rem,13.5vw,12rem)] uppercase leading-[0.82] tracking-[-0.01em] text-chalk">
          Cléopâtre
        </p>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <p className="kicker flex items-center gap-3 text-chalk-muted">
            <span aria-hidden className="marker bg-iodine" />
            Officine dermo-cosmétique — Ezzahra · Hammam-Lif
          </p>
          <p className="kicker text-chalk-faint">Depuis 1998</p>
        </div>
      </div>

      {/* The indices */}
      <div className="relative mt-12 border-t border-night-line lg:mt-16">
        <div className="shell-wide grid gap-10 py-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="kicker-xs text-chalk-faint">La lettre</p>
            <p className="mt-5 max-w-sm font-ant text-[1.6rem] uppercase leading-[1.06] text-chalk">
              Une lettre par saison, les conseils du comptoir.
            </p>
            <form action={action} className="mt-7 max-w-sm" aria-label="Bulletin">
              <label htmlFor="footer-newsletter" className="kicker-xs text-chalk-faint">
                Adresse e-mail
              </label>
              <div className="mt-3 flex items-center gap-3 border-b border-night-line-strong pb-2 focus-within:border-iodine">
                <input
                  id="footer-newsletter"
                  name="email"
                  type="email"
                  required
                  placeholder="vous@exemple.tn"
                  className="min-h-11 w-full bg-transparent text-[0.9375rem] text-chalk placeholder:text-chalk-faint focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-signal shrink-0 min-h-11"
                  aria-label="S'abonner à la lettre"
                >
                  {pending ? "…" : "S’abonner"}
                </button>
              </div>
              <div className="mt-3 min-h-5 text-[0.75rem]" aria-live="polite">
                {state &&
                  (ok ? (
                    <p className="text-chalk-muted">Merci — la prochaine lettre vous attend.</p>
                  ) : (
                    <p className="text-iodine">{state.error}</p>
                  ))}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 lg:col-start-6">
            <Index heading="Rayons" links={RAYONS} />
          </div>
          <div className="lg:col-span-2">
            <Index heading="La maison" links={MAISON} start={7} />
          </div>
          <div className="lg:col-span-3">
            <Index heading="Service" links={SERVICE} start={12} />

            <div className="mt-8">
              <p className="kicker-xs text-chalk-faint">Le journal</p>
              <Link href="/journal" className="btn-ghost mt-3 text-chalk">
                Lire le journal <ArrowUpRightIcon size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Le plan de la maison — drawn, not photographed. */}
      <div className="relative border-t border-night-line">
        <div className="shell-wide py-10">
          <HousePlan rayons={rayons} className="text-chalk-faint" />
        </div>
      </div>

      {/* The counters */}
      <div className="relative border-t border-night-line">
        <div className="shell-wide grid gap-8 py-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <p className="kicker-xs text-chalk-faint">Nos comptoirs</p>
          </div>
          {stores.map((s) => (
            <div key={s.id} className="lg:col-span-4">
              <div className="flex items-start gap-4">
                <span aria-hidden className="mt-1.5">
                  <MapPinIcon size={14} className="text-iodine" />
                </span>
                <div>
                  <p className="font-ant text-[1.15rem] uppercase leading-none text-chalk">{s.name}</p>
                  <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-chalk-faint">
                    {s.address} — {s.city}
                    <br />
                    {s.hours}
                  </p>
                  {/* Le jour du comptoir — the verdict is computed on the
                      visitor's own watch, so a cached page cannot claim the
                      shop is open at nine at night. */}
                  <div className="mt-3">
                    <CounterClock hours={s.hours} tone="night" />
                  </div>
                  <a
                    href={`tel:+216${s.phone}`}
                    className="data mt-3 inline-flex items-center gap-2 text-[0.8125rem] text-chalk-muted transition-colors hover:text-iodine"
                  >
                    <PhoneIcon size={12} aria-hidden />
                    {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Les réglages de la maison — the visitor keeps the switches. */}
      <div className="relative border-t border-night-line">
        <div className="shell-wide py-10">
          <HouseSettings className="max-w-md" />
        </div>
      </div>

      {/* The hairline */}
      <div className="relative border-t border-night-line">
        <div className="shell-wide flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="kicker-xs text-chalk-faint">© {year} Cléopâtre — Tous droits réservés</p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
            {[
              ["/cgv", "CGV"],
              ["/confidentialite", "Confidentialité"],
              ["/livraison", "Livraison"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="kicker-xs text-chalk-faint transition-colors hover:text-chalk">
                {label}
              </Link>
            ))}
            <a
              href="https://www.instagram.com/cleopatre.tn"
              target="_blank"
              rel="noopener noreferrer"
              className="kicker-xs text-chalk-faint transition-colors hover:text-chalk"
            >
              Instagram
            </a>
          </div>
          <p className="kicker-xs text-chalk-faint">Ezzahra, Tunisie</p>
        </div>
      </div>
    </footer>
  );
}
