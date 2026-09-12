import test from "node:test";
import assert from "node:assert/strict";
import { shippingPromise } from "./fulfilment";

test("in stock before the 14 h cut-off, on an open day — today", () => {
  assert.equal(shippingPromise({ stock: 3, hour: 9, weekday: 2 }), "today");
  assert.equal(shippingPromise({ stock: 3, hour: 13, weekday: 6 }), "today");
});

test("after the cut-off — tomorrow, no heroics", () => {
  assert.equal(shippingPromise({ stock: 3, hour: 14, weekday: 3 }), "tomorrow");
  assert.equal(shippingPromise({ stock: 3, hour: 23, weekday: 1 }), "tomorrow");
});

test("out of stock — no delivery promise at all", () => {
  assert.equal(shippingPromise({ stock: 0, hour: 8, weekday: 2 }), "restock");
});

test("Sunday — the promise waits for Monday", () => {
  assert.equal(shippingPromise({ stock: 9, hour: 10, weekday: 7 }), "monday");
});
