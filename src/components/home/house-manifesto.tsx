import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";

/**
 * A quiet declaration between the campaign and the catalogue.
 *
 * This is intentionally not a marketing-feature grid: it states the three
 * practical promises that distinguish a real officine from a generic shelf.
 * The typography and generous spacing give the page a breath before the
 * catalogue gets dense again.
 */
const PROMISES = [
  {
    index: "I",
    title: "Le choix juste",
    body: "Chaque référence entre au comptoir parce qu’elle a sa place dans une routine, pas parce qu’elle fait du bruit.",
  },
  {
    index: "II",
    title: "Le conseil vivant",
    body: "En ligne comme en boutique, une question trouve une réponse auprès de notre équipe de pharmaciens.",
  },
  {
    index: "III",
    title: "Le soin du détail",
    body: "Un stock suivi, une préparation attentive et une livraison partout en Tunisie, avec la même exigence.",
  },
] as const;

export function HouseManifesto() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-porcelain">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,var(--color-iodine-wash),transparent_27rem)] opacity-70" />
      <div className="shell-wide relative grid gap-12 py-block lg:grid-cols-12 lg:items-end lg:gap-8 lg:py-block-lg">
        <div className="lg:col-span-5">
          <p className="kicker flex items-center gap-3 text-iodine-deep">
            <span aria-hidden className="h-px w-9 bg-iodine" />
            La promesse de la maison
          </p>
          <h2 className="mt-5 max-w-[11ch] font-editorial text-[clamp(3rem,5.6vw,5.6rem)] font-normal leading-[0.82] tracking-[-0.055em] text-carbon">
            Plus qu&apos;une sélection,
            <br />
            <em className="text-iodine-deep">une attention.</em>
          </h2>
          <p className="mt-7 max-w-[42ch] text-lead text-steel">
            Parce qu&apos;un soin n&apos;est jamais seulement un produit : c&apos;est un geste, un besoin et une personne à écouter.
          </p>
          <Link href="/conseil-pharmacien" className="btn-ghost mt-8 group text-carbon">
            Parler à un pharmacien
            <ArrowUpRightIcon size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <ol className="border-t border-line lg:col-span-6 lg:col-start-7">
          {PROMISES.map((promise) => (
            <li key={promise.index} className="group grid grid-cols-[2.5rem_1fr] gap-4 border-b border-line py-6 sm:grid-cols-[4rem_1fr] sm:gap-6">
              <span className="font-editorial text-[1.55rem] italic leading-none text-iodine-deep">{promise.index}</span>
              <div>
                <h3 className="font-editorial text-[1.7rem] font-normal leading-none tracking-[-0.025em] text-carbon transition-colors duration-300 group-hover:text-iodine-deep">
                  {promise.title}
                </h3>
                <p className="mt-2 max-w-[48ch] text-meta leading-relaxed text-muted">{promise.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
