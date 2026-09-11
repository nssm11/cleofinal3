import { HOUSE, MAIL, url } from "../brand";
import { WELCOME_MAIL } from "../copy";
import { button, emailShell, esc, heading, eyebrow, rule, secondaryLink, steps, text } from "../shell";

/**
 * 01 · BIENVENUE — the first letter a customer receives.
 *
 * It says three things and no more: you are welcome, this is how the house
 * works, and here is the door. No discount code — a welcome that opens with a
 * reduction teaches the customer to wait for the next one.
 */
export function welcomeEmail(o: { firstName: string; accountHref?: string }): { subject: string; html: string } {
  const first = o.firstName.trim() || "bienvenue";
  const body = `
    ${eyebrow(WELCOME_MAIL.eyebrow)}
    ${heading(esc(WELCOME_MAIL.title(first)))}
    ${rule("20px 0 24px")}
    ${text(esc(WELCOME_MAIL.body(first)))}
    ${steps([...WELCOME_MAIL.points])}
    <div style="text-align:center;margin:26px 0 6px">${button(url(WELCOME_MAIL.cta.href), WELCOME_MAIL.cta.label)}</div>
    ${secondaryLink(o.accountHref ?? url(WELCOME_MAIL.secondary.href), WELCOME_MAIL.secondary.label)}
    ${rule("28px 0 20px")}
    ${text(
      `Une hésitation sur une référence&nbsp;? Appelez le <a href="${HOUSE.phoneHref}" style="color:${MAIL.champagne2};text-decoration:none">${HOUSE.phone}</a> — un pharmacien vous répond, ${esc(HOUSE.hours.toLowerCase())}.`,
      14,
    )}
  `;
  return {
    subject: WELCOME_MAIL.subject,
    html: emailShell({ subject: WELCOME_MAIL.subject, preheader: WELCOME_MAIL.preheader, body }),
  };
}
