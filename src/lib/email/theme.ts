/**
 * The e-mails wear the same dress as the house. Every value below mirrors a
 * design token from `globals.css` — grounds, inks, champagne — translated into
 * inline styles because e-mail clients read nothing else.
 */
export const EMAIL = {
  bg: "#f6f1e6", // ivory
  card: "#faf6ec", // cream
  cardEdge: "#e2d8c2",
  paper: "#f2ecdf", // paper
  ink: "#211b12",
  charcoal: "#38322a",
  muted: "#6d6253",
  muted2: "#988b72",
  champagne: "#a3803f",
  champagne2: "#87662e",
  champagne3: "#cbb078",
  champagneSoft: "#eee2c9",
  success: "#4a3d1f",
  error: "#96412f",
  dark: "#16120c", // noir — the colophon band
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  sans: 'Manrope, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  microCaps: {
    fontFamily: "Manrope, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
    fontSize: "10px",
    letterSpacing: "0.28em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    color: "#988b72",
  },
  width: 560,
} as const;

/** E-mail locales the house writes in: French, and Tunisian (Latin script). */
export type EmailLocale = "fr" | "tn";
export function emailLocale(locale: string): EmailLocale {
  return locale === "fr" ? "fr" : "tn";
}
