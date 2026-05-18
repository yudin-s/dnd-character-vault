import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";
import SegmentedToggle from "@/components/form/SegmentedToggle";
import { SKILLS, passiveScore, proficiencyBonus, signed, skillBonus } from "@/lib/dndRules";

export default function SkillsPanel({ character, updatePath, t }) {
  return (
    <Panel
      title={t("panel.skills.title")}
      kicker={t("panel.skills.kicker", { bonus: proficiencyBonus(character.identity.level) })}
      action={<span className="font-ui text-xs font-black text-slate">{t("panel.skills.passivePerception", { value: passiveScore(character, "perception") })}</span>}
    >
      <div className="grid gap-1">
        {SKILLS.map((skill) => (
          <div key={skill.key} className="grid min-w-0 grid-cols-[26px_minmax(0,1fr)_minmax(0,116px)_44px] items-center gap-2 border-b border-umber/15 py-1.5 last:border-b-0">
            <Field
              type="checkbox"
              label={t(`skill.${skill.key}`)}
              value={character.skills[skill.key].proficient}
              onChange={(value) => updatePath(`skills.${skill.key}.proficient`, value)}
              hideLabel
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{t(`skill.${skill.key}`)}</div>
              <div className="font-ui text-[11px] uppercase tracking-[0.08em] text-umber">{t(`ability.short.${skill.ability}`)}</div>
            </div>
            <SegmentedToggle
              label={`${t(`skill.${skill.key}`)} ${t("generic.expert")}`}
              value={character.skills[skill.key].expertise ? "expertise" : "normal"}
              options={[
                { value: "normal", label: t("generic.norm") },
                { value: "expertise", label: t("generic.expert") }
              ]}
              onChange={(value) => updatePath(`skills.${skill.key}.expertise`, value === "expertise")}
            />
            <div className="text-right font-ui text-sm font-black">{signed(skillBonus(character, skill.key))}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
