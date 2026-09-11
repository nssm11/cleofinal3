import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { PackageIcon, RefreshIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { formatDTShort, EXPRESS_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/money";

export const metadata: Metadata = {
  title: "Livraison & retours",
  description:
    "Livraison standard et express partout en Tunisie, retrait en boutique sous 2 heures, retours sous 7 jours.",
  alternates: { canonical: "/livraison" },
};

export default function LivraisonPage() {
  const rows = [
    {
      i: TruckIcon,
      n: "01",
      t: "Livraison standard",
      p: `${formatDTShort(STANDARD_SHIPPING_FEE)}`,
      d: `Offerte dès ${formatDTShort(FREE_SHIPPING_THRESHOLD)}. 24–48 h sur le Grand Tunis, 48–72 h dans les autres gouvernorats.`,
    },
    {
      i: PackageIcon,
      n: "02",
      t: "Livraison express",
      p: `${formatDTShort(EXPRESS_SHIPPING_FEE)}`,
      d: "Sous 24 h sur le Grand Tunis pour toute commande passée avant 14 h, du lundi au samedi.",
    },
    {
      i: StoreIcon,
      n: "03",
      t: "Retrait en boutique",
      p: "Gratuit",
      d: "Prête sous 2 h à Ezzahra ou Hammam-Lif. Nous vous prévenons par téléphone dès qu'elle vous attend.",
    },
    {
      i: RefreshIcon,
      n: "04",
      t: "Retours",
      p: "7 jours",
      d: "Pour tout produit non ouvert, depuis votre compte. Remboursement ou avoir sous 5 jours après réception.",
    },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone/70 bg-paper pb-12 pt-28 lg:pb-16 lg:pt-36">
        <MotifLayer motif="fluid" light={[22, 14]} />
        <div className="relative container-wide">
          <Breadcrumbs items={[{ label: "Livraison & retours" }]} />
          <div className="mt-8">
            <PageHeader
              eyebrow="Livraison & retours"
              title="Simple, rapide, partout en Tunisie"
              description="Nos deux boutiques préparent et expédient elles-mêmes vos commandes. Aucun entrepôt intermédiaire, aucune rupture silencieuse : si un produit manque, nous vous appelons."
            />
          </div>
        </div>
      </section>

      <section className="container-wide py-rhythm lg:py-rhythm-lg">
        <ul className="grid gap-px bg-stone-2/20 border border-stone-2/40 sm:grid-cols-2">
          {rows.map((r, i) => (
            <Reveal key={r.t} as="li" y={12} delay={i * 0.05} className="bg-paper p-8 lg:p-10">
              <div className="flex items-baseline justify-between gap-6">
                <span className="font-display text-[clamp(1.5rem,2.4vw,2rem)] italic leading-none text-champagne-2">
                  {r.n}
                </span>
                <r.i size={20} className="text-champagne-2/70" />
              </div>
              <h2 className="mt-6 font-display text-[clamp(1.2rem,2vw,1.5rem)] text-ink">{r.t}</h2>
              <p className="mt-2 font-display text-[15px] text-champagne-2">{r.p}</p>
              <p className="mt-4 max-w-md text-[13.5px] leading-[1.85] text-muted">{r.d}</p>
            </Reveal>
          ))}
        </ul>

        <p className="mt-12 max-w-2xl text-[13.5px] leading-[1.9] text-muted">
          Les délais sont donnés en jours ouvrés et courent à partir de la confirmation téléphonique de votre commande.
          Pour les zones rurales de l&apos;intérieur, comptez une journée supplémentaire : nous préférons vous le dire
          plutôt que de vous faire attendre.
        </p>
      </section>
    </div>
  );
}
