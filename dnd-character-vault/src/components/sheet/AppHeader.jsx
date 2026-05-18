import { Shield, Sparkles } from "lucide-react";
import LocaleToggle from "@/components/LocaleToggle";

export default function AppHeader({ actions, status, locale, setLocale, t }) {
  return (
    <header className="paper-grain fantasy-frame mb-4 flex flex-col gap-4 rounded-md border border-umber/35 p-4 shadow-sheet lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center border-2 border-ink bg-parchment text-oxblood [clip-path:polygon(50%_0,92%_24%,92%_76%,50%_100%,8%_76%,8%_24%)]">
          <Shield className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("header.tagline")}</p>
          <h1 className="truncate font-display text-3xl font-bold leading-none text-ink sm:text-4xl">{t("header.title")}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <LocaleToggle locale={locale} setLocale={setLocale} />
        <span className="inline-flex h-10 items-center rounded-full border border-laurel/30 bg-laurel/10 px-3 font-ui text-sm font-black text-laurel">
          <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
          {status}
        </span>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              title={action.label}
              aria-label={action.label}
              className="inline-grid h-10 w-10 place-items-center rounded-md border border-ink/80 bg-parchment text-ink shadow-insetLine transition hover:bg-vellum focus:outline-none focus:ring-2 focus:ring-slate/40"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </header>
  );
}
