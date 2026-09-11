import { test } from "node:test";
import assert from "node:assert/strict";
import { LOYALTY_TIERS, loyaltyProgress, pointsToDinars, POINTS_PER_DINAR } from "./loyalty";

/* Le programme de fidélité est une promesse chiffrée : ce qui est affiché doit
   être exactement ce que la caisse applique. Ces tests vérifient l'arithmétique
   et les bords — zéro, le seuil exact, le sommet, et un solde négatif qui ne
   devrait jamais exister mais ne doit pas non plus produire un NaN à l'écran. */

test("1 000 points valent 10 DT, comme à la caisse", () => {
  assert.equal(POINTS_PER_DINAR, 100);
  assert.equal(pointsToDinars(1_000), 10);
  assert.equal(pointsToDinars(0), 0);
  assert.equal(pointsToDinars(150), 1.5);
});

test("un solde négatif ne produit ni négatif ni NaN", () => {
  assert.equal(pointsToDinars(-500), 0);
  const p = loyaltyProgress(-500);
  assert.equal(p.points, 0);
  assert.equal(p.ratio, 0);
  assert.equal(p.tier.id, "ambre");
  assert.ok(Number.isFinite(p.ratio));
});

test("zéro point, c'est déjà le premier palier", () => {
  const p = loyaltyProgress(0);
  assert.equal(p.tier.id, "ambre");
  assert.equal(p.next?.id, "or");
  assert.equal(p.remaining, 5_000);
  assert.equal(p.ratio, 0);
});

test("le seuil exact fait entrer dans le palier", () => {
  const at = loyaltyProgress(5_000);
  assert.equal(at.tier.id, "or");
  assert.equal(at.ratio, 0, "on vient d'entrer : la barre repart de zéro");
  assert.equal(at.remaining, 10_000);

  const justBefore = loyaltyProgress(4_999);
  assert.equal(justBefore.tier.id, "ambre");
  assert.equal(justBefore.remaining, 1);
});

test("au sommet, la barre est pleine et il n'y a pas de palier suivant", () => {
  const p = loyaltyProgress(15_000);
  assert.equal(p.tier.id, "perle");
  assert.equal(p.next, null);
  assert.equal(p.ratio, 1);
  assert.equal(p.remaining, 0);
  assert.equal(loyaltyProgress(999_999).tier.id, "perle");
});

test("la progression se mesure entre deux paliers, pas depuis zéro", () => {
  // À mi-chemin entre Or (5 000) et Perle (15 000) : la barre doit être à 50 %,
  // pas à 67 % comme le donnerait un calcul depuis zéro.
  assert.equal(loyaltyProgress(10_000).ratio, 0.5);
  assert.equal(loyaltyProgress(2_500).ratio, 0.5);
});

test("le ratio reste borné entre 0 et 1", () => {
  for (const pts of [0, 1, 999, 1_000, 4_999, 5_000, 9_999, 15_000, 40_000]) {
    const r = loyaltyProgress(pts).ratio;
    assert.ok(r >= 0 && r <= 1, `${pts} points donnent un ratio hors bornes : ${r}`);
  }
});

test("les paliers sont ordonnés et leurs seuils croissants", () => {
  const froms = LOYALTY_TIERS.map((t) => t.from);
  assert.deepEqual(froms, [...froms].sort((a, b) => a - b));
  assert.equal(froms[0], 0, "le premier palier doit être atteignable sans condition");
  for (const t of LOYALTY_TIERS) assert.ok(t.perks.length >= 2, `${t.name} n'apporte rien`);
});
