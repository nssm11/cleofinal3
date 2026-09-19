import assert from "node:assert/strict";
import { test } from "node:test";
import { ean13, ean13CheckDigit, isValidEan13 } from "./barcode";

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
