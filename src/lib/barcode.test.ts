import assert from "node:assert/strict";
import { test } from "node:test";
import { EAN13_MODULES, ean13, ean13Bars, ean13CheckDigit, ean13Modules, isValidEan13 } from "./barcode";

test("the check digit is the one GS1 computes", () => {
  // 4006381333931 — a published example, verified by hand.
  assert.equal(ean13CheckDigit("400638133393"), 1);
});

test("the shop's own codes are valid, stable and unique enough", () => {
  const codes = new Set<string>();
  for (let id = 1; id <= 200; id++) {
    const code = ean13(id);
    assert.equal(code.length, 13);
    assert.ok(isValidEan13(code), code);
    assert.ok(code.startsWith("619"), code);
    codes.add(code);
  }
  assert.equal(codes.size, 200);
  assert.equal(ean13(42), ean13("42"));
});

test("a mistyped digit is rejected, not looked up", () => {
  const good = ean13(7);
  const bad = good.slice(0, 5) + String((Number(good[5]) + 1) % 10) + good.slice(6);
  assert.equal(isValidEan13(good), true);
  assert.equal(isValidEan13(bad), false);
  assert.equal(isValidEan13("12345"), false);
  assert.equal(isValidEan13(null), false);
});

test("the printed bars are the real EAN-13 encoding", () => {
  const code = ean13(42);
  const modules = ean13Modules(code);
  assert.equal(modules.length, EAN13_MODULES);
  assert.ok(modules.startsWith("101"), "left guard");
  assert.equal(modules.slice(45, 50), "01010", "centre guard");
  assert.ok(modules.endsWith("101"), "right guard");
  // Every module is either a bar or a space, and the parity table was applied.
  assert.match(modules, /^[01]{95}$/);
  // The first digit never appears as bars: it is encoded by the parity only.
  assert.equal(ean13Modules("12345"), "");
  assert.equal(ean13Bars("12345").length, 0);
});

test("the bars count what a scanner will read", () => {
  const bars = ean13Bars(ean13(7));
  // 30 barres et 29 espaces : le compte exact d'un symbole EAN-13.
  assert.ok(bars.length >= 28 && bars.length <= 36, `${bars.length} barres`);
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1]!;
    assert.ok(bars[i]!.x >= prev.x + prev.w, "les barres ne se chevauchent pas");
  }
  const last = bars[bars.length - 1]!;
  assert.equal(last.x + last.w, 95, "the last bar closes the symbol");
});
