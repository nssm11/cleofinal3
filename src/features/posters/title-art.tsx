import type { ReactNode } from "react";
import type { Film, Series, Tint } from "@/data/types";
import { seededRandom } from "@/lib/format";
import { TINT_PALETTE, type TintPalette } from "./palette";

/**
 * Title art — the archive draws its own plates.
 *
 * These are honest posters: they never pretend to be a film's original
 * billed artwork (which we could neither license nor should fake), but every
 * plate carries the title, the year, the archive index and a motif drawn
 * from the film's own era and mood. Each composition is deterministic: the
 * slug is the seed, so a title's plate never flickers between renders.
 */

export type ArtVariant = "poster" | "wide" | "micro";

interface Plate {
  slug: string;
  index: number;
  titleAr: string;
  titleLat: string;
  yearLabel: string;
  metaAr: string;
  tint: Tint;
  motif: Film["motif"];
}

export function plateForTitle(title: Film | Series, index: number): Plate {
  return title.kind === "film" ? plateFromFilm(title, index) : plateFromSeries(title, index);
}

export function plateFromFilm(film: Film, index: number): Plate {
  return {
    slug: film.slug,
    index,
    titleAr: film.titleAr,
    titleLat: film.titleLat,
    yearLabel: String(film.year),
    metaAr: `${film.runtimeMin} د · ${film.license === "pd" ? "ملكية عامة" : "CC BY"}`,
    tint: film.tint,
    motif: film.motif,
  };
}

export function plateFromSeries(series: Series, index: number): Plate {
  const episodes = series.seasons.reduce((n, s) => n + s.episodes.length, 0);
  return {
    slug: series.slug,
    index,
    titleAr: series.titleAr,
    titleLat: series.titleLat,
    yearLabel: String(series.yearFrom),
    metaAr: `${episodes} حلقات · ${series.license === "pd" ? "ملكية عامة" : "CC BY"}`,
    tint: series.tint,
    motif: series.motif,
  };
}

/* — motif drawing in a local 320×340 field — */

interface MotifCtx {
  pal: TintPalette;
  rnd: (slot: number) => number;
}

function motifEclipse({ pal, rnd }: MotifCtx) {
  const cx = 120 + rnd(1) * 80;
  const cy = 120 + rnd(2) * 60;
  const r = 66 + rnd(3) * 30;
  return (
    <g>
      <circle cx={250} cy={250} r={r + 26} fill="none" stroke={pal.accent} strokeOpacity={0.5} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r} fill={pal.fg} opacity={0.94} />
      <circle cx={cx - r * 0.42} cy={cy - r * 0.3} r={r * 0.86} fill={pal.deep} opacity={0.92} />
      <line x1={0} y1={252} x2={320} y2={252} stroke={pal.fg} strokeOpacity={0.35} strokeWidth={1} />
      <circle cx={40 + rnd(4) * 240} cy={298} r={4} fill={pal.accent} />
    </g>
  );
}

function motifShatter({ pal, rnd }: MotifCtx) {
  const ox = 140 + rnd(1) * 60;
  const oy = 120 + rnd(2) * 40;
  const cracks = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + rnd(10 + i) * 0.8;
    const len = 90 + rnd(20 + i) * 120;
    const mx = ox + Math.cos(a) * len * 0.55 + (rnd(30 + i) - 0.5) * 46;
    const my = oy + Math.sin(a) * len * 0.55 + (rnd(40 + i) - 0.5) * 46;
    const ex = ox + Math.cos(a) * len;
    const ey = oy + Math.sin(a) * len;
    return `M ${ox} ${oy} L ${mx} ${my} L ${ex} ${ey}`;
  });
  return (
    <g stroke={pal.fg} fill="none">
      <circle cx={ox} cy={oy} r={5} fill={pal.accent} stroke="none" />
      {cracks.map((d, i) => (
        <path key={i} d={d} strokeOpacity={0.55 + (i % 3) * 0.15} strokeWidth={i % 2 ? 1 : 1.6} />
      ))}
      <path d={`M 20 ${262} L ${84 + rnd(5) * 40} ${230} L ${180 + rnd(6) * 60} ${272} L 300 ${240 + rnd(7) * 20}`} strokeOpacity={0.4} strokeWidth={1.2} />
    </g>
  );
}

function motifBlinds({ pal, rnd }: MotifCtx) {
  const tilt = -11 + rnd(1) * 6;
  const gap = 30 + rnd(2) * 10;
  const count = 8;
  return (
    <g>
      <circle cx={90 + rnd(3) * 150} cy={96 + rnd(4) * 30} r={44 + rnd(5) * 16} fill={pal.fg} opacity={0.85} />
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={-60}
          y={40 + i * gap}
          width={440}
          height={gap * 0.38}
          fill={pal.deep}
          stroke={pal.fg}
          strokeOpacity={0.16}
          strokeWidth={0.8}
          transform={`rotate(${tilt} 160 170)`}
        />
      ))}
      <circle cx={120 + rnd(6) * 160} cy={282} r={3.5} fill={pal.accent} />
    </g>
  );
}

function motifArcs({ pal, rnd }: MotifCtx) {
  const radii = [52, 84, 116, 148, 180];
  return (
    <g fill="none" stroke={pal.fg}>
      {radii.map((r, i) => (
        <path
          key={r}
          d={`M ${160 - r} ${300} A ${r} ${r} 0 0 1 ${160 + r} ${300}`}
          strokeOpacity={0.75 - i * 0.11}
          strokeWidth={i === 2 ? 2.2 : 1.2}
        />
      ))}
      <line x1={0} y1={300} x2={320} y2={300} strokeOpacity={0.5} strokeWidth={1.4} />
      <rect x={152 + rnd(1) * 12} y={288} width={8} height={12} fill={pal.fg} stroke="none" opacity={0.9} />
      <circle cx={160 + rnd(2) * 14 - 7} cy={118 + rnd(3) * 16} r={9} fill={pal.accent} stroke="none" />
    </g>
  );
}

function motifPeaks({ pal, rnd }: MotifCtx) {
  const base = 268;
  const sun = 96 + rnd(1) * 34;
  return (
    <g>
      <circle cx={236} cy={sun} r={sun * 0.34} fill={pal.fg} opacity={0.9} />
      <circle cx={236} cy={sun} r={sun * 0.34 + 10} fill="none" stroke={pal.accent} strokeOpacity={0.45} strokeWidth={1.2} />
      <polygon points={`-20,${base} 90,${120 + rnd(2) * 30} 200,${base}`} fill={pal.deep} stroke={pal.fg} strokeOpacity={0.7} strokeWidth={1.3} />
      <polygon points={`110,${base} 210,${90 + rnd(3) * 26} 320,${base}`} fill="none" stroke={pal.fg} strokeOpacity={0.5} strokeWidth={1.3} />
      <line x1={0} y1={base} x2={320} y2={base} stroke={pal.fg} strokeOpacity={0.55} strokeWidth={1.2} />
      <circle cx={40} cy={base + 26} r={3} fill={pal.accent} />
    </g>
  );
}

function motifOrbit({ pal, rnd }: MotifCtx) {
  const tilt = -24 + rnd(1) * 48;
  return (
    <g>
      <circle cx={160} cy={170} r={40 + rnd(2) * 14} fill={pal.fg} opacity={0.92} />
      <circle cx={146} cy={160} r={9} fill={pal.deep} opacity={0.5} />
      {[1, 2].map((i) => (
        <ellipse
          key={i}
          cx={160}
          cy={170}
          rx={92 + i * 34}
          ry={(92 + i * 34) * (0.28 + rnd(3 + i) * 0.1)}
          fill="none"
          stroke={pal.fg}
          strokeOpacity={0.55}
          strokeWidth={1.2}
          strokeDasharray={i === 1 ? undefined : "6 7"}
          transform={`rotate(${tilt + i * 24} 160 170)`}
        />
      ))}
      <circle cx={160 + 104} cy={170 - 30} r={4.5} fill={pal.accent} />
    </g>
  );
}

function motifGrid({ pal, rnd }: MotifCtx) {
  const fx = 80 + rnd(1) * 160;
  const fy = 80 + rnd(2) * 140;
  const dots: ReactNode[] = [];
  for (let gx = 0; gx < 10; gx++) {
    for (let gy = 0; gy < 9; gy++) {
      const x = 26 + gx * 30;
      const y = 26 + gy * 30;
      const d = Math.hypot(x - fx, y - fy);
      const r = Math.max(1, 7.5 - d / 60);
      dots.push(<circle key={`${gx}-${gy}`} cx={x} cy={y} r={r} fill={pal.fg} opacity={0.32 + (7.5 - Math.min(7.5, d / 60) - 0) * 0.08} />);
    }
  }
  return (
    <g>
      {dots}
      <rect x={fx - 14} y={fy - 14} width={28} height={28} fill="none" stroke={pal.accent} strokeWidth={1.6} />
      <rect x={fx - 8 + (rnd(3) - 0.5) * 10} y={fy - 8 + (rnd(4) - 0.5) * 10} width={28} height={28} fill="none" stroke={pal.fg} strokeOpacity={0.5} strokeWidth={1} />
    </g>
  );
}

function motifStrip({ pal, rnd }: MotifCtx) {
  const x = 96 + rnd(1) * 90;
  const perf = Array.from({ length: 8 }, (_, i) => (
    <g key={i}>
      <rect x={x - 46} y={16 + i * 40} width={12} height={18} rx={2} fill={pal.fg} opacity={0.5} />
      <rect x={x + 34} y={16 + i * 40} width={12} height={18} rx={2} fill={pal.fg} opacity={0.5} />
    </g>
  ));
  const frames = [0, 1, 2].map((i) => (
    <g key={i}>
      <rect x={x - 26} y={22 + i * 104} width={52} height={66} fill={pal.deep} stroke={pal.fg} strokeOpacity={0.6} strokeWidth={1} />
      {i % 3 === 0 && <circle cx={x} cy={55 + i * 104} r={12} fill="none" stroke={pal.accent} strokeWidth={1.6} />}
      {i % 3 === 1 && <polygon points={`${x - 12},${68 + i * 104} ${x},${42 + i * 104} ${x + 12},${68 + i * 104}`} fill={pal.fg} opacity={0.75} />}
      {i % 3 === 2 && <path d={`M ${x - 14} ${64 + i * 104} q 7 -${14 + rnd(2 + i) * 8} 14 0 t 14 0`} stroke={pal.fg} strokeOpacity={0.8} fill="none" strokeWidth={1.6} />}
    </g>
  ));
  return (
    <g>
      <rect x={x - 40} y={8} width={80} height={328} fill={pal.deep} stroke={pal.fg} strokeOpacity={0.5} strokeWidth={1.2} />
      {perf}
      {frames}
    </g>
  );
}

const MOTIF_DRAW = {
  eclipse: motifEclipse,
  shatter: motifShatter,
  blinds: motifBlinds,
  arcs: motifArcs,
  peaks: motifPeaks,
  orbit: motifOrbit,
  grid: motifGrid,
  strip: motifStrip,
} as const;

/* — type fitting for the plate — */

function arabicTitleSize(chars: number, scale = 1): number {
  const size = chars <= 7 ? 60 : chars <= 12 ? 52 : chars <= 17 ? 44 : chars <= 23 ? 36 : 30;
  return Math.round(size * scale);
}

/** Split at the word closest to the middle — two balanced lines, never one long one. */
function wrapTitle(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  if (words.length < 2) return [text];
  let best = 1;
  let bestDiff = Infinity;
  let acc = 0;
  for (let i = 0; i < words.length - 1; i++) {
    acc += words[i].length + 1;
    const diff = Math.abs(acc - text.length / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i + 1;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/* — print wear: deterministic speckles, cheap and filter-free — */

function speckles(slug: string, w: number, h: number, pal: TintPalette, count = 34) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = seededRandom(slug, 100 + i) * w;
        const y = seededRandom(slug, 200 + i) * h;
        const r = 0.4 + seededRandom(slug, 300 + i) * 1.1;
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={r.toFixed(2)} fill={i % 4 === 0 ? pal.accent : pal.fg} opacity={0.05 + seededRandom(slug, 400 + i) * 0.09} />;
      })}
    </g>
  );
}

/* — the plate — */

export function TitleArt({
  plate,
  variant = "poster",
  className,
}: {
  plate: Plate;
  variant?: ArtVariant;
  className?: string;
}) {
  const pal = TINT_PALETTE[plate.tint];
  const rnd = (slot: number) => seededRandom(plate.slug, slot);
  const gradId = `f-${plate.slug}-${variant}`;

  if (variant === "wide") {
    const W = 640, H = 360;
    const lines = wrapTitle(plate.titleAr, 15);
    const size = arabicTitleSize(Math.max(...lines.map((l) => l.length)), 0.66);
    const step = size + 7;
    // the block floats at the optical center of the text half, not glued to the floor
    const blockBottom = H / 2 + ((lines.length - 1) * step) / 2 + size * 0.36;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`بطاقة ${plate.titleAr}`} className={className} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={pal.field} />
            <stop offset="1" stopColor={pal.deep} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${gradId})`} />
        <g transform="translate(26,6) scale(1.04)">
          {MOTIF_DRAW[plate.motif]({ pal, rnd })}
        </g>
        <line x1={388} y1={34} x2={388} y2={H - 34} stroke={pal.fg} strokeOpacity={0.28} strokeWidth={1} />
        <text x={W - 40} y={blockBottom - lines.length * step - 26} textAnchor="end" direction="rtl" fontFamily="Fraunces Variable, Georgia, serif" fontStyle="italic" fontSize="14" fill={pal.faint} letterSpacing="0.02em">
          {plate.titleLat.length > 30 ? `${plate.titleLat.slice(0, 29)}…` : plate.titleLat}
        </text>
        {lines.map((line, i) => (
          <text key={i} x={W - 40} y={blockBottom - (lines.length - 1 - i) * step} textAnchor="end" direction="rtl" fontFamily="Aref Ruqaa, serif" fontWeight={700} fontSize={size} fill={pal.fg}>
            {line}
          </text>
        ))}
        <text x={W - 40} y={blockBottom + 22} textAnchor="end" direction="rtl" fontFamily="JetBrains Mono Variable, IBM Plex Sans Arabic, monospace" fontSize="12.5" fill={pal.faint}>
          {plate.yearLabel} · {plate.metaAr}
        </text>
        <text x={36} y={H - 24} fontFamily="JetBrains Mono Variable, IBM Plex Sans Arabic, monospace" fontSize="10" letterSpacing="0.22em" fill={pal.fg} fillOpacity={0.4}>
          KHAYAL · OPEN FILM ARCHIVE
        </text>
        <text x={W - 40} y={30} textAnchor="end" fontFamily="JetBrains Mono Variable, IBM Plex Sans Arabic, monospace" fontSize="10" letterSpacing="0.12em" fill={pal.fg} fillOpacity={0.55}>
          №{String(plate.index).padStart(3, "0")}
        </text>
        {speckles(plate.slug, W, H, pal, 46)}
      </svg>
    );
  }

  const poster = variant === "poster";
  const W = poster ? 480 : 176;
  const H = poster ? 720 : 264;
  const s = poster ? 1 : 0.38; // micro shares one grammar with the big plate
  const lines = poster ? wrapTitle(plate.titleAr, 18) : wrapTitle(plate.titleAr, 13);
  const size = arabicTitleSize(Math.max(...lines.map((l) => l.length)), s);
  const margin = poster ? 22 : 8;
  const blockBottom = H - (poster ? 60 : 22);
  const step = size + (poster ? 6 : 3);
  const lastLineY = poster ? blockBottom - 34 : H - 20;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`بطاقة ${plate.titleAr}`} className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.field} />
          <stop offset="0.62" stopColor={pal.deep} />
          <stop offset="1" stopColor={pal.deep} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${gradId})`} />
      {/* mounted-plate frame */}
      <rect x={margin} y={margin} width={W - margin * 2} height={H - margin * 2} fill="none" stroke={pal.fg} strokeOpacity={0.32} strokeWidth={poster ? 1.4 : 0.8} />
      <rect x={margin + 4} y={margin + 4} width={W - (margin + 4) * 2} height={H - (margin + 4) * 2} fill="none" stroke={pal.fg} strokeOpacity={0.12} strokeWidth={0.8} />
      {/* registration ticks at the corners */}
      {poster && (
        <g stroke={pal.fg} strokeOpacity={0.5} strokeWidth={1.2}>
          <line x1={margin} y1={margin + 14} x2={margin + 14} y2={margin} />
          <line x1={W - margin - 14} y1={margin} x2={W - margin} y2={margin + 14} />
          <line x1={margin} y1={H - margin - 14} x2={margin + 14} y2={H - margin} />
          <line x1={W - margin - 14} y1={H - margin} x2={W - margin} y2={H - margin - 14} />
        </g>
      )}

      {/* top strip */}
      <text x={margin + 14} y={margin + (poster ? 30 : 20)} fontFamily="JetBrains Mono Variable, IBM Plex Sans Arabic, monospace" fontSize={poster ? 9.5 : 6} letterSpacing="0.2em" fill={pal.fg} fillOpacity={0.55}>
        KHAYAL · ARCHIVE
      </text>
      <text x={W - margin - 14} y={margin + (poster ? 30 : 20)} textAnchor="end" fontFamily="JetBrains Mono Variable, IBM Plex Sans Arabic, monospace" fontSize={poster ? 9.5 : 6} letterSpacing="0.08em" fill={pal.fg} fillOpacity={0.6}>
        №{String(plate.index).padStart(3, "0")}
      </text>

      {/* motif zone */}
      <g transform={poster ? "translate(80,120)" : "translate(29,34) scale(0.36)"}>
        {MOTIF_DRAW[plate.motif]({ pal, rnd })}
      </g>

      {/* title block — baselines are computed from the bottom so a long,
          wrapped title grows UPWARD and never collides with the frame */}
      {poster && (
        <text
          x={W - 44}
          y={lastLineY - (lines.length - 1) * step - size - 14}
          textAnchor="end"
          fontFamily="Fraunces Variable, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill={pal.faint}
          letterSpacing="0.01em"
        >
          {plate.titleLat.length > 34 ? `${plate.titleLat.slice(0, 33)}…` : plate.titleLat}
        </text>
      )}
      {lines.map((line, i) => (
        <text
          key={i}
          x={W - 44}
          y={lastLineY - (lines.length - 1 - i) * step}
          textAnchor="end"
          direction="rtl"
          fontFamily="Aref Ruqaa, serif"
          fontWeight={700}
          fontSize={size}
          fill={pal.fg}
        >
          {line}
        </text>
      ))}
      {poster && (
        <text x={W - 44} y={blockBottom - 4} textAnchor="end" direction="rtl" fontFamily="JetBrains Mono Variable, IBM Plex Sans Arabic, monospace" fontSize="13.5" fill={pal.faint}>
          {plate.yearLabel} · {plate.metaAr}
        </text>
      )}

      {/* house seal */}
      <g transform={poster ? `translate(44,${H - 108})` : `translate(10,${H - 30}) scale(0.42)`}>
        <rect x={0} y={0} width={poster ? 52 : 44} height={poster ? 52 : 44} fill="none" stroke={pal.fg} strokeOpacity={0.55} strokeWidth={1.4} />
        <rect x={4} y={4} width={(poster ? 52 : 44) - 8} height={(poster ? 52 : 44) - 8} fill="none" stroke={pal.fg} strokeOpacity={0.25} strokeWidth={0.8} />
        <text x={(poster ? 52 : 44) / 2} y={(poster ? 36 : 30)} textAnchor="middle" fontFamily="Aref Ruqaa, serif" fontWeight={700} fontSize={poster ? 26 : 22} fill={pal.fg} fillOpacity={0.85}>
          خ
        </text>
      </g>

      {speckles(plate.slug, W, H, pal, poster ? 52 : 14)}
    </svg>
  );
}

export type { Plate };
