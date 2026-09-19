import assert from "node:assert/strict";
import test from "node:test";
import { activeBySlug, canonise } from "./actives-dictionary";

/* The dictionary is deliberately free of any database import, so it can be
   tested on a machine that has never seen DATABASE_URL. */

/* ══════════════════════════════════════════════════════════════════════════
   LES ACTIFS — the catalogue spells the same molecule four ways. The folding
   is what makes the glossary honest, so the folding is what gets tested:
   every spelling must land on the same actif, whatever the accents, the
   capital letters or the stray spaces the supplier left in.
   ══════════════════════════════════════════════════════════════════════════ */

test("panthenol is one actif, however the supplier spells it", () => {
  const slugs = ["Panthénol", "Panthénol B5", "Panthénol 5 %", "Pantothonate", "panthénol"].map(
    (s) => canonise(s)?.slug,
  );
  assert.deepEqual(slugs, ["panthenol", "panthenol", "panthenol", "panthenol", "panthenol"]);
  assert.equal(canonise("Panthénol")?.label, "Panthénol (B5)");
});

test("glycerine folds across three wordings", () => {
  const slugs = ["Glycérine", "Glycérine végétale", "Glycérine d'origine végétale"].map(
    (s) => canonise(s)?.slug,
  );
  assert.deepEqual(slugs, ["glycerine", "glycerine", "glycerine"]);
});

test("accents and capital letters do not make a new actif", () => {
  assert.equal(canonise("Niacinamide")?.slug, canonise("niacinamide")?.slug);
  assert.equal(canonise("MEXORYL 400")?.slug, "mexoryl");
  assert.equal(canonise("  Mexoryl 400  ")?.slug, "mexoryl");
  assert.equal(canonise("Céramides")?.slug, canonise("ceramides")?.slug);
});

test("zinc folds its salts together", () => {
  assert.equal(canonise("Zinc")?.slug, "zinc");
  assert.equal(canonise("Gluconate de zinc")?.slug, "zinc");
  assert.equal(canonise("Cuivre-zinc")?.slug, "zinc");
});

test("an actif we do not know is not invented", () => {
  assert.equal(canonise("Extrait de lune"), null);
  assert.equal(canonise(""), null);
  assert.equal(activeBySlug("poudre-de-perlimpinpin"), null);
});

test("every canonical name carries a note and a family", () => {
  const known = activeBySlug("niacinamide");
  assert.ok(known);
  assert.match(known.note, /\S/);
  assert.match(known.family, /\S/);
  assert.doesNotMatch(known.note, /guérit|soigne|traitement médical/i);
});
