"use client";

import { useMemo, useState } from "react";
import { Activity, Castle, Dice5, Footprints, HeartPulse, Minus, Plus, RotateCcw, Shield, Skull, Sparkles, Swords } from "lucide-react";
import { ABILITIES, SKILLS, abilityModifier, passiveScore, savingThrowBonus, signed, skillBonus } from "@/lib/dndRules";
import { CONDITIONS, parseConditions } from "@/lib/combat";

const QUICK_SKILLS = ["perception", "stealth", "investigation", "persuasion", "athletics"];

export default function PlayDashboard({ character, actions, openDice, t }) {
  const [hpAmount, setHpAmount] = useState(1);
  const combat = character.combat;
  const hp = combat.hitPoints;
  const hpMax = Math.max(1, Number(hp.max) || 1);
  const hpPercent = Math.max(0, Math.min(100, ((Number(hp.current) || 0) / hpMax) * 100));
  const activeConditions = useMemo(() => parseConditions(combat.conditions), [combat.conditions]);
  const initiative = combat.initiativeOverride === "" ? abilityModifier(character.abilities.dexterity.score) : Number(combat.initiativeOverride);

  return (
    <section id="play" className="grid min-w-0 gap-4">
      <div className="paper-grain fantasy-frame rounded-md border border-umber/35 p-4 shadow-sheet">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("play.kicker")}</p>
            <h2 className="truncate font-display text-3xl font-bold leading-none text-ink sm:text-4xl">
              {character.identity.name || t("play.unnamed")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-umber">
              {[character.identity.species, character.identity.className, character.identity.level ? `${t("play.level")} ${character.identity.level}` : ""].filter(Boolean).join(" / ")}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:min-w-[440px]">
            <HeroStat icon={Shield} label={t("play.ac")} value={combat.armorClass} />
            <HeroStat icon={Sparkles} label={t("play.init")} value={signed(initiative)} />
            <HeroStat icon={Footprints} label={t("play.speed")} value={combat.speed} />
            <HeroStat icon={Castle} label={t("play.passive")} value={passiveScore(character, "perception")} />
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-4">
          <section className="rounded-md border border-umber/30 bg-vellum/70 p-4 shadow-insetLine">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("play.hp")}</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-ui text-5xl font-black leading-none text-oxblood">{hp.current}</span>
                  <span className="pb-1 font-ui text-lg font-black text-umber">/ {hp.max}</span>
                  {Number(hp.temporary) > 0 ? (
                    <span className="mb-1 rounded-full border border-laurel/30 bg-laurel/10 px-2 py-1 font-ui text-xs font-black text-laurel">
                      +{hp.temporary} {t("play.temp")}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full border border-umber/25 bg-white/45">
                  <div className="h-full rounded-full bg-gradient-to-r from-oxblood to-laurel transition-all" style={{ width: `${hpPercent}%` }} />
                </div>
              </div>

              <div className="grid min-w-0 gap-2 sm:grid-cols-[88px_1fr] md:w-[360px]">
                <label className="block">
                  <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("play.amount")}</span>
                  <input
                    type="number"
                    min="0"
                    value={hpAmount}
                    onChange={(event) => setHpAmount(event.target.value)}
                    className="h-11 w-full rounded-md border border-umber/35 bg-white/65 px-3 text-center font-ui text-lg font-black text-ink outline-none focus:border-slate focus:ring-2 focus:ring-slate/20"
                  />
                </label>
                <div className="grid grid-cols-3 gap-2 self-end">
                  <ActionButton icon={Skull} label={t("play.damage")} onClick={() => actions.applyHitPointChange({ type: "damage", amount: hpAmount })} tone="danger" />
                  <ActionButton icon={HeartPulse} label={t("play.heal")} onClick={() => actions.applyHitPointChange({ type: "heal", amount: hpAmount })} tone="heal" />
                  <ActionButton icon={Sparkles} label={t("play.temp")} onClick={() => actions.applyHitPointChange({ type: "temp", amount: hpAmount })} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-w-0 gap-4 lg:grid-cols-2">
            <QuickRolls character={character} openDice={openDice} t={t} />
            <Resources character={character} actions={actions} t={t} />
          </section>
        </div>

        <aside className="grid min-w-0 gap-4">
          <section className="rounded-md border border-umber/30 bg-vellum/70 p-4 shadow-insetLine">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("play.deathSaves")}</div>
                <div className="font-display text-xl font-bold text-ink">{t("play.survival")}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  [0, 1, 2].forEach((index) => {
                    actions.setDeathSave("successes", index, false);
                    actions.setDeathSave("failures", index, false);
                  });
                }}
                className="grid h-9 w-9 place-items-center rounded-md border border-umber/30 bg-white/40 text-umber"
                aria-label={t("play.resetDeathSaves")}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <DeathSaveRow label={t("panel.combat.successes")} values={character.deathSaves.successes} onToggle={(index, value) => actions.setDeathSave("successes", index, value)} />
            <DeathSaveRow label={t("panel.combat.failures")} values={character.deathSaves.failures} onToggle={(index, value) => actions.setDeathSave("failures", index, value)} danger />
          </section>

          <section className="rounded-md border border-umber/30 bg-vellum/70 p-4 shadow-insetLine">
            <div className="mb-3 font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("play.conditions")}</div>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((condition) => {
                const active = activeConditions.some((item) => item.toLowerCase() === condition.toLowerCase());
                return (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => actions.toggleCondition(t(`condition.${condition}`))}
                    className={`rounded-full border px-3 py-1.5 font-ui text-[11px] font-black uppercase transition ${
                      active
                        ? "border-oxblood bg-oxblood text-vellum"
                        : "border-umber/25 bg-white/35 text-umber hover:bg-white/60"
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
    </section>
  );
}

function HeroStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-umber/25 bg-white/30 p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-oxblood" aria-hidden="true" />
      <div className="font-ui text-[10px] font-black uppercase tracking-[0.08em] text-umber">{label}</div>
      <div className="mt-1 font-ui text-xl font-black text-ink">{value || 0}</div>
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
    <button type="button" onClick={onClick} className={`inline-flex h-11 items-center justify-center gap-1 rounded-md px-2 font-ui text-xs font-black ${tones[tone]}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function QuickRolls({ character, openDice, t }) {
  const attacks = character.attacks.filter((attack) => attack.name).slice(0, 3);
  return (
    <section className="rounded-md border border-umber/30 bg-vellum/70 p-4 shadow-insetLine">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("play.quickRolls")}</div>
          <div className="font-display text-xl font-bold text-ink">{t("play.actions")}</div>
        </div>
        <button type="button" onClick={() => openDice({ label: t("dice.title"), sides: 20, count: 1 })} className="grid h-10 w-10 place-items-center rounded-md border border-ink bg-parchment text-ink">
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
          <RollButton key={skill} compact label={t(`skill.${skill}`)} bonus={skillBonus(character, skill)} openDice={openDice} />
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

function RollButton({ icon: Icon = Activity, label, bonus, openDice, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => openDice({ label, sides: 20, count: 1, modifier: bonus })}
      className={`flex items-center justify-between gap-2 rounded-md border border-umber/25 bg-white/35 px-3 font-ui font-black text-ink transition hover:bg-white/60 ${compact ? "min-h-10 text-xs" : "min-h-11 text-sm"}`}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-oxblood" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-oxblood">{signed(bonus)}</span>
    </button>
  );
}

function Resources({ character, actions, t }) {
  return (
    <section className="rounded-md border border-umber/30 bg-vellum/70 p-4 shadow-insetLine">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("play.resources")}</div>
          <div className="font-display text-xl font-bold text-ink">{t("play.counters")}</div>
        </div>
        <button type="button" onClick={() => actions.resetResources("long")} className="rounded-md border border-umber/30 bg-white/40 px-2 py-1 font-ui text-[11px] font-black uppercase text-umber">
          {t("play.longRest")}
        </button>
      </div>
      <div className="grid gap-2">
        {character.resources.slice(0, 5).map((resource, index) => (
          <div key={resource.id} className="grid grid-cols-[1fr_34px_44px_34px] items-center gap-2 rounded-md border border-umber/20 bg-white/25 p-2">
            <div className="min-w-0">
              <div className="truncate font-bold">{resource.name || t("play.resource")}</div>
              <div className="font-ui text-[11px] uppercase text-umber">{resource.reset || t("play.manual")}</div>
            </div>
            <CounterButton icon={Minus} label="-" onClick={() => actions.adjustResource(index, -1)} />
            <div className="text-center font-ui text-sm font-black">{resource.current || 0}/{resource.max || "-"}</div>
            <CounterButton icon={Plus} label="+" onClick={() => actions.adjustResource(index, 1)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CounterButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-9 w-9 place-items-center rounded-md border border-umber/25 bg-parchment text-ink">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function DeathSaveRow({ label, values, onToggle, danger = false }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <div className="font-ui text-xs font-black uppercase tracking-[0.08em] text-umber">{label}</div>
      <div className="flex gap-2">
        {values.map((value, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onToggle(index, !value)}
            className={`h-9 w-9 rounded-full border ${value ? (danger ? "border-oxblood bg-oxblood" : "border-laurel bg-laurel") : "border-umber/35 bg-white/35"}`}
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
