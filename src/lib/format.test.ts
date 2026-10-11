import test from "node:test";
import assert from "node:assert/strict";
import { formatClock, hashString, seededRandom } from "./format";

test("formatClock covers minutes and hours without leaking decimals", () => {
  assert.equal(formatClock(0), "0:00");
  assert.equal(formatClock(65.9), "1:05");
  assert.equal(formatClock(3661), "1:01:01");
  assert.equal(formatClock(-3), "0:00");
  assert.equal(formatClock(NaN), "0:00");
});

test("hash + seeded random are stable and bounded", () => {
  assert.equal(hashString("nosferatu"), hashString("nosferatu"));
  assert.notEqual(hashString("nosferatu"), hashString("caligari"));
  for (let i = 0; i < 40; i++) {
    const x = seededRandom("x", i);
    assert.ok(x >= 0 && x < 1);
  }
  assert.equal(seededRandom("abc", 3), seededRandom("abc", 3));
});
