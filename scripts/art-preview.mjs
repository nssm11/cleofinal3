/**
 * art-preview — render the generated plates to standalone SVG files.
 *
 *   node --import tsx scripts/art-preview.mjs [outDir] [--wide] [--micro]
 *
 * A design-review tool: it lets the art system be inspected outside the
 * browser (or rasterized with any SVG renderer) without spinning up the app.
 * The output files are scratch, not part of the repo.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { films } from "../src/data/films";
import { seriesList } from "../src/data/series";
import { TitleArt, plateForTitle } from "../src/features/posters/title-art";

const outDir = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "/tmp/art";
const wantWide = process.argv.includes("--wide");
const wantMicro = process.argv.includes("--micro");
mkdirSync(outDir, { recursive: true });

const all = [...films, ...seriesList];
const wanted = wantWide || wantMicro ? all.map((t) => t.slug) : [
  "nosferatu", "caligari", "the-general", "the-big-combo", "plan-9-from-outer-space",
  "sintel", "night-of-the-living-dead", "house-on-haunted-hill", "cabinet-of-dr-caligari",
  "trip-to-the-moon", "the-cabinet-of-dr-caligari", "golem", "the-snows-of-kilimanjaro",
];

const pick = wanted.length ? all.filter((t) => wanted.includes(t.slug)) : all;

for (const [i, t] of pick.entries()) {
  const plate = plateForTitle(t, i + 1);
  const variants = wantWide && wantMicro
    ? ["wide", "micro"]
    : wantWide ? ["wide"] : wantMicro ? ["micro"] : ["poster"];
  for (const v of variants) {
    let svg = renderToStaticMarkup(h(TitleArt, { plate, variant: v }));
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    // map the CSS font stacks to names a standalone renderer can match
    svg = svg.replaceAll("Fraunces Variable", "Fraunces");
    svg = svg.replaceAll("JetBrains Mono Variable", "JetBrains Mono");
    writeFileSync(join(outDir, `${t.slug}-${v}.svg`), `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`);
  }
}
console.log(`wrote ${pick.length}×plates to ${outDir}`);
