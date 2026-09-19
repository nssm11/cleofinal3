import assert from "node:assert/strict";
import test from "node:test";
import { pickGapFillers } from "./gap";

const shelf = [
  { id: 1, priceMillimes: 12_000, stock: 4 },
  { id: 2, priceMillimes: 25_000, stock: 0 },
  { id: 3, priceMillimes: 31_000, stock: 2 },
  { id: 4, priceMillimes: 18_000, stock: 9 },
  { id: 5, priceMillimes: 44_000, stock: 1 },
];

test("only what closes the gap, cheapest first", () => {
  const picked = pickGapFillers(shelf, [], 17_000);
  // 12 000 is under the gap: it would not earn the free delivery.
  assert.deepEqual(picked.map((p) => p.id), [4, 3, 5]);
});

test("out of stock is never suggested", () => {
  const picked = pickGapFillers(shelf, [], 20_000);
  assert.ok(!picked.some((p) => p.id === 2), "a bottle nobody can buy is not a suggestion");
  assert.ok(!picked.some((p) => p.stock <= 0));
});

test("nothing already in the basket", () => {
  const picked = pickGapFillers(shelf, [4], 15_000);
  assert.ok(!picked.some((p) => p.id === 4));
  // 12 000 would not close a 15 000 gap, so it is not offered either.
  assert.deepEqual(picked.map((p) => p.id), [3, 5]);
});

test("once the delivery is free, the rail says nothing", () => {
  assert.deepEqual(pickGapFillers(shelf, [], 0), []);
  assert.deepEqual(pickGapFillers(shelf, [], -5_000), []);
});

test("an empty shelf suggests nothing either", () => {
  assert.deepEqual(pickGapFillers([], [], 30_000), []);
});

test("never more than three bottles", () => {
  assert.ok(pickGapFillers(shelf, [], 1_000, 2).length <= 2);
  assert.ok(pickGapFillers(shelf, [], 1_000).length <= 3);
});
