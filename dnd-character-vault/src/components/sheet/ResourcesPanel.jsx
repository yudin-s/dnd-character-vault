import { Plus, X } from "lucide-react";
import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";

export default function ResourcesPanel({ character, updatePath, addItem, removeItem, t, panelProps = {} }) {
  return (
    <Panel
      title={t("panel.resources.title")}
      kicker={t("panel.resources.kicker")}
      action={<button type="button" onClick={() => addItem("resources")} className="inline-flex h-8 items-center gap-1 rounded-md border border-ink bg-parchment px-2 font-ui text-xs font-black hover:bg-vellum"><Plus className="h-3.5 w-3.5" />{t("panel.resources.add")}</button>}
      {...panelProps}
    >
      <div className="grid gap-3">
        {character.resources.map((resource, index) => (
          <div key={resource.id} className="grid gap-3 rounded-md border border-umber/25 bg-white/25 p-3 lg:grid-cols-[minmax(180px,1fr)_minmax(150px,0.55fr)_minmax(150px,0.55fr)_minmax(190px,0.8fr)_40px] lg:items-end">
            <Field label={t("panel.resources.name")} value={resource.name} onChange={(value) => updatePath(`resources.${index}.name`, value)} />
            <Field label={t("panel.resources.current")} type="number" value={resource.current} onChange={(value) => updatePath(`resources.${index}.current`, value)} buttonWidth="34px" inputClassName="font-ui text-base font-black" />
            <Field label={t("panel.resources.max")} type="number" value={resource.max} onChange={(value) => updatePath(`resources.${index}.max`, value)} buttonWidth="34px" inputClassName="font-ui text-base font-black" />
            <Field label={t("panel.resources.reset")} value={resource.reset} onChange={(value) => updatePath(`resources.${index}.reset`, value)} />
            <button type="button" title={t("panel.resources.remove")} aria-label={t("panel.resources.removeAria")} onClick={() => removeItem("resources", resource.id)} className="grid h-11 w-full place-items-center rounded-md border border-oxblood/50 text-oxblood hover:bg-oxblood hover:text-white lg:w-10">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
