import { MAIL, MAIL_FONT_SANS } from "../brand";
import { PASSWORD_RESET_MAIL as C } from "../copy";
import { button, emailShell, esc, heading, eyebrow, notice, rule, text } from "../shell";

/**
 * 03 · MOT DE PASSE OUBLIÉ — one button, one warning, one visible link.
 *
 * The raw URL is printed as well as linked: it is the fallback for every client
 * that strips or rewrites buttons, and it lets a suspicious customer check
 * where the link really goes before clicking.
 */
export function passwordResetEmail(o: { resetHref: string; expiresInMinutes?: number }): { subject: string; html: string } {
  const minutes = o.expiresInMinutes ?? 60;
  const body = `
    ${eyebrow(C.eyebrow)}
    ${heading(esc(C.title))}
    ${rule("20px 0 24px")}
    ${text(esc(C.body))}
    <div style="text-align:center;margin:24px 0 8px">${button(o.resetHref, C.cta)}</div>
    ${rule("22px 0 18px")}
    ${notice(`<strong style="color:${MAIL.ink}">Valable ${minutes} minutes.</strong> ${esc(C.notice)}`, "warn")}
    <p style="margin:20px 0 0;font-family:${MAIL_FONT_SANS};font-size:11.5px;line-height:1.6;color:${MAIL.muted2}">
      ${esc(C.fallbackLabel)}<br />
      <a href="${esc(o.resetHref)}" style="color:${MAIL.muted2};word-break:break-all">${esc(o.resetHref)}</a>
    </p>
  `;
  return {
    subject: C.subject,
    html: emailShell({ subject: C.subject, preheader: C.preheader.replace("une heure", `${minutes} minutes`), body }),
  };
}
