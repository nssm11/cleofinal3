"use client";

/**
 * Last net. `error.tsx` catches page faults; this one fires only if the root
 * layout itself breaks — which means no fonts, no html wrappers, nothing.
 * So it renders a complete document, plain and quiet, in the house colors.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#141312", color: "#f6f1e7", fontFamily: "Georgia, serif", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <main style={{ maxWidth: 480, textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#c8a24a" }}>Cléopâtre</p>
          <h1 style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.25, margin: "18px 0 12px" }}>Une panne de maison, pas de comptoir.</h1>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "#d8d2c4" }}>
            La page n’a pas pu se construire. Réessayez — si cela persiste, le 71 450 210 reste décroché pour vous.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 22, background: "#c8a24a", color: "#141312", border: 0, padding: "12px 26px", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Rouvrir la boutique
          </button>
        </main>
      </body>
    </html>
  );
}
