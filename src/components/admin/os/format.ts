/**
 * Formats as data.
 *
 * These components are rendered from Server Components as well as from client
 * ones, and a closure cannot cross that boundary. A format is therefore
 * described, not passed: `{ kind: "dt", digits: 0 }`.
 */
export type FormatSpec = {
  kind?: "dt" | "count" | "decimal" | "percent" | "plain";
  digits?: number;
  suffix?: string;
  suffixes?: [string, string];
  prefix?: string;
};

const NUMBER = new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 });
const DECIMAL = new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function makeFormat(spec?: FormatSpec): (v: number) => string {
  const { kind = "count", digits = 3, suffix, suffixes, prefix } = spec ?? {};
  return (v: number) => {
    let body: string;
    if (kind === "dt") body = `${new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(v / 1000)} DT`;
    else if (kind === "decimal") body = DECIMAL.format(v);
    else if (kind === "percent") body = `${DECIMAL.format(v)} %`;
    else if (kind === "plain") body = String(v);
    else body = NUMBER.format(v);
    if (suffixes) body = `${body} ${v > 1 ? suffixes[1] : suffixes[0]}`;
    if (suffix) body = `${body} ${suffix}`;
    return prefix ? `${prefix}${body}` : body;
  };
}
