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
