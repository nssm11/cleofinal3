import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportPayload } from "@/lib/customer-data";
import { toCsv } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/compte/export[?format=json|csv]
 *
 * La cliente emporte ses données. Le JSON est la copie complète ; le CSV est
 * ce qu'on ouvre dans un tableur — une ligne par article commandé, avec les
 * dates de lot, parce que c'est la seule partie qu'on regarde vraiment.
 *
 * Aucune donnée n'est agrégée ni reformulée : c'est le contenu des tables.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Connexion requise.", { status: 401 });

  const data = await exportPayload(user.id);
  if (!data) return new NextResponse("Compte introuvable.", { status: 404 });

  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const rows = (data.orderItems as Array<Record<string, unknown>>).map((it) => ({
      commande: it.order_number,
      produit: it.name,
      reference: it.sku,
      quantite: it.quantity,
      prix_unitaire_dt: (Number(it.unit_price_millimes) / 1000).toFixed(3),
      total_ligne_dt: (Number(it.line_total_millimes) / 1000).toFixed(3),
      lot: it.lot_number ?? "",
      peremption: it.lot_expires_at ?? "",
    }));
    const csv = rows.length ? toCsv(rows) : "commande,produit,reference,quantite,prix_unitaire_dt,total_ligne_dt,lot,peremption\n";
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="cleopatre-commandes-${stamp}.csv"`,
        "cache-control": "no-store",
      },
    });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="cleopatre-donnees-${stamp}.json"`,
      "cache-control": "no-store",
    },
  });
}
