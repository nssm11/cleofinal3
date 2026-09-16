import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/primitives";
import { Reveal, MaskLine } from "@/components/motion/reveal";
import { CinematicVideo } from "@/components/cinematic/VideoLoader";
import { ArrowRightIcon } from "@/components/icons";
import type { UniverseCinema } from "@/lib/universe-cinema";
import type { UniverseAtmosphere } from "@/lib/atmospheres";
import type { getCopy } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

type Copy = Awaited<ReturnType<typeof getCopy>>;

export type VisageUniverse = {
  slug: string;
  name: string;
  description: string | null;
  story: string | null;
};

/**
 * VISAGE MASTHEAD — the consultation counter, not the cinema screen.
 *
 * The old page opened fullscreen video with the title laid over the frame.
 * This is the structural inverse: a split desk. The brief sits left — kicker,
 * title, story, figures, decisions — and the film plays right, framed like a
 * plate in an album, captioned with the chapter's statement.
 */
export function VisageMasthead({
  u,
  cinema,
  atm,
  copy,
  index,
  total,
  productCount,
  rayonCount,
}: {
  u: VisageUniverse;
  cinema: UniverseCinema;
  atm: UniverseAtmosphere;
  copy: Copy;
  index: number;
  total: number;
  productCount: number;
  rayonCount: number;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const story = u.story ?? u.description ?? atm.promise;

  return (
    <header className="border-b border-stone/60 bg-paper">
      <div className="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8 lg:px-10 lg:pt-10">
        <Breadcrumbs items={[{ label: copy.univers.breadcrumb }, { label: u.name }]} />

        <div className="grid items-end gap-10 pb-12 pt-8 lg:grid-cols-12 lg:gap-12 lg:pb-16 lg:pt-10">
          {/* The brief */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="flex flex-wrap items-center gap-3">
                <span className="badge border-ink/20 bg-ink/[0.045] !text-[10px] !tracking-[0.24em] text-ink">
                  {copy.univers.label} · {cinema.kicker}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-2">
                  {pad(index)} / {pad(total)}
                </span>
              </p>
            </Reveal>

            <MaskLine delay={0.06} className="mt-6">
              <h1
                className={cn(
                  "font-display text-[13.5vw] leading-[0.98] tracking-[-0.01em] text-ink sm:text-6xl lg:text-[4.6rem]",
                  atm.register === "italic" && "italic",
                )}
              >
                {u.name}
              </h1>
            </MaskLine>

            <Reveal delay={0.14}>
              <p className="mt-6 max-w-xl text-[15px] leading-[1.85] text-charcoal">{story}</p>
            </Reveal>

            <Reveal delay={0.2}>
              <dl className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 border-y border-stone/60 py-5">
                <div className="flex items-baseline gap-2.5">
                  <dt className="order-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-muted">références</dt>
                  <dd className="order-1 font-display text-[26px] italic leading-none text-ink">{productCount}</dd>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <dt className="order-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-muted">rayons</dt>
                  <dd className="order-1 font-display text-[26px] italic leading-none text-ink">{rayonCount}</dd>
                </div>
                <div className="ms-auto flex flex-wrap items-center gap-3">
                  <Link href="#explorer" className="btn-primary">
                    Explorer le rayon <ArrowRightIcon size={13} className="rtl-mirror" />
                  </Link>
                  <Link href="/diagnostic" className="btn-ghost">
                    {copy.univers.askAdvice}
                  </Link>
                </div>
              </dl>
            </Reveal>
          </div>

          {/* The framed plate */}
          <Reveal delay={0.1} className="lg:col-span-5">
            <figure className="relative">
              <div
                aria-hidden
                className="absolute -inset-3 -z-0 bg-[radial-gradient(60%_55%_at_50%_0%,color-mix(in_oklab,var(--color-champagne)_26%,transparent),transparent)]"
              />
              <div className="relative overflow-hidden border border-ink/10 bg-ink shadow-[0_30px_60px_-30px_rgba(28,25,23,0.45)]">
                <CinematicVideo
                  sources={{ desktop: `/videos/${cinema.video}.mp4`, mobile: `/videos/${cinema.video}-mobile.mp4` }}
                  poster={`/videos/posters/${cinema.poster}.jpg`}
                  alt=""
                  eager
                  className="aspect-[4/5] w-full sm:aspect-[16/12] lg:aspect-[4/5]"
                />
                <figcaption className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 bg-paper/92 px-4 py-3 backdrop-blur-sm">
                  <span className="font-display text-[15px] italic leading-snug text-ink">{cinema.title}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-2">
                    {cinema.kicker}
                  </span>
                </figcaption>
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </header>
  );
}
