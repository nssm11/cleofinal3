import type { Metadata } from "next";
import Link from "next/link";
import { Kicker, Rule } from "@/components/kit/surfaces";
import { MotifLayer } from "@/components/shell/motif";
import { Reveal } from "@/components/motion/reveal";
import { ACTIVE_FAMILIES, listActives } from "@/lib/actives";
import { LeafIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Le glossaire des actifs",
  description:
    "Niacinamide, céramides, eau thermale, filtres photostables : ce que chaque actif fait, en une phrase, et les produits du comptoir qui le contiennent.",
  alternates: { canonical: "/actifs" },
};
export const dynamic = "force-dynamic";

/**
 * LE GLOSSAIRE.
 *
 * The catalogue writes its actives the way suppliers do — "Panthénol",
 * "Panthénol B5" and "Panthénol 5 %" for one and the same thing. Left alone,
 * the glossary would read like a shop that does not know its own shelves.
 * They are folded onto a canonical name in src/lib/actives.ts, and each one
 * carries the sentence the counter would say: what it is used for here, not
 * what it claims to cure.
 */
export default async function ActifsPage() {
  const actives = await listActives();
  const top = actives[0]?.n ?? 1;

  return (
    <div className="pb-24">
      <section className="relative isolate overflow-hidden border-b border-line/60 bg-mist/50">
        <MotifLayer motif="clarity" mark={[78, 10]} />
        <div className="shell-wide py-20 lg:py-28">
          <Reveal>
            <Kicker>Le glossaire</Kicker>
            <h1 className="mt-7 max-w-[24ch] font-ant uppercase text-[clamp(2.1rem,5.2vw,4.2rem)] font-light leading-[1.05] text-carbon">
              Ce qu&apos;il y a dedans,{" "}
              <span className="text-iodine-deep">dit une fois.</span>
            </h1>
          </Reveal>
          <Reveal y={14} delay={0.08}>
            <p className="mt-8 max-w-[54ch] text-[15px] leading-[1.85] text-muted">
              {actives.length} actifs reviennent sur nos étagères. Nous les écrivons ici avec leur
              vrai nom — le catalogue dit « Panthénol », « Panthénol B5 » et « Panthénol 5 % » pour la
              même chose — et la phrase que nous prononçons au comptoir, jamais davantage. Ouvrez un
              actif : vous lisez quels produits le portent.
            </p>
          </Reveal>
        </div>
      </section>

      {ACTIVE_FAMILIES.map((family) => {
        const group = actives.filter((a) => a.family === family);
        if (!group.length) return null;
        return (
          <section key={family} className="shell-wide pt-16">
            <Reveal>
              <div className="flex items-baseline gap-5">
                <p className="kicker whitespace-nowrap text-iodine-deep">{family}</p>
                <Rule className="flex-1" />
                <p className="kicker-xs shrink-0 text-faint">{group.length}</p>
              </div>
            </Reveal>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((a, i) => (
                <li key={a.slug}>
                  <Reveal y={12} delay={Math.min(i, 6) * 0.04}>
                    <Link
                      href={`/actifs/${a.slug}`}
                      className="group flex h-full flex-col border border-line/70 bg-canvas p-5 transition-colors duration-300 hover:border-iodine/40"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-ant text-[19px] leading-tight text-carbon group-hover:text-iodine-deep">
                          {a.label}
                        </span>
                        <span className="kicker-xs shrink-0 text-faint">
                          {a.n}
                          <span aria-hidden className="ml-1 text-[9px]">
                            réf.
                          </span>
                        </span>
                      </div>
                      <p className="mt-2.5 text-[13px] leading-[1.7] text-muted">{a.note}</p>
                      {/* The bar is the count — no second number needed. */}
                      <span
                        aria-hidden
                        className="mt-4 block h-[3px] w-full bg-mist"
                      >
                        <span
                          className="block h-full bg-iodine-deep"
                          style={{ width: `${Math.max(6, Math.round((a.n / top) * 100))}%` }}
                        />
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="shell-wide pt-20">
        <Reveal>
          <div className="border border-line/70 bg-canvas p-8 lg:p-12">
            <div className="flex items-start gap-4">
              <LeafIcon size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-iodine-deep" />
              <div>
                <p className="kicker mb-3 text-carbon">Une promesse que nous ne faisons pas</p>
                <p className="max-w-[62ch] text-[13.5px] leading-[1.85] text-muted">
                  Ces phrases décrivent l&apos;usage que nous connaissons de chaque actif, au
                  comptoir, produit par produit. Elles ne soignent rien par elles-mêmes : un actif
                  agit dans une formule, à une concentration, sur une peau. Pour un traitement, pour
                  une grossesse, pour un enfant de moins de trois ans, la réponse se prend devant
                  nous — elle ne se lit pas dans une liste.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
