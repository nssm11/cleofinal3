import "dotenv/config";
import { renderAsync } from "@react-email/render";
import { EMAIL_KINDS, renderEmailElement, emailSubject, type EmailKind, type EmailPayload } from "@/lib/email/registry";
import { mkdirSync, writeFileSync } from "node:fs";

const items = [
  { name: "Lipikar Baume AP+M", brandName: "La Roche-Posay", quantity: 1, lineTotalMillimes: 79900 },
  { name: "Sensibio H2O", brandName: "Bioderma", quantity: 2, lineTotalMillimes: 77000 },
];
const order = {
  orderNumber: "CL-260911-TEST123456",
  firstName: "Ines",
  placedAt: "11 sept. 2026",
  items,
  totalMillimes: 163900,
  address: "Ines Mansour — 12 rue des Jasmins, Ezzahra, Ben Arous",
  trackingCode: "TN-4471-8820",
  carrierUrl: "https://t.17track.net/en#nums=TN-4471-8820",
};
const samples: Record<string, Record<string, unknown>> = {
  welcome: { kind: "welcome", firstName: "Ines" },
  password_reset: { kind: "password_reset", firstName: "Ines", resetUrl: "http://localhost:3000/reinitialiser-mot-de-passe/abc", expiresInMinutes: 60 },
  order_confirmed: { kind: "order_confirmed", ...order },
  order_preparing: { kind: "order_preparing", ...order },
  order_shipped: { kind: "order_shipped", ...order },
  order_out_for_delivery: { kind: "order_out_for_delivery", ...order },
  order_delivered: { kind: "order_delivered", ...order },
  order_cancelled: { kind: "order_cancelled", ...order, trackingCode: null, carrierUrl: null },
  order_refunded: { kind: "order_refunded", ...order, refundAmountMillimes: 163900 },
  ticket_created: { kind: "ticket_created", firstName: "Ines", ticketId: 7, ticketNumber: "#00007", subject: "Question", reply: null },
  ticket_reply: { kind: "ticket_reply", firstName: "Ines", ticketId: 7, ticketNumber: "#00007", subject: "Question", reply: "Bonjour Inès, votre colis est en route." },
  ticket_resolved: { kind: "ticket_resolved", firstName: "Ines", ticketId: 7, ticketNumber: "#00007", subject: "Question", reply: null },
  restock_available: { kind: "restock_available", firstName: "Ines", productSlug: "bioderma-sensibio-h2o-eau-micellaire", productName: "Sensibio H2O" },
  care_feedback: { kind: "care_feedback", firstName: "Ines", orderNumber: order.orderNumber, items, tips: "Appliquer le soir." },
  care_followup: { kind: "care_followup", firstName: "Ines", orderNumber: order.orderNumber, advice: "Un SPF au matin.", suggestion: { name: "Anthelios 400", slug: "x", shortDescription: "Fluide invisible." } },
  ritual_reminder: { kind: "ritual_reminder", firstName: "Ines", ritualName: "Rituel du matin", moment: "morning", steps: [{ name: "Sensibio H2O", brandName: "Bioderma" }] },
  subscription_order: { kind: "subscription_order", firstName: "Ines", orderNumber: order.orderNumber, items, totalMillimes: 150000, nextDueAt: "11 octobre 2026" },
  return_update: { kind: "return_update", firstName: "Ines", returnNumber: "RET-2609-4F7K", orderNumber: order.orderNumber, status: "approved", note: "Merci de passer au comptoir d'Ezzahra, du lundi au samedi, 9 h – 19 h." },
};

(async () => {
  mkdirSync("/tmp/emails-out", { recursive: true });
  let n = 0;
  for (const kind of EMAIL_KINDS) {
    for (const locale of ["fr", "tn", "tn-arab"] as const) {
      const payload = { ...samples[kind], locale } as unknown as EmailPayload;
      const subject = emailSubject(kind as EmailKind, samples[kind], locale);
      const html = await renderAsync(renderEmailElement(kind as EmailKind, payload, (locale === "fr" ? "fr" : "tn") as never));
      writeFileSync(`/tmp/emails-out/${kind}.${locale}.html`, html);
      console.log(`${kind} [${locale}] → ${subject} (${(html.length / 1024).toFixed(1)} KB)`);
      n++;
    }
  }
  console.log(`✓ ${n} e-mails rendered`);
})();
