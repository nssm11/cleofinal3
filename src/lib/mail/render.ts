/**
 * LE TEXTE — the plain-text twin of every letter.
 *
 * `react-dom/server` cannot be imported from a server action, and transactional
 * mail has no state to render anyway, so the templates write markup directly
 * (see `shell.ts`). This module only derives the text alternative, which exists
 * so that a client refusing HTML still receives the order number, the total
 * and the link.
 */

/**
 * A readable text/plain twin. Deliberately dumb: it exists so that a client
 * which refuses HTML still receives the order number, the total and the link.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // A link keeps its words and gains its address.
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, text: string) => {
      const label = text.replace(/<[^>]*>/g, "").trim();
      return label && label !== href ? `${label} (${href})` : href;
    })
    .replace(/<\/(p|div|tr|td|h1|h2|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
