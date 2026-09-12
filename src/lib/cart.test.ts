import { test } from "node:test";
import assert from "node:assert/strict";
import { addLine, clampQty, duoSavings, duoSavingsTotal, mergeCarts, removeLine, setQtyLine, MAX_CART_QTY, type CartLine, type CartDuo } from "./cart";

const line = (over: Partial<CartLine> = {}): CartLine => ({
  productId: 1,
  slug: "produit",
  name: "Produit",
  brandName: null,
  image: null,
  priceMillimes: 1000,
  quantity: 1,
  stock: 10,
  volume: null,
  ...over,
});

test("add inserts a new line with the requested quantity", () => {
  const r = addLine([], line({ productId: 1, stock: 10 }), 2);
  assert.equal(r.length, 1);
  assert.equal(r[0].quantity, 2);
});

test("add increments an existing line and clamps to available stock", () => {
  let r = addLine([line({ productId: 1, stock: 3 })], line({ productId: 1, stock: 3 }), 2);
  assert.equal(r[0].quantity, 3, "1 + 2 must clamp to stock 3");
  r = addLine(r, line({ productId: 1, stock: 3 }), 5);
  assert.equal(r[0].quantity, 3, "stays clamped on further adds");
});

test("add never exceeds MAX_CART_QTY even when stock is huge", () => {
  const r = addLine([], line({ productId: 1, stock: 999 }), 999);
  assert.equal(r[0].quantity, MAX_CART_QTY);
});

test("setQty removes the line at zero and clamps above stock", () => {
  assert.equal(setQtyLine([line({ productId: 1, stock: 5 })], 1, 0).length, 0);
  assert.equal(setQtyLine([line({ productId: 1, stock: 5 })], 1, 99)[0].quantity, 5);
});

test("remove drops the matching line", () => {
  assert.equal(removeLine([line({ productId: 1 })], 1).length, 0);
});

test("mergeCarts combines duplicates, clamps to stock and drops unavailable items", () => {
  const guest = [
    line({ productId: 1, stock: 5, quantity: 3 }),
    line({ productId: 2, stock: 0, quantity: 2 }),
  ];
  const account = [line({ productId: 1, stock: 5, quantity: 2 })];
  const merged = mergeCarts(guest, account);
  const p1 = merged.find((l) => l.productId === 1);
  assert.ok(p1, "product 1 survives the merge");
  assert.equal(p1!.quantity, 5, "3 + 2 clamps to stock 5");
  assert.equal(merged.find((l) => l.productId === 2), undefined, "out-of-stock product 2 is dropped");
});

test("clampQty defends against invalid input", () => {
  assert.equal(clampQty(NaN, 5), 1);
  assert.equal(clampQty(-3, 5), 1);
  assert.equal(clampQty(99, 4), 4);
});

const duoLine = (productId: number, duo?: CartDuo): CartLine => ({
  productId, slug: `p${productId}`, name: `Produit ${productId}`, brandName: null, image: null,
  priceMillimes: 40_000, quantity: 1, stock: 10, volume: null, duo,
});

test("duo savings only apply when both members are on the plate", () => {
  const duo: CartDuo = { code: "duo-a", label: "Duo A", memberIds: [1, 2], discountMillimes: 5_000 };
  assert.equal(duoSavingsTotal([duoLine(1, duo)]), 0, "one member alone earns nothing");
  assert.equal(duoSavingsTotal([duoLine(1, duo), duoLine(2, duo)]), 5_000, "both members unlock the duo");
  const list = duoSavings([duoLine(1, duo), duoLine(2, duo)]);
  assert.equal(list.length, 1);
  assert.equal(list[0].label, "Duo A");
});

test("duo metadata survives quantity merges and cart reconciliation", () => {
  const duo: CartDuo = { code: "duo-b", label: "Duo B", memberIds: [7, 8], discountMillimes: 3_000 };
  const twice = addLine([duoLine(7, duo)], { ...duoLine(7, duo), duo }, 1);
  assert.deepEqual(twice[0].duo, duo, "re-adding keeps the duo tag");
  const merged = mergeCarts([duoLine(7, duo)], [duoLine(8, duo)]);
  assert.ok(merged.every((l) => l.duo?.code === duo.code), "duo tags are not silently dropped by the merge");
  assert.equal(duoSavingsTotal(merged), 3_000, "a duo split across guest and account carts is whole again after merging");
  assert.equal(duoSavingsTotal(mergeCarts([duoLine(7, duo)], [duoLine(9, duo)]) ) , 0, "…but half a duo is still half a duo");
});
