import type { Motif } from "@/lib/atmospheres";

/* ══════════════════════════════════════════════════════════════════════════
   LE PLAN — the drawing behind the room.

   The seven motifs survive as ideas, redrawn in the new language: technical
   rules, measured circles, schematic paths. Every one of them is a drawing you
   could have made with a ruler on the sheet — measurements, ticks and section
   lines in the house's signal and in its ink, always behind the content, never
   animated. No washes, no blooms, no colour fog.

   Pure CSS and SVG, rendered on the server: no client JavaScript ships for
   decoration.
   ══════════════════════════════════════════════════════════════════════════ */

export function MotifLayer({ motif, mark = [50, 14] }: { motif: Motif; mark?: [number, number] }) {
  const [mx, my] = mark;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* The twelve-column measure of the sheet, always present. */}
      <div className="blueprint absolute inset-0 opacity-[0.35]" />

      {/* The datum of the drawing: a hairline cross and a measured tick, where
          the composition's weight sits. Ruler work — never light. */}
      <div className="absolute inset-y-0 w-px bg-line-strong/25" style={{ insetInlineStart: `${mx}%` }} />
      <div className="absolute inset-x-0 h-px bg-line-strong/25" style={{ top: `${my}%` }} />

      {motif === "light" && (
        <>
          <div className="absolute -right-[6%] top-[8%] aspect-square w-[38vw] rounded-full border border-line-strong/60" />
          <div className="absolute -right-[2%] top-[16%] aspect-square w-[22vw] rounded-full border border-iodine/25" />
          <div className="absolute bottom-[10%] left-[6%] h-px w-[24vw] bg-iodine/40" />
        </>
      )}

      {motif === "architecture" && (
        <>
          <div className="absolute inset-y-0 left-[16.666%] w-px bg-line-strong/50" />
          <div className="absolute inset-y-0 left-[41.666%] w-px bg-line-strong/40" />
          <div className="absolute inset-y-0 right-[16.666%] w-px bg-line-strong/40" />
          <div className="absolute right-[8%] top-[12%] h-[42vh] w-[22vw] border border-line-strong/50" />
          <div className="absolute bottom-0 left-[8%] h-[18vh] w-[16vw] bg-canvas-2/70" />
          <div className="absolute bottom-[38%] left-[8%] h-px w-[16vw] bg-iodine/40" />
        </>
      )}

      {motif === "fluid" && (
        <svg className="absolute inset-x-0 bottom-0 h-[42vh] w-full" viewBox="0 0 1440 420" preserveAspectRatio="none">
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M0 ${300 + i * 22}c260-58 420 34 700-22s460-96 740-40`}
              fill="none"
              stroke={i === 0 ? "var(--color-iodine)" : "var(--color-carbon)"}
              strokeOpacity={i === 0 ? 0.4 : 0.16}
              strokeWidth="1"
            />
          ))}
        </svg>
      )}

      {motif === "precision" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, color-mix(in oklab, var(--color-carbon) 9%, transparent) 0 1px, transparent 1px 10%)",
            }}
          />
          <div className="absolute left-[62%] top-[14%] aspect-square w-[30vw] rounded-full border border-line-strong/60" />
          <div className="absolute left-[62%] top-[14%] aspect-square w-[30vw] translate-x-1/2 translate-y-1/2 rounded-full border border-iodine/20" />
        </>
      )}

      {motif === "warmth" && (
        <>
          <div className="absolute -left-[4%] top-[12%] aspect-square w-[30vw] rounded-full border border-iodine/20" />
          <div className="absolute -left-[4%] top-[12%] aspect-square w-[15vw] translate-x-1/2 translate-y-1/2 rounded-full bg-iodine-wash/70" />
          <div className="absolute bottom-[14%] right-[8%] h-px w-[20vw] bg-line-strong/60" />
          <div className="absolute bottom-[14%] right-[8%] h-[6vh] w-px bg-line-strong/60" />
        </>
      )}

      {motif === "botanical" && (
        <svg className="absolute right-[-4%] top-0 h-full w-[52%]" viewBox="0 0 600 800" aria-hidden>
          <path d="M300 800C300 560 380 420 540 260" fill="none" stroke="var(--color-carbon)" strokeOpacity="0.22" strokeWidth="1" />
          <path d="M300 800C300 600 240 470 120 340" fill="none" stroke="var(--color-carbon)" strokeOpacity="0.18" strokeWidth="1" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx={320 + i * 34}
              cy={700 - i * 76}
              rx="42"
              ry="16"
              fill="none"
              stroke="var(--color-iodine)" strokeOpacity="0.28"
              transform={`rotate(-32 ${320 + i * 34} ${700 - i * 76})`}
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={`l${i}`}
              cx={266 - i * 40}
              cy={726 - i * 92}
              rx="38"
              ry="14"
              fill="none"
              stroke="var(--color-carbon)" strokeOpacity="0.16"
              transform={`rotate(30 ${266 - i * 40} ${726 - i * 92})`}
            />
          ))}
        </svg>
      )}

      {motif === "clarity" && (
        <>
          <div className="absolute inset-x-0 top-[24%] h-px bg-iodine/35" />
          <div className="absolute inset-x-0 top-[40%] h-px bg-line-strong/60" />
          <div className="absolute inset-x-0 top-[56%] h-px bg-line-strong/45" />
          <div className="absolute inset-x-0 top-[72%] h-px bg-line-strong/35" />
        </>
      )}

      <div className="grain absolute inset-0" />
    </div>
  );
}
