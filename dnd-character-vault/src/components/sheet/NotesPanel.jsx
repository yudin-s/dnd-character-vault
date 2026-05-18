import Panel from "@/components/form/Panel";
import TextArea from "@/components/form/TextArea";

export default function NotesPanel({ character, updatePath, t, panelProps = {} }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title={t("panel.notes.personality.title")} kicker={t("panel.notes.personality.kicker")} {...panelProps}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextArea label={t("panel.notes.traits")} value={character.personality.traits} onChange={(value) => updatePath("personality.traits", value)} />
          <TextArea label={t("panel.notes.ideals")} value={character.personality.ideals} onChange={(value) => updatePath("personality.ideals", value)} />
          <TextArea label={t("panel.notes.bonds")} value={character.personality.bonds} onChange={(value) => updatePath("personality.bonds", value)} />
          <TextArea label={t("panel.notes.flaws")} value={character.personality.flaws} onChange={(value) => updatePath("personality.flaws", value)} />
        </div>
        <div className="mt-3">
          <TextArea label={t("panel.notes.appearance")} value={character.appearance} onChange={(value) => updatePath("appearance", value)} rows={5} />
        </div>
      </Panel>
      <Panel title={t("panel.notes.featuresAndNotes.title")} kicker={t("panel.notes.featuresAndNotes.kicker")} {...panelProps}>
        <div className="grid gap-3">
          <TextArea label={t("panel.notes.features")} value={character.features} onChange={(value) => updatePath("features", value)} rows={5} />
          <TextArea label={t("panel.notes.campaignNotes")} value={character.notes} onChange={(value) => updatePath("notes", value)} rows={6} />
        </div>
      </Panel>
    </div>
  );
}
