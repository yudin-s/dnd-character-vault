"use client";

import { ChevronDown, Coins, Minus, PackagePlus, Plus, Shield, ShieldCheck, Swords, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import TextArea from "@/components/form/TextArea";
import { DICE_TYPES } from "@/lib/dice";
import { COINS } from "@/lib/dndRules";
import { EQUIPMENT_TYPES, createEquipmentItem } from "@/lib/equipment";
import Field from "@/components/form/Field";
import NumberStepper from "@/components/form/NumberStepper";
import Panel from "@/components/form/Panel";

const DAMAGE_TYPES = [
  "slashing",
  "piercing",
  "bludgeoning",
  "acid",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "poison",
  "psychic",
  "radiant",
  "thunder"
];

const COIN_TONES = {
  cp: "border-[#9d5833] bg-[#b87333] text-vellum",
  sp: "border-[#8f98a5] bg-[#c9d0d8] text-ink",
  ep: "border-[#6f8794] bg-[#a5c4c8] text-ink",
  gp: "border-[#b8872a] bg-[#d6a832] text-ink",
  pp: "border-[#b7c4d2] bg-[#e7edf4] text-ink"
};

const INVENTORY_FILTERS = ["all", "weapon", "armor", "shield", "potion", "gear"];
const GENERIC_ITEM_TYPES = ["gear", "tool", "treasure"];

function normalizeQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function normalizeDiceCount(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(12, Math.max(1, Math.round(parsed)));
}

function normalizeDiceSides(value, fallback = 6) {
  const parsed = Number(value);
  return DICE_TYPES.includes(parsed) ? parsed : fallback;
}

function normalizeModifier(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function isWeapon(item) {
  return String(item?.type || "").toLowerCase() === "weapon";
}

function isArmorOrShield(item) {
  const type = String(item?.type || "").toLowerCase();
  return type === "armor" || type === "shield";
}

function isPotion(item) {
  return String(item?.type || "").toLowerCase() === "potion";
}

function matchesInventoryFilter(item, filter) {
  if (filter === "all") return true;
  const type = String(item?.type || "gear").toLowerCase();
  if (filter === "gear") return GENERIC_ITEM_TYPES.includes(type);
  return type === filter;
}

function parseDiceNotation(value) {
  const match = String(value || "").toLowerCase().match(/(\d*)d(\d+)/);
  const count = normalizeDiceCount(match?.[1], 1);
  const sides = normalizeDiceSides(match?.[2], 6);
  return { count, sides };
}

function getWeaponDamage(item) {
  const legacy = parseDiceNotation(item?.damageDice);
  return {
    count: normalizeDiceCount(item?.damageDiceCount, legacy.count),
    sides: normalizeDiceSides(item?.damageDiceSides, legacy.sides)
  };
}

function formatDiceNotation({ count, sides }) {
  return `${normalizeDiceCount(count)}d${normalizeDiceSides(sides)}`;
}

function formatModifier(value) {
  const modifier = normalizeModifier(value);
  if (!modifier) return "";
  return modifier > 0 ? `+${modifier}` : `${modifier}`;
}

function createTypedItem(type, t) {
  const item = {
    ...createEquipmentItem(),
    type,
    name: t(`panel.inventory.template.${type}`)
  };

  if (type === "weapon") {
    item.quantity = 1;
    item.attackBonus = "";
    item.damageDiceCount = 1;
    item.damageDiceSides = 6;
    item.damageDice = "1d6";
    item.damageBonus = "";
    item.damageType = "slashing";
  }

  if (type === "armor") {
    item.quantity = 1;
    item.armorClass = 11;
  }

  if (type === "potion") {
    item.consumable = true;
    item.quantity = 1;
    item.use = 1;
    item.effects = "2d4+2";
  }

  if (type === "shield") {
    item.quantity = 1;
    item.armorClass = 2;
  }

  return item;
}

export default function InventoryPanel({ character, updatePath, t, panelProps = {}, equipmentActions = {}, openDice }) {
  const items = character?.equipment?.items || [];
  const [activeFilter, setActiveFilter] = useState("all");
  const visibleItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => matchesInventoryFilter(item, activeFilter));
  const addType = activeFilter === "all" ? "gear" : activeFilter;

  const addItem = (type = "gear") => {
    updatePath("equipment.items", [...items, createTypedItem(type, t)]);
  };

  const removeItem = (index) => {
    const nextItems = [...items];
    nextItems.splice(index, 1);
    updatePath("equipment.items", nextItems);
  };

  const updateItem = (index, path, value) => {
    updatePath(`equipment.items.${index}.${path}`, value);
  };

  const updateWeaponDice = (index, patch) => {
    const current = items[index] || {};
    const damage = getWeaponDamage(current);
    const nextDamage = {
      count: normalizeDiceCount(patch.count, damage.count),
      sides: normalizeDiceSides(patch.sides, damage.sides)
    };
    updatePath(`equipment.items.${index}`, {
      ...current,
      damageDiceCount: nextDamage.count,
      damageDiceSides: nextDamage.sides,
      damageDice: formatDiceNotation(nextDamage)
    });
  };

  const updateItemType = (index, type) => {
    const current = items[index] || {};
    const next = { ...current, type };
    const damage = getWeaponDamage(current);

    if (type === "weapon") {
      next.armorClass = "";
      next.consumable = false;
      next.use = 0;
      next.attackBonus = current.attackBonus ?? "";
      next.damageDiceCount = damage.count;
      next.damageDiceSides = damage.sides;
      next.damageDice = formatDiceNotation(damage);
      next.damageBonus = current.damageBonus ?? "";
      next.damageType = current.damageType || "slashing";
    }

    if (type === "armor" || type === "shield") {
      next.attackBonus = "";
      next.damageDiceCount = 1;
      next.damageDiceSides = 6;
      next.damageDice = "";
      next.damageBonus = "";
      next.damageType = "";
      next.consumable = false;
      next.use = 0;
      next.armorClass = current.armorClass || (type === "shield" ? 2 : 11);
    }

    if (type === "potion") {
      next.armorClass = "";
      next.attackBonus = "";
      next.damageDiceCount = 1;
      next.damageDiceSides = 6;
      next.damageDice = "";
      next.damageBonus = "";
      next.damageType = "";
      next.consumable = true;
      next.use = current.use || 1;
      next.effects = current.effects || "2d4+2";
    }

    if (!["weapon", "armor", "shield", "potion"].includes(type)) {
      next.armorClass = "";
      next.attackBonus = "";
      next.damageDiceCount = 1;
      next.damageDiceSides = 6;
      next.damageDice = "";
      next.damageBonus = "";
      next.damageType = "";
    }

    updatePath(`equipment.items.${index}`, next);
  };

  const adjustQuantity = (index, delta) => {
    const current = normalizeQuantity(items[index]?.quantity);
    updateItem(index, "quantity", Math.max(0, current + delta));
  };

  const useItem = (index, item) => {
    if (equipmentActions.useItem) {
      equipmentActions.useItem(index);
      return;
    }
    if (!item?.consumable) return;
    const currentQuantity = normalizeQuantity(item.quantity);
    if (currentQuantity <= 0) return;
    updateItem(index, "quantity", Math.max(0, currentQuantity - 1));
  };

  return (
    <Panel title={t("panel.inventory.title")} kicker={t("panel.inventory.kicker")} {...panelProps}>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">
            {t("panel.inventory.itemsCount", { count: items.length })}
          </div>
          <button
            type="button"
            onClick={() => addItem(addType)}
            className="inline-flex min-h-11 items-center gap-1 rounded-md border border-ink bg-parchment px-3 font-ui text-xs font-black hover:bg-vellum"
          >
            <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("panel.inventory.addItem")}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {INVENTORY_FILTERS.map((type) => {
            const active = activeFilter === type;
            const count = type === "all"
              ? items.length
              : items.filter((item) => matchesInventoryFilter(item, type)).length;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveFilter(type)}
                className={`inline-flex min-h-11 min-w-0 items-center justify-between gap-1 rounded-md border px-2 font-ui text-[11px] font-black transition ${
                  active
                    ? "border-oxblood bg-oxblood text-vellum"
                    : "border-ink bg-parchment text-ink hover:bg-vellum"
                }`}
                aria-pressed={active}
              >
                <span className="min-w-0 truncate">{t(type === "all" ? "panel.inventory.filter.all" : `panel.inventory.add.${type}`)}</span>
                <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-[10px] ${active ? "bg-vellum/20 text-vellum" : "bg-umber/10 text-umber"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <CoinPouch coins={character.equipment.coins} updateCoin={(coin, value) => updatePath(`equipment.coins.${coin}`, value)} t={t} />

        <div className="grid gap-2">
          {visibleItems.length ? visibleItems.map(({ item, index }) => (
            <ItemCard
              key={item.id}
              item={item}
              index={index}
              t={t}
              updateItem={updateItem}
              updateWeaponDice={updateWeaponDice}
              updateItemType={updateItemType}
              adjustQuantity={adjustQuantity}
              useItem={useItem}
              removeItem={removeItem}
              openDice={openDice}
              toggleEquipped={(itemIndex) => {
                if (equipmentActions.toggleEquipped) {
                  equipmentActions.toggleEquipped(itemIndex);
                  return;
                }
                updateItem(itemIndex, "equipped", !Boolean(items[itemIndex]?.equipped));
              }}
            />
          )) : (
            <div className="rounded-md border border-dashed border-umber/35 bg-vellum px-3 py-5 text-sm leading-6 text-umber">
              {activeFilter === "all" ? t("panel.inventory.empty") : t("panel.inventory.filterEmpty")}
            </div>
          )}
        </div>

        <details className="group rounded-md border border-umber/25 bg-parchment">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
            <span className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("panel.inventory.notes")}</span>
            <ChevronDown className="h-4 w-4 text-umber transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="grid gap-3 border-t border-umber/15 p-3">
            <TextArea label={t("panel.inventory.gear")} value={character?.equipment?.notes} onChange={(value) => updatePath("equipment.notes", value)} rows={5} />
            <TextArea label={t("panel.inventory.proficienciesAndLanguages")} value={character.proficiencies} onChange={(value) => updatePath("proficiencies", value)} rows={4} />
          </div>
        </details>
      </div>
    </Panel>
  );
}

function CoinPouch({ coins, updateCoin, t }) {
  const [activeCoin, setActiveCoin] = useState("gp");
  const activeValue = coins?.[activeCoin] ?? 0;

  return (
    <details className="group rounded-md border border-umber/25 bg-parchment" open>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
        <span className="inline-flex min-w-0 items-center gap-2 font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">
          <Coins className="h-4 w-4 shrink-0 text-oxblood" aria-hidden="true" />
          {t("panel.inventory.wallet")}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-umber transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="grid gap-3 border-t border-umber/15 p-2 sm:p-3">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {COINS.map((coin) => {
            const amount = Number(coins?.[coin]) || 0;
            const active = activeCoin === coin;
            return (
              <button
                key={coin}
                type="button"
                onClick={() => setActiveCoin(coin)}
                className={`min-w-0 rounded-md border p-1.5 text-center shadow-insetLine transition ${
                  active ? "border-oxblood bg-vellum" : "border-umber/20 bg-vellum/70 hover:bg-vellum"
                }`}
                aria-label={t(`panel.inventory.coinName.${coin}`)}
              >
                <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-[10px] font-black uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_4px_rgba(37,24,19,0.18)] sm:h-10 sm:w-10 sm:text-xs ${COIN_TONES[coin]}`}>
                  {t(`panel.inventory.coin.${coin}`)}
                </span>
                <span className="mt-1 block truncate font-ui text-[9px] font-black uppercase tracking-[0.05em] text-umber sm:text-[10px]">
                  {amount > 0 ? amount : t(`panel.inventory.coin.${coin}`)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="grid gap-1 rounded-md border border-umber/20 bg-vellum/80 p-2 shadow-insetLine">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
              {t(`panel.inventory.coinName.${activeCoin}`)}
            </span>
            <span className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-black uppercase ${COIN_TONES[activeCoin]}`}>
              {t(`panel.inventory.coin.${activeCoin}`)}
            </span>
          </div>
          <NumberStepper
            min="0"
            label={t(`panel.inventory.coinName.${activeCoin}`)}
            value={activeValue}
            onChange={(value) => updateCoin(activeCoin, value)}
            className="h-12 bg-white/70"
            inputClassName="font-ui text-lg font-black"
            buttonWidth="38px"
            aria-label={t(`panel.inventory.coinName.${activeCoin}`)}
          />
        </div>
      </div>
    </details>
  );
}

function ItemCard({ item, index, t, updateItem, updateWeaponDice, updateItemType, adjustQuantity, useItem, removeItem, toggleEquipped, openDice }) {
  const quantity = normalizeQuantity(item.quantity);
  const canUse = Boolean(item.consumable) && quantity > 0;
  const weapon = isWeapon(item);
  const armorOrShield = isArmorOrShield(item);
  const potion = isPotion(item);
  const typeChoices = item.type && !EQUIPMENT_TYPES.includes(item.type)
    ? [item.type, ...EQUIPMENT_TYPES]
    : EQUIPMENT_TYPES;
  const weaponDamage = getWeaponDamage(item);
  const damageDice = formatDiceNotation(weaponDamage);
  const attackFormula = `1d20${formatModifier(item.attackBonus)}`;
  const damageFormula = `${damageDice}${formatModifier(item.damageBonus)}`;

  const rollWeaponStrike = () => {
    openDice?.({
      label: item.name || t("panel.inventory.template.weapon"),
      groups: [
        {
          key: "attack",
          label: t("panel.inventory.rollAttack"),
          sides: 20,
          count: 1,
          modifier: normalizeModifier(item.attackBonus)
        },
        {
          key: "damage",
          label: t("panel.inventory.rollDamage"),
          sides: weaponDamage.sides,
          count: weaponDamage.count,
          modifier: normalizeModifier(item.damageBonus)
        }
      ]
    });
  };

  return (
    <article className="rounded-md border border-umber/25 bg-vellum shadow-insetLine">
      <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_154px_auto] lg:items-center">
        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
          <label className="block min-w-0">
            <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
              {t("panel.inventory.itemName")}
            </span>
            <input
              value={item.name}
              onChange={(event) => updateItem(index, "name", event.target.value)}
              placeholder={t("panel.inventory.itemNamePlaceholder")}
              className="min-h-11 w-full rounded-md border border-umber/35 bg-parchment px-3 py-2 text-base font-bold text-ink outline-none transition placeholder:text-umber/55 focus:border-slate focus:ring-2 focus:ring-slate/20 sm:text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
              {t("panel.inventory.itemType")}
            </span>
            <select
              value={item.type}
              onChange={(event) => updateItemType(index, event.target.value)}
              className="h-11 w-full rounded-md border border-umber/35 bg-parchment px-3 text-sm font-bold text-ink outline-none focus:border-slate focus:ring-2 focus:ring-slate/20"
            >
              {typeChoices.map((type) => (
                <option key={type} value={type}>{EQUIPMENT_TYPES.includes(type) ? t(`equipment.type.${type}`) : type}</option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="mb-1 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
            {t("panel.inventory.quantity")}
          </div>
          <div className="grid grid-cols-[38px_minmax(0,1fr)_38px] gap-2">
            <IconButton label={t("panel.inventory.decreaseQuantity")} onClick={() => adjustQuantity(index, -1)}>
              <Minus className="h-4 w-4" aria-hidden="true" />
            </IconButton>
            <div className="grid h-11 place-items-center rounded-md border border-ink bg-parchment font-ui text-lg font-black text-ink">
              {quantity}
            </div>
            <IconButton label={t("panel.inventory.increaseQuantity")} onClick={() => adjustQuantity(index, 1)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:w-[270px]">
          {weapon ? (
            <ActionButton
              disabled={!openDice}
              label={t("panel.inventory.strike")}
              hint={`${attackFormula} / ${damageFormula}`}
              onClick={rollWeaponStrike}
              wide
            >
              <Swords className="h-4 w-4" aria-hidden="true" />
            </ActionButton>
          ) : null}
          {armorOrShield || weapon ? (
            <ActionButton
              active={Boolean(item.equipped)}
              label={Boolean(item.equipped) ? t("panel.inventory.unequip") : t("panel.inventory.equip")}
              onClick={() => toggleEquipped(index)}
            >
              {Boolean(item.equipped) ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <Shield className="h-4 w-4" aria-hidden="true" />}
            </ActionButton>
          ) : null}
          {potion || item.consumable ? (
            <ActionButton disabled={!canUse} label={t("panel.inventory.use")} onClick={() => useItem(index, item)}>
              <Wand2 className="h-4 w-4" aria-hidden="true" />
            </ActionButton>
          ) : null}
          <ActionButton danger label={t("panel.inventory.removeItem")} onClick={() => removeItem(index)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </ActionButton>
        </div>
      </div>

      <details className="group border-t border-umber/15">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
          <div className="min-w-0 truncate font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
            {item.equipped ? t("panel.inventory.equipped") : t("panel.inventory.itemDetails")}
            {weapon && damageDice ? ` / ${damageDice}` : ""}
            {armorOrShield && item.armorClass ? ` / AC ${item.armorClass}` : ""}
            {item.consumable ? ` / ${t("panel.inventory.consumable")}` : ""}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-umber transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ItemDetails
          item={item}
          index={index}
          t={t}
          updateItem={updateItem}
          updateWeaponDice={updateWeaponDice}
          weapon={weapon}
          armorOrShield={armorOrShield}
          potion={potion}
        />
      </details>
    </article>
  );
}

function ItemDetails({ item, index, t, updateItem, updateWeaponDice, weapon, armorOrShield, potion }) {
  if (weapon) {
    const damage = getWeaponDamage(item);
    return (
      <div className="grid gap-3 border-t border-umber/15 p-3">
        <div className="rounded-md border border-umber/20 bg-parchment p-2.5 shadow-insetLine">
          <div className="mb-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
            {t("panel.inventory.weaponRolls")}
          </div>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <div className="font-ui text-[10px] font-black uppercase tracking-[0.08em] text-umber">{t("panel.inventory.attackBonus")}</div>
              <NumberStepper
                label={t("panel.inventory.attackBonus")}
                signed
                value={item.attackBonus}
                onChange={(value) => updateItem(index, "attackBonus", value)}
                className="h-11 bg-white/70"
                inputClassName="font-ui text-base font-black"
                buttonWidth="38px"
              />
            </div>

            <div className="grid gap-1">
              <div className="font-ui text-[10px] font-black uppercase tracking-[0.08em] text-umber">{t("panel.inventory.damageDice")}</div>
              <div className="grid grid-cols-[minmax(82px,1fr)_74px_minmax(82px,1fr)] gap-2">
                <NumberStepper
                  label={t("panel.inventory.damageDiceCount")}
                  min={1}
                  max={12}
                  value={damage.count}
                  onChange={(value) => updateWeaponDice(index, { count: value, sides: damage.sides })}
                  className="h-11 bg-white/70"
                  inputClassName="px-0 font-ui text-base font-black"
                  buttonWidth="30px"
                />
                <select
                  aria-label={t("panel.inventory.damageDie")}
                  value={String(damage.sides)}
                  onChange={(event) => updateWeaponDice(index, { count: damage.count, sides: event.target.value })}
                  className="h-11 w-full rounded-md border border-umber/35 bg-white/70 px-2 text-center font-ui text-sm font-black text-ink outline-none focus:border-slate focus:ring-2 focus:ring-slate/20"
                >
                  {DICE_TYPES.map((sides) => <option key={sides} value={String(sides)}>d{sides}</option>)}
                </select>
                <NumberStepper
                  label={t("panel.inventory.damageBonus")}
                  signed
                  value={item.damageBonus}
                  onChange={(value) => updateItem(index, "damageBonus", value)}
                  className="h-11 bg-white/70"
                  inputClassName="px-0 font-ui text-base font-black"
                  buttonWidth="30px"
                />
              </div>
            </div>
          </div>
        </div>

        <SelectField
          label={t("panel.inventory.damageType")}
          value={item.damageType || ""}
          onChange={(value) => updateItem(index, "damageType", value)}
          options={[
            { value: "", label: t("generic.none") },
            ...DAMAGE_TYPES.map((type) => ({ value: type, label: t(`damage.type.${type}`) }))
          ]}
        />
        <div>
          <TextArea
            label={t("panel.inventory.itemNotes")}
            rows={2}
            value={item.effects}
            onChange={(value) => updateItem(index, "effects", value)}
            textareaClassName="min-h-[76px] bg-parchment"
          />
        </div>
      </div>
    );
  }

  if (armorOrShield) {
    return (
      <div className="grid gap-3 border-t border-umber/15 p-3 md:grid-cols-[140px_minmax(0,1fr)]">
        <Field
          label={t("panel.inventory.armorClass")}
          type="number"
          value={item.armorClass}
          onChange={(value) => updateItem(index, "armorClass", value)}
        />
        <TextArea
          label={t("panel.inventory.itemNotes")}
          rows={2}
          value={item.effects}
          onChange={(value) => updateItem(index, "effects", value)}
          textareaClassName="min-h-[76px] bg-parchment"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 border-t border-umber/15 p-3 md:grid-cols-[130px_minmax(0,1fr)]">
      <div className="grid gap-2">
        {!potion ? (
          <Field
            label={t("panel.inventory.consumable")}
            type="checkbox"
            value={Boolean(item.consumable)}
            onChange={(value) => updateItem(index, "consumable", Boolean(value))}
          />
        ) : null}
        <Field
          label={t("panel.inventory.uses")}
          type="number"
          min={0}
          value={item.use}
          onChange={(value) => updateItem(index, "use", normalizeQuantity(value))}
          disabled={!item.consumable}
        />
      </div>
      <TextArea
        label={potion ? t("panel.inventory.effects") : t("panel.inventory.itemNotes")}
        rows={3}
        value={item.effects}
        onChange={(value) => updateItem(index, "effects", value)}
        textareaClassName="min-h-[96px] bg-parchment"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-11 w-full rounded-md border border-umber/35 bg-parchment px-3 text-sm font-bold text-ink outline-none focus:border-slate focus:ring-2 focus:ring-slate/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-11 place-items-center rounded-md border border-umber/35 bg-parchment text-ink transition hover:bg-vellum"
    >
      {children}
    </button>
  );
}

function ActionButton({ label, hint, onClick, children, active = false, disabled = false, danger = false, wide = false }) {
  const className = danger
    ? "border-oxblood/50 text-oxblood hover:bg-oxblood hover:text-vellum"
    : active
      ? "border-oxblood bg-oxblood text-vellum"
      : "border-ink bg-parchment text-ink hover:bg-vellum";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint ? `${label}: ${hint}` : label}
      aria-label={label}
      className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-md border px-2 py-2 font-ui text-[11px] font-black uppercase tracking-[0.04em] transition disabled:cursor-not-allowed disabled:opacity-40 ${wide ? "col-span-2" : ""} ${className}`}
    >
      {children}
      <span className="grid min-w-0 text-left leading-tight">
        <span className="truncate">{label}</span>
        {hint ? <span className="truncate text-[10px] opacity-75">{hint}</span> : null}
      </span>
    </button>
  );
}
