import test from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "./utils";

test("toCsv emits a header and quoted cells", () => {
  const csv = toCsv([{ a: "x", b: 2 }]);
  assert.equal(csv, "a,b\n\"x\",\"2\"");
});

test("toCsv escapes embedded quotes", () => {
  const csv = toCsv([{ a: 'say "hi"' }]);
  assert.equal(csv, 'a\n"say ""hi"""');
});

test("toCsv neutralises formula-injection prefixes in string cells", () => {
  const csv = toCsv([
    { name: '=HYPERLINK("http://evil.tn","x")', plus: "+cmd|'/c calc'!A0", minus: "-1+1", at: "@SUM(A1)", tabbed: "\tevil" },
  ]);
  const [header, row] = csv.split("\n");
  assert.equal(header, "name,plus,minus,at,tabbed");
  assert.ok(row.startsWith("\"'=HYPERLINK"));
  assert.ok(row.includes("\"'+cmd"));
  assert.ok(row.includes("\"'-1+1\""));
  assert.ok(row.includes("\"'@SUM(A1)\""));
  assert.ok(row.includes("\"'\tevil\""));
});

test("toCsv leaves numeric negative values untouched", () => {
  const csv = toCsv([{ delta: -5 }]);
  assert.equal(csv, 'delta\n"-5"');
});

test("toCsv leaves ordinary strings untouched", () => {
  const csv = toCsv([{ ville: "Ezzahra" }]);
  assert.equal(csv, 'ville\n"Ezzahra"');
});
