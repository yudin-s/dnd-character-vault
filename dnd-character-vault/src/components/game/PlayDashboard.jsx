"use client";

import { useMemo, useState } from "react";
import { Activity, Castle, Dice5, Footprints, HeartPulse, Minus, Plus, RotateCcw, Shield, Skull, Sparkles, Swords, Trophy } from "lucide-react";
import { ABILITIES, SKILLS, abilityModifier, passiveScore, savingThrowBonus, signed, skillBonus } from "@/lib/dndRules";
import { CONDITIONS, parseConditions } from "@/lib/combat";
import NumberStepper from "@/components/form/NumberStepper";

const QUICK_SKILLS = ["perception", "stealth", "investigation", "persuasion", "athletics"];

export default function PlayDashboard({ character, actions, openDice, t }) {
  const [hpAmount, setHpAmount] = useState(1);
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [xpAmount, setXpAmount] = useState(100);
  const combat = character.combat;
  const hp = combat.hitPoints;
  const hpMax = Math.max(1, Number(hp.max) || 1);
  const hpPercent = Math.max(0, Math.min(100, ((Number(hp.current) || 0) / hpMax) * 100));
  const activeConditions = useMemo(() => parseConditions(combat.conditions), [combat.conditions]);
  const initiative = combat.initiativeOverride === "" ? abilityModifier(character.abilities.dexterity.score) : Number(combat.initiativeOverride);
  const experience = character.identity.experience || {};

  return (
    <section id="play" className="grid min-w-0 gap-4">
      <div className="rpg-hero rounded-md p-4 shadow-sheet">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)_auto] lg:items-center">
          <CharacterProfile identity={character.identity} t={t} />
          <ExperienceProgress
            experience={experience}
            t={t}
            onClick={() => setXpModalOpen(true)}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[420px]">
            <HeroStat icon={Shield} label={t("play.ac")} value={combat.armorClass} />
            <HeroStat icon={Sparkles} label={t("play.init")} value={signed(initiative)} />
            <HeroStat icon={Footprints} label={t("play.speed")} value={combat.speed} />
            <HeroStat icon={Castle} label={t("play.passive")} value={passiveScore(character, "perception")} />
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-4">
          <section className="rpg-panel rounded-md p-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-[#d6a832]">{t("play.hp")}</div>
                </div>
                {Number(hp.temporary) > 0 ? (
                  <span className="rounded-full border border-laurel/40 bg-laurel/15 px-2 py-1 font-ui text-[11px] font-black uppercase tracking-[0.08em] text-[#d7f0b0]">
                    +{hp.temporary} {t("play.temp")}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="mt-1 flex items-end gap-2">
                  <span className="font-ui text-5xl font-black leading-none text-[#f0d58c]">{hp.current}</span>
                  <span className="pb-1 font-ui text-lg font-black text-vellum/70">/ {hp.max}</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full border border-[#d6a832]/30 bg-black/35">
                  <div className="h-full rounded-full bg-gradient-to-r from-oxblood via-oxblood/90 to-laurel transition-all" style={{ width: `${hpPercent}%` }} />
                </div>
              </div>

              <div className="grid min-w-0 gap-2 md:grid-cols-[132px_1fr] md:items-end">
                <label className="block">
                  <span className="sr-only">{t("play.amount")}</span>
                  <NumberStepper
                    label={t("play.amount")}
                    min="0"
                    value={hpAmount}
                    onChange={setHpAmount}
                    className="h-12 bg-white/65"
                    inputClassName="font-ui text-lg font-black"
                  />
                </label>
                <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                  <ActionButton icon={Skull} label={t("play.damage")} onClick={() => actions.applyHitPointChange({ type: "damage", amount: hpAmount })} tone="danger" />
                  <ActionButton icon={HeartPulse} label={t("play.heal")} onClick={() => actions.applyHitPointChange({ type: "heal", amount: hpAmount })} tone="heal" />
                  <ActionButton icon={Sparkles} label={t("play.temp")} onClick={() => actions.applyHitPointChange({ type: "temp", amount: hpAmount })} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-2">
            <QuickRolls character={character} openDice={openDice} t={t} />
            <Resources character={character} actions={actions} t={t} />
          </section>
        </div>

        <aside className="grid min-w-0 gap-4">
          <section className="rpg-panel rounded-md p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-[#d6a832]">{t("play.deathSaves")}</div>
                <div className="font-display text-xl font-bold text-vellum">{t("play.survival")}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  [0, 1, 2].forEach((index) => {
                    actions.setDeathSave("successes", index, false);
                    actions.setDeathSave("failures", index, false);
                  });
                }}
                className="grid h-11 w-11 place-items-center rounded-md border border-[#d6a832]/35 bg-parchment text-ink transition hover:bg-vellum"
                aria-label={t("play.resetDeathSaves")}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <DeathSaveRow label={t("panel.combat.successes")} values={character.deathSaves.successes} onToggle={(index, value) => actions.setDeathSave("successes", index, value)} />
            <DeathSaveRow label={t("panel.combat.failures")} values={character.deathSaves.failures} onToggle={(index, value) => actions.setDeathSave("failures", index, value)} danger />
          </section>

          <section className="rpg-panel rounded-md p-4">
            <div className="mb-3 font-ui text-xs font-black uppercase tracking-[0.12em] text-[#d6a832]">{t("play.conditions")}</div>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((condition) => {
                const active = activeConditions.some((item) => item.toLowerCase() === condition.toLowerCase());
                return (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => actions.toggleCondition(condition)}
                    className={`rounded-full border px-3 py-1.5 font-ui text-[10px] font-black uppercase tracking-[0.08em] transition ${
                      active
                        ? "border-oxblood bg-oxblood text-vellum shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
                        : "border-[#d6a832]/30 bg-vellum/90 text-ink hover:bg-parchment"
                    }`}
                  >
                    {t(`condition.${condition}`)}
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
      {xpModalOpen ? (
        <ExperienceModal
          amount={xpAmount}
          setAmount={setXpAmount}
          t={t}
          onClose={() => setXpModalOpen(false)}
          onSubmit={() => {
            actions.addExperience(Math.max(0, Number(xpAmount) || 0));
            setXpModalOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

function CharacterProfile({ identity, t }) {
  const alignment = formatAlignment(identity.alignment, t);
  const details = [
    { label: t("play.class"), value: identity.className },
    { label: t("play.subclass"), value: identity.subclass },
    { label: t("play.race"), value: identity.species },
    { label: t("play.alignment"), value: alignment }
  ];

  return (
    <div className="min-w-0 rounded-md border border-[#d6a832]/25 bg-black/15 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-ui text-xs font-black uppercase tracking-[0.12em] text-[#d6a832]">{t("play.profile")}</p>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-4">
        {details.map((item) => (
          <div key={item.label} className="min-w-0 rounded-md border border-[#d6a832]/20 bg-vellum/8 px-3 py-2">
            <div className="truncate font-ui text-[10px] font-black uppercase tracking-[0.09em] text-vellum/55">{item.label}</div>
            <div className="mt-1 truncate font-ui text-sm font-black leading-tight text-vellum" title={item.value || t("generic.none")}>
              {item.value || t("generic.none")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAlignment(value, t) {
  const alignment = String(value || "").trim();
  if (!alignment) return "";
  const key = `alignment.${alignment}`;
  const translated = t(key);
  return translated === key ? alignment : translated;
}

function ExperienceProgress({ experience, t, onClick }) {
  const current = Math.max(0, Number(experience?.current) || 0);
  const max = Math.max(0, Number(experience?.max) || 0);
  const percent = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rpg-stat-card relative min-h-24 overflow-hidden rounded-md p-3 text-left transition hover:border-[#f0d58c]/70 focus:outline-none focus:ring-2 focus:ring-[#d6a832]/35"
    >
      <span
        className="absolute inset-x-0 top-0 bg-[#8c1f24]/42 transition-[height]"
        style={{ height: `${percent}%` }}
        aria-hidden="true"
      />
      <span className="relative z-10 flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="inline-flex items-center gap-1.5 font-ui text-[10px] font-black uppercase tracking-[0.08em] text-vellum/65">
            <Trophy className="h-4 w-4 text-[#d6a832]" aria-hidden="true" />
            {t("play.experience")}
          </span>
          <span className="mt-2 block font-ui text-2xl font-black leading-none text-vellum">{current}</span>
          <span className="mt-1 block truncate font-ui text-[11px] font-black uppercase tracking-[0.06em] text-vellum/65">
            {max > 0 ? `${t("play.xpToNext")}: ${max}` : t("play.setXpTarget")}
          </span>
        </span>
        <span className="shrink-0 rounded-full border border-[#d6a832]/35 bg-black/25 px-2 py-1 font-ui text-[10px] font-black text-[#f0d58c]">
          {Math.round(percent)}%
        </span>
      </span>
    </button>
  );
}

function ExperienceModal({ amount, setAmount, t, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/75 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-md border border-umber/35 bg-vellum p-4 shadow-sheet">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("play.experience")}</div>
            <h3 className="font-display text-2xl font-bold leading-none text-ink">{t("play.addExperience")}</h3>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md border border-umber/35 bg-parchment text-ink hover:bg-white/70" aria-label={t("generic.close")}>
            ×
          </button>
        </div>
        <NumberStepper
          label={t("play.addExperience")}
          min={0}
          step={50}
          value={amount}
          onChange={setAmount}
          className="bg-white/70"
          inputClassName="font-ui text-lg font-black"
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-md border border-umber/35 bg-parchment px-3 font-ui text-xs font-black uppercase tracking-[0.08em] text-ink hover:bg-white/70">
            {t("generic.cancel")}
          </button>
          <button type="button" onClick={onSubmit} className="min-h-11 rounded-md border border-ink bg-oxblood px-3 font-ui text-xs font-black uppercase tracking-[0.08em] text-vellum hover:bg-oxblood/90">
            {t("play.addXp")}
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }) {
  return (
    <div className="rpg-stat-card rounded-md p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-[#d6a832]" aria-hidden="true" />
      <div className="font-ui text-[10px] font-black uppercase tracking-[0.08em] text-vellum/65">{label}</div>
      <div className="mt-1 font-ui text-xl font-black leading-tight text-vellum">{value || 0}</div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, tone = "default" }) {
  const tones = {
    danger: "border-oxblood bg-oxblood text-vellum",
    heal: "border-laurel bg-laurel text-vellum",
    default: "border-ink bg-parchment text-ink"
  };
  return (
    <button type="button" onClick={onClick} className={`rpg-action inline-flex h-12 min-w-0 items-center justify-center gap-1 rounded-md px-2 font-ui text-[11px] font-black ${tones[tone]} uppercase tracking-[0.05em]`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function QuickRolls({ character, openDice, t }) {
  const attacks = character.attacks.filter((attack) => attack.name).slice(0, 3);
  return (
    <section className="rpg-panel rounded-md p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-[#d6a832]">{t("play.quickRolls")}</div>
          <div className="font-display text-xl font-bold text-vellum">{t("play.actions")}</div>
        </div>
        <button type="button" onClick={() => openDice({ label: t("dice.title"), sides: 20, count: 1 })} className="rpg-action grid h-11 w-11 place-items-center rounded-md border border-[#d6a832]/50 bg-parchment text-ink shadow-insetLine transition hover:bg-vellum" aria-label={t("dice.title")}>
          <Dice5 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-2">
        <RollButton icon={Sparkles} label={t("play.initiative")} bonus={abilityModifier(character.abilities.dexterity.score)} openDice={openDice} />
        {attacks.map((attack) => (
          <RollButton key={attack.id} icon={Swords} label={attack.name} bonus={parseBonus(attack.bonus)} openDice={openDice} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {QUICK_SKILLS.map((skill) => (
          <RollButton key={skill} compact label={t(`skill.short.${skill}`)} title={t(`skill.${skill}`)} bonus={skillBonus(character, skill)} openDice={openDice} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {ABILITIES.slice(0, 6).map((ability) => (
          <RollButton key={ability.key} compact label={t(`ability.short.${ability.key}`)} bonus={savingThrowBonus(character, ability.key)} openDice={openDice} />
        ))}
      </div>
    </section>
  );
}

function RollButton({ icon: Icon = Activity, label, title, bonus, openDice, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => openDice({ label: title || label, sides: 20, count: 1, modifier: bonus })}
      title={title || label}
      className={`rpg-action rounded-md border border-[#d6a832]/30 bg-vellum/90 font-ui font-black text-ink transition hover:bg-parchment ${
        compact
          ? "grid min-h-12 grid-cols-[14px_minmax(3ch,1fr)_auto] items-center gap-1 px-2 text-[11px] tracking-[0.05em]"
          : "flex min-h-12 items-center justify-between gap-2 px-3 text-sm"
      }`}
    >
      {compact ? (
        <>
          <Icon className="h-3.5 w-3.5 shrink-0 text-oxblood" aria-hidden="true" />
          <span className="min-w-[3ch] whitespace-nowrap text-center">{label}</span>
        </>
      ) : (
        <span className="inline-flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-oxblood" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </span>
      )}
      <span className="shrink-0 text-oxblood">{signed(bonus)}</span>
    </button>
  );
}

function Resources({ character, actions, t }) {
  const visibleResources = character.resources
    .map((resource, index) => ({ resource, index }))
    .slice(0, 5);

  return (
    <section className="rpg-panel rounded-md p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-[#d6a832]">{t("play.resources")}</div>
          <div className="font-display text-xl font-bold text-vellum">{t("play.counters")}</div>
        </div>
        <button type="button" onClick={() => actions.resetResources("long")} className="rpg-action rounded-md border border-[#d6a832]/40 bg-parchment px-2.5 py-1.5 font-ui text-[11px] font-black uppercase tracking-[0.05em] text-ink">
          {t("play.longRest")}
        </button>
      </div>
      <div className="grid gap-2">
        {visibleResources.map(({ resource, index }) => (
          <div key={resource.id} className="grid grid-cols-[minmax(0,1fr)_44px_52px_44px] items-center gap-1.5 rounded-md border border-[#d6a832]/20 bg-vellum/90 p-2 sm:grid-cols-[minmax(0,1fr)_44px_58px_44px] sm:gap-2">
            <div className="min-w-0">
              <div className="truncate font-bold text-ink">{resource.name || t("play.resource")}</div>
              <div className="font-ui text-[11px] uppercase text-umber">{resource.resetOnRest ? t("play.resetOnRest") : t("play.manual")}</div>
            </div>
            <CounterButton icon={Minus} label="-" onClick={() => actions.adjustResource(index, -1)} />
            <div className="text-center font-ui text-sm font-black text-ink">{resource.current || 0}/{resource.max || "-"}</div>
            <CounterButton icon={Plus} label="+" onClick={() => actions.adjustResource(index, 1)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CounterButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="rpg-action grid h-11 w-11 place-items-center rounded-md border border-umber/25 bg-parchment text-ink">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function DeathSaveRow({ label, values, onToggle, danger = false }) {
  const activeCount = values.filter(Boolean).length;
  return (
    <div className="mt-3 rounded-md border border-[#d6a832]/20 bg-vellum/90 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-ui text-xs font-black uppercase tracking-[0.08em] text-umber">{label}</div>
        <span className="rounded-full border border-umber/20 bg-vellum px-2 py-1 font-ui text-[10px] font-black tracking-[0.08em] text-umber">{activeCount}/3</span>
      </div>
      <div className="flex gap-2">
        {values.map((value, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onToggle(index, !value)}
            className={`h-11 w-11 rounded-full border ${value ? (danger ? "border-oxblood bg-oxblood" : "border-laurel bg-laurel") : "border-umber/35 bg-vellum/90"} shadow-[inset_0_0_0_1px_rgba(120,110,100,0.12)]`}
            aria-label={`${label} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function parseBonus(value) {
  const match = String(value || "").match(/[+-]?\d+/);
  return match ? Number(match[0]) : 0;
}
