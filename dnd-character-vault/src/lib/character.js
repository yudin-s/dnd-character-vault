import { createEquipmentItem, normalizeEquipmentItem } from "./equipment";

export const SCHEMA_VERSION = 3;

export const ABILITY_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma"
];

export const SKILL_DEFINITIONS = {
  acrobatics: { label: "Acrobatics", ability: "dexterity" },
  animalHandling: { label: "Animal Handling", ability: "wisdom" },
  arcana: { label: "Arcana", ability: "intelligence" },
  athletics: { label: "Athletics", ability: "strength" },
  deception: { label: "Deception", ability: "charisma" },
  history: { label: "History", ability: "intelligence" },
  insight: { label: "Insight", ability: "wisdom" },
  intimidation: { label: "Intimidation", ability: "charisma" },
  investigation: { label: "Investigation", ability: "intelligence" },
  medicine: { label: "Medicine", ability: "wisdom" },
  nature: { label: "Nature", ability: "intelligence" },
  perception: { label: "Perception", ability: "wisdom" },
  performance: { label: "Performance", ability: "charisma" },
  persuasion: { label: "Persuasion", ability: "charisma" },
  religion: { label: "Religion", ability: "intelligence" },
  sleightOfHand: { label: "Sleight of Hand", ability: "dexterity" },
  stealth: { label: "Stealth", ability: "dexterity" },
  survival: { label: "Survival", ability: "wisdom" }
};

const DEFAULT_ABILITY_SCORE = 10;

function createId(prefix = "char") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createAbilities() {
  return Object.fromEntries(ABILITY_KEYS.map((key) => [key, { score: DEFAULT_ABILITY_SCORE }]));
}

function createSavingThrows() {
  return Object.fromEntries(ABILITY_KEYS.map((key) => [key, { proficient: false, bonus: "" }]));
}

function createSkills() {
  return Object.fromEntries(
    Object.entries(SKILL_DEFINITIONS).map(([key, meta]) => [
      key,
      {
        ability: meta.ability,
        proficient: false,
        expertise: false,
        bonus: ""
      }
    ])
  );
}

function createSpellSlots() {
  return Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [
      String(index + 1),
      {
        current: "",
        max: ""
      }
    ])
  );
}

export function createDefaultCharacter() {
  return {
    schemaVersion: SCHEMA_VERSION,
    identity: {
      id: createId(),
      name: "New Character",
      player: "",
      className: "",
      subclass: "",
      level: 1,
      species: "",
      background: "",
      alignment: "",
      experience: ""
    },
    inspiration: false,
    abilities: createAbilities(),
    savingThrows: createSavingThrows(),
    skills: createSkills(),
    combat: {
      armorClass: 10,
      speed: 30,
      initiativeOverride: "",
      proficiencyOverride: "",
      hitPoints: {
        current: 10,
        max: 10,
        temporary: 0
      },
      hitDice: "",
      exhaustion: 0,
      conditions: ""
    },
    deathSaves: {
      successes: [false, false, false],
      failures: [false, false, false]
    },
    resources: [
      { id: createId("resource"), name: "Hit Dice", current: "", max: "", reset: "Long rest" }
    ],
    attacks: [
      { id: createId("attack"), name: "", bonus: "", damage: "", notes: "" }
    ],
    spells: {
      ability: "none",
      saveDc: "",
      attackBonus: "",
      focus: "",
      slots: createSpellSlots(),
      known: []
    },
    equipment: {
      coins: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 0,
        pp: 0
      },
      items: [],
      notes: "",
      legacyNotes: ""
    },
    proficiencies: "",
    features: "",
    appearance: "",
    personality: {
      traits: "",
      ideals: "",
      bonds: "",
      flaws: ""
    },
    notes: ""
  };
}

export function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function abilityModifier(score) {
  const value = numberOr(score, DEFAULT_ABILITY_SCORE);
  return Math.floor((value - 10) / 2);
}

export function proficiencyBonus(level) {
  const value = clamp(Math.round(numberOr(level, 1)), 1, 20);
  return 2 + Math.floor((value - 1) / 4);
}

export function normalizeCharacter(input) {
  const merged = mergeDeep(createDefaultCharacter(), isObject(input) ? input : {});

  merged.schemaVersion = SCHEMA_VERSION;
  merged.identity.id = stringOr(merged.identity.id, createId());
  merged.identity.name = stringOr(merged.identity.name, "New Character");
  merged.identity.player = stringOr(merged.identity.player || merged.identity.playerName, "");
  merged.identity.className = stringOr(merged.identity.className || merged.identity.class, "");
  merged.identity.subclass = stringOr(merged.identity.subclass || merged.identity.subClass, "");
  merged.identity.species = stringOr(merged.identity.species || merged.identity.race, "");
  merged.identity.level = clamp(Math.round(numberOr(merged.identity.level, 1)), 1, 20);

  for (const key of ABILITY_KEYS) {
    const score = isObject(merged.abilities[key])
      ? merged.abilities[key].score
      : merged.abilities[key];
    merged.abilities[key] = { score: clamp(Math.round(numberOr(score, DEFAULT_ABILITY_SCORE)), 1, 30) };
    merged.savingThrows[key] = {
      proficient: Boolean(merged.savingThrows[key]?.proficient),
      bonus: stringOr(merged.savingThrows[key]?.bonus, "")
    };
  }

  for (const [key, meta] of Object.entries(SKILL_DEFINITIONS)) {
    const skill = merged.skills[key] || {};
    merged.skills[key] = {
      ability: meta.ability,
      proficient: Boolean(skill.proficient),
      expertise: Boolean(skill.expertise),
      bonus: stringOr(skill.bonus, "")
    };
  }

  merged.inspiration = Boolean(merged.inspiration);
  merged.combat.armorClass = numberOr(merged.combat.armorClass, 10);
  merged.combat.speed = numberOr(merged.combat.speed, 30);
  merged.combat.hitPoints.current = numberOr(merged.combat.hitPoints.current, 10);
  merged.combat.hitPoints.max = numberOr(merged.combat.hitPoints.max, 10);
  merged.combat.hitPoints.temporary = numberOr(merged.combat.hitPoints.temporary, 0);
  merged.combat.exhaustion = clamp(Math.round(numberOr(merged.combat.exhaustion, 0)), 0, 6);

  merged.deathSaves.successes = normalizeThreeChecks(merged.deathSaves.successes);
  merged.deathSaves.failures = normalizeThreeChecks(merged.deathSaves.failures);
  merged.resources = normalizeList(merged.resources, "resource", {
    name: "",
    current: "",
    max: "",
    reset: ""
  });
  merged.attacks = normalizeList(merged.attacks, "attack", {
    name: "",
    bonus: "",
    damage: "",
    notes: ""
  });
  merged.spells.slots = mergeDeep(createSpellSlots(), merged.spells.slots || {});
  merged.spells.known = normalizeList(merged.spells.known, "spell", {
    level: "",
    name: "",
    prepared: false,
    notes: ""
  }).map((spell) => ({ ...spell, prepared: Boolean(spell.prepared) }));
  const legacyGearNotes = stringOr(merged.equipment?.legacyNotes, stringOr(merged.equipment?.gear, ""));
  const notes = stringOr(merged.equipment?.notes, legacyGearNotes);
  merged.equipment = {
    coins: {
      cp: numberOr(merged.equipment?.coins?.cp, 0),
      sp: numberOr(merged.equipment?.coins?.sp, 0),
      ep: numberOr(merged.equipment?.coins?.ep, 0),
      gp: numberOr(merged.equipment?.coins?.gp, 0),
      pp: numberOr(merged.equipment?.coins?.pp, 0)
    },
    items: normalizeEquipmentItems(merged.equipment?.items),
    notes,
    legacyNotes: legacyGearNotes,
    gear: stringOr(merged.equipment?.gear, notes)
  };

  return merged;
}

export function summarizeCharacter(character) {
  const safe = normalizeCharacter(character);
  const identity = safe.identity;
  return {
    id: identity.id,
    title: identity.name || "Unnamed character",
    subtitle: [
      identity.level ? `Level ${identity.level}` : "",
      identity.species,
      identity.className
    ].filter(Boolean).join(" "),
    armorClass: safe.combat.armorClass,
    hitPoints: `${safe.combat.hitPoints.current}/${safe.combat.hitPoints.max}`,
    updatedAt: new Date().toISOString()
  };
}

export function createListItem(type) {
  const factories = {
    attacks: () => ({ id: createId("attack"), name: "", bonus: "", damage: "", notes: "" }),
    resources: () => ({ id: createId("resource"), name: "", current: "", max: "", reset: "" }),
    spells: () => ({ id: createId("spell"), level: "", name: "", prepared: false, notes: "" }),
    equipment: () => createEquipmentItem(createId("equipment"))
  };
  return factories[type]?.() || { id: createId("item") };
}

function normalizeEquipmentItems(value) {
  const source = Array.isArray(value) ? value : [];
  return source.map((item) => normalizeEquipmentItem(item, createId));
}

function normalizeList(value, prefix, defaults) {
  const source = Array.isArray(value) ? value : [];
  return source.map((item) => ({
    ...defaults,
    ...(isObject(item) ? item : {}),
    id: stringOr(item?.id, createId(prefix))
  }));
}

function normalizeThreeChecks(value) {
  if (Array.isArray(value)) {
    return [Boolean(value[0]), Boolean(value[1]), Boolean(value[2])];
  }
  const count = clamp(Math.round(numberOr(value, 0)), 0, 3);
  return [0, 1, 2].map((index) => index < count);
}

function mergeDeep(base, input) {
  if (!isObject(base) || !isObject(input)) {
    return deepClone(input ?? base);
  }
  const output = deepClone(base);
  for (const [key, value] of Object.entries(input)) {
    if (isObject(value) && isObject(output[key])) {
      output[key] = mergeDeep(output[key], value);
    } else {
      output[key] = deepClone(value);
    }
  }
  return output;
}

function isObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringOr(value, fallback) {
  return value == null ? fallback : String(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
