import { HOUSE, MAIL, MAIL_FONT_SANS, MAIL_FONT_SERIF } from "../brand";
import { TICKET_CREATED_MAIL, TICKET_REPLY_MAIL, TICKET_RESOLVED_MAIL } from "../copy";
import { button, emailShell, esc, heading, eyebrow, rule, steps, text } from "../shell";
import type { MailTicket } from "../types";

/**
 * 04 · LE SUPPORT — the three letters of a conversation, in one anatomy.
 *
 * The reference is printed like a counter ticket in every one of them, because
 * it is the thing the customer will quote back to us on the phone.
 */

function reference(reference: string, subject: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px"><tbody><tr>
    <td style="padding:14px 16px;background:${MAIL.paper};border-left:2px solid ${MAIL.champagne2}">
      <p style="${`margin:0;font-family:${MAIL_FONT_SANS};font-size:9px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${MAIL.muted2}`}">Référence</p>
      <p style="margin:6px 0 0;font-family:${MAIL_FONT_SERIF};font-size:22px;color:${MAIL.ink}">#${esc(reference)}</p>
      <p style="margin:6px 0 0;font-family:${MAIL_FONT_SANS};font-size:13px;line-height:1.55;color:${MAIL.muted}">${esc(subject)}</p>
    </td></tr></tbody></table>`;
}

function sign(): string {
  return `${rule("26px 0 18px")}
    <p style="margin:0;font-family:${MAIL_FONT_SANS};font-size:12.5px;line-height:1.7;color:${MAIL.muted}">
      Préférez-vous parler&nbsp;? Le <a href="${HOUSE.phoneHref}" style="color:${MAIL.champagne2};text-decoration:none">${HOUSE.phone}</a>
      est tenu par nos équipes, ${esc(HOUSE.hours.toLowerCase())}.
    </p>`;
}

function cta(href: string, label: string): string {
  return `<div style="text-align:center;margin:22px 0 0">${button(href, label)}</div>`;
}

const fill = (t: MailTicket) => (s: string) => s.replaceAll("{id}", t.reference).replaceAll("{name}", t.name || "bonjour");

/** 04a · Demande créée. */
export function ticketCreatedEmail(t: MailTicket): { subject: string; html: string } {
  const f = fill(t);
  const subject = f(TICKET_CREATED_MAIL.subject);
  const body = `
    ${eyebrow(TICKET_CREATED_MAIL.eyebrow)}
    ${heading(esc(TICKET_CREATED_MAIL.title))}
    ${rule("20px 0 24px")}
    ${text(esc(f(TICKET_CREATED_MAIL.body)))}
    ${reference(t.reference, t.subject)}
    ${eyebrow("Ce qui se passe maintenant", MAIL.muted2)}
    ${steps(TICKET_CREATED_MAIL.steps.map(f))}
    ${cta(t.trackingHref, TICKET_CREATED_MAIL.cta.label)}
    ${sign()}
  `;
  return { subject, html: emailShell({ subject, preheader: TICKET_CREATED_MAIL.preheader, body }) };
}

/** 04b · Réponse reçue. */
export function ticketReplyEmail(t: MailTicket): { subject: string; html: string } {
  const f = fill(t);
  const subject = f(TICKET_REPLY_MAIL.subject);
  const reply = t.reply
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px"><tbody><tr>
        <td style="padding:16px 18px;background:${MAIL.cream};border:1px solid ${MAIL.line}">
          <p style="margin:0 0 8px;font-family:${MAIL_FONT_SANS};font-size:9px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${MAIL.champagne2}">Réponse de l&apos;équipe Cléopâtre</p>
          <p style="margin:0;font-family:${MAIL_FONT_SERIF};font-size:15.5px;line-height:1.75;color:${MAIL.charcoal};white-space:pre-line">${esc(t.reply)}</p>
        </td></tr></tbody></table>`
    : "";
  const body = `
    ${eyebrow(TICKET_REPLY_MAIL.eyebrow)}
    ${heading(esc(TICKET_REPLY_MAIL.title))}
    ${rule("20px 0 24px")}
    ${text(esc(f(TICKET_REPLY_MAIL.body)))}
    ${reference(t.reference, t.subject)}
    ${reply}
    ${cta(t.trackingHref, TICKET_REPLY_MAIL.cta.label)}
    ${sign()}
  `;
  return { subject, html: emailShell({ subject, preheader: TICKET_REPLY_MAIL.preheader, body }) };
}

/** 04c · Demande close. */
export function ticketResolvedEmail(t: MailTicket): { subject: string; html: string } {
  const f = fill(t);
  const subject = f(TICKET_RESOLVED_MAIL.subject);
  const body = `
    ${eyebrow(TICKET_RESOLVED_MAIL.eyebrow)}
    ${heading(esc(TICKET_RESOLVED_MAIL.title))}
    ${rule("20px 0 24px")}
    ${text(esc(f(TICKET_RESOLVED_MAIL.body)))}
    ${reference(t.reference, t.subject)}
    ${steps(TICKET_RESOLVED_MAIL.steps.map(f))}
    ${cta(t.trackingHref, TICKET_RESOLVED_MAIL.cta.label)}
    ${sign()}
  `;
  return { subject, html: emailShell({ subject, preheader: TICKET_RESOLVED_MAIL.preheader, body }) };
}
