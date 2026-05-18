import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";
import TextArea from "@/components/form/TextArea";
import { COINS } from "@/lib/dndRules";

export default function InventoryPanel({ character, updatePath, t }) {
  return (
    <Panel title={t("panel.inventory.title")} kicker={t("panel.inventory.kicker")}>
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
        <TextArea label={t("panel.inventory.gear")} value={character.equipment.gear} onChange={(value) => updatePath("equipment.gear", value)} rows={6} />
        <TextArea label={t("panel.inventory.proficienciesAndLanguages")} value={character.proficiencies} onChange={(value) => updatePath("proficiencies", value)} rows={4} />
      </div>
    </Panel>
  );
}
