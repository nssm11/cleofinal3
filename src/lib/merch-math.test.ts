import test from "node:test";
import assert from "node:assert/strict";
import { clampDiscount, duoComplete, monthWindowActive } from "./merch-math";

test("monthWindowActive: ordinary window (Solaire, Apr–Sep)", () => {
  assert.ok(monthWindowActive(4, 4, 9));
  assert.ok(monthWindowActive(9, 4, 9));
  assert.ok(!monthWindowActive(10, 4, 9));
  assert.ok(!monthWindowActive(3, 4, 9));
});

test("monthWindowActive: wrapping window (peaux sèches, Oct–Mar)", () => {
  assert.ok(monthWindowActive(10, 10, 3));
  assert.ok(monthWindowActive(1, 10, 3));
  assert.ok(monthWindowActive(3, 10, 3));
  assert.ok(!monthWindowActive(5, 10, 3));
});

test("monthWindowActive: single-month windows", () => {
  assert.ok(monthWindowActive(12, 12, 12));
  assert.ok(!monthWindowActive(11, 12, 12));
});

test("duoComplete requires every member with enough quantity", () => {
  const lines = [
    { productId: 1, quantity: 1 },
    { productId: 2, quantity: 2 },
  ];
  assert.ok(duoComplete(lines, [1, 2]));
  assert.ok(!duoComplete(lines, [1, 3]));
  assert.ok(!duoComplete([{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }], [1, 2], 2));
});

test("clampDiscount keeps discounts honest", () => {
  assert.equal(clampDiscount(5_000, 40_000), 5_000);
  assert.equal(clampDiscount(50_000, 40_000), 40_000);
  assert.equal(clampDiscount(-1, 40_000), 0);
});
