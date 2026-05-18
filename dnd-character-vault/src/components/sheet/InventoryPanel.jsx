import { Minus, Plus, Shield, ShieldCheck, X } from "lucide-react";
import TextArea from "@/components/form/TextArea";
import { COINS } from "@/lib/dndRules";
import { createEquipmentItem } from "@/lib/equipment";
import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";

function normalizeQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

export default function InventoryPanel({ character, updatePath, t, panelProps = {}, equipmentActions = {} }) {
  const addItem = () => {
    const nextItems = [...(character?.equipment?.items || []), createEquipmentItem()];
    updatePath("equipment.items", nextItems);
  };

  const removeItem = (index) => {
    const nextItems = [...(character?.equipment?.items || [])];
    nextItems.splice(index, 1);
    updatePath("equipment.items", nextItems);
  };

  const updateItem = (index, path, value) => {
    updatePath(`equipment.items.${index}.${path}`, value);
  };

  const adjustQuantity = (index, delta) => {
    const current = normalizeQuantity(character?.equipment?.items?.[index]?.quantity);
    const next = Math.max(0, current + delta);
    updateItem(index, "quantity", next);
  };

  const useItem = (index, item) => {
    if (equipmentActions.useItem) {
      equipmentActions.useItem(index);
      return;
    }
    if (!item?.consumable) return;
    const currentQuantity = normalizeQuantity(item.quantity);
    if (currentQuantity <= 0) return;
    const currentUses = normalizeQuantity(item.use);
    updateItem(index, "quantity", Math.max(0, currentQuantity - 1));
    if (currentUses > 0) {
      updateItem(index, "use", Math.max(0, currentUses - 1));
    }
  };

  return (
    <Panel title={t("panel.inventory.title")} kicker={t("panel.inventory.kicker")} {...panelProps}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-ui text-umber">{t("panel.inventory.itemsCount", { count: character?.equipment?.items?.length || 0 })}</div>
        <button type="button" onClick={addItem} className="inline-flex h-8 items-center gap-1 rounded-md border border-ink bg-parchment px-2 font-ui text-xs font-black hover:bg-vellum">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("panel.inventory.addItem")}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
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
      <div className="mt-3 grid gap-3">
        {character?.equipment?.items?.map((item, index) => (
          <article key={item.id} className="grid gap-3 rounded-md border border-umber/25 bg-white/25 p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_130px_130px_130px_120px_120px]">
              <Field
                label={t("panel.inventory.itemType")}
                value={item.type}
                onChange={(value) => updateItem(index, "type", value)}
              />
              <div className="grid gap-2">
                <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.inventory.quantity")}</span>
                <div className="grid grid-cols-[32px_minmax(0,1fr)_32px] gap-2">
                  <button type="button" onClick={() => adjustQuantity(index, -1)} className="grid h-11 items-center justify-center rounded-md border border-umber/25 bg-white/50 text-xs hover:bg-white" aria-label={t("panel.inventory.decreaseQuantity")}>
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <Field
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(value) => updateItem(index, "quantity", normalizeQuantity(value))}
                    className="min-w-0"
                  />
                  <button type="button" onClick={() => adjustQuantity(index, 1)} className="grid h-11 items-center justify-center rounded-md border border-umber/25 bg-white/50 text-xs hover:bg-white" aria-label={t("panel.inventory.increaseQuantity")}>
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <Field
                label={t("panel.inventory.armorClass")}
                type="number"
                value={item.armorClass}
                onChange={(value) => updateItem(index, "armorClass", value)}
              />
              <Field
                label={t("panel.inventory.equipped")}
                type="checkbox"
                value={Boolean(item.equipped)}
                onChange={(value) => updateItem(index, "equipped", Boolean(value))}
              />
              <Field
                label={t("panel.inventory.consumable")}
                type="checkbox"
                value={Boolean(item.consumable)}
                onChange={(value) => updateItem(index, "consumable", Boolean(value))}
              />
              <div className="grid gap-2">
                <Field
                  label={t("panel.inventory.uses")}
                  type="number"
                  min={0}
                  value={item.use}
                  onChange={(value) => updateItem(index, "use", normalizeQuantity(value))}
                  disabled={!item.consumable}
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (equipmentActions.toggleEquipped) {
                      equipmentActions.toggleEquipped(index);
                      return;
                    }
                    updateItem(index, "equipped", !Boolean(item.equipped));
                  }}
                  className={`inline-flex h-11 items-center justify-center gap-1 rounded-md border px-2 text-xs font-black ${Boolean(item.equipped) ? "border-umber bg-slate/20 text-ink" : "border-ink bg-parchment text-ink"} hover:brightness-95`}
                >
                  {Boolean(item.equipped) ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Shield className="h-3.5 w-3.5" aria-hidden="true" />}
                  {Boolean(item.equipped) ? t("panel.inventory.unequip") : t("panel.inventory.equip")}
                </button>
                <button
                  type="button"
                  onClick={() => useItem(index, item)}
                  disabled={!Boolean(item.consumable) || normalizeQuantity(item.quantity) <= 0}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-ink bg-parchment px-2 text-xs font-black hover:bg-vellum disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("panel.inventory.use")}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Field
                label={t("panel.inventory.itemName")}
                value={item.name}
                onChange={(value) => updateItem(index, "name", value)}
              />
              <TextArea
                label={t("panel.inventory.effects")}
                rows={2}
                value={item.effects}
                onChange={(value) => updateItem(index, "effects", value)}
                className="min-w-0"
                textareaClassName="min-h-[82px]"
              />
            </div>
            <button
              type="button"
              title={t("panel.inventory.removeItem")}
              aria-label={t("panel.inventory.removeItem")}
              onClick={() => removeItem(index)}
              className="mt-auto grid h-9 w-full place-items-center rounded-md border border-oxblood/50 text-oxblood hover:bg-oxblood hover:text-white md:w-9"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
      <div className="mt-3 grid gap-3">
        <TextArea label={t("panel.inventory.gear")} value={character?.equipment?.notes} onChange={(value) => updatePath("equipment.notes", value)} rows={6} />
        <TextArea label={t("panel.inventory.proficienciesAndLanguages")} value={character.proficiencies} onChange={(value) => updatePath("proficiencies", value)} rows={4} />
      </div>
    </Panel>
  );
}
