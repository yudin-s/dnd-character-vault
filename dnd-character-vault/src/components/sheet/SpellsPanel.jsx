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
const SPELL_FILTERS = ["all", "prepared", "cantrip", "leveled"];
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

function groupRowsByLevel(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const level = Number(row.spell.level || 0);
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level).push(row);
  });
  return Array.from(groups.entries()).sort(([a], [b]) => a - b);
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
  const groupedRows = useMemo(() => groupRowsByLevel(filteredRows), [filteredRows]);
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
      {...panelProps}
    >
      <div className="grid max-w-full gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-start">
        <aside className="grid min-w-0 gap-3 xl:sticky xl:top-4">
          <section className="rounded-md border border-umber/25 bg-vellum/82 p-3 shadow-insetLine">
            <div className="mb-3 flex min-w-0 items-center gap-2">
              <WandSparkles className="h-5 w-5 shrink-0 text-oxblood" aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.spells.casting")}</div>
                <div className="truncate font-display text-lg font-bold text-ink">{t("panel.spells.spellbook")}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CasterStat label={t("panel.spells.saveDc")} value={spells.saveDc || "-"} />
              <CasterStat label={t("panel.spells.attack")} value={spells.attackBonus === "" ? "-" : spells.attackBonus} signed />
            </div>

            <div className="mt-3 grid gap-3">
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
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("panel.spells.saveDc")} type="number" min={0} value={spells.saveDc} onChange={(value) => updatePath("spells.saveDc", value)} inputClassName="font-ui text-base font-black" />
                <Field label={t("panel.spells.attack")} type="number" signed value={spells.attackBonus} onChange={(value) => updatePath("spells.attackBonus", value)} inputClassName="font-ui text-base font-black" />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-umber/25 bg-parchment p-3 shadow-insetLine">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
                <Zap className="h-4 w-4 shrink-0 text-oxblood" aria-hidden="true" />
                <span className="truncate">{t("panel.spells.slots")}</span>
              </span>
              <button
                type="button"
                onClick={addSlotLevel}
                disabled={!availableSlotLevels.length}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-umber/35 bg-vellum text-ink transition hover:border-oxblood/50 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label={t("panel.spells.addSlotLevel")}
                title={t("panel.spells.addSlotLevel")}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {visibleSlotLevels.map((level) => (
                <SlotLevelRow
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
        </aside>

        <section className="min-w-0 rounded-md border border-umber/25 bg-white/25 p-3 shadow-insetLine">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
                <BookOpen className="h-4 w-4 text-oxblood" aria-hidden="true" />
                {t("panel.spells.knownList")}
              </div>
              <div className="mt-1 font-display text-xl font-bold text-ink">
                {t("panel.spells.summaryPrepared", { prepared: preparedCount, total: known.length })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => addItem("spells")}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-ink bg-parchment px-3 font-ui text-xs font-black uppercase tracking-[0.08em] transition hover:bg-vellum sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("panel.spells.add")}
            </button>
          </div>

          <div className="grid gap-3">
            <label className="relative block min-w-0">
              <span className="sr-only">{t("panel.spells.search")}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-umber" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("panel.spells.searchPlaceholder")}
                className="min-h-11 w-full rounded-md border border-umber/35 bg-vellum pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-umber/55 focus:border-slate focus:ring-2 focus:ring-slate/20"
              />
            </label>

            <div className="-mx-3 flex max-w-[calc(100%+1.5rem)] gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:max-w-full sm:flex-wrap sm:overflow-visible sm:px-0">
              {SPELL_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border px-3 font-ui text-xs font-black transition ${filter === item ? "border-ink bg-ink text-vellum" : "border-umber/35 bg-vellum text-umber hover:bg-parchment"}`}
                >
                  <span>{t(`panel.spells.filter.${item}`)}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === item ? "bg-vellum/20 text-vellum" : "bg-umber/10 text-umber"}`}>{filterCounts[item]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3">
            {groupedRows.length ? groupedRows.map(([level, rows]) => (
              <SpellLevelGroup
                key={level}
                level={level}
                rows={rows}
                slot={spells.slots[String(level)]}
                updatePath={updatePath}
                removeItem={removeItem}
                t={t}
              />
            )) : (
              <EmptySpellbook
                hasKnown={known.length > 0}
                t={t}
                onAdd={() => addItem("spells")}
              />
            )}
          </div>
        </section>
      </div>
    </Panel>
  );
}

function CasterStat({ label, value, signed = false }) {
  const display = value === "" || value == null ? "-" : `${signed && Number(value) > 0 ? "+" : ""}${value}`;
  return (
    <div className="rounded-md border border-umber/20 bg-parchment px-3 py-2">
      <div className="truncate font-ui text-[10px] font-black uppercase tracking-[0.1em] text-umber">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold leading-none text-ink">{display}</div>
    </div>
  );
}

function SlotLevelRow({ level, slot, t, updatePath, onRemove, removable }) {
  const current = finiteNumber(slot?.current);
  const max = finiteNumber(slot?.max);

  return (
    <div className="rounded-md border border-umber/25 bg-vellum/85 p-2.5">
      <div className="mb-2 grid grid-cols-[48px_minmax(0,1fr)_32px] items-start gap-2">
        <div>
          <div className="font-ui text-[10px] font-black uppercase tracking-[0.08em] text-umber">{t("panel.spells.levelShort")} {level}</div>
          <div className="font-display text-xl font-bold leading-tight text-ink">{current ?? 0}/{max ?? "-"}</div>
        </div>
        <SlotPips current={current} max={max} />
        <button
          type="button"
          onClick={onRemove}
          disabled={!removable}
          className="grid h-8 w-8 place-items-center rounded-md border border-oxblood/30 text-oxblood transition hover:bg-oxblood hover:text-vellum disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={t("panel.spells.removeSlotLevel")}
          title={t("panel.spells.removeSlotLevel")}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
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
  if (!Number.isFinite(max) || max < 1 || max > 9) {
    return <div className="min-h-5 rounded-sm border border-dashed border-umber/25 bg-parchment/60" aria-hidden="true" />;
  }
  const filled = Number.isFinite(current) ? Math.max(0, Math.min(max, current)) : 0;
  return (
    <div className="flex min-h-5 flex-wrap content-start gap-1.5 pt-1" aria-hidden="true">
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={`h-3 w-3 rotate-45 rounded-[2px] border ${index < filled ? "border-oxblood bg-oxblood" : "border-umber/35 bg-parchment"}`}
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
        className="min-h-9 bg-white/70"
        inputClassName="px-0 font-ui text-sm font-black"
        buttonClassName="min-h-9"
        buttonWidth="30px"
      />
    </label>
  );
}

function SpellLevelGroup({ level, rows, slot, updatePath, removeItem, t }) {
  const current = finiteNumber(slot?.current);
  const max = finiteNumber(slot?.max);

  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-umber/25 bg-vellum/72">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-umber/20 bg-parchment px-3 py-2">
        <div className="min-w-0">
          <div className="truncate font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{levelLabel(level, t)}</div>
          <div className="font-ui text-[11px] text-umber">{rows.length} {t("panel.spells.countLabel")}</div>
        </div>
        {level > 0 ? (
          <div className="hidden min-w-28 sm:block">
            <SlotPips current={current} max={max} />
          </div>
        ) : null}
      </div>
      <div className="divide-y divide-umber/15">
        {rows.map(({ spell, index }) => (
          <SpellRow
            key={spell.id}
            spell={spell}
            index={index}
            updatePath={updatePath}
            removeItem={removeItem}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}

function SpellRow({ spell, index, updatePath, removeItem, t }) {
  const spellPath = `spells.known.${index}`;
  const prepared = Boolean(spell.prepared);

  return (
    <article className="bg-vellum">
      <div className="grid gap-2 p-3 md:grid-cols-[36px_88px_minmax(0,1fr)_44px] md:items-center">
        <div className="flex items-center gap-2 md:block">
          <button
            type="button"
            onClick={() => updatePath(`${spellPath}.prepared`, !prepared)}
            aria-pressed={prepared}
            title={t("panel.spells.prepared")}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border transition ${prepared ? "border-oxblood bg-oxblood text-vellum" : "border-umber/35 bg-parchment text-umber hover:bg-white/65"}`}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="md:hidden font-ui text-[11px] font-black uppercase tracking-[0.08em] text-umber">
            {prepared ? t("panel.spells.prepared") : t("panel.spells.known")}
          </span>
        </div>

        <SelectField
          label={t("panel.spells.level")}
          value={String(spell.level ?? 0)}
          onChange={(value) => updatePath(`${spellPath}.level`, Number(value))}
          options={SPELL_LEVELS.map((level) => ({ value: String(level), label: levelLabel(level, t) }))}
          compact
        />
        <Field label={t("panel.attacks.name")} value={spell.name} onChange={(value) => updatePath(`${spellPath}.name`, value)} />
        <button
          type="button"
          title={t("panel.spells.remove")}
          aria-label={t("panel.spells.removeAria")}
          onClick={() => removeItem("spells.known", spell.id)}
          className="grid min-h-10 w-full place-items-center rounded-md border border-oxblood/45 text-oxblood transition hover:bg-oxblood hover:text-white md:w-10"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 pb-3 md:pl-[139px]">
        <MetaChip>{spell.school ? t(`spell.school.${spell.school}`) : t("panel.spells.school")}</MetaChip>
        <MetaChip>{componentSummary(spell)}</MetaChip>
        {spell.castingTime ? <MetaChip icon={Clock3}>{spell.castingTime}</MetaChip> : null}
        {spell.range ? <MetaChip icon={Ruler}>{spell.range}</MetaChip> : null}
        {spell.concentration ? <MetaChip icon={Sparkles}>{t("panel.spells.concentrationShort")}</MetaChip> : null}
        {spell.ritual ? <MetaChip icon={Gem}>{t("panel.spells.ritual")}</MetaChip> : null}
      </div>

      <details className="group">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 border-t border-umber/15 px-3 py-2 marker:hidden md:pl-[139px]">
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

function EmptySpellbook({ hasKnown, t, onAdd }) {
  return (
    <div className="rounded-md border border-dashed border-umber/35 bg-vellum px-3 py-6 text-sm leading-6 text-umber">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{hasKnown ? t("panel.spells.noMatches") : t("panel.spells.empty")}</span>
        {!hasKnown ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-ink bg-parchment px-3 font-ui text-xs font-black uppercase tracking-[0.08em] text-ink hover:bg-white/70"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("panel.spells.add")}
          </button>
        ) : null}
      </div>
    </div>
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

function SelectField({ compact = false, icon: Icon, label, value, onChange, options }) {
  return (
    <label className="block min-w-0 text-sm">
      <span className={`${compact ? "sr-only" : "mb-1 block truncate font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber"}`}>
        {label}
      </span>
      <span className="relative block">
        {Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-umber" aria-hidden="true" /> : null}
        <select
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          className={`${compact ? "h-10" : "h-11"} w-full appearance-none rounded-md border border-umber/35 bg-parchment py-2 text-sm font-bold text-ink outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/20 ${Icon ? "pl-9 pr-9" : "px-3 pr-9"}`}
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
