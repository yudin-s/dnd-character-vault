import { ChevronDown, Minus, PackagePlus, Plus, Shield, ShieldCheck, Trash2, Wand2 } from "lucide-react";
import TextArea from "@/components/form/TextArea";
import { COINS } from "@/lib/dndRules";
import { EQUIPMENT_TYPES, createEquipmentItem } from "@/lib/equipment";
import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";

function normalizeQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function createTypedItem(type, t) {
  const item = {
    ...createEquipmentItem(),
    type,
    name: t(`panel.inventory.template.${type}`)
  };

  if (type === "potion") {
    item.consumable = true;
    item.quantity = 1;
    item.use = 1;
    item.effects = "2d4+2";
  }

  if (type === "shield") {
    item.armorClass = 2;
  }

  return item;
}

export default function InventoryPanel({ character, updatePath, t, panelProps = {}, equipmentActions = {} }) {
  const items = character?.equipment?.items || [];

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
          <div className="flex flex-wrap gap-2">
            {["weapon", "armor", "potion", "gear"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addItem(type)}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-ink bg-parchment px-2 font-ui text-xs font-black hover:bg-vellum"
              >
                <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                {t(`panel.inventory.add.${type}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-5">
          {COINS.map((coin) => (
            <Field
              key={coin}
              label={t(`panel.inventory.coin.${coin}`)}
              type="number"
              value={character.equipment.coins[coin]}
              onChange={(value) => updatePath(`equipment.coins.${coin}`, value)}
            />
          ))}
        </div>

        <div className="grid gap-2">
          {items.length ? items.map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              index={index}
              t={t}
              updateItem={updateItem}
              adjustQuantity={adjustQuantity}
              useItem={useItem}
              removeItem={removeItem}
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
              {t("panel.inventory.empty")}
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

function ItemCard({ item, index, t, updateItem, adjustQuantity, useItem, removeItem, toggleEquipped }) {
  const quantity = normalizeQuantity(item.quantity);
  const canUse = Boolean(item.consumable) && quantity > 0;
  const typeChoices = item.type && !EQUIPMENT_TYPES.includes(item.type)
    ? [item.type, ...EQUIPMENT_TYPES]
    : EQUIPMENT_TYPES;

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
              onChange={(event) => updateItem(index, "type", event.target.value)}
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

        <div className="grid grid-cols-3 gap-2 lg:w-[230px]">
          <ActionButton
            active={Boolean(item.equipped)}
            label={Boolean(item.equipped) ? t("panel.inventory.unequip") : t("panel.inventory.equip")}
            onClick={() => toggleEquipped(index)}
          >
            {Boolean(item.equipped) ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <Shield className="h-4 w-4" aria-hidden="true" />}
          </ActionButton>
          <ActionButton disabled={!canUse} label={t("panel.inventory.use")} onClick={() => useItem(index, item)}>
            <Wand2 className="h-4 w-4" aria-hidden="true" />
          </ActionButton>
          <ActionButton danger label={t("panel.inventory.removeItem")} onClick={() => removeItem(index)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </ActionButton>
        </div>
      </div>

      <details className="group border-t border-umber/15">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
          <div className="min-w-0 truncate font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
            {item.equipped ? t("panel.inventory.equipped") : t("panel.inventory.itemDetails")}
            {item.armorClass ? ` / AC ${item.armorClass}` : ""}
            {item.consumable ? ` / ${t("panel.inventory.consumable")}` : ""}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-umber transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="grid gap-3 border-t border-umber/15 p-3 md:grid-cols-[120px_120px_minmax(0,1fr)]">
          <Field
            label={t("panel.inventory.armorClass")}
            type="number"
            value={item.armorClass}
            onChange={(value) => updateItem(index, "armorClass", value)}
          />
          <div className="grid gap-2">
            <Field
              label={t("panel.inventory.consumable")}
              type="checkbox"
              value={Boolean(item.consumable)}
              onChange={(value) => updateItem(index, "consumable", Boolean(value))}
            />
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
            label={t("panel.inventory.effects")}
            rows={3}
            value={item.effects}
            onChange={(value) => updateItem(index, "effects", value)}
            textareaClassName="min-h-[96px] bg-parchment"
          />
        </div>
      </details>
    </article>
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

function ActionButton({ label, onClick, children, active = false, disabled = false, danger = false }) {
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
      title={label}
      aria-label={label}
      className={`inline-flex h-11 items-center justify-center gap-1 rounded-md border px-2 font-ui text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
