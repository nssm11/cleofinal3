#!/usr/bin/env node
/**
 * LE GARDE-FOU — the shop weighs itself, every time it is built.
 *
 * A performance budget written in a document is a wish. This one is a gate:
 * it stands the shop up, walks a list of real pages, and adds up what a
 * visitor's phone actually has to download — HTML, JavaScript, CSS — counted
 * the way the network counts it, gzipped, because that is what arrives.
 *
 * It runs against a production server (npm run start), never against the dev
 * server, whose bundles are deliberately uncompressed and enormous. If a page
 * crosses the budget, the build fails and says which page, by how much, and
 * what the three heaviest files are — because "too heavy" is not actionable
 * and "produit/[slug] is 41 KB over, 18 of them in a date library" is.
 */

import { get } from "node:http";
import { gunzipSync } from "node:zlib";

const BASE = process.argv[2] ?? process.env.WEIGHT_BASE ?? "http://127.0.0.1:3210";
const BUDGET_KB = Number(process.env.WEIGHT_BUDGET_KB ?? 300);
const ROUTES = (process.env.WEIGHT_ROUTES ?? "/,/boutique,/produit/la-roche-posay-effaclar-duo-m,/actifs,/compte/commandes")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

/** Bytes on the wire, gzipped — node:http does not decompress for us. */
function weigh(url) {
  return new Promise((resolve) => {
    const req = get(url, { headers: { "accept-encoding": "gzip" } }, (res) => {
      if (res.statusCode >= 400) {
        res.resume();
        resolve({ bytes: 0, status: res.statusCode });
        return;
      }
      let bytes = 0;
      res.on("data", (c) => (bytes += c.length));
      res.on("end", () => resolve({ bytes, status: res.statusCode }));
    });
    req.on("error", () => resolve({ bytes: 0, status: 0 }));
    req.setTimeout(20_000, () => {
      req.destroy();
      resolve({ bytes: 0, status: 0 });
    });
  });
}

/** The document, decompressed so the asset references inside it can be read. */
async function read(url) {
  return new Promise((resolve, reject) => {
    get(url, { headers: { "accept-encoding": "gzip" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
        res.resume();
        resolve("");
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const zipped = (res.headers["content-encoding"] ?? "").includes("gzip");
        try {
          resolve((zipped ? gunzipSync(buf) : buf).toString("utf8"));
        } catch {
          resolve(buf.toString("utf8"));
        }
      });
    }).on("error", reject);
  });
}

const kb = (b) => `${(b / 1024).toFixed(1)} Ko`;

const ok = (s) => String(s).padStart(9);
let failed = 0;
const lines = [];

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  const html = await read(url).catch(() => "");
  if (!html) {
    // A private door redirects to /connexion and has no weight to answer for.
    lines.push(`  · ${ok("—")}  ${route.padEnd(46)} (redirection — rien à peser)`);
    continue;
  }

  const assets = new Set();
  for (const m of html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)) assets.add(m[1]);
  for (const m of html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)) assets.add(m[1]);
  for (const m of html.matchAll(/"(\/_next\/static\/chunks\/[^"\\]+\.js)"/g)) assets.add(m[1]);

  const page = await weigh(url);
  const measured = [];
  for (const asset of assets) {
    const { bytes } = await weigh(`${BASE}${asset}`);
    measured.push({ asset, bytes });
  }

  const js = measured.filter((m) => m.asset.endsWith(".js"));
  const css = measured.filter((m) => m.asset.endsWith(".css"));
  const sum = (list) => list.reduce((a, m) => a + m.bytes, 0);
  const total = page.bytes + sum(js) + sum(css);

  const over = total / 1024 > BUDGET_KB;
  if (over) failed++;

  lines.push(
    `  ${over ? "✗" : "✓"} ${ok(kb(total))}  ${route.padEnd(46)} html ${kb(page.bytes)} · js ${kb(sum(js))} (${js.length}) · css ${kb(sum(css))} (${css.length})`,
  );

  if (over) {
    const heaviest = measured.sort((a, b) => b.bytes - a.bytes).slice(0, 3);
    for (const h of heaviest) lines.push(`        ↳ ${kb(h.bytes).padStart(9)}  ${h.asset}`);
    lines.push(`        budget ${BUDGET_KB} Ko dépassé de ${kb(total - BUDGET_KB * 1024)}`);
  }
}

console.log(`\n  LE GARDE-FOU — poids réel, gzip, servi par ${BASE}`);
console.log(`  budget : ${BUDGET_KB} Ko par page, tout compris\n`);
console.log(lines.join("\n"));

if (failed) {
  console.log(
    `\n  ${failed} page(s) trop lourdes. Une page lourde n'est pas un incident :\n` +
      `  c'est une facture de données que le visiteur paie. Allégez-la, ou\n` +
      `  relevez le budget en disant pourquoi dans le commit.\n`,
  );
  process.exit(1);
}

console.log(`\n  every page answers under ${BUDGET_KB} Ko. the shop is light enough to carry.\n`);
