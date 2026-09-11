import { env, SITE_URL } from "@/lib/env";

/**
 * LA PAPETERIE — the palette and the facts every e-mail is printed with.
 *
 * E-mail clients are not browsers: they strip `<style>` in places, ignore
 * `class` in others, and Outlook still lays out with tables. So the house
 * identity is carried by *inline* values taken from the same tokens the site
 * uses (`globals.css`), and every colour here has a twin there.
 */
export const MAIL = {
  /** The ivory the page is printed on. */
  cream: "#faf6ec",
  paper: "#f2ecdf",
  marble: "#ece4d3",
  /** The ground outside the card — a shade deeper, so the card reads as paper. */
  ground: "#e9e0cd",
  ink: "#211b12",
  charcoal: "#38322a",
  muted: "#6d6253",
  muted2: "#988b72",
  line: "#ddd3bd",
  champagne: "#a3803f",
  champagne2: "#87662e",
  champagne3: "#cbb078",
  champagneSoft: "#eee2c9",
  /** The house's blackened pharmacy green — headers and buttons. */
  noir: "#0b1914",
  noir2: "#16241c",
  paperOnDark: "#f6f1e6",
  success: "#2d6a4f",
  warning: "#91632c",
  error: "#96412f",
} as const;

/** E-mail clients rarely carry Newsreader; Georgia is the closest widely
 *  installed serif with the same editorial temperament. */
export const MAIL_FONT_SERIF = 'Georgia, "Times New Roman", "Newsreader", serif';
export const MAIL_FONT_SANS = '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

export const HOUSE = {
  name: "Cléopâtre",
  tagline: "Espace Santé Beauté",
  since: "depuis 1978",
  phone: "71 450 210",
  phoneHref: "tel:+21671450210",
  email: "bonjour@cleopatre.tn",
  hours: "Lundi – samedi, 8 h 30 → 20 h 30 · Dimanche, 9 h → 14 h",
  counters: [
    { name: "Ezzahra", line: "Avenue Habib Bourguiba, face à la municipalité" },
    { name: "Hammam-Lif", line: "Rue de la République, centre-ville" },
  ],
  /** Set `MAIL_SOCIAL="Instagram|https://…,Facebook|https://…"`. Empty means
   *  the line is not printed at all — a link to the wrong place is worse than
   *  no link. */
  social: env.MAIL_SOCIAL,
  legal:
    "Cléopâtre — Espace Santé Beauté, Ezzahra & Hammam-Lif, Tunisie. Vous recevez ce message parce qu'il concerne votre compte ou une commande passée chez nous.",
} as const;

/** Absolute URL — every link in an e-mail must survive being read offline. */
export function url(path = "/"): string {
  const base = SITE_URL.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
