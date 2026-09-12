import { test } from "node:test";
import assert from "node:assert/strict";
import { plural, resolveMoveTarget } from "./routines";

/* Ces tests existent à cause d'un bug précis : `Number(null)` vaut 0, donc un
   déplacement « d'un cran » sans position cible était lu comme « aller à la
   position 0 ». Pour la première étape, cela donnait « ordre inchangé » — et
   rien ne le signalait. */

const ORDER = [10, 20, 30];

test("descendre d'un cran quand aucune position n'est donnée", () => {
  assert.equal(resolveMoveTarget(ORDER, 10, null, "down"), 1);
  assert.equal(resolveMoveTarget(ORDER, 20, null, "down"), 2);
});

test("monter d'un cran quand aucune position n'est donnée", () => {
  assert.equal(resolveMoveTarget(ORDER, 30, null, "up"), 1);
  assert.equal(resolveMoveTarget(ORDER, 20, null, "up"), 0);
});

test("un champ absent n'est pas la position 0", () => {
  // Le bug d'origine : ces deux appels doivent différer.
  assert.notEqual(
    resolveMoveTarget(ORDER, 20, null, "down"),
    resolveMoveTarget(ORDER, 20, "0", "down"),
  );
  assert.equal(resolveMoveTarget(ORDER, 20, "", "down"), 2, "une chaîne vide est un champ absent");
  assert.equal(resolveMoveTarget(ORDER, 20, "  ", "down"), 2, "un espace seul aussi");
  assert.equal(resolveMoveTarget(ORDER, 20, undefined, "down"), 2);
});

test("la position demandée est bornée à la liste réelle", () => {
  assert.equal(resolveMoveTarget(ORDER, 10, "99", null), 2);
  assert.equal(resolveMoveTarget(ORDER, 30, "-5", null), 0);
  assert.equal(resolveMoveTarget(ORDER, 10, "1.6", null), 2, "arrondi au plus proche");
});

test("une étape inconnue ne donne pas une position plausible", () => {
  assert.equal(resolveMoveTarget(ORDER, 999, "1", "down"), -1);
  assert.equal(resolveMoveTarget([], 10, null, "down"), -1);
});

test("les bornes ne débordent jamais sur une liste d'une seule étape", () => {
  assert.equal(resolveMoveTarget([7], 7, null, "down"), 0);
  assert.equal(resolveMoveTarget([7], 7, null, "up"), 0);
  assert.equal(resolveMoveTarget([7], 7, "42", null), 0);
});

test("le pluriel français s'écrit, il ne se met pas entre parenthèses", () => {
  assert.equal(plural(1, "étape"), "1 étape");
  assert.equal(plural(0, "étape"), "0 étape");
  assert.equal(plural(3, "étape"), "3 étapes");
  assert.equal(plural(12, "routine"), "12 routines");
});

test("les pluriels irréguliers se déclarent", () => {
  assert.equal(plural(1, "journal", "journaux"), "1 journal");
  assert.equal(plural(2, "journal", "journaux"), "2 journaux");
});
