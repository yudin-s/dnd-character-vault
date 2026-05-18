import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";
import { ABILITIES, abilityModifier, signed, savingThrowBonus } from "@/lib/dndRules";

export default function AbilityPanel({ character, updatePath, t, panelProps = {} }) {
  return (
    <Panel title={t("panel.abilities.title")} kicker={t("panel.abilities.kicker")} {...panelProps}>
      <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
        {ABILITIES.map((ability) => {
          const score = character.abilities[ability.key].score;
          return (
            <div key={ability.key} className="rounded-md border border-umber/25 bg-white/25 p-3">
              <div className="grid grid-cols-[1fr_62px_62px] items-end gap-2">
                <Field
                  label={t(`ability.short.${ability.key}`)}
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(value) => updatePath(`abilities.${ability.key}.score`, value)}
                  inputClassName="text-center text-lg font-black"
                />
                <div>
                  <span className="block font-ui text-[10px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.abilities.modLabel")}</span>
                  <div className="grid h-10 place-items-center rounded-md border border-ink bg-parchment font-ui text-lg font-black">
                    {signed(abilityModifier(score))}
                  </div>
                </div>
                <div>
                  <span className="block font-ui text-[10px] font-black uppercase tracking-[0.12em] text-umber">{t("panel.abilities.saveLabel")}</span>
                  <div className="grid h-10 place-items-center rounded-md border border-umber/35 bg-white/35 font-ui font-black">
                    {signed(savingThrowBonus(character, ability.key))}
                  </div>
                </div>
              </div>
              <Field
                type="checkbox"
                label={t("panel.abilities.savingThrowProficiency")}
                value={character.savingThrows[ability.key].proficient}
                onChange={(value) => updatePath(`savingThrows.${ability.key}.proficient`, value)}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
