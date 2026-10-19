import assert from "node:assert/strict";
import test from "node:test";
import {
  applyRoundMultiplier,
  createMultiplierSpin,
  getCenteredMultiplier,
  getMultiplierOffset,
  getRandomMultiplier,
  MULTIPLIER_ITEM_WIDTH_PERCENT,
  MULTIPLIER_VALUES,
  MULTIPLIER_WEIGHTS,
} from "../src/fortunessegalla/multiplierReel.js";

function spinWith(value, centered) {
  let calls = 0;
  const valueIndex = MULTIPLIER_WEIGHTS.findIndex((entry) => entry.value === value);
  const precedingWeight = MULTIPLIER_WEIGHTS.slice(0, valueIndex).reduce((sum, entry) => sum + entry.weight, 0);
  const totalWeight = MULTIPLIER_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
  const valueRoll = (precedingWeight + MULTIPLIER_WEIGHTS[valueIndex].weight / 2) / totalWeight;
  return createMultiplierSpin(() => calls++ === 0 ? centered ? 0 : 0.99 : valueRoll);
}

test("high multipliers occupy only their configured rare ranges", () => {
  const counts = Object.fromEntries(MULTIPLIER_VALUES.map((value) => [value, 0]));
  for (let ticket = 0; ticket < 1000; ticket++) {
    counts[getRandomMultiplier(() => (ticket + 0.5) / 1000)]++;
  }
  assert.deepEqual(counts, { 1: 600, 2: 250, 5: 100, 10: 40, 25: 9, 50: 1 });
  assert.equal(getRandomMultiplier(() => 0), 1);
  assert.equal(getRandomMultiplier(() => 0.999999), 50);
});

test("the weighted ranges include the correct boundary values", () => {
  for (const [roll, expected] of [[0.6, 2], [0.85, 5], [0.95, 10], [0.99, 25], [0.999, 50]]) {
    assert.equal(getRandomMultiplier(() => roll), expected);
  }
});

test("each carousel spin starts with the previous numbers at the same positions", () => {
  for (const stopPosition of [2, 2.5]) {
    const previous = { items: [1, 2, 5, 10, 25], stopPosition };
    const next = createMultiplierSpin(() => 0, previous);
    const previousOffset = getMultiplierOffset(previous.stopPosition);
    const nextOffset = getMultiplierOffset(next.startPosition);
    for (let index = 0; index < 4; index++) {
      assert.equal(next.items[index], previous.items[index + 1]);
      assert.equal(
        nextOffset + index * MULTIPLIER_ITEM_WIDTH_PERCENT,
        previousOffset + (index + 1) * MULTIPLIER_ITEM_WIDTH_PERCENT
      );
    }
    assert.ok(next.stopPosition > 4);
    assert.equal(next.multiplier, 1);
  }
});

test("reduced motion shortens the carousel without changing its result or starting position", () => {
  const previous = { items: [1, 2, 5, 10], stopPosition: 1.5 };
  for (const roll of [0, 0.9999]) {
    const full = createMultiplierSpin(() => roll, previous);
    const reduced = createMultiplierSpin(() => roll, previous, true);
    assert.equal(reduced.startPosition, full.startPosition);
    assert.deepEqual(reduced.items.slice(0, 4), full.items.slice(0, 4));
    assert.ok(reduced.stopPosition < full.stopPosition);
    assert.equal(reduced.multiplier, full.multiplier);
  }
});

for (const value of MULTIPLIER_VALUES) {
  test(`${value}x in the center multiplies only an existing win`, () => {
    const result = spinWith(value, true);
    assert.equal(result.multiplier, value);
    assert.equal(result.items[result.stopPosition], value);
    assert.equal(applyRoundMultiplier(12.5, result.multiplier), 12.5 * value);
    assert.equal(applyRoundMultiplier(0, result.multiplier), 0);
  });

  test(`a gap between ${value}x numbers leaves the win unchanged`, () => {
    const result = spinWith(value, false);
    assert.equal(result.multiplier, null);
    assert.equal(applyRoundMultiplier(12.5, result.multiplier), 12.5);
  });
}

test("the multiplier comes from the center, never a neighboring number", () => {
  assert.equal(getCenteredMultiplier([50, 2, 25], 1), 2);
  assert.equal(getCenteredMultiplier([50, 2, 25], 1.5), null);
});

test("centered stops show exactly three complete badges, gap stops exactly two", () => {
  for (const centered of [true, false]) {
    const result = spinWith(50, centered);
    const offset = getMultiplierOffset(result.stopPosition);
    const badgeHalfWidth = MULTIPLIER_ITEM_WIDTH_PERCENT * 0.44 / 2;
    const positions = result.items.map((_, index) =>
      offset + (index + 0.5) * MULTIPLIER_ITEM_WIDTH_PERCENT
    );
    const visible = positions.filter((center) => center + badgeHalfWidth > 0 && center - badgeHalfWidth < 100);
    assert.equal(visible.length, centered ? 3 : 2);
    assert.ok(visible.every((center) => center - badgeHalfWidth >= 0 && center + badgeHalfWidth <= 100));
    assert.equal(visible.includes(50), centered);
  }
});

test("a new gap stop does not reuse the previous round's multiplier", () => {
  const first = spinWith(50, true);
  const second = spinWith(25, false);
  assert.equal(applyRoundMultiplier(10, first.multiplier), 500);
  assert.equal(applyRoundMultiplier(10, second.multiplier), 10);
});

test("payouts are rounded to cents after multiplication", () => {
  assert.equal(applyRoundMultiplier(0.1 + 0.2, 50), 15);
  assert.equal(applyRoundMultiplier(0.125, 5), 0.63);
});
