import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";

export default function IdentityPanel({ character, updatePath, t }) {
  const identity = character.identity;
  return (
    <Panel title={t("panel.character.title")} kicker={t("panel.character.kicker")}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label={t("panel.identity.name")} value={identity.name} onChange={(value) => updatePath("identity.name", value)} />
        <Field label={t("panel.identity.player")} value={identity.player} onChange={(value) => updatePath("identity.player", value)} />
        <Field label={t("panel.identity.class")} value={identity.className} onChange={(value) => updatePath("identity.className", value)} />
        <Field label={t("panel.identity.level")} type="number" min={1} max={20} value={identity.level} onChange={(value) => updatePath("identity.level", value)} />
        <Field label={t("panel.identity.subclass")} value={identity.subclass} onChange={(value) => updatePath("identity.subclass", value)} />
        <Field label={t("panel.identity.species")} value={identity.species} onChange={(value) => updatePath("identity.species", value)} />
        <Field label={t("panel.identity.background")} value={identity.background} onChange={(value) => updatePath("identity.background", value)} />
        <Field label={t("panel.identity.alignment")} value={identity.alignment} onChange={(value) => updatePath("identity.alignment", value)} />
      </div>
    </Panel>
  );
}
