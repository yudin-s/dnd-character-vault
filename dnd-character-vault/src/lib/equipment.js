const normalizeText = (value, fallback = "") => {
  if (value == null) return fallback;
  return String(value);
};

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
}

function normalizeBoolean(value, fallback = false) {
  return value == null ? fallback : Boolean(value);
}

const DAMAGE_DICE_SIDES = [4, 6, 8, 10, 12, 20];
const DEFAULT_ID_PREFIX = "equipment";

function createId(prefix = DEFAULT_ID_PREFIX) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const EQUIPMENT_DEFAULT_ITEM = {
  name: "",
  type: "",
  quantity: 1,
  equipped: false,
  consumable: false,
  use: 0,
  armorClass: "",
  attackBonus: "",
  damageDiceCount: 1,
  damageDiceSides: 6,
  damageDice: "",
  damageBonus: "",
  damageType: "",
  effects: ""
};

export const EQUIPMENT_TYPES = ["weapon", "armor", "shield", "potion", "tool", "gear", "treasure"];

export function createEquipmentItem(customId) {
  return {
    ...EQUIPMENT_DEFAULT_ITEM,
    id: normalizeText(customId, createId("equipment-item"))
  };
}

export function normalizeEquipmentItem(rawItem, getId = createId) {
  const item = typeof rawItem === "object" && rawItem !== null ? rawItem : {};
  const legacyDamageDice = parseDamageDice(item.damageDice);
  const damageDiceCount = normalizeDiceCount(item.damageDiceCount, legacyDamageDice.count);
  const damageDiceSides = normalizeDiceSides(item.damageDiceSides, legacyDamageDice.sides);
  return {
    ...EQUIPMENT_DEFAULT_ITEM,
    ...item,
    id: normalizeText(item.id, getId("equipment-item")),
    name: normalizeText(item.name, ""),
    type: normalizeText(item.type, ""),
    quantity: normalizeNumber(item.quantity, 1),
    equipped: normalizeBoolean(item.equipped, false),
    consumable: normalizeBoolean(item.consumable, false),
    use: normalizeNumber(item.use, 0),
    armorClass: normalizeText(item.armorClass, ""),
    attackBonus: normalizeText(item.attackBonus, ""),
    damageDiceCount,
    damageDiceSides,
    damageDice: normalizeText(item.damageDice, `${damageDiceCount}d${damageDiceSides}`),
    damageBonus: normalizeText(item.damageBonus, ""),
    damageType: normalizeText(item.damageType, ""),
    effects: normalizeText(item.effects, "")
  };
}

function parseDamageDice(value) {
  const match = String(value || "").toLowerCase().match(/(\d*)d(\d+)/);
  return {
    count: normalizeDiceCount(match?.[1], 1),
    sides: normalizeDiceSides(match?.[2], 6)
  };
}

function normalizeDiceCount(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(12, Math.max(1, Math.round(parsed)));
}

function normalizeDiceSides(value, fallback = 6) {
  const parsed = Number(value);
  return DAMAGE_DICE_SIDES.includes(parsed) ? parsed : fallback;
}

export function itemArmorValue(item) {
  const parsed = Number(item?.armorClass);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function isArmorLike(item) {
  const type = String(item?.type || "").toLowerCase();
  return type.includes("armor") || type.includes("armour") || type.includes("брон");
}

export function isShieldLike(item) {
  const type = String(item?.type || "").toLowerCase();
  const name = String(item?.name || "").toLowerCase();
  return type.includes("shield") || type.includes("щит") || name.includes("shield") || name.includes("щит");
}

export function rollHealingFromText(value) {
  const text = String(value || "").toLowerCase();
  const diceMatch = text.match(/(\d*)d(\d+)\s*([+-]\s*\d+)?/);
  if (diceMatch) {
    const count = Math.max(1, Number(diceMatch[1]) || 1);
    const sides = Math.max(1, Number(diceMatch[2]) || 4);
    const bonus = Number(String(diceMatch[3] || "0").replace(/\s+/g, "")) || 0;
    return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
      .reduce((sum, roll) => sum + roll, bonus);
  }

  const healMatch = text.match(/(?:heal|healing|леч|хил|hp|хп)\D{0,8}(\d+)/);
  if (healMatch) return Number(healMatch[1]) || 0;

  return 0;
}
