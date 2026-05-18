import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";
import { abilityModifier, signed } from "@/lib/dndRules";

export default function CombatPanel({ character, updatePath, t }) {
  const combat = character.combat;
  const dexInit = abilityModifier(character.abilities.dexterity.score);
  const initiative = combat.initiativeOverride === "" ? dexInit : Number(combat.initiativeOverride);

  return (
    <Panel title={t("panel.combat.title")} kicker={t("panel.combat.kicker", { value: signed(initiative) })}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("panel.combat.armor")} value={combat.armorClass} />
        <Stat label={t("panel.combat.speed")} value={combat.speed} />
        <Stat label={t("panel.combat.temp")} value={combat.hitPoints.temporary} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label={t("panel.combat.currentHp")} type="number" value={combat.hitPoints.current} onChange={(value) => updatePath("combat.hitPoints.current", value)} />
        <Field label={t("panel.combat.maxHp")} type="number" value={combat.hitPoints.max} onChange={(value) => updatePath("combat.hitPoints.max", value)} />
        <Field label={t("panel.combat.tempHp")} type="number" value={combat.hitPoints.temporary} onChange={(value) => updatePath("combat.hitPoints.temporary", value)} />
        <Field label={t("panel.combat.armorClass")} type="number" value={combat.armorClass} onChange={(value) => updatePath("combat.armorClass", value)} />
        <Field label={t("panel.combat.speed")} type="number" value={combat.speed} onChange={(value) => updatePath("combat.speed", value)} />
        <Field label={t("panel.combat.exhaustion")} type="number" min={0} max={6} value={combat.exhaustion} onChange={(value) => updatePath("combat.exhaustion", value)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={t("panel.combat.hitDice")} value={combat.hitDice} onChange={(value) => updatePath("combat.hitDice", value)} />
        <Field label={t("panel.combat.conditions")} value={combat.conditions} onChange={(value) => updatePath("combat.conditions", value)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <DeathSave label={t("panel.combat.successes")} values={character.deathSaves.successes} path="deathSaves.successes" updatePath={updatePath} />
        <DeathSave label={t("panel.combat.failures")} values={character.deathSaves.failures} path="deathSaves.failures" updatePath={updatePath} />
      </div>
      <div className="mt-3">
        <Field type="checkbox" label={t("panel.combat.inspiration")} value={character.inspiration} onChange={(value) => updatePath("inspiration", value)} />
      </div>
    </Panel>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-umber/25 bg-white/25 p-3">
      <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{label}</div>
      <div className="font-ui text-2xl font-black">{value || 0}</div>
    </div>
  );
}

function DeathSave({ label, values, path, updatePath }) {
  return (
    <div className="rounded-md border border-umber/25 bg-white/20 p-3">
      <div className="mb-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{label}</div>
      <div className="flex gap-2">
        {values.map((value, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${label} ${index + 1}`}
            onClick={() => updatePath(`${path}.${index}`, !value)}
            className={`h-8 w-8 rounded-full border ${value ? "border-oxblood bg-oxblood text-white" : "border-umber/40 bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
