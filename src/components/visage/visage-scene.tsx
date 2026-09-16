import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { CinematicVideo } from "@/components/cinematic/VideoLoader";
import { SectionOverlay } from "@/components/cinematic/SectionOverlay";
import { MaskLine, Reveal } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * VisageScene — the opening frame of the counter, re-cut for a workspace.
 *
 * The film of the homepage is kept — real footage, scrims, grain, ivory on
 * noir, the title rising out of its own baseline — but it no longer eats a
 * whole screen: the band is compact, its statement is anchored to the near
 * edge, and the first shelf row is already breathing at the bottom of the
 * first viewport. On the right, the counter's own ledger: what is actually in
 * this room, as figures. This is the landing page read as an interface, not
 * as a poster.
 */

export type SceneStats = {
  total: number;
  brands: number;
  concerns: number;
  tolerances: { key: string; n: number; label: string }[];
  priceMin: number;
  priceMax: number;
};

export function VisageScene({
  name,
  crumb,
  index,
  total,
  kicker,
  story,
  video,
  poster,
  register,
  stats,
  shelfHref,
  adviceHref,
}: {
  name: string;
  /** label of the parent crumb — “Univers” in the house tongue. */
  crumb: string;
  index: number;
  total: number;
  kicker: string;
  story: string;
  video: string;
  poster: string;
  /** The universe's own register from the atmosphere sheet — italic or roman. */
  register: "italic" | "roman";
  stats: SceneStats;
  shelfHref: string;
  adviceHref: string;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  /* Money here is scale, not a price — one decimal, fr-TN, never a trailing
     comma for whole dinars. */
  const dt = (millimes: number) => {
    const x = millimes / 1000;
    return Number.isInteger(x) ? String(x) : x.toLocaleString("fr-TN", { maximumFractionDigits: 1 });
  };

  return (
    <section aria-label={`Univers ${name}`} className="grain relative isolate overflow-hidden bg-cine-noir text-cine-ivory">
      {/* The film — behind the whole band; the left gradient lets the type
          sit in the dark without a box. */}
      <CinematicVideo
        eager
        sources={{ desktop: `/videos/${video}.mp4`, mobile: `/videos/${video}-mobile.mp4` }}
        poster={`/videos/posters/${poster}.jpg`}
        alt={`Cléopâtre — l’univers ${name}, filmé en pleine lumière`}
      />
      <SectionOverlay deep />
      <div
        aria-hidden
        className="absolute inset-0 -z-0 bg-linear-to-r from-cine-noir via-cine-noir/62 to-transparent lg:via-cine-noir/70"
      />

      <div className="relative z-10 container-wide">
        {/* Top edge: the thread of the house, then the chapter mark. */}
        <div className="flex items-center justify-between gap-6 pt-16 pb-2 lg:pt-22">
          <Breadcrumbs light items={[{ label: crumb }, { label: name }]} />
          <span className="cine-index hidden shrink-0 sm:block">
            {pad(index + 1)} / {pad(total)}
          </span>
        </div>

        <div className="grid items-end gap-8 pb-7 pt-8 min-[420px]:pt-9 lg:grid-cols-12 lg:gap-16 lg:pb-12 lg:pt-14">
          {/* The statement — anchored to the near edge, not centered. */}
          <div className="lg:col-span-7 xl:col-span-6">
            <Reveal y={14}>
              <p className="cine-kicker mb-6 flex items-center gap-4">
                <span aria-hidden className="h-px w-10 bg-cine-gold/70" />
                {kicker} — l’univers de la maison
              </p>
            </Reveal>

            <div className="overflow-hidden pb-[0.1em]">
              <MaskLine
                className={cn(
                  "font-film text-[clamp(3rem,11.5vw,6.2rem)] leading-[0.94] tracking-[-0.02em] select-none",
                  register === "italic" && "italic font-light",
                )}
              >
                {name}
              </MaskLine>
            </div>

            <Reveal y={16} delay={0.1}>
              <p className="mt-4 max-w-[46ch] text-[13px] leading-[1.8] text-cine-mist lg:mt-5 lg:text-[13.5px] lg:leading-[1.85]">
                {story}
              </p>
            </Reveal>

            {/* On the phone, the ledger is one line, not a plate. */}
            <Reveal y={12} delay={0.12}>
              <div className="scrollbar-none -mx-6 mt-6 flex items-center gap-5 overflow-x-auto border-y border-cine-line/70 px-6 py-2 whitespace-nowrap text-[11px] text-cine-mist lg:hidden">
                <span><span className="font-display text-[16px] italic text-cine-ivory">{stats.total}</span> soins</span>
                <span aria-hidden className="h-3 w-px bg-cine-line" />
                <span><span className="font-display text-[16px] italic text-cine-ivory">{stats.brands}</span> maisons</span>
                <span aria-hidden className="h-3 w-px bg-cine-line" />
                <span><span className="font-display text-[16px] italic text-cine-ivory">{stats.concerns}</span> besoins</span>
                <span aria-hidden className="h-3 w-px bg-cine-line" />
                <span>{dt(stats.priceMin)}–{dt(stats.priceMax)} DT</span>
              </div>
            </Reveal>

            {/* The two doors out of the scene. One is loud on purpose. */}
            <Reveal y={14} delay={0.16}>
              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 lg:mt-7">
                <Link href={shelfHref} className="btn-light min-h-11! px-6 text-[0.64rem] lg:min-h-12! lg:px-7 lg:text-[0.66rem]">
                  <SearchIcon size={13} />
                  Ouvrir le rayon — {stats.total} soins
                </Link>
                <Link href={adviceHref} className="cine-cta min-h-11! lg:min-h-12!">
                  Diagnostic de peau
                  <ArrowRightIcon size={13} strokeWidth={1.6} className="rtl-mirror" aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* The ledger of the room — figures, not decoration. Desktop only:
              the phone already got its one line above. */}
          <Reveal y={18} delay={0.22} className="hidden lg:col-span-5 lg:block xl:col-span-5 xl:col-start-8">
            <div className="border border-cine-line bg-cine-noir-2/55 backdrop-blur-md">
              <p className="flex items-center justify-between gap-4 border-b border-cine-line px-5 py-3">
                <span className="cine-kicker text-cine-faint">En un coup d’œil</span>
                <span className="cine-index">{pad(index + 1)}<span className="text-cine-gold/60">·</span>{pad(total)}</span>
              </p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-4 lg:grid-cols-2 lg:xl:grid-cols-4">
                {[
                  { v: String(stats.total), l: "soins retenus" },
                  { v: String(stats.brands), l: "laboratoires" },
                  { v: String(stats.concerns), l: "besoins traités" },
                  { v: `${dt(stats.priceMin)} – ${dt(stats.priceMax)}`, l: "dinars, la fourchette" },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-cine-faint">{s.l}</dt>
                    <dd className="mt-1 font-film text-[22px] leading-none text-cine-ivory tabular-nums">{s.v}</dd>
                  </div>
                ))}
              </dl>
              {stats.tolerances.length > 0 && (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-cine-line px-5 py-3 text-[11px] text-cine-mist">
                  <span className="font-bold uppercase tracking-[0.16em] text-cine-faint">Tolérances vérifiées&nbsp;:</span>
                  {stats.tolerances.map((t) => (
                    <span key={t.key} className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                      {t.label} <span className="font-film text-[13px] text-cine-ivory tabular-nums">{t.n}</span>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {/* The footrail — where the film ends, the work begins. */}
      <div className="relative z-10 border-t border-cine-line">
        <div className="container-wide flex items-center justify-between gap-6 py-2.5">
          <p className="cine-index truncate">CLÉOPÂTRE · BEAUTY IN RITUAL</p>
          <p className="hidden shrink-0 text-[9.5px] font-bold uppercase tracking-[0.22em] text-cine-faint sm:block">
            Le comptoir continue dessous ↓
          </p>
        </div>
      </div>
    </section>
  );
}
