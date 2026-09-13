import Image from "next/image";
import Link from "next/link";
import { ChatIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { Curtain, Reveal } from "@/components/motion/reveal";
import { Magnetic } from "./magnetic";

/**
 * HM · LA MAISON — the closure.
 *
 * The intensity resolves: the pharmacy itself, edge-to-edge, beside the two
 * addresses that ground everything above. The last image on the page is a
 * real room with real people — that is the brand.
 */
export function MaisonClose({
  stores,
  copy,
}: {
  stores: { id: number; name: string; address: string | null; hours: string | null; phone: string }[];
  copy: {
    index: string;
    title1: string;
    title2: string;
    text: string;
    local: string;
    hoursCta: string;
    question: string;
  };
}) {
  return (
    <section aria-label={copy.index} className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="container-wide flex flex-col justify-center py-20 lg:py-28 lg:pr-16">
          <Reveal>
            <p className="hm-kicker text-muted">{copy.index}</p>
            <h2 className="hm-display mt-6 text-[clamp(2.1rem,4.6vw,3.6rem)] text-ink">
              {copy.title1}
              <br />
              <span className="italic text-champagne-2">{copy.title2}</span>
            </h2>
            <p className="mt-6 max-w-lg text-[15px] leading-[1.85] text-muted">{copy.text}</p>
          </Reveal>

          <ul className="mt-10 border-t border-stone/60">
            {stores.map((s, i) => (
              <Reveal as="li" key={s.id} y={10} delay={i * 0.06} className="border-b border-stone/60">
                <div className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div className="min-w-0">
                    <p className="font-display text-[21px] text-ink">{s.name}</p>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {s.address} · {s.hours}
                    </p>
                  </div>
                  <a href={`tel:+216${s.phone}`} className="btn-secondary min-h-11 px-5">
                    <PhoneIcon size={13} /> {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </a>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Magnetic>
              <Link href="/boutiques" className="btn-secondary">
                {copy.hoursCta}
              </Link>
            </Magnetic>
            <Link href="/aide" className="btn-ghost">
              <ChatIcon size={14} /> {copy.question}
            </Link>
          </Reveal>
        </div>

        <Curtain className="relative min-h-[52vh] lg:min-h-full" from="right">
          <div className="absolute inset-0">
            <Image
              src="/images/maison.jpg"
              alt="La maison Cléopâtre, à Ezzahra"
              fill
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-paper/25 lg:via-transparent lg:to-transparent" />
          </div>
          <div className="absolute bottom-6 left-5 hidden items-center gap-2.5 border border-paper/25 bg-ink/45 px-5 py-4 backdrop-blur-xl sm:flex">
            <MapPinIcon size={13} className="text-champagne-3" />
            <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-paper">
              {copy.local} — Ezzahra · Hammam-Lif
            </p>
          </div>
        </Curtain>
      </div>
    </section>
  );
}
