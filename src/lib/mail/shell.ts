import { HOUSE, MAIL, MAIL_FONT_SANS, MAIL_FONT_SERIF, url } from "./brand";

/**
 * L'ENVELOPPE — the one layout every e-mail is printed on.
 *
 * Written as markup rather than as JSX on purpose: `react-dom/server` cannot
 * be imported from a server action (Next refuses it at build time, and rightly
 * — it would pull the whole reconciler into the action bundle). Transactional
 * mail has no state and no hydration, so a string is the honest representation
 * anyway. Every style is inline because that is the only thing Gmail, Apple
 * Mail and Outlook all honour; the single `<style>` block carries only what
 * cannot be inlined.
 *
 * The card is ivory paper on a slightly deeper ground, signed at the top by
 * the wordmark in the display serif, and closed by the counters, the social
 * line and the legal note — the same colophon as the site footer.
 */

const SERIF = MAIL_FONT_SERIF;
const SANS = MAIL_FONT_SANS;

/** Customer-supplied text (names, subjects, replies) goes through here. */
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ── Reusable declarations ─────────────────────────────────────────────── */

const CTA_LINK = `display:inline-block;padding:15px 30px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;text-decoration:none`;
const EYEBROW = `margin:0 0 14px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:.3em;text-transform:uppercase`;
const MICRO = `margin:0;font-family:${SANS};font-size:9px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${MAIL.muted2}`;
const SECONDARY_LINK = `font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${MAIL.muted};text-decoration:none;border-bottom:1px solid ${MAIL.line}`;

/* ── The parts ─────────────────────────────────────────────────────────── */

/** A CTA that survives Outlook: a table cell with a background, not a bare anchor. */
export function button(href: string, label: string, tone: "ink" | "outline" = "ink"): string {
  const solid = tone === "ink";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0"><tbody><tr>
    <td align="center" style="border-radius:2px;background:${solid ? MAIL.ink : "transparent"};border:1px solid ${solid ? MAIL.ink : MAIL.champagne2}">
      <a href="${esc(href)}" class="mail-btn" style="${CTA_LINK};color:${solid ? MAIL.paperOnDark : MAIL.champagne2}">${esc(label)}</a>
    </td></tr></tbody></table>`;
}

export function heading(text: string, size = 26): string {
  return `<h1 class="mail-h1" style="margin:0;font-family:${SERIF};font-size:${size}px;line-height:1.15;letter-spacing:-.02em;color:${MAIL.ink}">${text}</h1>`;
}

export function eyebrow(text: string, color: string = MAIL.champagne2): string {
  return `<p style="${EYEBROW};color:${color}">${esc(text)}</p>`;
}

export function text(body: string, size = 15, color = MAIL.muted, extra = ""): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:${size}px;line-height:1.75;color:${color}${extra ? `;${extra}` : ""}">${body}</p>`;
}

/** The hairline the house uses instead of boxes. */
export function rule(margin = "26px 0"): string {
  return `<div style="height:1px;line-height:1px;font-size:0;background:${MAIL.line};margin:${margin}"></div>`;
}

/** The quieter invitation under the main button. */
export function secondaryLink(href: string, label: string): string {
  return `<p style="margin:10px 0 0;text-align:center"><a href="${esc(href)}" style="${SECONDARY_LINK}">${esc(label)}</a></p>`;
}

/** One fact in a definition row: label left, value right. */
export function fact(label: string, value: string): string {
  return `<tr>
    <td style="padding:9px 0;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${MAIL.muted2}">${esc(label)}</td>
    <td align="right" style="padding:9px 0;font-family:${SANS};font-size:14px;color:${MAIL.ink};text-align:right">${esc(value)}</td>
  </tr>`;
}

/** A line of the order: brand in micro-caps, name in the serif, price aligned. */
export function orderLine(o: { name: string; brandName?: string | null; quantity: number; lineTotal: string }): string {
  const cell = `padding:12px 0;border-bottom:1px solid ${MAIL.line}`;
  return `<tr>
    <td style="${cell}">
      ${o.brandName ? `<p style="${MICRO};margin:0 0 4px">${esc(o.brandName)}</p>` : ""}
      <p style="margin:${o.brandName ? "0" : "0"};font-family:${SERIF};font-size:16px;line-height:1.35;color:${MAIL.ink}">${esc(o.name)}</p>
      <p style="margin:4px 0 0;font-family:${SANS};font-size:12px;color:${MAIL.muted}">Quantité ${esc(o.quantity)}</p>
    </td>
    <td align="right" valign="top" style="${cell};font-family:${SANS};font-size:14px;white-space:nowrap;color:${MAIL.ink};text-align:right">${esc(o.lineTotal)}</td>
  </tr>`;
}

/** The status, printed once and large — the whole point of the message. */
export function status(label: string, tone: "good" | "warn" | "bad" | "neutral"): string {
  const color = tone === "good" ? MAIL.success : tone === "warn" ? MAIL.warning : tone === "bad" ? MAIL.error : MAIL.champagne2;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px"><tbody><tr>
    <td style="padding:8px 14px;border-left:2px solid ${color};background:${MAIL.champagneSoft};font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:${color}">${esc(label)}</td>
  </tr></tbody></table>`;
}

/** What happens next — never more than three points. */
export function steps(items: string[]): string {
  const rows = items
    .map(
      (t, i) => `<tr>
        <td valign="top" style="padding:0 14px 10px 0;font-family:${SERIF};font-style:italic;font-size:13px;color:${MAIL.champagne2};white-space:nowrap">${String(i + 1).padStart(2, "0")}</td>
        <td valign="top" style="padding:0 0 10px;font-family:${SANS};font-size:14px;line-height:1.6;color:${MAIL.muted}">${esc(t)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 8px"><tbody>${rows}</tbody></table>`;
}

/** A tinted notice — used for the security warning and the counters. */
export function notice(body: string, tone: "warn" | "neutral" = "neutral"): string {
  const color = tone === "warn" ? MAIL.warning : MAIL.champagne2;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 8px"><tbody><tr>
    <td style="padding:14px 16px;background:${MAIL.champagneSoft};border-left:2px solid ${color};font-family:${SANS};font-size:13px;line-height:1.65;color:${MAIL.charcoal}">${body}</td>
  </tr></tbody></table>`;
}

/* ── The colophon ──────────────────────────────────────────────────────── */

function colophon(footerNote?: string): string {
  const counters = HOUSE.counters
    .map(
      (c) =>
        `<p style="margin:0 0 6px;font-family:${SANS};font-size:12px;line-height:1.55;color:${MAIL.muted}"><strong style="color:${MAIL.ink};font-weight:700">${esc(c.name)}</strong><br />${esc(c.line)}</p>`,
    )
    .join("");
  const social = HOUSE.social.length
    ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:12px">${HOUSE.social.map(
        (s, i) =>
          `${i > 0 ? `<span style="color:${MAIL.muted2}"> · </span>` : ""}<a href="${esc(s.href)}" style="color:${MAIL.champagne2};text-decoration:none">${esc(s.label)}</a>`,
      ).join("")}</p>`
    : "";

  return `<tr><td style="padding:26px 40px 30px;background:${MAIL.paper};border-top:1px solid ${MAIL.line}">
    ${footerNote ? `<p style="margin:0 0 18px;font-family:${SANS};font-size:12.5px;line-height:1.7;color:${MAIL.muted}">${footerNote}</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tbody>
      <tr>
        <td class="mail-stack" width="50%" valign="top" style="padding-bottom:14px">
          <p style="${MICRO};margin:0 0 8px">Nos deux comptoirs</p>
          ${counters}
        </td>
        <td class="mail-stack" width="50%" valign="top" style="padding-bottom:14px">
          <p style="${MICRO};margin:0 0 8px">Nous joindre</p>
          <p style="margin:0 0 6px;font-family:${SANS};font-size:12px;line-height:1.55;color:${MAIL.muted}">
            <a href="${HOUSE.phoneHref}" style="color:${MAIL.ink};text-decoration:none">${HOUSE.phone}</a><br />
            <a href="mailto:${HOUSE.email}" style="color:${MAIL.ink};text-decoration:none">${HOUSE.email}</a><br />
            ${esc(HOUSE.hours)}
          </p>
        </td>
      </tr>
      <tr><td colspan="2" style="padding-top:6px">
        ${social}
        <div style="height:1px;line-height:1px;font-size:0;background:${MAIL.line};margin:0 0 12px"></div>
        <p style="margin:0;font-family:${SANS};font-size:10.5px;line-height:1.65;color:${MAIL.muted2}">${esc(HOUSE.legal)}</p>
      </td></tr>
    </tbody></table>
  </td></tr>`;
}

/* ── The whole letter ──────────────────────────────────────────────────── */

export function emailShell(o: { subject: string; preheader: string; body: string; footerNote?: string }): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(o.subject)}</title>
<style>
  @media only screen and (max-width: 620px) {
    .mail-card { width: 100% !important; }
    .mail-pad { padding-left: 22px !important; padding-right: 22px !important; }
    .mail-stack { display: block !important; width: 100% !important; }
    .mail-h1 { font-size: 23px !important; }
  }
  .mail-btn:hover { opacity: .86; }
  a { color: ${MAIL.champagne2}; }
</style>
</head>
<body style="margin:0;padding:0;background:${MAIL.ground};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(o.preheader)}${"&nbsp;".repeat(60)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MAIL.ground}"><tbody><tr>
  <td align="center" style="padding:26px 12px 34px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="mail-card" style="width:600px;max-width:100%;background:${MAIL.cream};border:1px solid ${MAIL.line}"><tbody>
      <tr><td align="center" style="padding:30px 24px 26px;background:${MAIL.noir};border-bottom:2px solid ${MAIL.champagne}">
        <a href="${esc(url("/"))}" style="font-family:${SERIF};font-size:27px;font-weight:300;letter-spacing:.01em;color:${MAIL.paperOnDark};text-decoration:none">${esc(HOUSE.name)}</a>
        <p style="margin:8px 0 0;font-family:${SANS};font-size:8px;font-weight:700;letter-spacing:.36em;text-transform:uppercase;color:${MAIL.champagne3}">${esc(HOUSE.tagline)}</p>
      </td></tr>
      <tr><td class="mail-pad" style="padding:34px 40px 30px">${o.body}</td></tr>
      ${colophon(o.footerNote)}
    </tbody></table>
  </td>
</tr></tbody></table>
</body>
</html>`;
}
