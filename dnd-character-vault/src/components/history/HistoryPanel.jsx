import { RotateCcw, Trash2, X } from "lucide-react";
import { formatTimestamp } from "@/lib/storage";

export default function HistoryPanel({ history, status, restoreSnapshot, clearLocal, t, onClose, className = "" }) {
  return (
    <aside className={`paper-grain flex min-w-0 max-w-full flex-col overflow-hidden rounded-md border border-umber/35 p-4 shadow-sheet ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3 border-b border-umber/20 pb-3">
        <div className="min-w-0">
          <p className="font-ui text-xs font-black uppercase tracking-[0.12em] text-umber">{t("history.localOnly")}</p>
          <h2 className="font-display text-2xl font-bold leading-none">{t("history.title")}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="max-w-28 truncate rounded-full border border-laurel/30 bg-laurel/10 px-3 py-1 font-ui text-xs font-black text-laurel">{status}</span>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-md border border-umber/35 bg-parchment text-ink transition hover:bg-vellum"
              aria-label={t("generic.close")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="scrollbar-thin mt-3 grid flex-1 content-start gap-2 overflow-y-auto pr-1">
        {history.length === 0 ? (
          <p className="rounded-md border border-umber/20 bg-white/20 p-3 text-sm leading-6 text-umber">
            {t("history.empty")}
          </p>
        ) : (
          history.map((item) => (
            <article key={item.id} className="rounded-md border border-umber/20 bg-white/25 p-3">
              <div className="font-bold leading-tight">{item.summary?.title || t("history.snapshotFallbackTitle")}</div>
              <div className="mt-1 font-ui text-xs leading-5 text-umber">
                {item.summary?.subtitle || t("history.snapshotFallbackSubtitle")}<br />
                {formatTimestamp(item.timestamp)} / {t(`reason.${item.reason}`)}
              </div>
              <button
                type="button"
                onClick={() => restoreSnapshot(item.id)}
                className="mt-3 inline-flex h-8 items-center gap-1 rounded-md border border-ink bg-parchment px-2 font-ui text-xs font-black hover:bg-vellum"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {t("history.restoreButton")}
              </button>
            </article>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={clearLocal}
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-oxblood/50 font-ui text-sm font-black text-oxblood hover:bg-oxblood hover:text-white"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {t("history.clearLocalData")}
      </button>
    </aside>
  );
}
