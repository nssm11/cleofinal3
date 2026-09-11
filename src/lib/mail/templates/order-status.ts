import { MAIL, MAIL_FONT_SANS, url } from "../brand";
import { ORDER_MAIL_COPY } from "../copy";
import { button, emailShell, esc, fact, heading, eyebrow, orderLine, rule, secondaryLink, status, steps, text } from "../shell";
import type { MailOrder } from "../types";

/**
 * 02 · LE SUIVI — one letter per status, seven letters in one template.
 *
 * The anatomy never changes, so a customer learns to read it: the status
 * printed once and large, the sentence that explains it, the order in full,
 * then what happens next. Only the words and the invitation change.
 */
export function orderStatusEmail(order: MailOrder): { subject: string; html: string } {
  const c = ORDER_MAIL_COPY[order.status];
  const subject = c.subject.replace("{number}", order.number);
  const link = (p: (typeof c.cta)["path"]) => (p === "tracking" ? order.links.tracking : order.links[p]);

  const lines = order.lines.map(orderLine).join("");
  const facts = [
    fact("Commande", order.number),
    fact("Passée le", order.placedAt),
    fact("Livraison", order.shippingLabel),
    fact("Règlement", order.paymentLabel),
    order.trackingCode ? fact("N° de suivi", order.trackingCode) : "",
  ].join("");

  const trackingNote = order.trackingCode
    ? `<p style="margin:14px 0 0;font-family:${MAIL_FONT_SANS};font-size:12.5px;line-height:1.6;color:${MAIL.muted}">${
        order.carrierUrl
          ? `Suivre chez le transporteur&nbsp;: <a href="${esc(order.carrierUrl)}" style="color:${MAIL.champagne2}">${esc(order.carrierUrl)}</a>`
          : "Communiquez ce numéro au transporteur&nbsp;: il identifie votre colis sans autre information."
      }</p>`
    : "";

  const body = `
    ${eyebrow(c.eyebrow)}
    ${status(c.statusLabel, c.tone)}
    ${heading(esc(c.title), 27)}
    ${rule("20px 0 22px")}
    ${text(esc(c.body.replace("{name}", order.firstName)))}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tbody>${lines}</tbody></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px"><tbody><tr>
      <td style="padding:14px 0 0;font-family:${MAIL_FONT_SANS};font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${MAIL.muted2}">Total</td>
      <td align="right" style="padding:14px 0 0;font-family:${MAIL_FONT_SANS};font-size:20px;color:${MAIL.ink};text-align:right">${esc(order.total)}</td>
    </tr></tbody></table>
    ${rule("22px 0 6px")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tbody>${facts}</tbody></table>
    ${trackingNote}
    ${rule("24px 0 20px")}
    ${eyebrow("La suite", MAIL.muted2)}
    ${steps(c.steps)}
    <div style="text-align:center;margin:22px 0 4px">${button(link(c.cta.path), c.cta.label)}</div>
    ${c.secondary ? secondaryLink(link(c.secondary.path), c.secondary.label) : ""}
    ${rule("26px 0 18px")}
    <p style="margin:0;font-family:${MAIL_FONT_SANS};font-size:12px;line-height:1.65;color:${MAIL.muted2}">
      Ce lien de suivi est personnel&nbsp;: il ouvre votre commande sans mot de passe. Ne le transférez pas.
      <a href="${esc(url("/suivi"))}" style="color:${MAIL.muted2}">Ouvrir la page de suivi</a>
    </p>
  `;

  return { subject, html: emailShell({ subject, preheader: c.preheader, body }) };
}
