export default function PwaInstallHint({ canInstall, isStandalone, onInstall, t = (key) => key }) {
  if (isStandalone) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 px-3 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-md border border-umber/30 bg-vellum px-3 py-2 text-xs text-stone-700">
        {canInstall ? (
          <>
            <span>{t("pwa.installPrompt")}</span>
            <button
              type="button"
              onClick={onInstall}
              className="rounded-md border border-oxblood/40 bg-oxblood px-2.5 py-1 text-[11px] font-ui font-semibold uppercase tracking-wide text-parchment transition hover:bg-oxblood/90"
            >
              {t("pwa.installButton")}
            </button>
          </>
        ) : (
          <span>{t("pwa.offlineHint")}</span>
        )}
      </div>
    </div>
  );
}
