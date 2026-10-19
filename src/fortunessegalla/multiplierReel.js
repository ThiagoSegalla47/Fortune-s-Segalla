export const MULTIPLIER_WEIGHTS = [
  { value: 1, weight: 600 },
  { value: 2, weight: 250 },
  { value: 5, weight: 100 },
  { value: 10, weight: 40 },
  { value: 25, weight: 9 },
  { value: 50, weight: 1 },
];
export const MULTIPLIER_VALUES = MULTIPLIER_WEIGHTS.map(({ value }) => value);
export const MULTIPLIER_CENTER_CHANCE = 0.5;
const TOTAL_MULTIPLIER_WEIGHT = MULTIPLIER_WEIGHTS.reduce((total, { weight }) => total + weight, 0);

// Each item occupies 40% of the window: three numbers fit at an integer
// stop, and only two fit when the strip stops halfway between items.
export const MULTIPLIER_ITEM_WIDTH_PERCENT = 40;

export function getCenteredMultiplier(items, stopPosition) {
  return Number.isInteger(stopPosition) ? items[stopPosition] ?? null : null;
}

export function getMultiplierOffset(stopPosition) {
  return 50 - (stopPosition + 0.5) * MULTIPLIER_ITEM_WIDTH_PERCENT;
}

export function getRandomMultiplier(random = Math.random) {
  let ticket = random() * TOTAL_MULTIPLIER_WEIGHT;
  for (const { value, weight } of MULTIPLIER_WEIGHTS) {
    if (ticket < weight) return value;
    ticket -= weight;
  }
  return MULTIPLIER_VALUES.at(-1);
}

export function createMultiplierSpin(random = Math.random, previousReel = null, reducedMotion = false) {
  const centered = random() < MULTIPLIER_CENTER_CHANCE;
  // Carry over the last visible numbers so the next spin starts without a jump.
  const previousIndex = previousReel ? Math.floor(previousReel.stopPosition) : 0;
  const carriedItems = previousReel
    ? previousReel.items.slice(previousIndex - 1, previousIndex + 3)
    : [];
  const startPosition = previousReel ? 1 + previousReel.stopPosition - previousIndex : 1;
  const items = [
    ...carriedItems,
    ...Array.from({ length: reducedMotion ? 6 : 18 }, () => getRandomMultiplier(random)),
  ];
  const stopPosition = items.length - 3 + (centered ? 0 : 0.5);

  return {
    items,
    startPosition,
    stopPosition,
    multiplier: getCenteredMultiplier(items, stopPosition),
  };
}

export function applyRoundMultiplier(payout, multiplier) {
  return Math.round(payout * (multiplier ?? 1) * 100) / 100;
}
