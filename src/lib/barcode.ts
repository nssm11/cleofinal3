/**
 * EAN-13, computed and checked.
 *
 * A barcode is the one identifier a counter can read without asking anyone, so
 * it has to be *correct*: the thirteenth digit is a check digit, and a number
 * typed wrong by one digit must be rejected rather than looked up.
 *
 * The shop numbers its own stock in the Tunisian 619 prefix (GS1 Tunisia). When
 * a real GTIN comes from the laboratory, it is kept as it stands — we never
 * renumber a manufacturer's barcode.
 */

export const TN_PREFIX = "619";

/** The check digit of the first twelve digits (weights 1,3 alternating). */
export function ean13CheckDigit(first12: string): number {
  const digits = first12.replace(/\D/g, "").padEnd(12, "0").slice(0, 12).split("").map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

/** A complete, valid EAN-13 from any seed — deterministic, so seeds stay stable. */
export function ean13(seed: string | number): string {
  const body = seed.toString().replace(/\D/g, "").padStart(9, "0").slice(-9);
  const first12 = `${TN_PREFIX}${body}`;
  return `${first12}${ean13CheckDigit(first12)}`;
}

export function isValidEan13(code: string | null | undefined): boolean {
  if (!code) return false;
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 13) return false;
  return ean13CheckDigit(clean.slice(0, 12)) === Number(clean[12]);
}

/* ── Le même code, dessiné ──────────────────────────────────────────────────
   A printed shelf label is read by a scanner, so the bars have to be the real
   EAN-13 encoding — left guard, six digits in L or G parity chosen by the
   first digit, centre guard, six digits in R, right guard. Ninety-five
   modules, no invention. That is what makes the label on the box and the
   label on the shelf the same object.
   ------------------------------------------------------------------------- */

const L: Record<string, string> = {
  "0": "0001101", "1": "0011001", "2": "0010011", "3": "0111101", "4": "0100011",
  "5": "0110001", "6": "0101111", "7": "0111011", "8": "0110111", "9": "0001011",
};
const G: Record<string, string> = {
  "0": "0100111", "1": "0110011", "2": "0011011", "3": "0100001", "4": "0011101",
  "5": "0111001", "6": "0000101", "7": "0010001", "8": "0001001", "9": "0010111",
};
const R: Record<string, string> = {
  "0": "1110010", "1": "1100110", "2": "1101100", "3": "1000010", "4": "1011100",
  "5": "1001110", "6": "1010000", "7": "1000100", "8": "1001000", "9": "1110100",
};
/** Parity pattern of the six left digits, chosen by the first digit. */
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

/** The 95 modules of an EAN-13, "1" = bar. Empty string if the code is invalid. */
export function ean13Modules(code: string): string {
  const clean = (code ?? "").replace(/\D/g, "");
  if (clean.length !== 13) return "";
  const first = Number(clean[0]);
  const parity = PARITY[first];
  if (!parity) return "";
  let out = "101";
  for (let i = 0; i < 6; i++) {
    const table = parity[i] === "L" ? L : G;
    out += table[clean[i + 1]] ?? "";
  }
  out += "01010";
  for (let i = 7; i < 13; i++) out += R[clean[i]] ?? "";
  out += "101";
  return out.length === 95 ? out : "";
}

/** Bar rectangles (x, width in modules) — what an SVG actually needs. */
export function ean13Bars(code: string): { x: number; w: number }[] {
  const modules = ean13Modules(code);
  if (!modules) return [];
  const bars: { x: number; w: number }[] = [];
  let i = 0;
  while (i < modules.length) {
    if (modules[i] === "1") {
      let w = 1;
      while (modules[i + w] === "1") w++;
      bars.push({ x: i, w });
      i += w;
    } else i++;
  }
  return bars;
}

/** Where the digits sit under the bars: left group, right group. */
export const EAN13_MODULES = 95;
