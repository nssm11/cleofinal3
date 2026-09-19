import assert from "node:assert/strict";
import { test } from "node:test";
import { VISAGE } from "./catalogue-details-visage";
import { CORPS } from "./catalogue-details-corps";
import { RESTE } from "./catalogue-details-reste";

/**
 * The rule this file protects: a fiche is written, not generated.
 *
 * If two references ever share a composition, an instruction or a description,
 * this test fails before the shop ships a placeholder that pretends to be a
 * product page. It is the only place in the project where a copy-paste is
 * treated as a bug rather than a style choice.
 */
const ALL = { ...VISAGE, ...CORPS, ...RESTE };
const entries = Object.entries(ALL);

test("every fiche is complete: a description, a formula, a gesture, a public", () => {
  assert.ok(entries.length >= 80, `only ${entries.length} fiches`);
  for (const [name, d] of entries) {
    assert.ok(d.desc.length >= 120, `${name}: description trop courte`);
    assert.ok(d.inci.length >= 40, `${name}: formule vide`);
    assert.ok(d.use.length >= 40, `${name}: geste vide`);
    assert.ok(d.texture.length >= 4, `${name}: texture vide`);
    assert.ok(d.forWhom.length >= 8, `${name}: public vide`);
    assert.ok(/^[A-ZÀ-Ý0-9]/.test(d.desc), `${name}: description qui commence mal`);
    assert.ok(d.desc.endsWith("."), `${name}: description sans point final`);
  }
});

test("no two references share a composition", () => {
  const seen = new Map<string, string>();
  for (const [name, d] of entries) {
    const prev = seen.get(d.inci);
    assert.equal(prev, undefined, `${name} copie la formule de ${prev}`);
    seen.set(d.inci, name);
  }
});

test("no two references share a gesture or a description", () => {
  for (const field of ["use", "desc"] as const) {
    const seen = new Map<string, string>();
    for (const [name, d] of entries) {
      const prev = seen.get(d[field]);
      assert.equal(prev, undefined, `${name} copie « ${field} » de ${prev}`);
      seen.set(d[field], name);
    }
  }
});

test("a compliment is not written like a cream, and never promises a cure", () => {
  const complements = entries.filter(([n]) => /Arkog|Vitamine D3|Forcapil|Skin Booster|Arkovital/.test(n));
  assert.ok(complements.length >= 6, `only ${complements.length} supplements found`);
  for (const [name, d] of complements) {
    assert.match(d.precautions ?? "", /conseil|médecin|bilan|avis|dose|médicament|grossesse|allerg/i, `${name}: pas de précaution utile`);
    assert.ok(!/guérit|soigne définitivement|un miracle/i.test(`${d.desc} ${d.use}`), `${name}: promesse de guérison`);
  }
});

test("every precaution says something specific, and no claim is a promise of a cure", () => {
  for (const [name, d] of entries) {
    // « jamais au miracle » est une mise en garde, pas une promesse : on ne
    // cherche donc que les affirmations, pas les mots employés pour les nier.
    assert.ok(!/guérit|élimine définitivement|100 ?% efficace|un miracle|véritable miracle|efface les vergetures/i.test(`${d.desc} ${d.use} ${JSON.stringify(d.precautions ?? "")}`), `${name}: promesse excessive`);
  }
});
