import test from "node:test";
import assert from "node:assert/strict";
import { isOnScreen } from "./visible";

const VH = 900;
const rect = (top: number, height: number) => ({ top, bottom: top + height, width: 500, height });

test("a block below the fold is not shown yet", () => {
  assert.equal(isOnScreen(rect(1400, 400), VH), false);
});

test("a block that has just crossed the line is shown", () => {
  assert.equal(isOnScreen(rect(880, 400), VH), true);
});

test("a block taller than the viewport is shown as soon as it arrives", () => {
  // 2000px tall in a 900px window: no fraction of it could ever be "30% visible".
  assert.equal(isOnScreen(rect(700, 2000), VH), true);
});

test("a tall block still below the fold waits", () => {
  assert.equal(isOnScreen(rect(1200, 2000), VH), false);
});

test("a block already scrolled past is shown, never blank", () => {
  assert.equal(isOnScreen(rect(-1800, 600), VH), true);
});

test("a block that has not been laid out is left alone", () => {
  assert.equal(isOnScreen({ top: 0, bottom: 0, width: 0, height: 0 }, VH), false);
});

test("without a viewport height, the observer keeps the decision", () => {
  assert.equal(isOnScreen(rect(0, 400), 0), false);
  assert.equal(isOnScreen(rect(0, 400), Number.NaN), false);
});

test("the lead-in can be tuned", () => {
  assert.equal(isOnScreen(rect(1000, 400), VH, 0), false);
  assert.equal(isOnScreen(rect(1000, 400), VH, 0.2), true);
});
