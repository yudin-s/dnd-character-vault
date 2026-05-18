export const DICE_TYPES = [4, 6, 10, 12, 20];
export const MAX_DICE_COUNT = 12;

function createRollId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `roll-${crypto.randomUUID()}`;
  }
  return `roll-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeToPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.trunc(parsed));
}

function clampSides(value) {
  const selected = normalizeToPositiveInteger(value, DICE_TYPES[0]);
  let nearest = DICE_TYPES[0];
  let smallestDelta = Number.MAX_SAFE_INTEGER;
  for (const sides of DICE_TYPES) {
    const delta = Math.abs(sides - selected);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      nearest = sides;
    }
  }
  return nearest;
}

function clampCount(value) {
  const normalized = normalizeToPositiveInteger(value, 1);
  return Math.min(MAX_DICE_COUNT, normalized);
}

export function rollDie(sides, rng = Math.random) {
  const sidesValue = clampSides(sides);
  const random = typeof rng === "function" ? rng : Math.random;
  return Math.min(Math.max(1, Math.floor(random() * sidesValue) + 1), sidesValue);
}

export function rollDice({ sides, count, rng } = {}) {
  const sidesValue = clampSides(sides);
  const countValue = clampCount(count);
  const rolls = Array.from(
    { length: countValue },
    () => rollDie(sidesValue, rng)
  );
  const total = rolls.reduce((sum, value) => sum + value, 0);

  return {
    id: createRollId(),
    sides: sidesValue,
    count: countValue,
    rolls,
    total,
    notation: `${countValue}d${sidesValue}`,
    timestamp: Date.now()
  };
}

export function formatRoll(result) {
  if (!result || typeof result !== "object") return "";
  const count = normalizeToPositiveInteger(result.count, 1);
  const sides = clampSides(result.sides);
  const total = Number(result.total);
  if (!Number.isFinite(total)) return `${count}d${sides} = 0`;
  return `${count}d${sides} = ${total}`;
}
