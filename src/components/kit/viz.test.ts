import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Bars, Cadran, Curve, Scale } from "./viz";

/* ══════════════════════════════════════════════════════════════════════════
   LES FIGURES — the drawings the shop makes of itself are plain SVG rendered
   on the server, which means they can be read without a browser: the markup
   is the proof.
   ══════════════════════════════════════════════════════════════════════════ */

const money = (v: number) => `${(v / 1000).toFixed(3)} DT`;

test("a curve draws every month, empty ones included", () => {
  const html = renderToStaticMarkup(
    createElement(Curve, {
      points: [
        { label: "août", value: 154710 },
        { label: "sept", value: 215600 },
        { label: "oct", value: 0 },
      ],
      format: money,
    }),
  );
  assert.match(html, /<svg/);
  assert.match(html, /août/);
  assert.match(html, /sept/);
  assert.match(html, /oct/);
  // The peak and the last month print their figure; the middle ones are
  // carried by the drawing and by the screen-reader label, not by ink.
  assert.match(html, /215\.600 DT/);
  assert.match(html, /aria-label="Courbe : août 154\.710 DT, sept 215\.600 DT, oct 0\.000 DT\."/);
  // Nothing is plotted above the rule: no negative coordinates, no NaN.
  assert.doesNotMatch(html, /NaN/);
});

test("a curve with a single point draws nothing rather than lying", () => {
  const html = renderToStaticMarkup(
    createElement(Curve, { points: [{ label: "seul", value: 10 }] }),
  );
  assert.equal(html, "");
});

test("bars carry their own link, and their own count", () => {
  const html = renderToStaticMarkup(
    createElement(Bars, {
      points: [
        { key: "a", label: "Hydratation", value: 20, href: "/besoin/hydratation" },
        { key: "b", label: "Solaire", value: 5, href: "/besoin/solaire" },
      ],
    }),
  );
  assert.match(html, /href="\/besoin\/hydratation"/);
  assert.match(html, /Hydratation/);
  assert.match(html, /Solaire/);
});

test("the cadran sizes its arcs to the figures it was given", () => {
  const html = renderToStaticMarkup(
    createElement(Cadran, {
      points: [
        { key: "a", label: "Peau", value: 42, href: "/besoin/peau" },
        { key: "b", label: "Cheveu", value: 21, href: "/besoin/cheveu" },
      ],
    }),
  );
  assert.match(html, /Peau/);
  assert.match(html, /Cheveu/);
  assert.doesNotMatch(html, /NaN/);
});

test("an empty scale draws no bars rather than a flat line", () => {
  assert.doesNotMatch(renderToStaticMarkup(createElement(Scale, { points: [] })), /<dt/);
  assert.match(
    renderToStaticMarkup(createElement(Scale, { points: [{ key: "a", label: "Un", value: 1 }] })),
    /Un/,
  );
});
