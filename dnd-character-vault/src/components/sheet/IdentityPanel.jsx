import { ChevronDown } from "lucide-react";
import Field from "@/components/form/Field";
import Panel from "@/components/form/Panel";

const ALIGNMENTS = ["", "lg", "ng", "cg", "ln", "n", "cn", "le", "ne", "ce"];

export default function IdentityPanel({ character, updatePath, t, panelProps = {} }) {
  const identity = character.identity;
  const alignmentOptions = identity.alignment && !ALIGNMENTS.includes(identity.alignment)
    ? ["", identity.alignment, ...ALIGNMENTS.filter(Boolean)]
    : ALIGNMENTS;
  return (
    <Panel title={t("panel.character.title")} kicker={t("panel.character.kicker")} {...panelProps}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label={t("panel.identity.name")} value={identity.name} onChange={(value) => updatePath("identity.name", value)} />
        <Field label={t("panel.identity.player")} value={identity.player} onChange={(value) => updatePath("identity.player", value)} />
        <Field label={t("panel.identity.class")} value={identity.className} onChange={(value) => updatePath("identity.className", value)} />
        <Field label={t("panel.identity.level")} type="number" min={1} max={20} value={identity.level} onChange={(value) => updatePath("identity.level", value)} />
        <Field label={t("panel.identity.subclass")} value={identity.subclass} onChange={(value) => updatePath("identity.subclass", value)} />
        <Field label={t("panel.identity.species")} value={identity.species} onChange={(value) => updatePath("identity.species", value)} />
        <Field label={t("panel.identity.background")} value={identity.background} onChange={(value) => updatePath("identity.background", value)} />
        <label className="block text-sm">
          <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
            {t("panel.identity.alignment")}
          </span>
          <span className="relative block">
            <select
              value={identity.alignment || ""}
              onChange={(event) => updatePath("identity.alignment", event.target.value)}
              className="min-h-11 w-full appearance-none rounded-md border border-umber/35 bg-parchment px-3 py-2 pr-10 text-base font-bold text-ink shadow-insetLine outline-none transition hover:bg-vellum focus:border-slate focus:ring-2 focus:ring-slate/20 sm:text-sm"
            >
              {alignmentOptions.map((alignment) => (
                <option key={alignment || "none"} value={alignment}>
                  {alignment ? (ALIGNMENTS.includes(alignment) ? t(`alignment.${alignment}`) : alignment) : t("generic.none")}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-umber" aria-hidden="true" />
          </span>
        </label>
      </div>
    </Panel>
  );
}
