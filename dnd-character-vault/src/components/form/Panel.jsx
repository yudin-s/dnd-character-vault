"use client";

export function Panel({
  title,
  kicker,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`fantasy-frame min-w-0 max-w-full rounded-md border border-umber/25 bg-vellum/55 text-ink shadow-insetLine ${className}`.trim()}
    >
      <div className="border-b border-umber/20 bg-white/20 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-none text-ink">
              {title}
            </h2>
            {kicker ? (
              <p className="mt-1 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
                {kicker}
              </p>
            ) : null}
          </div>
          {action ? <div className="ml-auto shrink-0">{action}</div> : null}
        </div>
      </div>
      <div className="px-3 py-3 sm:px-4 sm:py-4">{children}</div>
    </section>
  );
}

export default Panel;
