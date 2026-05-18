import { Plus, X } from "lucide-react";
import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";
import SegmentedToggle from "@/components/form/SegmentedToggle";
import { ABILITIES, SPELL_LEVELS } from "@/lib/dndRules";

export default function SpellsPanel({ character, updatePath, addItem, removeItem, t, panelProps = {} }) {
  const spells = character.spells;
  return (
    <Panel
      title={t("panel.spells.title")}
      kicker={t("panel.spells.kicker")}
      action={<button type="button" onClick={() => addItem("spells")} className="inline-flex min-h-10 items-center gap-1 rounded-md border border-ink bg-parchment px-2 font-ui text-xs font-black hover:bg-vellum"><Plus className="h-3.5 w-3.5" />{t("panel.spells.add")}</button>}
      {...panelProps}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <label className="block">
          <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.ability")}</span>
          <select
            value={spells.ability}
            onChange={(event) => updatePath("spells.ability", event.target.value)}
            className="h-10 w-full rounded-md border border-umber/40 bg-white/45 px-3 text-sm outline-none focus:border-slate focus:ring-2 focus:ring-slate/20"
          >
            <option value="none">{t("panel.spells.abilityNone")}</option>
            {ABILITIES.map((ability) => <option key={ability.key} value={ability.key}>{t(`ability.${ability.key}`)}</option>)}
          </select>
        </label>
        <Field label={t("panel.spells.saveDc")} value={spells.saveDc} onChange={(value) => updatePath("spells.saveDc", value)} />
        <Field label={t("panel.spells.attack")} value={spells.attackBonus} onChange={(value) => updatePath("spells.attackBonus", value)} />
        <Field label={t("panel.spells.focus")} value={spells.focus} onChange={(value) => updatePath("spells.focus", value)} />
      </div>
      <div className="mt-3 grid max-w-full min-w-0 grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {SPELL_LEVELS.filter((level) => level > 0).map((level) => (
          <div key={level} className="min-w-0 rounded-md border border-umber/25 bg-white/20 p-2">
            <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">L{level}</div>
              <Field label={t("panel.spells.now")} value={spells.slots[String(level)].current} onChange={(value) => updatePath(`spells.slots.${level}.current`, value)} />
              <Field label={t("panel.spells.max")} value={spells.slots[String(level)].max} onChange={(value) => updatePath(`spells.slots.${level}.max`, value)} />
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3">
        {spells.known.map((spell, index) => (
          <div key={spell.id} className="grid gap-3 rounded-md border border-umber/25 bg-white/25 p-3 md:grid-cols-[76px_1fr_120px_minmax(0,1.2fr)_34px]">
            <Field label={t("panel.spells.level")} value={spell.level} onChange={(value) => updatePath(`spells.known.${index}.level`, value)} />
            <Field label={t("panel.attacks.name")} value={spell.name} onChange={(value) => updatePath(`spells.known.${index}.name`, value)} />
            <SegmentedToggle
              label={t("panel.spells.prepared")}
              value={spell.prepared ? "yes" : "no"}
              options={[{ value: "no", label: t("generic.no") }, { value: "yes", label: t("generic.yes") }]}
              onChange={(value) => updatePath(`spells.known.${index}.prepared`, value === "yes")}
            />
            <Field label={t("panel.attacks.notes")} value={spell.notes} onChange={(value) => updatePath(`spells.known.${index}.notes`, value)} />
            <button type="button" title={t("panel.spells.remove")} aria-label={t("panel.spells.removeAria")} onClick={() => removeItem("spells.known", spell.id)} className="mt-5 grid min-h-11 w-full place-items-center rounded-md border border-oxblood/50 text-oxblood hover:bg-oxblood hover:text-white md:w-11">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
