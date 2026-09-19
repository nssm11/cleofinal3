import { EAN13_MODULES, ean13Bars, ean13Modules } from "@/lib/barcode";

/**
 * LE CODE-BARRES, DESSINÉ
 *
 * SVG, pas d'image : une étiquette imprimée doit rester nette à n'importe
 * quelle taille, et un scanner au comptoir lit le motif, pas un JPEG. Les
 * barres viennent de l'encodage réel (voir src/lib/barcode.ts) — si le code
 * est invalide, on n'invente rien : on écrit qu'il n'y a rien à scanner.
 */
export function Barcode({ code, height = 44, className, showDigits = true }: { code: string | null; height?: number; className?: string; showDigits?: boolean }) {
  if (!code || !ean13Modules(code)) {
    return (
      <span className={className} style={{ fontSize: 10, letterSpacing: "0.08em" }}>
        SANS CODE-BARRES
      </span>
    );
  }
  const bars = ean13Bars(code);
  const unit = 1.4;
  const width = EAN13_MODULES * unit;
  const digitY = height + 11;
  return (
    <svg
      className={className}
      role="img"
      aria-label={`Code-barres ${code}`}
      viewBox={`0 0 ${width} ${height + (showDigits ? 14 : 2)}`}
      width={width}
      height={height + (showDigits ? 14 : 2)}
      style={{ display: "block" }}
    >
      <rect width={width} height={height + (showDigits ? 14 : 2)} fill="#fff" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x * unit} y={0} width={b.w * unit} height={height} fill="#111" />
      ))}
      {showDigits && (
        <text x={width / 2} y={digitY} textAnchor="middle" fontFamily="monospace" fontSize={11} letterSpacing={1.6} fill="#111">
          {code}
        </text>
      )}
    </svg>
  );
}
