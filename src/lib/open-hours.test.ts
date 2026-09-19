import assert from "node:assert/strict";
import test from "node:test";
import {
  formatSpans,
  formatTime,
  hoursForDate,
  openState,
  parseHours,
  type WeekHours,
} from "./open-hours";

/* ══════════════════════════════════════════════════════════════════════════
   LES HORAIRES — the sentence the shopkeeper wrote is the source of truth,
   so it has to survive being read by a machine on a Sunday in Ramadan.
   ══════════════════════════════════════════════════════════════════════════ */

const HOURS = "Lun–Sam 8h30–20h30 · Dim 9h–14h";

const at = (isoLocal: string) => new Date(`${isoLocal}T00:00:00`);

test("the shopkeeper's sentence parses into a seven-day week", () => {
  const w: WeekHours = parseHours(HOURS);
  assert.deepEqual(w[1], [{ open: 510, close: 1230 }]); // lundi 8h30 → 20h30
  assert.deepEqual(w[7], [{ open: 540, close: 840 }]); // dimanche 9h → 14h
  assert.equal(Object.keys(w).length, 7);
});

test("a garbled sentence yields an empty week, never a crash", () => {
  assert.deepEqual(parseHours(null), {});
  assert.deepEqual(parseHours(""), {});
  assert.deepEqual(parseHours("Ouvert quand on veut"), {});
});

test("open at ten on a Monday, closed at nine that night", () => {
  const open = openState(HOURS, new Date("2026-09-21T10:00:00")); // lundi
  assert.equal(open.open, true);
  assert.equal(open.nextChangeAt, 1230); // ferme à 20h30
  assert.equal(open.changeInMinutes, 630);

  const closed = openState(HOURS, new Date("2026-09-21T21:00:00"));
  assert.equal(closed.open, false);
  assert.equal(closed.nextChangeAt, 510); // rouvre à 8h30
  assert.equal(closed.nextChangeLabel, "demain");
});

test("Sunday keeps its own hours, and the weekly turn is right", () => {
  const sundayMorning = openState(HOURS, new Date("2026-09-20T10:00:00")); // dimanche
  assert.equal(sundayMorning.open, true);
  assert.equal(sundayMorning.nextChangeAt, 840); // 14h

  const sundayEvening = openState(HOURS, new Date("2026-09-20T15:00:00"));
  assert.equal(sundayEvening.open, false);
  assert.equal(sundayEvening.nextChangeLabel, "demain"); // lundi
});

test("Ramadan replaces the week while it runs, and only then", () => {
  const during = openState(HOURS, new Date("2026-02-25T12:00:00"));
  assert.equal(during.open, true);
  assert.match(during.label, /Ramadan/i);

  const evening = openState(HOURS, new Date("2026-02-25T19:00:00"));
  assert.equal(evening.open, false, "18h closes the counter in Ramadan, not 20h30");

  const outside = openState(HOURS, new Date("2026-01-26T19:00:00")); // lundi
  assert.equal(outside.open, true, "outside Ramadan the ordinary hours apply");
  assert.doesNotMatch(outside.label, /Ramadan/i);
});

test("hoursForDate reports the period in force", () => {
  const { label } = hoursForDate(HOURS, at("2026-03-01"));
  assert.match(label ?? "", /Ramadan/i);
  const plain = hoursForDate(HOURS, at("2026-05-01"));
  assert.equal(plain.label, null);
});

test("times read the way a Tunisian writes them", () => {
  assert.equal(formatTime(510), "8h30");
  assert.equal(formatTime(1230), "20h30");
  assert.equal(formatTime(0), "0h");
  assert.equal(formatSpans([{ open: 510, close: 1230 }]), "8h30 – 20h30");
  assert.equal(formatSpans([]), "Fermé");
});
