"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowRightIcon, CashIcon, MapPinIcon, PhoneIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { subscribeNewsletterAction } from "@/actions/shop";
import { Wordmark } from "./announcement-strip";
import type { Store } from "@/db/schema";

/**
 * LE COLOPHON — the back page of the house.
 *
 * Instead of four columns of links, the footer opens with the promise of the
 * maison set in the display face, then lets the seven rayons occupy the width
 * the way a magazine index does: large type, a rule, a number. Practical
 * information (boutiques, promises, legal) sits underneath, quietly.
 */
export function Footer({ universes, stores }: { universes: { slug: string; name: string }[]; stores: Store[] }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, null);

  return (
    <footer className="relative overflow-hidden bg-noir text-paper">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="marble-veil opacity-25" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "repeating-linear-gradient(to right, rgba(203,176,120,0.06) 0 1px, transparent 1px 25%)",
          }}
        />
        <div className="grain absolute inset-0" />
      </div>

      {/* ── The statement ──────────────────────────────────────────────── */}
      <div className="relative border-b border-paper/10">
        <div className="container-wide grid gap-10 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="lg:col-span-7">
            <p className="rule-label mb-8 !text-paper/50" style={{ color: "rgba(246,241,230,0.5)" }}>
              La maison
            </p>
            <p className="font-display text-[clamp(2.1rem,5vw,4rem)] italic leading-[1.02] tracking-[-0.02em] text-paper">
              La santé de la peau
              <br />
              mérite une maison.
            </p>
          </div>
          <div className="lg:col-span-5 lg:pt-3">
            <p className="max-w-md text-[15px] leading-[1.8] text-paper/60">
              Depuis Ezzahra et Hammam-Lif, nos pharmaciennes et pharmaciens sélectionnent chaque référence —
              authentique, tolérante, utile — et la préparent pour vous, en boutique ou livrée partout en Tunisie.
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-[11px] text-paper/45">
              <li className="flex items-center gap-2">
                <ShieldIcon size={14} className="text-champagne-3" /> Distribution officielle
              </li>
              <li className="flex items-center gap-2">
                <TruckIcon size={14} className="text-champagne-3" /> Livraison 24–72 h
              </li>
              <li className="flex items-center gap-2">
                <CashIcon size={14} className="text-champagne-3" /> Paiement à la livraison
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── The index ──────────────────────────────────────────────────── */}
      <div className="relative container-wide py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8 text-paper/40">Les rayons</p>
            <ul>
              {universes.map((u, i) => (
                <li key={u.slug} className="border-b border-paper/10">
                  <Link href={`/univers/${u.slug}`} className="group flex items-baseline gap-6 py-3.5">
                    <span className="w-6 shrink-0 font-display text-[11px] italic text-champagne-3/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-display text-[clamp(1.4rem,2.4vw,2rem)] leading-none text-paper/85 transition-colors duration-500 group-hover:text-champagne-3">
                      {u.name}
                    </span>
                    <ArrowRightIcon
                      size={16}
                      className="shrink-0 translate-x-0 text-paper/25 transition-all duration-500 group-hover:translate-x-2 group-hover:text-champagne-3"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 lg:col-span-5 lg:col-start-9">
            <div>
              <p className="eyebrow mb-6 text-paper/40">La maison</p>
              <ul className="space-y-3 text-[13.5px]">
                {[
                  ["/promotions", "Offres du moment"],
                  ["/marques", "Les laboratoires"],
                  ["/journal", "Le Journal"],
                  ["/boutiques", "Nos boutiques"],
                  ["/aide", "Aide & FAQ"],
                  ["/suivi", "Suivre ma commande"],
                  ["/livraison", "Livraison & retours"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="link-underline text-paper/70 transition-colors hover:text-champagne-3">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow mb-6 text-paper/40">Venir nous voir</p>
              <ul className="space-y-7 text-[13.5px]">
                {stores.map((s) => (
                  <li key={s.id}>
                    <p className="font-display text-[19px] leading-tight text-paper/90">{s.name}</p>
                    <p className="mt-2 flex gap-2 text-paper/55">
                      <MapPinIcon size={13} className="mt-0.5 shrink-0 text-champagne-3" />
                      <span>
                        {s.address}
                        <br />
                        {s.city}
                      </span>
                    </p>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-paper/40">{s.hours}</p>
                    <a
                      href={`tel:+216${s.phone}`}
                      className="mt-3 inline-flex min-h-9 items-center gap-2 text-paper/75 transition-colors hover:text-champagne-3"
                    >
                      <PhoneIcon size={13} className="text-champagne-3" />
                      {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── The Journal ────────────────────────────────────────────────── */}
      <div className="relative border-y border-paper/10 bg-noir-2/60">
        <div className="container-wide grid items-center gap-8 py-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="font-display text-[clamp(1.3rem,2.2vw,1.8rem)] italic leading-tight text-paper">
              Le Journal, une fois par mois.
            </p>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-paper/50">
              Des conseils courts, écrits par nos pharmaciens. Pas de publicité, pas de promesse excessive.
            </p>
          </div>
          <form action={action} className="lg:col-span-7" aria-label="Inscription au Journal">
            <div className="flex items-center gap-4 border-b border-paper/25 transition-colors focus-within:border-champagne-3">
              <label htmlFor="footer-email" className="sr-only">
                Votre adresse e-mail
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                required
                placeholder="votre adresse e-mail"
                className="min-h-14 w-full bg-transparent text-[15px] text-paper placeholder:text-paper/30 focus:outline-none"
              />
              <button
                disabled={pending}
                className="flex min-h-11 shrink-0 items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-champagne-3 transition-opacity hover:opacity-70 disabled:opacity-40"
              >
                {pending ? "…" : "S'inscrire"} <ArrowRightIcon size={13} />
              </button>
            </div>
            <div className="mt-2 min-h-5">
              {state && (
                <p
                  className={`text-[12px] ${state.ok ? "text-success-soft" : "text-error-soft"}`}
                  role="status"
                  aria-live="polite"
                >
                  {state.ok ? state.message : state.error}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── The leather line ───────────────────────────────────────────── */}
      <div className="relative container-wide flex flex-col gap-5 py-7 text-[11.5px] text-paper/40 lg:flex-row lg:items-center lg:justify-between">
        <Wordmark size="sm" light />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/cgv" className="transition-colors hover:text-champagne-3">
            Conditions générales
          </Link>
          <Link href="/confidentialite" className="transition-colors hover:text-champagne-3">
            Confidentialité
          </Link>
          <span>© {new Date().getFullYear()} Cléopâtre — Espace Santé Beauté</span>
        </div>
      </div>
    </footer>
  );
}
