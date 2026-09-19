import { Cadran, Bars, VizFrame, type VizPoint } from "@/components/kit/viz";

/* ══════════════════════════════════════════════════════════════════════════
   LE CATALOGUE, DESSINÉ — three ways to read the same shelf.

   A shop window that only lists products makes a visitor do the work. These
   three figures let the catalogue explain itself: what the house treats,
   which laboratories it keeps, and what the gestures cost. Every arc, bar and
   row is a door — clicking it opens the shelf it measures.

   The counts come from the database at render time. Nothing here is a
   marketing shape: an arc is only as long as the references behind it.
   ══════════════════════════════════════════════════════════════════════════ */

export function CatalogueFigures({
  needs,
  labs,
  bands,
}: {
  needs: VizPoint[];
  labs: (VizPoint & { country: string | null })[];
  bands: VizPoint[];
}) {
  const topLabs = labs.slice(0, 12);
  const maxLab = Math.max(1, ...topLabs.map((l) => l.value));

  return (
    <div className="grid gap-8">
      {/* ── Le cadran des besoins ─────────────────────────────────────── */}
      <VizFrame
        kicker="Figure 01 — par besoin"
        title="Ce que la maison soigne"
        note="Chaque arc compte les références qui répondent à un besoin. Les besoins les plus servis sont les plus demandés au comptoir."
      >
        <Cadran points={needs} />
      </VizFrame>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── La maison des laboratoires ──────────────────────────────── */}
        <VizFrame
          kicker="Figure 02 — par laboratoire"
          title="Les maisons que nous gardons"
          note="La largeur de la barre est le nombre de références retenues. Le pays est celui du laboratoire, pas de l'usine."
        >
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {topLabs.map((l) => (
              <li key={l.key}>
                <a href={l.href} className="group block">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] text-muted transition-colors group-hover:text-carbon">{l.label}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-faint">{l.country ?? "—"}</span>
                  </span>
                  <span className="mt-1 block h-[3px] bg-canvas-2">
                    <span
                      className="block h-full bg-carbon/70 transition-colors group-hover:bg-iodine"
                      style={{ width: `${(l.value / maxLab) * 100}%` }}
                    />
                  </span>
                  <span className="mt-1 block text-[10px] tabular-nums text-faint">
                    {l.value} réf.
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </VizFrame>

        {/* ── L'échelle des prix ──────────────────────────────────────── */}
        <VizFrame
          kicker="Figure 03 — par prix"
          title="Ce que coûtent les gestes"
          note="Le catalogue lu en paliers de 25 dinars. Cliquer une barre ouvre la boutique dans ce palier."
        >
          <Bars points={bands} unit="réf." />
          <p className="mt-3 border-t border-line-soft pt-3 text-[11px] text-faint">
            Paliers en dinars tunisiens. La hauteur est le nombre de références, jamais le chiffre d&apos;affaires.
          </p>
        </VizFrame>
      </div>
    </div>
  );
}
