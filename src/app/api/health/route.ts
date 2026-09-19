import { statusReport } from "@/lib/status";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Deux niveaux dans la même réponse, parce que deux publics la lisent :
 * `ok` pour une sonde qui veut un booléen, et le rapport complet pour un
 * humain qui veut savoir *quoi* ne va pas. Aucune donnée personnelle, aucun
 * chiffre d'affaires — seulement l'état des machines du magasin.
 */
export async function GET() {
  try {
    const report = await statusReport();
    return Response.json(
      {
        ok: report.state !== "bad",
        state: report.state,
        at: report.at,
        checks: report.checks.map((c) => ({ key: c.key, state: c.state, detail: c.detail })),
      },
      { status: report.state === "bad" ? 503 : 200 },
    );
  } catch {
    return Response.json({ ok: false, state: "bad", checks: [] }, { status: 500 });
  }
}
