import type { Motif } from "@/lib/atmospheres";

/* ══════════════════════════════════════════════════════════════════════════
   LA GRILLE — the shape language of a room.
   ──────────────────────────────────────────────────────────────────────────
   Seven compositions, drawn entirely from the instrument's grammar: hairlines,
   the graticule, one measured circle, one solid plate, one cinabre mark. They
   give each universe its own architecture without introducing a single new
   colour — the difference between two rayons is *measurement*, not palette.

   Pure CSS/SVG, rendered on the server: decoration ships zero JavaScript.
   Everything sits behind the content and never animates on its own.
   ══════════════════════════════════════════════════════════════════════════ */

const line = (tone: "light" | "night") =>
  tone === "night" ? "rgba(244,243,240,0.10)" : "rgba(17,17,19,0.06)";
const strong = (tone: "light" | "night") =>
  tone === "night" ? "rgba(244,243,240,0.18)" : "rgba(17,17,19,0.12)";

export function MotifLayer({
  motif,
  light = [50, 14],
  tone = "light",
}: {
  motif: Motif;
  light?: [number, number];
  tone?: "light" | "night";
}) {
  const [lx, ly] = light;
  const night = tone === "night";
  const ink = night ? "var(--color-cine-ivory)" : "var(--color-ink)";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* The light of the room, wherever the motif is used. */}
      <div
        className="absolute inset-0"
        style={{
          background: night
            ? `radial-gradient(50% 46% at ${lx}% ${ly}%, rgba(244,243,240,0.10), transparent 70%), radial-gradient(38% 40% at ${100 - lx}% 92%, rgba(217,58,16,0.16), transparent 72%)`
            : `radial-gradient(46% 44% at ${lx}% ${ly}%, rgba(255,255,255,0.85), transparent 70%), radial-gradient(34% 36% at ${100 - lx}% 88%, rgba(207,203,195,0.42), transparent 74%)`,
        }}
      />

      {/* The graticule is always there — the instrument measures every room. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, ${line(tone)} 0 1px, transparent 1px 8.3333%)`,
        }}
      />

      {motif === "light" && (
        <>
          <div className="absolute inset-y-0 start-[8.3333%] w-px" style={{ background: strong(tone) }} />
          <div
            className="absolute end-[-6%] top-[8%] h-[54vh] w-[54vh] rounded-full border"
            style={{ borderColor: "rgba(217,58,16,0.22)" }}
          />
          <div className="absolute end-[6%] top-[26%] h-[26vh] w-[26vh] rounded-full border border-rule" />
          <div className="absolute start-[12%] bottom-[10%] h-px w-[22vw] bg-cinabre" />
        </>
      )}

      {motif === "architecture" && (
        <>
          <div className="absolute inset-y-0 start-[25%] w-px" style={{ background: strong(tone) }} />
          <div className="absolute inset-y-0 start-[50%] w-px" style={{ background: line(tone) }} />
          <div className="absolute inset-y-0 end-[16.6667%] w-px" style={{ background: strong(tone) }} />
          <div className="absolute end-[8%] top-[12%] h-[44vh] w-[24vw] border" style={{ borderColor: strong(tone) }} />
          <div className="absolute start-[8%] bottom-[8%] h-[18vh] w-[14vw] bg-bone/60" />
          <div className="absolute start-[8%] bottom-[8%] h-[18vh] w-[14vw] border border-cinabre/30" />
        </>
      )}

      {motif === "fluid" && (
        <svg className="absolute inset-x-0 bottom-0 h-[42vh] w-full" viewBox="0 0 1440 420" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M0 ${200 + i * 34}c240-${72 - i * 8} 380 ${24 - i * 4} 640-${26 - i * 4}s400-${104 - i * 10} 800-${54 - i * 6}`}
              fill="none"
              stroke={i === 0 ? "rgba(217,58,16,0.34)" : strong(tone)}
              strokeWidth="1"
            />
          ))}
        </svg>
      )}

      {motif === "precision" && (
        <>
          <div className="absolute start-[62%] top-[14%] h-[38vh] w-[38vh] rounded-full border border-ink/12" />
          <div className="absolute start-[62%] top-[14%] h-[38vh] w-[38vh] rounded-full border border-cinabre/25" />
          <div className="absolute start-[62%] top-[14%] h-px w-[19vh] bg-cinabre/60" />
          <div className="absolute start-[62%] top-[14%] h-[19vh] w-px bg-cinabre/60" />
          <div className="absolute inset-x-0 top-[38%] h-px" style={{ background: strong(tone) }} />
          <div className="absolute inset-x-0 top-[52%] h-px" style={{ background: line(tone) }} />
        </>
      )}

      {motif === "warmth" && (
        <>
          <div className="absolute start-[-8%] top-[10%] h-[46vh] w-[46vh] rounded-full bg-cinabre-soft/70 blur-3xl" />
          <div className="absolute end-[4%] bottom-[2%] h-[34vh] w-[34vh] rounded-full bg-cinabre-soft/60 blur-3xl" />
          <div className="absolute end-[16%] top-[18%] h-40 w-40 rounded-full border border-cinabre/25" />
          <div className="absolute inset-y-0 start-[33.3333%] w-px" style={{ background: strong(tone) }} />
        </>
      )}

      {motif === "botanical" && (
        <svg className="absolute end-[-4%] top-0 h-full w-[52%]" viewBox="0 0 600 800" aria-hidden>
          {[
            "M300 800C300 560 380 420 540 260",
            "M300 800C300 600 240 470 120 340",
          ].map((d, i) => (
            <path key={d} d={d} fill="none" stroke={i === 0 ? "rgba(28,106,74,0.34)" : "rgba(28,106,74,0.2)"} strokeWidth="1" />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx={320 + i * 34}
              cy={700 - i * 76}
              rx="42"
              ry="15"
              fill="none"
              stroke="rgba(28,106,74,0.24)"
              transform={`rotate(-30 ${320 + i * 34} ${700 - i * 76})`}
            />
          ))}
        </svg>
      )}

      {motif === "clarity" && (
        <>
          <div className="absolute inset-x-0 top-[24%] h-px bg-gradient-to-r from-transparent via-cinabre/50 to-transparent" />
          <div className="absolute inset-x-0 top-[40%] h-px" style={{ background: strong(tone) }} />
          <div className="absolute inset-x-0 top-[56%] h-px" style={{ background: line(tone) }} />
          <div className="absolute end-[8%] top-[6%] h-[40vh] w-[40vh] rounded-full bg-white/50 blur-3xl" />
        </>
      )}

      {/* One measurement, always in the same corner: the instrument's mark. */}
      <div className="absolute bottom-5 end-5 hidden items-end gap-2 lg:flex">
        <span className="h-3 w-px" style={{ background: ink, opacity: 0.25 }} />
        <span className="h-px w-3" style={{ background: ink, opacity: 0.25 }} />
      </div>

      <div className="grain absolute inset-0" />
    </div>
  );
}
