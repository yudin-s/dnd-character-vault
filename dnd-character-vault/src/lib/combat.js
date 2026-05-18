import { deepClone, normalizeCharacter } from "./character";
import { isArmorLike, itemArmorValue, rollHealingFromText } from "./equipment";

export const CONDITIONS = [
  "blinded",
  "charmed",
  "deafened",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious"
];

export function applyHitPointChange(character, { type, amount }) {
  const next = deepClone(character);
  const hitPoints = next.combat.hitPoints;
  const value = normalizeAmount(amount);

  if (type === "damage") {
    const absorbed = Math.min(numberOr(hitPoints.temporary, 0), value);
    hitPoints.temporary = Math.max(0, numberOr(hitPoints.temporary, 0) - absorbed);
    hitPoints.current = Math.max(0, numberOr(hitPoints.current, 0) - (value - absorbed));
  }

  if (type === "heal") {
    hitPoints.current = Math.min(numberOr(hitPoints.max, 0), numberOr(hitPoints.current, 0) + value);
  }

  if (type === "temp") {
    hitPoints.temporary = Math.max(numberOr(hitPoints.temporary, 0), value);
  }

  return normalizeCharacter(next);
}

export function adjustResourceValue(character, index, delta) {
  const next = deepClone(character);
  const resource = next.resources[index];
  if (!resource) return normalizeCharacter(next);

  const max = numberOr(resource.max, Number.POSITIVE_INFINITY);
  const current = resource.current === "" ? maxFiniteOr(max, 0) : numberOr(resource.current, 0);
  resource.current = clamp(current + delta, 0, maxFiniteOr(max, current + delta));

  return normalizeCharacter(next);
}

export function resetResources(character, restType = "long") {
  const next = deepClone(character);
  const normalizedRest = String(restType).toLowerCase();

  next.resources = next.resources.map((resource) => {
    const resetText = String(resource.reset || "").toLowerCase();
    const shouldReset = normalizedRest === "long"
      ? resetText.includes("long") || resetText.includes("дл")
      : resetText.includes("short") || resetText.includes("кор");

    return shouldReset && resource.max !== ""
      ? { ...resource, current: numberOr(resource.max, 0) }
      : resource;
  });

  return normalizeCharacter(next);
}

export function setDeathSave(character, type, index, value) {
  const next = deepClone(character);
  if (!["successes", "failures"].includes(type)) return normalizeCharacter(next);
  next.deathSaves[type][index] = Boolean(value);
  return normalizeCharacter(next);
}

export function toggleCondition(character, condition) {
  const next = deepClone(character);
  const current = parseConditions(next.combat.conditions);
  const normalized = String(condition || "").trim();
  if (!normalized) return normalizeCharacter(next);

  const exists = current.some((item) => item.toLowerCase() === normalized.toLowerCase());
  const nextConditions = exists
    ? current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())
    : [...current, normalized];
  next.combat.conditions = nextConditions.join(", ");

  return normalizeCharacter(next);
}

export function toggleEquipment(character, index) {
  const next = deepClone(character);
  const item = next.equipment?.items?.[index];
  if (!item) return normalizeCharacter(next);

  const armorValue = itemArmorValue(item);
  const equipped = Boolean(item.equipped);
  const itemType = String(item.type || "").toLowerCase();
  const armorLike = isArmorLike(item);
  const shieldLike = itemType === "shield" || itemType.includes("shield") || itemType.includes("щит");
  item.equipped = !equipped;

  if (armorValue > 0 && item.equipped) {
    if (shieldLike && armorValue <= 5) {
      next.combat.armorClass = numberOr(next.combat.armorClass, 10) + armorValue;
    } else if (armorLike) {
      next.combat.armorClass = armorValue;
    }
  }

  if (armorValue > 0 && !item.equipped) {
    if (shieldLike && armorValue <= 5) {
      next.combat.armorClass = Math.max(0, numberOr(next.combat.armorClass, 10) - armorValue);
    } else if (armorLike && numberOr(next.combat.armorClass, 10) === armorValue) {
      next.combat.armorClass = 10;
    }
  }

  return normalizeCharacter(next);
}

export function useEquipmentItem(character, index) {
  const next = deepClone(character);
  const item = next.equipment?.items?.[index];
  if (!item) return normalizeCharacter(next);

  const quantity = numberOr(item.quantity, 0);
  if (item.consumable) item.quantity = Math.max(0, quantity - 1);
  if (numberOr(item.use, 0) > 0) item.use = Math.max(0, numberOr(item.use, 0) - 1);

  const text = `${item.name || ""} ${item.type || ""} ${item.effects || ""}`;
  let healing = rollHealingFromText(text);
  if (!healing && /potion|зель|healing|леч/i.test(text)) {
    healing = rollHealingFromText("2d4+2");
  }

  if (healing > 0) {
    return applyHitPointChange(next, { type: "heal", amount: healing });
  }

  return normalizeCharacter(next);
}

export function parseConditions(value) {
  return String(value || "")
    .split(/[,;|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAmount(value) {
  return Math.max(0, Math.round(numberOr(value, 0)));
}

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function maxFiniteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
