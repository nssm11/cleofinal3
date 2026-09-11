import { test } from "node:test";
import assert from "node:assert/strict";
import { ORDER_MAIL_COPY } from "./copy";
import { ORDER_FLOW, ORDER_STEPS } from "@/lib/order-constants";
import { htmlToText } from "./render";
import { welcomeEmail } from "./templates/welcome";
import { orderStatusEmail } from "./templates/order-status";
import { ticketReplyEmail } from "./templates/ticket";
import { restockEmail } from "./templates/restock";
import type { MailOrder, MailTicket } from "./types";
import type { OrderStatus } from "@/db/schema";

/* The copy and the text renderer are the two parts of the mail system that
   can be checked without a provider: every status must have a letter, and the
   plain-text twin must still carry the facts. */

const STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"] as const;

test("every order status has a letter", () => {
  for (const s of STATUSES) {
    const c = ORDER_MAIL_COPY[s];
    assert.ok(c, `no copy for ${s}`);
    assert.match(c.subject, /\{number\}/, `${s}: the subject must name the order`);
    assert.ok(c.title.length > 3, `${s}: title`);
    assert.ok(c.statusLabel.length > 2, `${s}: status label`);
    assert.ok(c.steps.length >= 3, `${s}: at least three next steps`);
    assert.ok(c.body.includes("{name}"), `${s}: the letter must greet the customer by name`);
    assert.ok(["good", "warn", "bad", "neutral"].includes(c.tone), `${s}: tone`);
  }
});

test("the seven letters are not the same letter", () => {
  const bodies = new Set(STATUSES.map((s) => ORDER_MAIL_COPY[s].body));
  assert.equal(bodies.size, STATUSES.length);
  const ctas = new Set(STATUSES.map((s) => ORDER_MAIL_COPY[s].cta.label));
  assert.ok(ctas.size >= 4, "the invitation should follow the status");
});

test("a refund is announced as a refund", () => {
  assert.match(ORDER_MAIL_COPY.returned.statusLabel, /Rembours/i);
  assert.match(ORDER_MAIL_COPY.returned.body, /remboursement/i);
});

test("a shipment carries its tracking number", () => {
  assert.match(ORDER_MAIL_COPY.shipped.steps.join(" "), /numéro/i);
});

test("htmlToText keeps the words and recovers the addresses", () => {
  const html = `<html><head><style>.x{color:red}</style></head><body>
    <h1>Commande confirmée</h1>
    <p>Bonjour Ines,</p>
    <a href="https://para-cleopatre.tn/suivi?n=CL-1">Suivre ma commande</a>
    <p>Total&nbsp;: 269.500&nbsp;DT</p>
  </body></html>`;
  const text = htmlToText(html);
  assert.match(text, /Commande confirmée/);
  assert.match(text, /Bonjour Ines/);
  assert.match(text, /Suivre ma commande \(https:\/\/para-cleopatre\.tn\/suivi\?n=CL-1\)/);
  assert.match(text, /269\.500 DT/);
  assert.ok(!text.includes("<"), "no tag survives");
  assert.ok(!text.includes("color:red"), "no stylesheet survives");
  assert.ok(!text.includes("&nbsp;"), "no entity survives");
});

test("a bare link does not duplicate itself", () => {
  const text = htmlToText('<a href="https://x.tn">https://x.tn</a>');
  assert.equal(text, "https://x.tn");
});

/* ── The letters themselves ────────────────────────────────────────────── */

const ORDER: MailOrder = {
  number: "CL-260911-A7K2",
  email: "ines@example.tn",
  firstName: "Ines",
  status: "shipped",
  total: "269.500 DT",
  shippingLabel: "Livraison standard",
  paymentLabel: "Paiement à la livraison",
  placedAt: "11 septembre 2026",
  trackingCode: "TN-9938-2214",
  carrierUrl: null,
  links: {
    tracking: "https://para-cleopatre.tn/suivi?n=CL-260911-A7K2&k=demo",
    shop: "https://para-cleopatre.tn/boutique",
    support: "https://para-cleopatre.tn/aide",
    account: "https://para-cleopatre.tn/compte/commandes",
  },
  lines: [{ name: "Hyalu B5 Sérum <30 ml>", brandName: "La Roche-Posay", quantity: 1, lineTotal: "128.000 DT" }],
};

const TICKET: MailTicket = {
  reference: "42",
  email: "ines@example.tn",
  name: "Ines",
  subject: "Colis <endommagé>",
  reply: "Bonjour Ines,\n\nNous vous renvoyons la référence.",
  trackingHref: "https://para-cleopatre.tn/aide",
};

test("every letter is a complete HTML document with its subject in the title", () => {
  const letters = [
    welcomeEmail({ firstName: "Ines" }),
    ...(["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"] as OrderStatus[]).map((s) =>
      orderStatusEmail({ ...ORDER, status: s }),
    ),
    ticketReplyEmail(TICKET),
  ];
  for (const l of letters) {
    assert.ok(l.html.startsWith("<!DOCTYPE html"), `${l.subject}: doctype`);
    assert.match(l.html, /<html lang="fr">/);
    assert.match(l.html, /<\/html>\s*$/);
    assert.ok(l.html.includes(`<title>${l.subject}</title>`), `${l.subject}: title`);
    assert.ok(!l.html.includes("undefined"), `${l.subject}: an undefined leaked into the markup`);
    assert.ok(!/style="[^"]*undefined/.test(l.html), `${l.subject}: an undefined leaked into a style`);
    assert.ok(l.html.includes("Cléopâtre"), `${l.subject}: wordmark`);
  }
});

test("the order letter carries its facts and escapes customer text", () => {
  const { html } = orderStatusEmail(ORDER);
  assert.ok(html.includes("CL-260911-A7K2"));
  assert.ok(html.includes("269.500 DT"));
  assert.ok(html.includes("TN-9938-2214"));
  assert.ok(html.includes(ORDER_MAIL_COPY.shipped.statusLabel));
  // A product name containing markup must not become markup.
  assert.ok(html.includes("Hyalu B5 Sérum &lt;30 ml&gt;"));
  assert.ok(!html.includes("Sérum <30"), "raw angle brackets survived escaping");
});

test("the tracking link is the per-order one, never a generic page", () => {
  const { html } = orderStatusEmail(ORDER);
  assert.ok(html.includes("suivi?n=CL-260911-A7K2&amp;k=demo") || html.includes("suivi?n=CL-260911-A7K2&k=demo"));
});

test("a support letter quotes its reference and escapes the reply", () => {
  const { html, subject } = ticketReplyEmail(TICKET);
  assert.equal(subject, "Une réponse à votre demande #42");
  assert.ok(html.includes("#42"));
  assert.ok(html.includes("Colis &lt;endommagé&gt;"));
  assert.ok(html.includes("Nous vous renvoyons la référence."));
  // Line breaks in a pharmacist's reply must survive as breaks.
  assert.match(html, /white-space:pre-line/);
});

test("the welcome letter does not ship a discount code", () => {
  const { html, subject } = welcomeEmail({ firstName: "Ines" });
  assert.equal(subject, "Bienvenue chez Cléopâtre ✨");
  assert.ok(html.includes("Bienvenue, Ines"));
  assert.ok(!/code promo|réduction|\-\d+\s?%/i.test(html), "a welcome should not open with a reduction");
});

test("links inside a letter are absolute", () => {
  const { html } = welcomeEmail({ firstName: "Ines" });
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    assert.ok(
      h.startsWith("http") || h.startsWith("mailto:") || h.startsWith("tel:"),
      `a relative link would break in an inbox: ${h}`,
    );
  }
});

/* ── 13 · De retour en stock ─────────────────────────────────────────────── */

test("the restock letter carries the product and an absolute link", () => {
  const { html, subject, } = restockEmail({
    productName: "Hyalu B5 Sérum 30 ml",
    brandName: "La Roche-Posay",
    productHref: "https://para-cleopatre.tn/produit/hyalu-b5-serum-30-ml",
    priceLabel: "128.000 DT",
    stock: 6,
  });
  assert.equal(subject, "Hyalu B5 Sérum 30 ml est de retour");
  assert.ok(html.includes("Hyalu B5 Sérum 30 ml"));
  assert.ok(html.includes("6 exemplaires"));
  assert.ok(html.includes("128.000 DT"));
  // A promise kept should not turn into a promotion.
  assert.ok(!/code promo|réduction|\-\d+\s?%/i.test(html), "a restock notice is not a sales pitch");
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length > 0);
  for (const h of hrefs) assert.ok(h.startsWith("http") || h.startsWith("mailto:") || h.startsWith("tel:"), h);
});

test("the restock letter survives a missing price, image and stock", () => {
  const { html } = restockEmail({
    productName: "Soin <test>",
    productHref: "https://para-cleopatre.tn/produit/soin",
  });
  // Customer-supplied text must never become markup.
  assert.ok(html.includes("Soin &lt;test&gt;"));
  assert.ok(!html.includes("<td width=\"92\""), "no image cell without an image");
});

test("a single remaining unit is announced as such", () => {
  const { html } = restockEmail({ productName: "A", productHref: "https://x.tn/a", stock: 1 });
  assert.ok(html.includes("Un seul exemplaire"));
});

/* ── Le récit du parcours ────────────────────────────────────────────────── */

test("every order status has tracking copy with its own next step", () => {
  for (const s of STATUSES) {
    const c = ORDER_STEPS[s];
    assert.ok(c, `no tracking copy for ${s}`);
    assert.ok(c.title.length > 4, `${s}: titre vide`);
    assert.ok(c.description.length > 20, `${s}: description trop courte pour rassurer`);
    assert.ok(c.next.length > 10, `${s}: aucune prochaine étape`);
  }
  // Only the two exits are terminal; the five others must keep the customer
  // on the progression rail.
  assert.deepEqual(STATUSES.filter((s) => ORDER_STEPS[s].terminal), ["cancelled", "returned"]);
  assert.equal(ORDER_FLOW.length, 5);
});

test("the shipped step is the one that promises a tracking number", () => {
  assert.match(ORDER_STEPS.shipped.description, /transporteur|suivi/i);
  assert.match(ORDER_STEPS.shipped.next, /suivi|transporteur|71 450 210/i);
});
