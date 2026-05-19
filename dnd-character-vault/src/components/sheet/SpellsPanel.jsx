"use client";

import {
  BookOpen,
  Brain,
  ChevronDown,
  Clock3,
  Gem,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
  Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import Field from "@/components/form/Field";
import NumberStepper from "@/components/form/NumberStepper";
import Panel from "@/components/form/Panel";
import TextArea from "@/components/form/TextArea";
import { ABILITIES, SPELL_LEVELS } from "@/lib/dndRules";

const DEFAULT_SLOT_LEVELS = [1];
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

const SPELL_FILTERS = ["all", "prepared", "cantrip", "leveled"];

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

function finiteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesSpellFilter(row, filter) {
  const level = Number(row.spell.level || 0);
  if (filter === "prepared") return Boolean(row.spell.prepared);
  if (filter === "cantrip") return level === 0;
  if (filter === "leveled") return level > 0;
  return true;
}

function matchesQuery(row, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const spell = row.spell;
  return [
    spell.name,
    spell.school,
    spell.castingTime,
    spell.range,
    spell.duration,
    spell.notes,
    spell.materialText
  ].some((value) => String(value || "").toLowerCase().includes(normalized));
}

function sortSpells(a, b) {
  const levelDelta = Number(a.spell.level || 0) - Number(b.spell.level || 0);
  if (levelDelta !== 0) return levelDelta;
  return String(a.spell.name || "").localeCompare(String(b.spell.name || ""));
}

export default function SpellsPanel({ character, updatePath, addItem, removeItem, t, panelProps = {} }) {
  const spells = character.spells;
  const known = spells.known || [];
  const preparedCount = known.filter((spell) => spell.prepared).length;
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [visibleSlotLevels, setVisibleSlotLevels] = useState(() => {
    const active = SPELL_LEVELS.filter((level) => {
      if (level <= 0) return false;
      const slot = spells.slots[String(level)] || {};
      return Number(slot.current) > 0 || Number(slot.max) > 0;
    });
    return active.length ? active : DEFAULT_SLOT_LEVELS;
  });

  const spellRows = useMemo(() => known.map((spell, index) => ({ spell, index })).sort(sortSpells), [known]);
  const filteredRows = useMemo(() => (
    spellRows.filter((row) => matchesSpellFilter(row, filter) && matchesQuery(row, query))
  ), [filter, query, spellRows]);
  const filterCounts = useMemo(() => Object.fromEntries(
    SPELL_FILTERS.map((item) => [item, spellRows.filter((row) => matchesSpellFilter(row, item)).length])
  ), [spellRows]);
  const availableSlotLevels = SPELL_LEVELS.filter((level) => level > 0 && !visibleSlotLevels.includes(level));

  const addSlotLevel = () => {
    const nextLevel = availableSlotLevels[0];
    if (!nextLevel) return;
    setVisibleSlotLevels((levels) => [...levels, nextLevel].sort((a, b) => a - b));
  };

  const removeSlotLevel = (level) => {
    setVisibleSlotLevels((levels) => {
      const nextLevels = levels.filter((item) => item !== level);
      return nextLevels.length ? nextLevels : DEFAULT_SLOT_LEVELS;
    });
    updatePath(`spells.slots.${level}.current`, "");
    updatePath(`spells.slots.${level}.max`, "");
  };

  return (
    <Panel
      title={t("panel.spells.title")}
      kicker={t("panel.spells.kicker")}
      action={(
        <button
          type="button"
          onClick={() => addItem("spells")}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink bg-parchment px-3 font-ui text-xs font-black hover:bg-vellum"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("panel.spells.add")}
        </button>
      )}
      {...panelProps}
    >
      <div className="grid gap-4">
        <section className="rounded-md border border-umber/25 bg-vellum/80 p-3 shadow-insetLine">
          <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
            <div className="inline-flex min-w-0 items-center gap-2">
              <WandSparkles className="h-5 w-5 shrink-0 text-oxblood" aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.casting")}</div>
                <div className="truncate font-display text-xl font-bold text-ink">{t("panel.spells.spellbook")}</div>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-umber/20 bg-parchment px-3 py-1.5 font-ui text-[11px] font-black uppercase tracking-[0.08em] text-umber">
              {t("panel.spells.summaryPrepared", { prepared: preparedCount, total: known.length })}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(190px,0.8fr)_minmax(220px,1fr)_140px_140px]">
            <SelectField
              icon={Brain}
              label={t("panel.spells.ability")}
              value={spells.ability}
              onChange={(value) => updatePath("spells.ability", value)}
              options={[
                { value: "none", label: t("panel.spells.abilityNone") },
                ...ABILITIES.map((ability) => ({ value: ability.key, label: t(`ability.${ability.key}`) }))
              ]}
            />
            <Field label={t("panel.spells.focus")} value={spells.focus} onChange={(value) => updatePath("spells.focus", value)} />
            <Field label={t("panel.spells.saveDc")} type="number" min={0} value={spells.saveDc} onChange={(value) => updatePath("spells.saveDc", value)} inputClassName="font-ui text-base font-black" />
            <Field label={t("panel.spells.attack")} type="number" signed value={spells.attackBonus} onChange={(value) => updatePath("spells.attackBonus", value)} inputClassName="font-ui text-base font-black" />
          </div>
        </section>

        <section className="rounded-md border border-umber/25 bg-parchment p-3 shadow-insetLine">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
              <Zap className="h-4 w-4 text-oxblood" aria-hidden="true" />
              {t("panel.spells.slots")}
            </span>
            <button
              type="button"
              onClick={addSlotLevel}
              disabled={!availableSlotLevels.length}
              className="inline-flex min-h-9 items-center gap-1 rounded-md border border-umber/35 bg-vellum px-2 font-ui text-xs font-black text-ink transition hover:border-oxblood/50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("panel.spells.addSlotLevel")}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleSlotLevels.map((level) => (
              <SlotLevelCard
                key={level}
                level={level}
                slot={spells.slots[String(level)]}
                t={t}
                updatePath={updatePath}
                onRemove={() => removeSlotLevel(level)}
                removable={visibleSlotLevels.length > 1 || level !== DEFAULT_SLOT_LEVELS[0]}
              />
            ))}
          </div>
        </section>

        <section className="rounded-md border border-umber/25 bg-white/25 p-3 shadow-insetLine">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.45fr)] lg:items-end">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
                <BookOpen className="h-4 w-4 text-oxblood" aria-hidden="true" />
                {t("panel.spells.knownList")}
              </div>
              <div className="flex max-w-full flex-wrap gap-2">
                {SPELL_FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 font-ui text-xs font-black transition ${filter === item ? "border-ink bg-ink text-vellum" : "border-umber/35 bg-vellum text-umber hover:bg-parchment"}`}
                  >
                    <span>{t(`panel.spells.filter.${item}`)}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === item ? "bg-vellum/20 text-vellum" : "bg-umber/10 text-umber"}`}>{filterCounts[item]}</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="relative block min-w-0">
              <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.search")}</span>
              <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-umber" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("panel.spells.searchPlaceholder")}
                className="min-h-11 w-full rounded-md border border-umber/35 bg-vellum pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-umber/55 focus:border-slate focus:ring-2 focus:ring-slate/20"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-2">
            {filteredRows.length ? filteredRows.map(({ spell, index }) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                index={index}
                updatePath={updatePath}
                removeItem={removeItem}
                t={t}
              />
            )) : (
              <div className="rounded-md border border-dashed border-umber/35 bg-vellum px-3 py-6 text-sm leading-6 text-umber">
                {known.length ? t("panel.spells.noMatches") : t("panel.spells.empty")}
              </div>
            )}
          </div>
        </section>
      </div>
    </Panel>
  );
}

function SlotLevelCard({ level, slot, t, updatePath, onRemove, removable }) {
  const current = finiteNumber(slot?.current);
  const max = finiteNumber(slot?.max);

  return (
    <div className="rounded-md border border-umber/25 bg-vellum/85 p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="font-ui text-[11px] font-black uppercase tracking-[0.08em] text-umber">
            {t("panel.spells.levelShort")} {level}
          </div>
          <div className="mt-0.5 font-display text-xl font-bold text-ink">
            {current ?? 0}/{max ?? "-"}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!removable}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-oxblood/35 text-oxblood transition hover:bg-oxblood hover:text-vellum disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={t("panel.spells.removeSlotLevel")}
          title={t("panel.spells.removeSlotLevel")}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <SlotPips current={current} max={max} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SlotStepper
          label={t("panel.spells.current")}
          value={slot?.current}
          onChange={(value) => updatePath(`spells.slots.${level}.current`, value)}
        />
        <SlotStepper
          label={t("panel.spells.total")}
          value={slot?.max}
          onChange={(value) => updatePath(`spells.slots.${level}.max`, value)}
        />
      </div>
    </div>
  );
}

function SlotPips({ current, max }) {
  if (!Number.isFinite(max) || max < 1 || max > 9) return null;
  const filled = Number.isFinite(current) ? Math.max(0, Math.min(max, current)) : 0;
  return (
    <div className="flex min-h-5 flex-wrap gap-1.5" aria-hidden="true">
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={`h-3.5 w-3.5 rotate-45 rounded-[2px] border ${index < filled ? "border-oxblood bg-oxblood" : "border-umber/35 bg-parchment"}`}
        />
      ))}
    </div>
  );
}

function SlotStepper({ label, value, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate font-ui text-[10px] font-black uppercase tracking-[0.08em] text-umber">
        {label}
      </span>
      <NumberStepper
        label={label}
        min={0}
        value={value}
        onChange={onChange}
        className="min-h-10 bg-white/70"
        inputClassName="px-0 font-ui text-sm font-black"
        buttonClassName="min-h-10"
        buttonWidth="32px"
      />
    </label>
  );
}

function SpellCard({ spell, index, updatePath, removeItem, t }) {
  const spellPath = `spells.known.${index}`;
  const prepared = Boolean(spell.prepared);

  return (
    <article className="rounded-md border border-umber/25 bg-vellum shadow-insetLine">
      <div className="grid gap-3 p-3 lg:grid-cols-[96px_minmax(190px,1fr)_auto_auto] lg:items-end">
        <SelectField
          label={t("panel.spells.level")}
          value={String(spell.level ?? 0)}
          onChange={(value) => updatePath(`${spellPath}.level`, Number(value))}
          options={SPELL_LEVELS.map((level) => ({ value: String(level), label: levelLabel(level, t) }))}
        />
        <Field label={t("panel.attacks.name")} value={spell.name} onChange={(value) => updatePath(`${spellPath}.name`, value)} />
        <button
          type="button"
          onClick={() => updatePath(`${spellPath}.prepared`, !prepared)}
          aria-pressed={prepared}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 font-ui text-xs font-black uppercase tracking-[0.08em] transition ${prepared ? "border-oxblood bg-oxblood text-vellum" : "border-umber/35 bg-parchment text-umber hover:bg-white/65"}`}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {prepared ? t("panel.spells.prepared") : t("panel.spells.known")}
        </button>
        <button
          type="button"
          title={t("panel.spells.remove")}
          aria-label={t("panel.spells.removeAria")}
          onClick={() => removeItem("spells.known", spell.id)}
          className="grid min-h-11 w-full place-items-center rounded-md border border-oxblood/50 text-oxblood transition hover:bg-oxblood hover:text-white lg:w-11"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-umber/15 px-3 py-2">
        <MetaChip>{levelLabel(spell.level, t)}</MetaChip>
        <MetaChip>{spell.school ? t(`spell.school.${spell.school}`) : t("panel.spells.school")}</MetaChip>
        <MetaChip>{componentSummary(spell)}</MetaChip>
        {spell.castingTime ? <MetaChip icon={Clock3}>{spell.castingTime}</MetaChip> : null}
        {spell.range ? <MetaChip icon={Ruler}>{spell.range}</MetaChip> : null}
        {spell.concentration ? <MetaChip icon={Sparkles}>{t("panel.spells.concentrationShort")}</MetaChip> : null}
        {spell.ritual ? <MetaChip icon={Gem}>{t("panel.spells.ritual")}</MetaChip> : null}
      </div>

      <details className="group border-t border-umber/15">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
          <span className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.details")}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-umber transition group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="grid gap-3 border-t border-umber/15 p-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-md border border-umber/20 bg-parchment p-3">
              <div className="mb-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.components")}</div>
              <div className="flex flex-wrap gap-2">
                <BooleanPill active={spell.verbal} label={t("panel.spells.verbal")} onClick={() => updatePath(`${spellPath}.verbal`, !spell.verbal)} />
                <BooleanPill active={spell.somatic} label={t("panel.spells.somatic")} onClick={() => updatePath(`${spellPath}.somatic`, !spell.somatic)} />
                <BooleanPill active={spell.material} label={t("panel.spells.material")} onClick={() => updatePath(`${spellPath}.material`, !spell.material)} />
              </div>
              {spell.material ? (
                <div className="mt-3">
                  <Field label={t("panel.spells.materialText")} value={spell.materialText} onChange={(value) => updatePath(`${spellPath}.materialText`, value)} />
                </div>
              ) : null}
            </div>

            <div className="rounded-md border border-umber/20 bg-parchment p-3">
              <div className="mb-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.tags")}</div>
              <div className="flex flex-wrap gap-2">
                <BooleanPill active={spell.concentration} label={t("panel.spells.concentration")} onClick={() => updatePath(`${spellPath}.concentration`, !spell.concentration)} />
                <BooleanPill active={spell.ritual} label={t("panel.spells.ritual")} onClick={() => updatePath(`${spellPath}.ritual`, !spell.ritual)} />
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

function MetaChip({ children, icon: Icon }) {
  return (
    <span className="inline-flex min-h-7 max-w-full items-center gap-1 rounded-full border border-umber/20 bg-parchment px-2 font-ui text-[11px] font-black text-umber">
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-oxblood" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

function BooleanPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(active)}
      className={`inline-flex min-h-9 min-w-14 items-center justify-center rounded-md border px-3 font-ui text-xs font-black transition ${active ? "border-oxblood bg-oxblood text-vellum" : "border-umber/35 bg-vellum text-umber hover:bg-white/70"}`}
    >
      {label}
    </button>
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

function SelectField({ icon: Icon, label, value, onChange, options }) {
  return (
    <label className="block min-w-0 text-sm">
      <span className="mb-1 block truncate font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
        {label}
      </span>
      <span className="relative block">
        {Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-umber" aria-hidden="true" /> : null}
        <select
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          className={`h-11 w-full appearance-none rounded-md border border-umber/35 bg-parchment py-2 text-sm font-bold text-ink outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/20 ${Icon ? "pl-9 pr-9" : "px-3 pr-9"}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-umber" aria-hidden="true" />
      </span>
    </label>
  );
}
