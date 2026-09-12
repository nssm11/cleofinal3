import test from "node:test";
import assert from "node:assert/strict";
import { returnWindow, RETURN_WINDOW_DAYS } from "./returns";

const DAY = 86_400_000;
const delivered = new Date("2026-09-01T10:00:00.000Z");

test("day of delivery — window fully open", () => {
  const w = returnWindow(delivered, new Date(delivered.getTime() + 2 * 3600_000));
  assert.equal(w.open, true);
  assert.equal(w.daysLeft, 7);
});

test("day six — one day left", () => {
  const w = returnWindow(delivered, new Date(delivered.getTime() + 6.5 * DAY));
  assert.equal(w.open, true);
  assert.equal(w.daysLeft, 1);
});

test("day seven — the window has closed", () => {
  const w = returnWindow(delivered, new Date(delivered.getTime() + RETURN_WINDOW_DAYS * DAY));
  assert.equal(w.open, false);
  assert.equal(w.daysLeft, 0);
});

test("no recorded delivery moment — we do not refuse what we cannot measure", () => {
  const w = returnWindow(null, new Date());
  assert.equal(w.open, true);
});
