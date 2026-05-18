const ABILITY_LABELS = {
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  charisma: "Charisma",
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const ABILITIES = [
  { key: "strength", label: "Strength", short: "STR" },
  { key: "dexterity", label: "Dexterity", short: "DEX" },
  { key: "constitution", label: "Constitution", short: "CON" },
  { key: "intelligence", label: "Intelligence", short: "INT" },
  { key: "wisdom", label: "Wisdom", short: "WIS" },
  { key: "charisma", label: "Charisma", short: "CHA" },
];

export const SKILLS = [
  { key: "acrobatics", label: "Acrobatics", ability: "dexterity" },
  { key: "animalHandling", label: "Animal Handling", ability: "wisdom" },
  { key: "arcana", label: "Arcana", ability: "intelligence" },
  { key: "athletics", label: "Athletics", ability: "strength" },
  { key: "deception", label: "Deception", ability: "charisma" },
  { key: "history", label: "History", ability: "intelligence" },
  { key: "insight", label: "Insight", ability: "wisdom" },
  { key: "intimidation", label: "Intimidation", ability: "charisma" },
  { key: "investigation", label: "Investigation", ability: "intelligence" },
  { key: "medicine", label: "Medicine", ability: "wisdom" },
  { key: "nature", label: "Nature", ability: "intelligence" },
  { key: "perception", label: "Perception", ability: "wisdom" },
  { key: "performance", label: "Performance", ability: "charisma" },
  { key: "persuasion", label: "Persuasion", ability: "charisma" },
  { key: "religion", label: "Religion", ability: "intelligence" },
  { key: "sleightOfHand", label: "Sleight of Hand", ability: "dexterity" },
  { key: "stealth", label: "Stealth", ability: "dexterity" },
  { key: "survival", label: "Survival", ability: "wisdom" },
];

export const COINS = ["cp", "sp", "ep", "gp", "pp"];
export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getNested = (obj, path) =>
  path.reduce((current, segment) => (current && typeof current === "object" ? current[segment] : undefined), obj);

const LEVEL_PATHS = [
  ["identity", "level"],
  ["identity", "lvl"],
  ["level"],
];

const ABILITY_METRICS = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

const ABILITY_SHORT_TO_KEY = {
  str: "strength",
  dex: "dexterity",
  con: "constitution",
  int: "intelligence",
  wis: "wisdom",
  cha: "charisma",
};

const SKILL_META_BY_KEY = new Map(
  SKILLS.map((skill) => [normalizeText(skill.key), skill]),
);

const SKILL_ALIAS_BY_LABEL = new Map(
  SKILLS.map((skill) => [normalizeText(skill.label), skill]),
);

const parseFlag = (value) => value === true || value === "true" || value === 1 || value === "1";

const resolveAbilityIndex = (ability) => {
  if (!ability) {
    return null;
  }

  const normalized = normalizeText(ability);
  if (!normalized) {
    return null;
  }

  if (ABILITY_SHORT_TO_KEY[normalized]) {
    return ABILITY_SHORT_TO_KEY[normalized];
  }

  if (Object.prototype.hasOwnProperty.call(ABILITY_METRICS, normalized)) {
    return normalized;
  }

  return null;
};

const abilityByKey = (ability) => {
  if (!ability) return null;
  const normalized = normalizeText(ability);
  const exact = resolveAbilityIndex(normalized);
  if (exact) {
    return exact;
  }

  const byLabel = Object.entries(ABILITY_LABELS).find(
    ([, label]) => normalized === normalizeText(label),
  );
  return byLabel ? byLabel[0] : null;
};

const getCharacterLevel = (character) => {
  for (const path of LEVEL_PATHS) {
    const value = getNested(character || {}, path);
    if (value !== undefined && value !== null) {
      return Math.max(1, Math.floor(toNumber(value, 1)));
    }
  }

  return 1;
};

export function abilityModifier(score) {
  const value = toNumber(score, 10);
  return Math.floor((value - 10) / 2);
}

export function signed(number) {
  const value = toNumber(number, 0);
  return value >= 0 ? `+${value}` : `${value}`;
}

export function proficiencyBonus(level) {
  const resolved = Math.max(1, Math.floor(toNumber(level, 1)));
  return Math.floor(2 + (resolved - 1) / 4);
}

export function getAbilityScore(character, ability) {
  const key = abilityByKey(ability);
  if (!key) {
    return 10;
  }

  const abilityValue = getNested((character || {}), ["abilities", key]);
  if (!abilityValue) {
    return 10;
  }

  const score = abilityValue && typeof abilityValue === "object"
    ? getNested(abilityValue, ["score"])
    : abilityValue;

  return toNumber(score, 10);
}

export function getSkillMeta(skillKey) {
  const normalized = normalizeText(skillKey);
  if (!normalized) {
    return null;
  }

  return SKILL_META_BY_KEY.get(normalized)
    || SKILL_ALIAS_BY_LABEL.get(normalized)
    || null;
}

export function skillBonus(character, skill) {
  const meta = getSkillMeta(skill);
  if (!meta) {
    return 0;
  }

  const normalizedSkillData = getNested(character || {}, ["skills", normalizeText(skill)]);
  const skillData = getNested(character || {}, ["skills", meta.key]) || normalizedSkillData || {};
  const proficient = parseFlag(skillData?.proficient);
  const expertise = parseFlag(
    skillData?.expertise
    || skillData?.expert
    || skillData?.doubles
  ) || skillData?.expertise === "expertise" || skillData?.expertise === "double";

  const abilityScore = getAbilityScore(character, meta.ability);
  const bonusFromAbility = abilityModifier(abilityScore);
  if (!proficient) {
    return bonusFromAbility;
  }

  const level = getCharacterLevel(character);
  const proficientBonus = proficiencyBonus(level);
  return bonusFromAbility + proficientBonus * (expertise ? 2 : 1);
}

export function savingThrowBonus(character, ability) {
  const key = abilityByKey(ability);
  if (!key) {
    return 0;
  }

  const bonusData = getNested(character || {}, ["savingThrows", key]);
  const proficient = parseFlag(bonusData?.proficient);

  const base = abilityModifier(getAbilityScore(character, key));
  if (!proficient) {
    return base;
  }

  const prof = proficiencyBonus(getCharacterLevel(character));
  return base + prof;
}

export function passiveScore(character, skillKey) {
  return 10 + skillBonus(character, skillKey);
}
