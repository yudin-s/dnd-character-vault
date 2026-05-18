export const DICE_TYPES = [4, 6, 8, 10, 12, 20];
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

function secureRandom() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 0xffffffff;
  }
  return Math.random();
}

export function rollDie(sides, rng = secureRandom) {
  const sidesValue = clampSides(sides);
  const random = typeof rng === "function" ? rng : Math.random;
  return Math.min(Math.max(1, Math.floor(random() * sidesValue) + 1), sidesValue);
}

export function rollDice({ sides, count, rng, modifier: inputModifier, label: inputLabel } = {}) {
  const sidesValue = clampSides(sides);
  const countValue = clampCount(count);
  const modifier = normalizeModifier(inputModifier);
  const label = String(inputLabel || "");
  const rolls = Array.from(
    { length: countValue },
    () => rollDie(sidesValue, rng)
  );
  const diceTotal = rolls.reduce((sum, value) => sum + value, 0);
  const total = diceTotal + modifier;

  return {
    id: createRollId(),
    sides: sidesValue,
    count: countValue,
    modifier,
    label,
    rolls,
    diceTotal,
    total,
    notation: `${countValue}d${sidesValue}${formatModifier(modifier)}`,
    timestamp: Date.now()
  };
}

export function rollCompositeDice({ label: inputLabel, groups = [], rng } = {}) {
  const label = String(inputLabel || "");
  const normalizedGroups = groups
    .map((group) => {
      const sides = clampSides(group.sides);
      const count = clampCount(group.count);
      const modifier = normalizeModifier(group.modifier);
      const rolls = Array.from({ length: count }, () => rollDie(sides, rng));
      const diceTotal = rolls.reduce((sum, value) => sum + value, 0);
      const total = diceTotal + modifier;

      return {
        key: String(group.key || group.label || `${count}d${sides}`),
        label: String(group.label || ""),
        sides,
        count,
        modifier,
        rolls,
        diceTotal,
        total,
        notation: `${count}d${sides}${formatModifier(modifier)}`
      };
    })
    .filter((group) => group.count > 0);

  const total = normalizedGroups.reduce((sum, group) => sum + group.total, 0);

  return {
    id: createRollId(),
    label,
    groups: normalizedGroups,
    rolls: normalizedGroups.flatMap((group) => group.rolls),
    diceTotal: normalizedGroups.reduce((sum, group) => sum + group.diceTotal, 0),
    total,
    notation: normalizedGroups.map((group) => group.notation).join(" / "),
    timestamp: Date.now()
  };
}

export function formatRoll(result) {
  if (!result || typeof result !== "object") return "";
  if (Array.isArray(result.groups) && result.groups.length) {
    const label = result.label ? `${result.label}: ` : "";
    return `${label}${result.groups.map((group) => {
      const groupLabel = group.label ? `${group.label} ` : "";
      return `${groupLabel}${group.notation} = ${group.total}`;
    }).join(" / ")}`;
  }
  const count = normalizeToPositiveInteger(result.count, 1);
  const sides = clampSides(result.sides);
  const modifier = normalizeModifier(result.modifier);
  const total = Number(result.total);
  const label = result.label ? `${result.label}: ` : "";
  if (!Number.isFinite(total)) return `${label}${count}d${sides}${formatModifier(modifier)} = 0`;
  return `${label}${count}d${sides}${formatModifier(modifier)} = ${total}`;
}

function normalizeModifier(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function formatModifier(value) {
  const modifier = normalizeModifier(value);
  if (modifier === 0) return "";
  return modifier > 0 ? `+${modifier}` : `${modifier}`;
}
