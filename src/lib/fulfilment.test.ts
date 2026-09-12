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

import { pickupWindow } from "./fulfilment";
const tT = (iso: string) => new Date(iso);

test("Saturday 10:00 Tunis — ready at noon, held 48 h after", () => {
  const { readyAt, holdUntil } = pickupWindow(tT("2026-09-12T09:00:00.000Z")); // Tunis is UTC+1
  assert.equal(readyAt.toISOString(), "2026-09-12T11:00:00.000Z"); // 12:00 Tunis
  assert.equal(holdUntil.getTime() - readyAt.getTime(), 48 * 3600_000);
});

test("Wednesday 07:00 — the clock starts at opening, not at dawn", () => {
  const { readyAt } = pickupWindow(tT("2026-09-09T06:00:00.000Z")); // 07:00 Tunis
  assert.equal(readyAt.toISOString(), "2026-09-09T09:30:00.000Z"); // 8 h 30 + 2 h = 10 h 30 Tunis
});

test("Sunday — never “ready tonight”: rolls to Monday morning", () => {
  const { readyAt } = pickupWindow(tT("2026-09-13T10:00:00.000Z"));
  assert.ok(readyAt.getTime() > Date.parse("2026-09-14T06:00:00.000Z"));
});

test("Saturday 19:00 — too late to promise tonight, rolls to Monday", () => {
  const { readyAt } = pickupWindow(tT("2026-09-12T18:00:00.000Z"));
  assert.ok(readyAt.getTime() > Date.parse("2026-09-14T06:00:00.000Z"));
});
