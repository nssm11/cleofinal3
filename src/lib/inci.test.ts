import assert from "node:assert/strict";
import { test } from "node:test";
import { activesIn, allergensIn, formulaFingerprint, isFragranceFree, parseInci, readFormula, watchedIn } from "./inci";

const CICA = "Aqua, Glycerin, Butyrospermum Parkii Butter, Panthenol, Madecassoside, Zinc Gluconate, Linalool, Limonene, Parfum";
const CLEAN = "Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Ceramide NP, Tocopherol, Allantoin. Sans parabènes.";
const INCIDENTAL = "Aqua, Squalane, Ascorbic Acid, Tocopherol, Helianthus Annuus Seed Oil";

test("a formula is split into its ingredients, notes dropped", () => {
  const parts = parseInci("Ingrédients : Aqua, Glycerin (humectant), Parfum. Sans parabènes.");
  assert.deepEqual(parts, ["Aqua", "Glycerin", "Parfum"]);
  assert.deepEqual(parseInci(null), []);
});

test("the 26 allergens are found by name, in declaration order", () => {
  assert.deepEqual(allergensIn(CICA), ["Linalool", "Limonene"]);
  assert.deepEqual(allergensIn(CLEAN), []);
});

test("« sans parfum » is decided from the text, and unknown stays unknown", () => {
  assert.equal(isFragranceFree(CLEAN), true);
  assert.equal(isFragranceFree(CICA), false);
  assert.equal(isFragranceFree(null), null);
});

test("what else the counter should say out loud", () => {
  assert.deepEqual(watchedIn(INCIDENTAL), []);
  assert.ok(watchedIn("Aqua, Phenoxyethanol, Dimethicone, Sodium Laureth Sulfate").includes("Conservateurs (parabènes)"));
  assert.ok(watchedIn("Aqua, Phenoxyethanol, Dimethicone, Sodium Laureth Sulfate").includes("Silicones"));
});

test("the glossary and the formula agree on which actives are present", () => {
  const found = activesIn("Aqua, Niacinamide, Sodium Hyaluronate, Glycerin, Zinc PCA");
  assert.ok(found.includes("Niacinamide"), found.join(", "));
  assert.ok(found.includes("Acide hyaluronique"), found.join(", "));
  assert.ok(found.includes("Glycérine"), found.join(", "));
});

test("two fiches with the same formula share a fingerprint", () => {
  const a = formulaFingerprint("Aqua, Glycerin, Niacinamide, Panthenol");
  const b = formulaFingerprint("panthenol, niacinamide, glycerin, aqua");
  assert.equal(a, b);
  assert.notEqual(a, formulaFingerprint(CICA));
  assert.equal(formulaFingerprint(""), null);
});

test("one call gives the whole reading", () => {
  const r = readFormula(CICA);
  assert.equal(r.count, 9);
  assert.equal(r.fragranceFree, false);
  assert.deepEqual(r.allergens, ["Linalool", "Limonene"]);
});
