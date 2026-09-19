import Link from "next/link";

/**
 * LE PLAN DE LA MAISON — the shop, drawn as it is walked.
 *
 * An officine is a room you enter, turn left in, and leave with a bag. So the
 * plan is a plan: the door at the bottom, the counter in the middle where the
 * pharmacist stands, the seven bays along the walls, the dispensary behind a
 * hatch, and the door to the stockroom that customers never open. Dimensions
 * are drawn with the same ticks an architect would use — they are a reading of
 * the room, not a survey, and the plate says so.
 *
 * Plain SVG, rendered on the server: no JavaScript ships for a drawing, and it
 * prints. The bays carry the names of the rayons when the page knows them, and
 * only their numbers when it does not.
 */

const BAYS = [
  { n: "01", x: 40, y: 26, w: 150 },
  { n: "02", x: 200, y: 26, w: 150 },
  { n: "03", x: 360, y: 26, w: 150 },
  { n: "04", x: 640, y: 26, w: 150 },
  { n: "05", x: 800, y: 26, w: 150 },
  { n: "06", x: 40, y: 150, w: 190 },
  { n: "07", x: 760, y: 150, w: 190 },
];

export function HousePlan({
  rayons,
  className,
}: {
  /** The seven rayons, in the order they sit on the walls. */
  rayons?: { label: string; href: string }[];
  className?: string;
}) {
  const label = (i: number) => rayons?.[i]?.label;

  return (
    <figure className={className}>
      <svg
        viewBox="0 0 1000 300"
        role="img"
        aria-label={
          rayons?.length
            ? `Plan de la maison : l'entrée au sud, le comptoir au centre, et sept rayons — ${rayons
                .map((r) => r.label)
                .join(", ")}.`
            : "Plan de la maison : l'entrée au sud, le comptoir au centre et sept rayons le long des murs."
        }
        className="h-auto w-full"
      >
        {/* ── The shell ─────────────────────────────────────────────── */}
        <rect x="20" y="16" width="960" height="268" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="30" y="26" width="940" height="248" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />

        {/* ── Les rayons — the bays along the walls ─────────────────── */}
        {BAYS.map((b, i) => {
          const href = rayons?.[i]?.href;
          const bay = (
            <g>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height="46"
                fill="currentColor"
                fillOpacity="0.06"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              {/* Shelf lines: three levels to a bay, as on the wall. */}
              {[1, 2].map((l) => (
                <line
                  key={l}
                  x1={b.x}
                  x2={b.x + b.w}
                  y1={b.y + (46 / 3) * l}
                  y2={b.y + (46 / 3) * l}
                  stroke="currentColor"
                  strokeWidth="0.4"
                  opacity="0.35"
                />
              ))}
              <text
                x={b.x + 10}
                y={b.y + 30}
                fill="currentColor"
                fontSize="13"
                fontFamily="var(--font-mono, monospace)"
                letterSpacing="1"
                opacity="0.85"
              >
                {b.n}
              </text>
            </g>
          );
          return (
            <g key={b.n} className={href ? "transition-opacity hover:opacity-100" : undefined}>
              {href ? (
                <Link href={href} aria-label={rayons?.[i]?.label} className="cursor-pointer">
                  {bay}
                </Link>
              ) : (
                bay
              )}
            </g>
          );
        })}

        {/* ── Le comptoir — where the pharmacist stands ─────────────── */}
        <g>
          <rect
            x="330"
            y="120"
            width="340"
            height="78"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <rect x="342" y="132" width="316" height="54" fill="currentColor" fillOpacity="0.1" stroke="none" />
          <text
            x="500"
            y="163"
            textAnchor="middle"
            fill="currentColor"
            fontSize="11"
            letterSpacing="3"
            fontFamily="var(--font-mono, monospace)"
          >
            LE COMPTOIR
          </text>
        </g>

        {/* ── L'officine — behind the hatch, not open to the room ────── */}
        <g opacity="0.75">
          <rect x="700" y="220" width="260" height="54" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 3" />
          <text
            x="830"
            y="251"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            letterSpacing="2.4"
            fontFamily="var(--font-mono, monospace)"
            opacity="0.7"
          >
            PRÉPARATION
          </text>
        </g>

        {/* ── La porte — south, on the street ───────────────────────── */}
        <g>
          <line x1="430" y1="284" x2="570" y2="284" stroke="currentColor" strokeWidth="3.4" />
          <path d="M 570 284 A 140 140 0 0 0 430 284" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
          <text
            x="500"
            y="272"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            letterSpacing="2.4"
            fontFamily="var(--font-mono, monospace)"
            opacity="0.7"
          >
            ENTRÉE
          </text>
        </g>

        {/* ── Les cotes — measured, as on a drawing ─────────────────── */}
        <g opacity="0.5" stroke="currentColor" strokeWidth="0.5">
          <line x1="20" y1="298" x2="980" y2="298" />
          <line x1="20" y1="292" x2="20" y2="304" />
          <line x1="980" y1="292" x2="980" y2="304" />
        </g>
        <text
          x="500"
          y="296"
          textAnchor="middle"
          fill="currentColor"
          fontSize="9"
          letterSpacing="2"
          fontFamily="var(--font-mono, monospace)"
          opacity="0.6"
        >
          14,20 m
        </text>

        {/* ── Le nord ───────────────────────────────────────────────── */}
        <g opacity="0.6">
          <path d="M 962 44 L 962 76" stroke="currentColor" strokeWidth="0.6" />
          <path d="M 962 40 L 958 50 L 966 50 Z" fill="currentColor" />
          <text
            x="962"
            y="88"
            textAnchor="middle"
            fill="currentColor"
            fontSize="9"
            letterSpacing="1.6"
            fontFamily="var(--font-mono, monospace)"
          >
            N
          </text>
        </g>
      </svg>

      <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="kicker-xs text-chalk-faint">
          Plan de principe — Ezzahra, 14,20 m sur 9,40 m
        </span>
        {rayons?.length ? (
          <span className="kicker-xs text-chalk-faint">
            {rayons.map((r, i) => (
              <span key={r.href}>
                {i > 0 && <span className="mx-1.5 opacity-40">·</span>}
                <Link href={r.href} className="transition-colors hover:text-chalk">
                  <span className="text-iodine">{String(i + 1).padStart(2, "0")}</span> {r.label}
                </Link>
              </span>
            ))}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
