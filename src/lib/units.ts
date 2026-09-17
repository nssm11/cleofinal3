/**
 * Honest unit pricing — “what does 100 ml really cost”.
 *
 * The volume field-box on a product is a short human string (“400 ml”,
 * “50 ml”, “90 gélules”, “2 × 40 ml”). We parse it defensively: anything we
 * cannot read confidently yields `null`, and nothing is displayed. A quiet,
 * truthful line under the price beats a wrong one anywhere.
 */
export type ParsedVolume =
  | { kind: "metric"; count: number; unit: "ml" | "g" }
  | { kind: "pieces"; count: number; unit: string };

// “400 ml”, “2 × 40 ml”, “125,5 ml”, “90 gélules” — number, optional pack
// multiplier, unit token. Units are then mapped explicitly: accented words
// defeat \b tricks, so no regex alternation on them.
const PACK_RE = /^(?:(\d+)\s*[×x]\s*)?(\d+(?:[.,]\d+)?)\s*([a-zà-ÿµ]+)/i;
const METRIC: Record<string, "ml" | "g"> = {
  ml: "ml", millilitre: "ml", millilitres: "ml",
  l: "ml", litre: "ml", litres: "ml",
  g: "g", gramme: "g", grammes: "g",
};
const PIECES = new Set(["gélule", "gélules", "gelule", "gelules", "comprimé", "comprimés", "comprime", "comprimes", "capsule", "capsules", "stick", "sticks", "sachet", "sachets", "dose", "doses", "crayon", "crayons", "stylo", "stylos", "unité", "unités", "unite", "unites"]);

export function parseVolume(raw: string | null | undefined): ParsedVolume | null {
  if (!raw) return null;
  const m = PACK_RE.exec(raw.trim());
  if (!m) return null;
  const packs = m[1] ? Number(m[1]) : 1;
  const count = Number(m[2].replace(",", "."));
  if (!Number.isFinite(count) || count <= 0) return null;
  const total = count * (Number.isFinite(packs) && packs > 0 ? packs : 1);
  const u = m[3].toLowerCase();
  const metric = METRIC[u];
  if (metric) return { kind: "metric", count: metric === "ml" && (u === "l" || u.startsWith("litre")) ? total * 1000 : total, unit: metric };
  if (PIECES.has(u)) return { kind: "pieces", count: total, unit: u };
  return null;
}

/** Per-100 reference for metrics, per-unit for pieces; null when unshown. */
export function unitPrice(
  priceMillimes: number,
  raw: string | null | undefined,
  opts?: { forceSmall?: boolean; minPieces?: number },
): { text: string; perLabel: string } | null {
  const v = parseVolume(raw);
  if (!v) return null;
  if (v.kind === "metric") {
    // Quiet by design: large formats and serums (the shelf asks for it),
    // never the 7 ml stick that would turn rounding noise into a claim.
    const small = v.count < 100;
    if (small && !opts?.forceSmall) return null;
    const per100 = Math.round((priceMillimes / v.count) * 100);
    return { text: `${fmtMilli(per100)} / 100 ${v.unit}`, perLabel: `100 ${v.unit}` };
  }
  const min = opts?.minPieces ?? 20;
  if (v.count < min) return null;
  const per = Math.round(priceMillimes / v.count);
  return { text: `${fmtMilli(per)} / unité`, perLabel: "unité" };
}

function fmtMilli(millimes: number): string {
  const dt = millimes / 1000;
  const s = (Number.isInteger(dt) ? String(dt) : dt.toFixed(2)).replace(".", ",");
  return `${s} DT`;
}
