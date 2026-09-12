import test from "node:test";
import assert from "node:assert/strict";
import { parseVolume, unitPrice } from "./units";

test("parseVolume reads plain metric formats", () => {
  assert.deepEqual(parseVolume("400 ml"), { kind: "metric", count: 400, unit: "ml" });
  assert.deepEqual(parseVolume("52 ml"), { kind: "metric", count: 52, unit: "ml" });
  assert.deepEqual(parseVolume("30 g"), { kind: "metric", count: 30, unit: "g" });
});

test("parseVolume handles multi-packs and decimal commas", () => {
  assert.deepEqual(parseVolume("2 × 40 ml"), { kind: "metric", count: 80, unit: "ml" });
  assert.deepEqual(parseVolume("125,5 ml"), { kind: "metric", count: 125.5, unit: "ml" });
});

test("parseVolume counts pieces, not grams", () => {
  assert.deepEqual(parseVolume("90 gélules"), { kind: "pieces", count: 90, unit: "gélules" });
  assert.deepEqual(parseVolume("30 comprimés"), { kind: "pieces", count: 30, unit: "comprimés" });
});

test("parseVolume refuses nonsense rather than guessing", () => {
  assert.equal(parseVolume(null), null);
  assert.equal(parseVolume(""), null);
  assert.equal(parseVolume("Roll-on"), null);
  assert.equal(parseVolume("0 ml"), null);
});

test("unitPrice: quiet per-100 line for large formats", () => {
  // 79,900 DT for 400 ml → 19,975 DT per 100 ml (79 900 / 4).
  assert.equal(unitPrice(79_900, "400 ml")?.text, "19,98 DT / 100 ml");
});

test("unitPrice: serums force the line even below 100 ml", () => {
  assert.equal(unitPrice(129_000, "30 ml"), null);
  assert.equal(unitPrice(129_000, "30 ml", { forceSmall: true })?.text, "430 DT / 100 ml");
});

test("unitPrice: per-unit line for long treatments only", () => {
  assert.equal(unitPrice(115_000, "90 gélules")?.text, "1,28 DT / unité");
  assert.equal(unitPrice(115_000, "10 gélules"), null);
});
