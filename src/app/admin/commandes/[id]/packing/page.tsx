import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, stores } from "@/db/schema";
import { formatDT } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { PAYMENT_LABELS, SHIPPING_LABELS } from "@/lib/orders";
import { PrintButton } from "@/components/admin/inline-actions";

export const dynamic = "force-dynamic";

/**
 * LA FEUILLE DE PRÉPARATION — one sheet, printed or read on the shelf edge:
 * the counter ticks each line, signs the check, and (for COD) carries the sum
 * to collect at the door. Deliberately plain: no ink-heavy chrome, black on
 * white, big ticks — the kind of page a printer and a pair of gloves both
 * understand. Prompt 12.
 */
export default async function PackingList({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const o = await db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true } });
  if (!o) notFound();
  const store = o.storeId ? await db.query.stores.findFirst({ where: eq(stores.id, o.storeId) }) : null;

  return (
    <article className="mx-auto max-w-3xl bg-white p-8 text-[15px] leading-relaxed text-black print:p-0">
      <style>{`@media print { body * { visibility: hidden; } #packing-sheet, #packing-sheet * { visibility: visible; } #packing-sheet { position: absolute; inset: 0; } .no-print { display: none !important; } @page { margin: 14mm; } }`}</style>
      <div id="packing-sheet">
      <header className="mb-6 flex items-end justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em]">Cléopâtre — préparation</p>
          <h1 className="font-mono text-[26px] font-bold leading-tight">{o.number}</h1>
          <p className="text-[12px]">Imprimée le {formatDateTime(new Date())} · commande du {formatDateTime(o.createdAt)}</p>
        </div>
        <div className="no-print flex gap-2">
          <PrintButton />
          <Link href={`/admin/commandes/${o.id}`} className="rounded border border-black/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] hover:border-black">
            Retour
          </Link>
        </div>
      </header>

      <section>
        <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
          <p>
            <span className="font-bold uppercase tracking-wide text-[10px]">Client</span>
            <br />
            {o.shippingAddress.fullName} — {o.phone}
          </p>
          <p>
            <span className="font-bold uppercase tracking-wide text-[10px]">Acheminement</span>
            <br />
            {SHIPPING_LABELS[o.shippingMethod]}
            {store ? ` — ${store.name}` : ` — ${o.shippingAddress.city}, ${o.shippingAddress.governorate}`}
            {o.shippingMethod !== "pickup" && (
              <>
                <br />
                {o.shippingAddress.line1}
                {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}
              </>
            )}
          </p>
          <p>
            <span className="font-bold uppercase tracking-wide text-[10px]">Paiement</span>
            <br />
            {PAYMENT_LABELS[o.paymentMethod]}
            {o.paymentMethod === "cod" && <span className="font-bold"> — encaisser {formatDT(o.totalMillimes)}</span>}
          </p>
          <p>
            <span className="font-bold uppercase tracking-wide text-[10px]">Articles</span>
            <br />
            {o.items.reduce((a, i) => a + i.quantity, 0)} pièce(s) · total {formatDT(o.totalMillimes)}
          </p>
          {o.giftWrap && (
            <p className="col-span-2 border-l-4 border-black pl-3 text-[13px]">
              <span className="font-bold uppercase tracking-wide text-[10px]">Emballage cadeau</span>
              <br />
              Glisser le mot : « {o.giftMessage || "(sans message)"} »
            </p>
          )}
          {o.customerNote && <p className="col-span-2 text-[12px]">Note client : {o.customerNote}</p>}
          {o.internalNote && <p className="col-span-2 text-[12px]">Note interne : {o.internalNote}</p>}
        </div>

        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-y-2 border-black text-left text-[10px] font-bold uppercase tracking-[0.18em]">
              <th className="w-10 py-2">Prévu</th>
              <th className="py-2">Réf.</th>
              <th className="w-14 py-2">Qté</th>
              <th className="w-10 py-2">Fait</th>
              <th className="w-20 py-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id} className="border-b border-black/25">
                <td className="py-3">
                  <span className="inline-block h-6 w-6 border-2 border-black" aria-hidden />
                </td>
                <td className="py-3 pr-4">
                  <span className="font-bold">{i.name}</span>
                  <br />
                  <span className="text-[11px]">
                    {i.brandName} · {i.sku}
                  </span>
                  {/* Le lot qui part réellement : le préparateur le vérifie sur la
                      boîte, et le contrôleur le relit sur le papier. */}
                  <br />
                  {i.lotNumber ? (
                    <span className="font-mono text-[11px]">
                      Lot {i.lotNumber}
                      {i.lotExpiresAt ? ` · DLC ${String(i.lotExpiresAt.getUTCMonth() + 1).padStart(2, "0")}/${i.lotExpiresAt.getUTCFullYear()}` : " · DLC non communiquée"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-black/60">Lot à saisir au moment du prélèvement</span>
                  )}
                </td>
                <td className="py-3 font-mono text-[16px] font-bold">×{i.quantity}</td>
                <td className="py-3">
                  <span className="inline-block h-6 w-6 border-2 border-black/50" aria-hidden />
                </td>
                <td className="py-3 text-right font-mono">{formatDT(i.lineTotalMillimes)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-10 flex items-end justify-between gap-8 text-[12px]">
          <div className="flex-1 border-t border-black pt-2 text-center">Contrôle & signature du préparateur</div>
          <div className="w-40 border-t border-black pt-2 text-center">Date</div>
        </footer>
        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.24em]">
          Cléopâtre — Ezzahra & Hammam-Lif · 71 450 210
        </p>
      </section>
      </div>
    </article>
  );
}
