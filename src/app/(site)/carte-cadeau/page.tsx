import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHeader } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { CardIcon, GiftIcon, ShieldIcon } from "@/components/icons";
import { GiftBalanceChecker } from "@/components/gift/gift-balance-checker";

export const metadata: Metadata = {
  title: "La carte cadeau Cléopâtre",
  description: "Offrez la maison : la carte cadeau Cléopâtre, utilisable en ligne au moment de payer. Vérifiez votre solde ici.",
  alternates: { canonical: "/carte-cadeau" },
};

/**
 * THE GIFT — Cléopâtre's gift card, honestly presented.
 *
 * Cards are issued at the counter (Ezzahra, Hammam-Lif) and spent online:
 * the code pays the whole order at checkout, the balance is checked here.
 * No invented denominations, no fake purchase flow — what the house does,
 * plainly said.
 */
export default function CarteCadeauPage() {
  const notes = [
    {
      i: GiftIcon,
      n: "01",
      t: "Offerte au comptoir",
      d: "Les cartes s’achètent en boutique, à Ezzahra ou Hammam-Lif, du montant de votre choix. Le code est remis en main propre.",
    },
    {
      i: CardIcon,
      n: "02",
      t: "Dépensée en ligne",
      d: "Au moment de payer, choisissez « Carte cadeau » et saisissez le code : il règle la totalité de la commande, en un geste.",
    },
    {
      i: ShieldIcon,
      n: "03",
      t: "Solde protégé",
      d: "Le code seul fait foi — gardez-le comme des espèces. Vérifiez le solde ci-dessous, à tout moment.",
    },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone/70 bg-paper pb-12 pt-28 lg:pb-16 lg:pt-36">
        <MotifLayer motif="fluid" light={[22, 14]} />
        <div className="relative container-wide">
          <Breadcrumbs items={[{ label: "Carte cadeau" }]} />
          <div className="mt-6 max-w-3xl">
            <PageHeader
              eyebrow="Offrir la maison"
              title="La carte cadeau Cléopâtre"
              description="Un rituel à choisir soi-même : la carte règle une commande entière, en ligne, au moment de payer."
            />
          </div>
        </div>
      </section>

      <div className="container-wide grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-7">
          <ol className="space-y-0 border-t border-stone/60">
            {notes.map((r, i) => (
              <Reveal key={r.n} y={14} delay={i * 0.06} amount={0.1}>
                <li className="grid gap-4 border-b border-stone/60 py-8 sm:grid-cols-[3rem_1fr] sm:gap-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-champagne-2/40 bg-champagne-soft/60 text-champagne-2">
                    <r.i size={20} strokeWidth={1.3} />
                  </span>
                  <span>
                    <span className="flex items-baseline gap-4">
                      <span className="font-display text-[13px] italic text-champagne-2">{r.n}</span>
                      <span className="font-display text-[clamp(1.3rem,2.6vw,1.7rem)] text-ink">{r.t}</span>
                    </span>
                    <span className="mt-3 block max-w-xl text-[14px] leading-[1.8] text-muted">{r.d}</span>
                  </span>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal y={12} className="mt-10 flex flex-wrap gap-3">
            <Link href="/boutiques" className="btn-secondary">Nos boutiques</Link>
            <Link href="/boutique" className="btn-ghost">Parcourir la boutique</Link>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal y={16} amount={0.05}>
            <GiftBalanceChecker />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
