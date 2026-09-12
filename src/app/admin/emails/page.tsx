import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { emailOutbox } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { AdminPage, Panel } from "@/components/admin/ui";
import { renderEmailPreview } from "@/lib/email/send";
import { EMAIL_KINDS, type EmailKind, type EmailPayload } from "@/lib/email/registry";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "E-mails — Administration" };

/** Sample payloads so every template renders as it will in production. */
function sample(kind: EmailKind): Record<string, unknown> {
  const items = [
    { name: "Lipikar Baume AP+M", brandName: "La Roche-Posay", quantity: 1, lineTotalMillimes: 79_900 },
    { name: "Sensibio H2O Eau Micellaire", brandName: "Bioderma", quantity: 2, lineTotalMillimes: 77_000 },
  ];
  const order = {
    orderNumber: "CL-260901-ABCDEFGHJK",
    firstName: "Ines",
    placedAt: "1 sept. 2026",
    items,
    totalMillimes: 163_900,
    address: "Ines Mansour — 12 rue des Jasmins, Ezzahra, Ben Arous",
    trackingCode: "TN-4471-8820",
    carrierUrl: "https://t.17track.net/en#nums=TN-4471-8820",
  };
  switch (kind) {
    case "welcome":
      return { kind, firstName: "Ines" };
    case "password_reset":
      return { kind, firstName: "Ines", resetUrl: "http://localhost:3000/reinitialiser-mot-de-passe/exemple-de-token", expiresInMinutes: 60 };
    case "order_confirmed":
    case "order_preparing":
    case "order_shipped":
    case "order_out_for_delivery":
    case "order_delivered":
    case "order_cancelled":
      return { kind, ...order, loyaltyEarned: kind === "order_delivered" ? 640 : null, trackingCode: kind === "order_shipped" || kind === "order_out_for_delivery" ? order.trackingCode : null, carrierUrl: kind === "order_shipped" || kind === "order_out_for_delivery" ? order.carrierUrl : null };
    case "order_refunded":
      return { kind, ...order, refundAmountMillimes: order.totalMillimes };
    case "return_update":
      return { kind, firstName: "Ines", returnNumber: "RET-2609-4F7K", orderNumber: "CL-260903-XXXXXXXX", status: "approved", note: "Merci de passer au comptoir d'Ezzahra, du lundi au samedi, 9 h – 19 h." };
    case "ticket_created":
    case "ticket_reply":
    case "ticket_resolved":
      return { kind, firstName: "Ines", ticketId: 142, ticketNumber: "#00142", subject: "Question sur une commande livrée", reply: kind === "ticket_created" ? null : "Bonjour Ines, votre colis est bien passé au contrôle ce matin ; le transporteur l'a récupéré à 16 h. Je reste disponible au comptoir." };
    case "restock_available":
      return { kind, firstName: "Ines", productSlug: "lipikar-baume-apm", productName: "Lipikar Baume AP+M" };
    case "care_feedback":
      return { kind, firstName: "Ines", orderNumber: order.orderNumber, items, tips: "Appliquez sur peau propre, en couche fine, en massant du bas vers le haut." };
    case "care_followup":
      return { kind, firstName: "Ines", orderNumber: order.orderNumber, advice: "En été, votre baume s'allège d'un fluide SPF au matin.", suggestion: { name: "Anthelios UVMune 400 Fluide Invisible SPF50+", slug: "anthelios-uvmune-400-fluide-invisible-spf50", shortDescription: "Protection ultra-large, fini invisible." } };
    case "ritual_reminder":
      return { kind, firstName: "Ines", ritualName: "Rituel d'été", moment: "morning", steps: [{ name: "Sensibio H2O", brandName: "Bioderma" }, { name: "Hyalu B5 Sérum", brandName: "La Roche-Posay" }] };
    case "subscription_order":
      return { kind, firstName: "Ines", orderNumber: "CL-260903-XXXXXXXX", items, totalMillimes: 150_705, nextDueAt: "3 octobre 2026" };
  }
}

export default async function AdminEmailsPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  const me = await requireAdmin().catch(() => null);
  if (!me) return null;
  const sp = await searchParams;
  const locale = sp.locale === "tn" ? "tn" : "fr";

  const logRows = await db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(40);

  const previews = await Promise.all(
    EMAIL_KINDS.map(async (kind) => {
      try {
        const { subject, html } = await renderEmailPreview(kind, sample(kind) as unknown as EmailPayload, locale);
        return { kind, subject, html };
      } catch (e) {
        return { kind, subject: String(e instanceof Error ? e.message : e), html: "" };
      }
    }),
  );

  return (
    <AdminPage
      eyebrow="Relation client"
      title="E-mails transactionnels"
      sub="Aperçu de chaque lettre, dans les deux langues de la maison. Hors RESEND_API_KEY, les envois sont écrits dans ./.emails/ — le journal ci-dessous reste le reflet exact de la file."
      action={
        <div className="flex gap-2">
          <Link href="/admin/emails" className={`min-h-9 border px-3 text-[10px] font-bold uppercase tracking-[0.16em] ${locale === "fr" ? "border-admin-gold text-admin-gold" : "border-admin-border text-admin-muted"}`}>Français</Link>
          <Link href="/admin/emails?locale=tn" className={`min-h-9 border px-3 text-[10px] font-bold uppercase tracking-[0.16em] ${locale === "tn" ? "border-admin-gold text-admin-gold" : "border-admin-border text-admin-muted"}`}>Tounsi</Link>
        </div>
      }
    >
      <div className="mb-10 grid gap-6 xl:grid-cols-2">
        {previews.map((p) => (
          <Panel key={p.kind} title={p.kind} action={<span className="truncate text-[11px] text-admin-muted">{p.subject}</span>}>
            {p.html ? (
              <iframe title={`aperçu ${p.kind}`} srcDoc={p.html} className="h-[520px] w-full border-0 bg-white" sandbox="" loading="lazy" />
            ) : (
              <p className="p-4 text-sm text-red-400">{p.subject}</p>
            )}
          </Panel>
        ))}
      </div>

      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-admin-gold">Journal de la poste</h2>
      <div className="overflow-x-auto border border-admin-border bg-admin-panel">
        <table className="w-full min-w-[840px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-admin-border text-left text-[9px] font-bold uppercase tracking-[0.18em] text-admin-muted">
              <th className="px-4 py-3">Destinataire</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Sujet</th>
              <th className="px-4 py-3">Programmé</th>
              <th className="px-4 py-3">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {logRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-admin-muted">
                  Aucun envoi pour l&apos;instant — les lettres apparaîtront ici dès la première commande ou inscription.
                </td>
              </tr>
            )}
            {logRows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 text-admin-text">{r.to}</td>
                <td className="px-4 py-2.5"><code className="text-admin-gold">{r.kind}</code></td>
                <td className="max-w-[320px] truncate px-4 py-2.5 text-admin-muted">{r.subject}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-admin-muted">{formatDateTime(r.sendAt)}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex whitespace-nowrap px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
                      r.status === "sent" ? "bg-success-soft text-success" : r.status === "failed" ? "bg-error-soft text-error" : "bg-admin-panel-2 text-admin-muted"
                    }`}
                  >
                    {r.status}
                    {r.status === "failed" && r.error ? ` — ${r.error.slice(0, 60)}` : ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
