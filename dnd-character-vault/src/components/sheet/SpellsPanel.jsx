"use client";

import { ChevronDown, Clock3, Plus, Ruler, Sparkles, X, Zap } from "lucide-react";
import Field from "@/components/form/Field";
import NumberStepper from "@/components/form/NumberStepper";
import Panel from "@/components/form/Panel";
import SegmentedToggle from "@/components/form/SegmentedToggle";
import TextArea from "@/components/form/TextArea";
import { ABILITIES, SPELL_LEVELS } from "@/lib/dndRules";

const SPELL_SCHOOLS = [
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation"
];

function levelLabel(level, t) {
  const value = Number(level);
  if (value === 0) return t("panel.spells.cantrip");
  return `${t("panel.spells.levelShort")} ${value}`;
}

function componentSummary(spell) {
  return [
    spell.verbal ? "V" : "",
    spell.somatic ? "S" : "",
    spell.material ? "M" : ""
  ].filter(Boolean).join(", ") || "-";
}

export default function SpellsPanel({ character, updatePath, addItem, removeItem, t, panelProps = {} }) {
  const spells = character.spells;
  const known = spells.known || [];
  const preparedCount = known.filter((spell) => spell.prepared).length;

  return (
    <Panel
      title={t("panel.spells.title")}
      kicker={t("panel.spells.kicker")}
      action={<button type="button" onClick={() => addItem("spells")} className="inline-flex min-h-10 items-center gap-1 rounded-md border border-ink bg-parchment px-2 font-ui text-xs font-black hover:bg-vellum"><Plus className="h-3.5 w-3.5" aria-hidden="true" />{t("panel.spells.add")}</button>}
      {...panelProps}
    >
      <div className="grid gap-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="rounded-md border border-umber/25 bg-white/25 p-3">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-oxblood" aria-hidden="true" />
              <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.casting")}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.ability")}</span>
                <select
                  value={spells.ability}
                  onChange={(event) => updatePath("spells.ability", event.target.value)}
                  className="h-11 w-full rounded-md border border-umber/40 bg-white/45 px-3 text-sm outline-none focus:border-slate focus:ring-2 focus:ring-slate/20"
                >
                  <option value="none">{t("panel.spells.abilityNone")}</option>
                  {ABILITIES.map((ability) => <option key={ability.key} value={ability.key}>{t(`ability.${ability.key}`)}</option>)}
                </select>
              </label>
              <Field label={t("panel.spells.focus")} value={spells.focus} onChange={(value) => updatePath("spells.focus", value)} />
              <Field label={t("panel.spells.saveDc")} type="number" min={0} value={spells.saveDc} onChange={(value) => updatePath("spells.saveDc", value)} />
              <Field label={t("panel.spells.attack")} type="number" signed value={spells.attackBonus} onChange={(value) => updatePath("spells.attackBonus", value)} />
            </div>
          </section>

          <section className="rounded-md border border-umber/25 bg-parchment p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
                <Zap className="h-4 w-4 text-oxblood" aria-hidden="true" />
                {t("panel.spells.slots")}
              </span>
              <span className="rounded-full border border-umber/20 bg-vellum px-2 py-1 font-ui text-[10px] font-black uppercase tracking-[0.08em] text-umber">
                {preparedCount}/{known.length} {t("panel.spells.preparedShort")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {SPELL_LEVELS.filter((level) => level > 0).map((level) => (
                <div key={level} className="min-w-0 rounded-md border border-umber/25 bg-vellum/80 p-1.5 shadow-insetLine">
                  <div className="mb-1 text-center font-ui text-[10px] font-black uppercase tracking-[0.08em] text-umber">{t("panel.spells.levelShort")} {level}</div>
                  <NumberStepper
                    label={`${t("panel.spells.levelShort")} ${level} ${t("panel.spells.now")}`}
                    min={0}
                    value={spells.slots[String(level)].current}
                    onChange={(value) => updatePath(`spells.slots.${level}.current`, value)}
                    className="bg-white/70"
                    inputClassName="px-0 font-ui text-sm font-black"
                    buttonClassName="min-h-10"
                    buttonWidth="28px"
                  />
                  <NumberStepper
                    label={`${t("panel.spells.levelShort")} ${level} ${t("panel.spells.max")}`}
                    min={0}
                    value={spells.slots[String(level)].max}
                    onChange={(value) => updatePath(`spells.slots.${level}.max`, value)}
                    className="mt-1 bg-white/70"
                    inputClassName="px-0 font-ui text-sm font-black"
                    buttonClassName="min-h-10"
                    buttonWidth="28px"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-2">
          {known.length ? known.map((spell, index) => (
            <SpellCard
              key={spell.id}
              spell={spell}
              index={index}
              updatePath={updatePath}
              removeItem={removeItem}
              t={t}
            />
          )) : (
            <div className="rounded-md border border-dashed border-umber/35 bg-vellum px-3 py-5 text-sm leading-6 text-umber">
              {t("panel.spells.empty")}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function SpellCard({ spell, index, updatePath, removeItem, t }) {
  const spellPath = `spells.known.${index}`;

  return (
    <article className="rounded-md border border-umber/25 bg-vellum shadow-insetLine">
      <div className="grid gap-2 p-3 md:grid-cols-[108px_minmax(0,1fr)_132px_44px] md:items-end">
        <SelectField
          label={t("panel.spells.level")}
          value={String(spell.level ?? 0)}
          onChange={(value) => updatePath(`${spellPath}.level`, Number(value))}
          options={SPELL_LEVELS.map((level) => ({ value: String(level), label: levelLabel(level, t) }))}
        />
        <Field label={t("panel.attacks.name")} value={spell.name} onChange={(value) => updatePath(`${spellPath}.name`, value)} />
        <SegmentedToggle
          label={t("panel.spells.prepared")}
          value={spell.prepared ? "yes" : "no"}
          options={[{ value: "no", label: t("generic.no") }, { value: "yes", label: t("generic.yes") }]}
          onChange={(value) => updatePath(`${spellPath}.prepared`, value === "yes")}
        />
        <button type="button" title={t("panel.spells.remove")} aria-label={t("panel.spells.removeAria")} onClick={() => removeItem("spells.known", spell.id)} className="grid min-h-11 w-full place-items-center rounded-md border border-oxblood/50 text-oxblood hover:bg-oxblood hover:text-white md:w-11">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <details className="group border-t border-umber/15">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
          <div className="min-w-0 truncate font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
            {levelLabel(spell.level, t)} / {spell.school ? t(`spell.school.${spell.school}`) : t("panel.spells.school")} / {componentSummary(spell)}
            {spell.concentration ? ` / ${t("panel.spells.concentration")}` : ""}
            {spell.ritual ? ` / ${t("panel.spells.ritual")}` : ""}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-umber transition group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="grid gap-3 border-t border-umber/15 p-3">
          <div className="grid gap-3 md:grid-cols-4">
            <SelectField
              label={t("panel.spells.school")}
              value={spell.school || ""}
              onChange={(value) => updatePath(`${spellPath}.school`, value)}
              options={[
                { value: "", label: t("generic.none") },
                ...SPELL_SCHOOLS.map((school) => ({ value: school, label: t(`spell.school.${school}`) }))
              ]}
            />
            <IconField icon={Clock3} label={t("panel.spells.castingTime")} value={spell.castingTime} onChange={(value) => updatePath(`${spellPath}.castingTime`, value)} />
            <IconField icon={Ruler} label={t("panel.spells.range")} value={spell.range} onChange={(value) => updatePath(`${spellPath}.range`, value)} />
            <Field label={t("panel.spells.duration")} value={spell.duration} onChange={(value) => updatePath(`${spellPath}.duration`, value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-md border border-umber/20 bg-parchment p-3">
              <div className="mb-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.components")}</div>
              <div className="grid grid-cols-3 gap-2">
                <Field label={t("panel.spells.verbal")} type="checkbox" value={spell.verbal} onChange={(value) => updatePath(`${spellPath}.verbal`, value)} />
                <Field label={t("panel.spells.somatic")} type="checkbox" value={spell.somatic} onChange={(value) => updatePath(`${spellPath}.somatic`, value)} />
                <Field label={t("panel.spells.material")} type="checkbox" value={spell.material} onChange={(value) => updatePath(`${spellPath}.material`, value)} />
              </div>
              {spell.material ? (
                <div className="mt-2">
                  <Field label={t("panel.spells.materialText")} value={spell.materialText} onChange={(value) => updatePath(`${spellPath}.materialText`, value)} />
                </div>
              ) : null}
            </div>

            <div className="rounded-md border border-umber/20 bg-parchment p-3">
              <div className="mb-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.tags")}</div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("panel.spells.concentration")} type="checkbox" value={spell.concentration} onChange={(value) => updatePath(`${spellPath}.concentration`, value)} />
                <Field label={t("panel.spells.ritual")} type="checkbox" value={spell.ritual} onChange={(value) => updatePath(`${spellPath}.ritual`, value)} />
              </div>
            </div>
          </div>

          <TextArea
            label={t("panel.attacks.notes")}
            value={spell.notes}
            rows={3}
            onChange={(value) => updatePath(`${spellPath}.notes`, value)}
            textareaClassName="min-h-[96px] bg-parchment"
          />
        </div>
      </details>
    </article>
  );
}

function IconField({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Field {...props} inputClassName="pl-8" />
      <Icon className="pointer-events-none absolute bottom-3 left-2.5 h-4 w-4 text-umber" aria-hidden="true" />
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
