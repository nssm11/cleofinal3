import test from "node:test";
import assert from "node:assert/strict";
import { films } from "./films";
import { seriesList } from "./series";

/**
 * The laws of the house, enforced by test — because every promise in the
 * product spec has a data invariant behind it. If someone adds a title
 * without license, attribution, or with a duplicate slug, CI stops them.
 */

test("law 1 — nothing plays without a license", () => {
  for (const f of films) assert.ok(f.license === "pd" || f.license === "cc-by");
  for (const s of seriesList) assert.ok(s.license === "pd" || s.license === "cc-by");
});

test("law 2 — CC-BY without attribution is a violation", () => {
  for (const f of films.filter((x) => x.license === "cc-by")) {
    assert.ok(f.attribution && f.attribution.includes("CC BY"), f.slug);
  }
});

test("law 3 — slugs are unique across the whole archive", () => {
  const slugs = [...films.map((f) => f.slug), ...seriesList.map((s) => s.slug)];
  assert.equal(new Set(slugs).size, slugs.length);
});

test("law 4 — Arabic-first: every title carries both language faces", () => {
  for (const t of [...films, ...seriesList]) {
    assert.ok(/[؀-ۿ]/.test(t.titleAr), t.slug + " titleAr must be Arabic");
    assert.ok(t.titleLat.length > 1, t.slug + " titleLat missing");
    assert.ok(/[؀-ۿ]/.test(t.synopsisAr), t.slug + " synopsis must be Arabic");
  }
});

test("law 5 — the daily program needs a deep enough pool to rotate", () => {
  assert.ok(films.filter((f) => f.program).length >= 12);
});

test("law 6 — years follow the licensing logic, runtimes are sane", () => {
  for (const f of films) {
    if (f.license === "pd") assert.ok(f.year >= 1900 && f.year <= 1975, f.slug);
    else assert.ok(f.year >= 2000 && f.year <= 2030, f.slug); // open movies are modern
    assert.ok(f.runtimeMin >= 8 && f.runtimeMin <= 180, f.slug);
  }
  for (const s of seriesList) assert.ok(s.yearTo >= s.yearFrom);
});
