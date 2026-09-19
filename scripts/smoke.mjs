#!/usr/bin/env node
/**
 * SMOKE — does the shop answer, and does it keep its doors locked?
 *
 *   node scripts/smoke.mjs [base-url]
 *   npm run smoke -- http://127.0.0.1:3000
 *
 * Two things are checked, and only two:
 *
 *   1. every public door opens (200) — pages, universes, a real product page,
 *      the JSON endpoints ;
 *   2. every private door stays shut (307 toward `connexion`) — the back
 *      office and the customer account, for an anonymous visitor.
 *
 * A route list is not a substitute for a browser: it proves the server
 * renders without throwing, which is exactly what a deploy needs to know
 * in the first ten seconds.
 */

const BASE = (process.argv[2] ?? process.env.SMOKE_BASE ?? "http://127.0.0.1:3000").replace(/\/$/, "");

/** Routes that must answer 200. */
const PUBLIC = [
  "/",
  "/boutique",
  "/panier",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/recherche",
  "/marques",
  "/journal",
  "/aide",
  "/cgv",
  "/confidentialite",
  "/livraison",
  "/promotions",
  "/diagnostic",
  "/comparer",
  "/carte-cadeau",
  "/boutiques",
  "/suivi",
  "/api/health",
  "/api/products?limit=1",
  "/api/search?q=creme",
  "/sitemap.xml",
  "/robots.txt",
];

/** Universes — read from the same list the site declares a reel for. */
const UNIVERSES = ["visage", "corps", "cheveux", "solaire", "bebe-maman", "complements", "hygiene"];

/** Routes that must refuse an anonymous visitor. */
const GATED = ["/admin", "/compte", "/admin/commandes", "/admin/produits"];

const TIMEOUT_MS = 30_000;

let failures = 0;
const rows = [];

async function hit(path, { redirect = "follow" } = {}) {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      redirect,
      headers: { "user-agent": "cleopatre-smoke/1.0" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { status: res.status, location: res.headers.get("location"), ms: Date.now() - started };
  } catch (error) {
    return { status: 0, error: error.message, ms: Date.now() - started };
  }
}

function record(path, expected, got, detail = "") {
  const ok = got === expected;
  if (!ok) failures++;
  rows.push({ path, expected, got, ms: detail, ok });
  process.stdout.write(
    `  ${ok ? "✓" : "✗"} ${String(got).padEnd(4)} ${path}${detail ? `  ${detail}` : ""}${ok ? "" : `   (expected ${expected})`}\n`,
  );
}

// ── the doors that open ────────────────────────────────────────────────────
process.stdout.write(`\n  public — ${BASE}\n`);
for (const path of [...PUBLIC, ...UNIVERSES.map((u) => `/univers/${u}`)]) {
  const r = await hit(path);
  record(path, 200, r.status, `${r.ms} ms`);
}

// A real product page, taken from the catalogue rather than guessed.
// `/api/products` answers by id (`?ids=1,2`), so the search endpoint is what
// turns a word into a live slug.
try {
  const res = await fetch(`${BASE}/api/search?q=creme`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = await res.json();
  const slug = body?.items?.[0]?.slug ?? body?.[0]?.slug;
  if (slug) {
    const r = await hit(`/produit/${slug}`);
    record(`/produit/${slug}`, 200, r.status, `${r.ms} ms`);
  } else {
    process.stdout.write(`  · /api/search returned nothing — product page not checked\n`);
  }
} catch (error) {
  process.stdout.write(`  · product page not checked (${error.message})\n`);
}

// ── the doors that stay shut ───────────────────────────────────────────────
process.stdout.write(`\n  gated — anonymous visitor\n`);
for (const path of GATED) {
  const r = await hit(path, { redirect: "manual" });
  const ok = r.status === 307 || r.status === 302;
  const toward = r.location ?? "";
  const right = ok && toward.includes("connexion");
  if (!right) failures++;
  rows.push({ path, expected: "307 → connexion", got: `${r.status}`, ok: right });
  process.stdout.write(
    `  ${right ? "✓" : "✗"} ${String(r.status).padEnd(4)} ${path}${toward ? `  → ${toward}` : ""}${right ? "" : "   (expected 307 toward /connexion)"}\n`,
  );
}

// ── the door that is not there ─────────────────────────────────────────────
process.stdout.write(`\n  absent\n`);
const missing = await hit("/cette-page-nexiste-pas");
record("/cette-page-nexiste-pas", 404, missing.status, `${missing.ms} ms`);

// ── verdict ────────────────────────────────────────────────────────────────
const total = rows.length;
const passed = rows.filter((r) => r.ok).length;
const slowest = rows.filter((r) => typeof r.ms === "number").sort((a, b) => b.ms - a.ms)[0];

process.stdout.write(`\n  ${passed}/${total} checks passed`);
if (slowest) process.stdout.write(` · slowest ${slowest.path} ${slowest.ms} ms`);
process.stdout.write(`\n`);

if (failures) {
  process.stdout.write(`  ${failures} failure(s)\n\n`);
  process.exit(1);
}
process.stdout.write(`  the shop answers and keeps its doors.\n\n`);
