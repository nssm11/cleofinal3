import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chooseLots,
  daysUntil,
  earliestExpiry,
  expiringSoon,
  expiryState,
  isSellable,
  lotLine,
  lotMonthLabel,
  sellableUnits,
  toQuarantine,
  undatedLots,
  unsellableUnits,
  type LotLike,
} from "./lots";

const NOW = new Date("2026-09-19T12:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

const lot = (over: Partial<LotLike> & { id: number }): LotLike => ({
  lot: `L${over.id}`,
  expiresAt: day(365),
  quantity: 10,
  status: "sale",
  placed: "shelf",
  storeId: 1,
  ...over,
});

test("a date in the future reads as a whole number of days", () => {
  assert.equal(daysUntil(day(30), NOW), 30);
  assert.equal(daysUntil(day(-1), NOW), -1);
  assert.equal(daysUntil(null, NOW), null);
});

test("the four states are separated at the boundaries the office agreed", () => {
  assert.equal(expiryState(day(-1), NOW), "expired");
  assert.equal(expiryState(day(0), NOW), "critical"); // the last day is still a selling day, and an urgent one
  assert.equal(expiryState(day(1), NOW), "critical");
  assert.equal(expiryState(day(30), NOW), "critical");
  assert.equal(expiryState(day(31), NOW), "watch");
  assert.equal(expiryState(day(90), NOW), "watch");
  assert.equal(expiryState(day(91), NOW), "ok");
  assert.equal(expiryState(null, NOW), "undated");
});

test("an expired lot is never sellable, and neither is an undated one", () => {
  assert.equal(isSellable(lot({ id: 1, expiresAt: day(-1) }), NOW), false);
  assert.equal(isSellable(lot({ id: 2, expiresAt: null }), NOW), false);
  assert.equal(isSellable(lot({ id: 3, status: "quarantine" }), NOW), false);
  assert.equal(isSellable(lot({ id: 4, quantity: 0 }), NOW), false);
  assert.equal(isSellable(lot({ id: 5 }), NOW), true);
});

test("FEFO takes the earliest date first, not the fullest box", () => {
  const lots = [lot({ id: 1, expiresAt: day(400), quantity: 50 }), lot({ id: 2, expiresAt: day(40), quantity: 2 }), lot({ id: 3, expiresAt: day(200), quantity: 5 })];
  const { picks, short } = chooseLots(lots, 4, NOW);
  assert.equal(short, 0);
  assert.deepEqual(picks.map((p) => [p.lot.id, p.take]), [[2, 2], [3, 2]]);
});

test("among lots of the same date, the shelf goes before the reserve", () => {
  const lots = [lot({ id: 1, expiresAt: day(100), placed: "back" }), lot({ id: 2, expiresAt: day(100), placed: "shelf" })];
  assert.deepEqual(chooseLots(lots, 1, NOW).picks.map((p) => p.lot.id), [2]);
});

test("expired and undated lots are skipped, and the shortage is reported", () => {
  const lots = [lot({ id: 1, expiresAt: day(-3) }), lot({ id: 2, expiresAt: null }), lot({ id: 3, expiresAt: day(500), quantity: 2 })];
  const { picks, short } = chooseLots(lots, 5, NOW);
  assert.deepEqual(picks.map((p) => [p.lot.id, p.take]), [[3, 2]]);
  assert.equal(short, 3);
});

test("nothing sellable means nothing picked, and the whole quantity is short", () => {
  const { picks, short } = chooseLots([lot({ id: 1, expiresAt: day(-1) }), lot({ id: 2, expiresAt: null })], 3, NOW);
  assert.deepEqual(picks, []);
  assert.equal(short, 3);
});

test("the sellable count and the blocked count add up to what is on the shelf", () => {
  const lots = [
    lot({ id: 1, quantity: 4 }),
    lot({ id: 2, expiresAt: day(-1), quantity: 3 }),
    lot({ id: 3, expiresAt: null, quantity: 2 }),
    lot({ id: 4, status: "quarantine", quantity: 5 }),
  ];
  assert.equal(sellableUnits(lots, NOW), 4);
  assert.deepEqual(unsellableUnits(lots, NOW), { expired: 3, undated: 2, held: 5 });
});

test("the date the counter can promise is the earliest sellable one", () => {
  const lots = [lot({ id: 1, expiresAt: day(30) }), lot({ id: 2, expiresAt: day(900) }), lot({ id: 3, expiresAt: day(-5) })];
  assert.equal(earliestExpiry(lots, NOW)!.toISOString().slice(0, 10), day(30).toISOString().slice(0, 10));
  assert.equal(earliestExpiry([lot({ id: 4, expiresAt: null })], NOW), null);
});

test("quarantine takes the past, and only the past", () => {
  const lots = [lot({ id: 1, expiresAt: day(-1) }), lot({ id: 2, expiresAt: day(1) }), lot({ id: 3, expiresAt: null })];
  assert.deepEqual(toQuarantine(lots, NOW).map((l) => l.id), [1]);
});

test("expiring soon is ordered by urgency and stops at the window", () => {
  const lots = [lot({ id: 1, expiresAt: day(60) }), lot({ id: 2, expiresAt: day(10) }), lot({ id: 3, expiresAt: day(200) }), lot({ id: 4, expiresAt: null })];
  assert.deepEqual(expiringSoon(lots, NOW).map((l) => l.id), [2, 1]);
  assert.deepEqual(expiringSoon(lots, NOW, 30).map((l) => l.id), [2]);
});

test("undated lots are listed, named, and never guessed at", () => {
  const lots = [lot({ id: 1, expiresAt: null }), lot({ id: 2, expiresAt: day(20) })];
  assert.deepEqual(undatedLots(lots).map((l) => l.id), [1]);
});

test("the printed line carries the number and the month, or says it does not know", () => {
  assert.equal(lotMonthLabel(new Date("2027-12-04T00:00:00Z")), "12/2027");
  assert.equal(lotMonthLabel(null), "DLC non communiquée");
  assert.equal(lotLine({ lot: "A4417", expiresAt: new Date("2027-12-04T00:00:00Z") }), "Lot A4417 — 12/2027");
  assert.equal(lotLine(null), null);
});
