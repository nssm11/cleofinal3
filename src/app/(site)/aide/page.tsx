import type { Metadata } from "next";
import { ContactForm } from "@/components/shell/contact-form";
import { MotifLayer } from "@/components/shell/motif";
import { Reveal } from "@/components/motion/reveal";
import { ChatIcon, ClockIcon, MapPinIcon, PhoneIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Aide & FAQ",
  description: "Questions fréquentes : livraison, paiement, retours, authenticité. Et si besoin, écrivez-nous.",
  alternates: { canonical: "/aide" },
};

const FAQ: [string, string][] = [
  ["Quels sont les délais de livraison ?", "24 à 48 h sur le Grand Tunis, 48 à 72 h ailleurs en Tunisie. Les commandes passées avant 14 h partent le jour même (hors dimanche)."],
  ["Quels moyens de paiement acceptez-vous ?", "Le paiement à la livraison (espèces), le virement bancaire et prochainement la carte bancaire. Les cartes cadeaux Cléopâtre sont acceptées en ligne et en boutique."],
  ["Les produits sont-ils authentiques ?", "Oui. Nous nous approvisionnons exclusivement auprès des laboratoires et distributeurs officiels en Tunisie. Chaque produit porte son numéro de lot et sa date de péremption."],
  ["Puis-je retirer ma commande en boutique ?", "Oui, choisissez « Click & Collect » lors de la commande. Elle sera prête sous 2 h à Ezzahra ou Hammam-Lif, sans frais."],
  ["Comment retourner un produit ?", "Vous disposez de 7 jours après réception pour demander un retour depuis votre compte, pour tout produit non ouvert. Nous vous recontactons sous 48 h."],
  ["Puis-je annuler ma commande ?", "Oui, tant qu'elle n'est pas en préparation, directement depuis « Mes commandes ». Les articles sont remis en stock immédiatement."],
  ["Que faire en cas de réaction cutanée ?", "Arrêtez le produit et contactez-nous : nos pharmaciens évaluent la situation avec vous. Si nécessaire, consultez un médecin — la peau d'abord."],
];

/**
 * THE CONSULTATION ROOM.
 *
 * Questions are read, not scanned, so the FAQ is a numbered editorial list with
 * generous leading — and the contact form is placed first on mobile, because a
 * person who needs help should not have to scroll past seven answers to reach
 * a human.
 */
export default function AidePage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <section className="relative overflow-hidden border-b border-stone/70 bg-paper pb-12 pt-28 lg:pb-16 lg:pt-36">
        <MotifLayer motif="clarity" light={[78, 14]} />
        <div className="relative container-wide">
          <p className="rule-label mb-7">Aide</p>
          <Reveal y={12} amount={0.1}>
            <h1 className="max-w-[24ch] font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.98] tracking-[-0.028em] text-ink">
              Une question&nbsp;?
              <span className="italic text-champagne-2"> Une vraie personne.</span>
            </h1>
          </Reveal>

          <Reveal y={12} delay={0.06}>
            <ul className="mt-12 grid gap-px border-y border-stone/70 sm:grid-cols-3 sm:bg-stone-2/20">
              {[
                { i: PhoneIcon, t: "71 450 210", d: "Lun–Sam 8 h 30 – 20 h 30", href: "tel:+21671450210" },
                { i: ChatIcon, t: "Formulaire", d: "réponse sous 24 h ouvrées", href: "#ecrire" },
                { i: MapPinIcon, t: "En boutique", d: "Ezzahra · Hammam-Lif", href: "/boutiques" },
              ].map((x) => (
                <li key={x.t}>
                  <a
                    href={x.href}
                    className="group flex items-start gap-4 bg-paper px-6 py-6 transition-colors duration-500 hover:bg-cream"
                  >
                    <x.i size={17} className="mt-0.5 shrink-0 text-champagne-2" />
                    <span>
                      <span className="block font-display text-[19px] text-ink">{x.t}</span>
                      <span className="mt-1 block text-[12px] text-muted">{x.d}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <div className="container-wide grid gap-14 py-14 lg:grid-cols-12 lg:gap-16 lg:py-20">
        {/* The form comes first in the DOM: mobile readers reach it immediately. */}
        <section id="ecrire" className="lg:order-2 lg:col-span-5 lg:col-start-8">
          <div className="lg:sticky lg:top-32">
            <p className="rule-label mb-6">Nous écrire</p>
            <ContactForm />
          </div>
        </section>

        <section className="lg:order-1 lg:col-span-7">
          <p className="rule-label mb-6">Questions fréquentes</p>
          <div className="border-t border-stone/70">
            {FAQ.map(([q, a], i) => (
              <details key={q} className="group border-b border-stone/70">
                <summary className="flex cursor-pointer list-none items-baseline gap-5 py-5">
                  <span className="font-display text-[12px] italic tabular-nums text-champagne-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display text-[clamp(1.05rem,1.7vw,1.25rem)] leading-snug text-ink">
                    {q}
                  </span>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 font-display text-[22px] font-light leading-none text-muted-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pl-[2.5rem] text-[14px] leading-[1.9] text-charcoal">{a}</p>
              </details>
            ))}
          </div>

          <p className="mt-10 flex items-start gap-3 text-[12.5px] leading-relaxed text-muted">
            <ClockIcon size={15} className="mt-0.5 shrink-0 text-champagne-2" />
            Les demandes de retour et les réclamations sont traitées par la même équipe, du lundi au samedi. Pour un
            produit endommagé, joignez une photographie&nbsp;: cela accélère beaucoup.
          </p>
        </section>
      </div>
    </div>
  );
}
