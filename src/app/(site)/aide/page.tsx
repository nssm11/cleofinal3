import type { Metadata } from "next";
import { ContactForm } from "@/components/shell/contact-form";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = { title: "Aide & FAQ", description: "Livraison, paiement, retours, authenticité.", alternates: { canonical: "/aide" } };

const FAQ: [string, string][] = [
  ["Délais de livraison ?", "24-48h Grand Tunis, 48-72h ailleurs. Commandes avant 14h partent le jour même."],
  ["Moyens de paiement ?", "Paiement à la livraison, virement, carte cadeau."],
  ["Produits authentiques ?", "Oui — sourcing officiel laboratoires Tunisie."],
  ["Click & Collect ?", "Oui, retrait 2h Ezzahra/Hammam-Lif."],
  ["Retours ?", "7 jours produit non ouvert depuis votre compte."],
  ["Annulation ?", "Possible tant que non préparée."],
];

export default async function AidePage({ searchParams }: { searchParams: Promise<{ type?: string; subject?: string; message?: string }> }) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const initial = { type: sp.type, subject: sp.subject?.slice(0, 160), message: sp.message?.slice(0, 1200) };

  return (
    <div>
      <section className="border-b border-line">
        <div className="shell-wide">
          <div className="border-x border-line px-8 py-12 lg:px-12 lg:py-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Aide — 00</p>
            <h1 className="mt-4 font-sans text-[clamp(2rem,5vw,4rem)] font-bold tracking-[-0.04em] leading-[0.9]">Une question ?<br /><span className="text-text-secondary">Une vraie personne.</span></h1>
            <div className="mt-10 grid gap-px bg-line border border-line sm:grid-cols-3">
              {[
                { t: "71 450 210", d: "Lun–Sam 8h30–20h30", href: "tel:+21671450210" },
                { t: user ? "Conciergerie" : "Formulaire", d: user ? "Conversation directe" : "Réponse 24h", href: user ? "/compte/support" : "#ecrire" },
                { t: "En boutique", d: "Ezzahra · Hammam-Lif", href: "/boutiques" },
              ].map((x) => (
                <a key={x.t} href={x.href} className="bg-bg p-6 hover:bg-bg-2"><p className="font-sans text-[16px] font-semibold">{x.t}</p><p className="mt-1 font-mono text-[11px] text-text-muted">{x.d}</p></a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="shell-wide grid gap-8 py-12 lg:grid-cols-12">
        <section id="ecrire" className="lg:col-span-5 lg:col-start-8">
          <div className="border border-line bg-bg p-6 sticky top-[80px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-6">Nous écrire</p>
            <ContactForm initial={initial} />
          </div>
        </section>
        <section className="lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">FAQ — {String(FAQ.length).padStart(2, "0")}</p>
          <div className="mt-6 border-t border-line">
            {FAQ.map(([q, a], i) => (
              <details key={q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5"><span className="font-mono text-[11px] text-text-muted">{String(i + 1).padStart(2, "0")}</span><span className="flex-1 font-sans text-[16px] font-medium">{q}</span><span className="font-mono group-open:rotate-45 transition-transform">+</span></summary>
                <p className="pb-6 pl-8 font-sans text-[14px] leading-[1.7] text-text-secondary max-w-[60ch]">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
