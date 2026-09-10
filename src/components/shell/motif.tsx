import type { Motif } from "@/lib/atmospheres";

/**
 * THE MOTIF — the shape language of a room.
 *
 * Seven decorative compositions, all drawn from the same palette, all behind
 * the content, none of them animated. They give each universe its own
 * architecture without introducing a single new colour.
 *
 * Pure CSS/SVG, rendered on the server: no client JavaScript is shipped for
 * decoration.
 */
export function MotifLayer({ motif, light = [50, 14] }: { motif: Motif; light?: [number, number] }) {
  const [lx, ly] = light;
  const glow = `radial-gradient(46% 42% at ${lx}% ${ly}%, rgba(203,176,120,0.34), rgba(238,226,201,0.16) 45%, transparent 72%)`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* The light of the room, in every case */}
      <div className="absolute inset-0" style={{ background: glow }} />

      {motif === "light" && (
        <>
          <div className="absolute -right-[12%] top-[6%] h-[52vh] w-[52vh] rounded-full border border-champagne/20" />
          <div className="absolute right-[4%] top-[24%] h-[30vh] w-[30vh] rounded-full border border-champagne-3/30" />
          <div className="absolute left-[8%] bottom-[8%] h-56 w-56 rounded-full bg-champagne-soft/30 blur-3xl" />
        </>
      )}

      {motif === "architecture" && (
        <>
          <div className="absolute inset-y-0 left-[18%] w-px bg-gradient-to-b from-transparent via-stone-2/45 to-transparent" />
          <div className="absolute inset-y-0 left-[34%] w-px bg-gradient-to-b from-transparent via-stone-2/35 to-transparent" />
          <div className="absolute inset-y-0 right-[22%] w-px bg-gradient-to-b from-transparent via-stone-2/35 to-transparent" />
          <div className="absolute right-[6%] top-[14%] h-[46vh] w-[26vw] border border-champagne/18" />
          <div className="absolute left-[4%] bottom-[6%] h-[22vh] w-[16vw] bg-linen/25" />
        </>
      )}

      {motif === "fluid" && (
        <svg
          className="absolute inset-x-0 bottom-0 h-[46vh] w-full"
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 268c220-96 380 30 620-24s420-150 820-70v246H0z" fill="rgba(203,176,120,0.14)" />
          <path d="M0 322c260-70 400 24 660-24s400-118 780-52v174H0z" fill="rgba(150,135,94,0.12)" />
          <path d="M0 268c220-96 380 30 620-24s420-150 820-70" fill="none" stroke="rgba(163,128,63,0.4)" strokeWidth="1" />
        </svg>
      )}

      {motif === "precision" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, rgba(150,135,94,0.14) 0 1px, transparent 1px 8.3333%)",
            }}
          />
          <div className="absolute left-[58%] top-[18%] h-[38vh] w-[38vh] rounded-full border border-champagne-2/25" />
          <div className="absolute left-[58%] top-[18%] h-[38vh] w-[38vh] translate-x-1/2 translate-y-1/2 rounded-full bg-champagne-soft/25 blur-2xl" />
        </>
      )}

      {motif === "warmth" && (
        <>
          <div className="absolute -left-[8%] top-[10%] h-[44vh] w-[44vh] rounded-full bg-terra-soft/45 blur-3xl" />
          <div className="absolute right-[6%] bottom-[4%] h-[36vh] w-[36vh] rounded-full bg-champagne-soft/45 blur-3xl" />
          <div className="absolute right-[18%] top-[16%] h-40 w-40 rounded-full border border-terra/15" />
        </>
      )}

      {motif === "botanical" && (
        <svg className="absolute right-[-6%] top-0 h-full w-[58%]" viewBox="0 0 600 800" aria-hidden>
          <path d="M300 800C300 560 380 420 540 260" fill="none" stroke="rgba(95,98,54,0.28)" strokeWidth="1.2" />
          <path d="M300 800C300 600 240 470 120 340" fill="none" stroke="rgba(95,98,54,0.22)" strokeWidth="1.2" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx={320 + i * 34}
              cy={700 - i * 76}
              rx="42"
              ry="17"
              fill="rgba(203,176,120,0.16)"
              transform={`rotate(-32 ${320 + i * 34} ${700 - i * 76})`}
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={`l${i}`}
              cx={266 - i * 40}
              cy={726 - i * 92}
              rx="38"
              ry="15"
              fill="rgba(150,135,94,0.14)"
              transform={`rotate(30 ${266 - i * 40} ${726 - i * 92})`}
            />
          ))}
        </svg>
      )}

      {motif === "clarity" && (
        <>
          <div className="absolute inset-x-0 top-[22%] h-px bg-gradient-to-r from-transparent via-champagne/40 to-transparent" />
          <div className="absolute inset-x-0 top-[38%] h-px bg-gradient-to-r from-transparent via-stone-2/45 to-transparent" />
          <div className="absolute inset-x-0 top-[54%] h-px bg-gradient-to-r from-transparent via-stone-2/35 to-transparent" />
          <div className="absolute right-[10%] top-[8%] h-[40vh] w-[40vh] rounded-full bg-champagne-soft/25 blur-3xl" />
        </>
      )}

      <div className="grain absolute inset-0" />
    </div>
  );
}
