import { Plus, X } from "lucide-react";
import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";

export default function AttacksPanel({ character, updatePath, addItem, removeItem, t, panelProps = {} }) {
  return (
    <Panel
      title={t("panel.attacks.title")}
      kicker={t("panel.attacks.kicker")}
      action={<AddButton label={t("panel.attacks.add")} onClick={() => addItem("attacks")} />}
      {...panelProps}
    >
      <div className="grid gap-3">
        {character.attacks.map((attack, index) => (
          <div key={attack.id} className="grid gap-3 rounded-md border border-umber/25 bg-white/25 p-3 md:grid-cols-[1fr_86px_110px_minmax(0,1.2fr)_34px]">
            <Field label={t("panel.attacks.name")} value={attack.name} onChange={(value) => updatePath(`attacks.${index}.name`, value)} />
            <Field label={t("panel.attacks.bonus")} value={attack.bonus} onChange={(value) => updatePath(`attacks.${index}.bonus`, value)} />
            <Field label={t("panel.attacks.damage")} value={attack.damage} onChange={(value) => updatePath(`attacks.${index}.damage`, value)} />
            <Field label={t("panel.attacks.notes")} value={attack.notes} onChange={(value) => updatePath(`attacks.${index}.notes`, value)} />
            <RemoveButton label={t("panel.attacks.remove")} onClick={() => removeItem("attacks", attack.id)} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AddButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-8 items-center gap-1 rounded-md border border-ink bg-parchment px-2 font-ui text-xs font-black hover:bg-vellum">
      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function RemoveButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="mt-5 grid h-9 w-full place-items-center rounded-md border border-oxblood/50 text-oxblood hover:bg-oxblood hover:text-white md:w-9">
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
