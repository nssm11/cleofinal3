#!/usr/bin/env -S npx tsx
/**
 * APERÇU DU COURRIER — render every transactional letter to `.mail/preview`.
 *
 * The point is that the letters can be *read* without a mail provider and
 * without placing an order: run this after touching a template and open the
 * HTML in a browser. It also asserts the basics (a doctype, the subject in the
 * title, the order number in the text twin) so a broken template fails here
 * rather than in an inbox.
 *
 *   npm run mail:preview
 *
 * Only modules free of `server-only` are imported, so the script runs in plain
 * Node.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { htmlToText } from "../src/lib/mail/render";
import { ORDER_MAIL_COPY } from "../src/lib/mail/copy";
import { welcomeEmail } from "../src/lib/mail/templates/welcome";
import { orderStatusEmail } from "../src/lib/mail/templates/order-status";
import { passwordResetEmail } from "../src/lib/mail/templates/password-reset";
import { ticketCreatedEmail, ticketReplyEmail, ticketResolvedEmail } from "../src/lib/mail/templates/ticket";
import { restockEmail } from "../src/lib/mail/templates/restock";
import { careFeedbackEmail, careFollowUpEmail } from "../src/lib/mail/templates/care";
import type { MailOrder, MailTicket } from "../src/lib/mail/types";
import type { OrderStatus } from "../src/db/schema";

const OUT = path.resolve(process.cwd(), ".mail/preview");

const LINES = [
  { name: "Hyalu B5 Sérum 30 ml", brandName: "La Roche-Posay", quantity: 1, lineTotal: "128.000 DT" },
  { name: "Sensibio H2O Eau Micellaire 500 ml", brandName: "Bioderma", quantity: 2, lineTotal: "79.000 DT" },
  { name: "Anthelios UVMune 400 Fluide SPF50+", brandName: "La Roche-Posay", quantity: 1, lineTotal: "62.500 DT" },
];

function order(status: OrderStatus): MailOrder {
  return {
    number: "CL-260911-A7K2",
    email: "ines.mansour@example.tn",
    firstName: "Ines",
    status,
    total: "269.500 DT",
    shippingLabel: "Livraison standard",
    paymentLabel: "Paiement à la livraison",
    placedAt: "11 septembre 2026",
    trackingCode: status === "shipped" || status === "delivered" ? "TN-9938-2214" : null,
    carrierUrl: status === "shipped" ? "https://suivi.transporteur.tn/TN-9938-2214" : null,
    links: {
      tracking: "https://para-cleopatre.tn/suivi?n=CL-260911-A7K2&k=demo-access-key",
      shop: "https://para-cleopatre.tn/boutique",
      support: "https://para-cleopatre.tn/aide",
      account: "https://para-cleopatre.tn/compte/commandes",
    },
    lines: LINES,
  };
}

const TICKET: MailTicket = {
  reference: "42",
  email: "ines.mansour@example.tn",
  name: "Ines",
  subject: "Ma crème est arrivée sans scellé",
  reply:
    "Bonjour Ines,\n\nMerci de nous avoir prévenus. Nous vous renvoyons la référence dès aujourd'hui, sans frais.\n\nSami — équipe Cléopâtre",
  trackingHref: "https://para-cleopatre.tn/aide",
};

const STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"];

async function main() {
  const jobs: { file: string; letter: { subject: string; html: string } }[] = [
    { file: "01-bienvenue", letter: welcomeEmail({ firstName: "Ines" }) },
    ...STATUS_ORDER.map((s, i) => ({ file: `${String(i + 2).padStart(2, "0")}-commande-${s}`, letter: orderStatusEmail(order(s)) })),
    {
      file: "09-mot-de-passe",
      letter: passwordResetEmail({ resetHref: "https://para-cleopatre.tn/mot-de-passe?token=demo-token&email=ines%40example.tn" }),
    },
    { file: "10-ticket-cree", letter: ticketCreatedEmail(TICKET) },
    { file: "11-ticket-reponse", letter: ticketReplyEmail(TICKET) },
    { file: "12-ticket-resolu", letter: ticketResolvedEmail(TICKET) },
    {
      file: "13-retour-en-stock",
      letter: restockEmail({
        productName: "Hyalu B5 Sérum 30 ml",
        brandName: "La Roche-Posay",
        productHref: "https://para-cleopatre.tn/produit/hyalu-b5-serum-30-ml",
        imageHref: "https://para-cleopatre.tn/images/demo.jpg",
        imageAlt: "Hyalu B5 Sérum 30 ml",
        priceLabel: "128.000 DT",
        stock: 6,
      }),
    },
    {
      file: "14-des-nouvelles",
      letter: careFeedbackEmail({
        productName: "Hyalu B5 Sérum 30 ml",
        reviewHref: "https://para-cleopatre.tn/produit/hyalu-b5-serum-30-ml#avis",
      }),
    },
    {
      file: "15-dix-jours-apres",
      letter: careFollowUpEmail({
        productName: "Hyalu B5 Sérum 30 ml",
        productHref: "https://para-cleopatre.tn/produit/hyalu-b5-serum-30-ml",
      }),
    },
  ];

  let failed = 0;
  await mkdir(OUT, { recursive: true });

  for (const { file, letter } of jobs) {
    const text = htmlToText(letter.html);

    // The non-negotiables: a real document, the subject in the <title>, the
    // house signature, and a plain-text twin that still carries the facts.
    const problems: string[] = [];
    if (!letter.html.startsWith("<!DOCTYPE html")) problems.push("no doctype");
    if (!letter.html.includes(`<title>${letter.subject}</title>`)) problems.push("subject not in <title>");
    if (!letter.html.includes("Cléopâtre")) problems.push("wordmark missing");
    if (letter.html.includes("undefined") || letter.html.includes("[object Object]")) problems.push("interpolation leaked");
    if (/<[a-z]+[^>]*style="[^"]*\bundefined\b/i.test(letter.html)) problems.push("undefined inside a style");
    if (text.length < 200) problems.push("text twin is empty");
    if (file.includes("commande")) {
      if (!text.includes("CL-260911-A7K2")) problems.push("order number missing from text");
      if (!text.includes(ORDER_MAIL_COPY[STATUS_ORDER[Number(file.slice(0, 2)) - 2]].statusLabel)) problems.push("status label missing from text");
    }
    if (file.includes("ticket") && !text.includes("#42")) problems.push("ticket reference missing from text");

    await writeFile(path.join(OUT, `${file}.html`), letter.html, "utf8");
    await writeFile(path.join(OUT, `${file}.txt`), `${letter.subject}\n\n${text}\n`, "utf8");

    if (problems.length) failed++;
    process.stdout.write(
      `${problems.length ? "\u001b[31mFAIL\u001b[0m " : "\u001b[32mok\u001b[0m   "} ${problems.join(", ").padEnd(28)} ${file.padEnd(24)} « ${letter.subject} »\n`,
    );
  }

  process.stdout.write(`\n${jobs.length - failed}/${jobs.length} letters rendered → ${OUT}\n`);
  if (failed) process.exitCode = 1;
}

void main();
