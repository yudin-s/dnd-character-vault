"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Panel({
  title,
  kicker,
  action,
  children,
  className = "",
  collapsible = false,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const frameClassName = `fantasy-frame min-w-0 max-w-full rounded-md border border-umber/25 bg-vellum/55 text-ink shadow-insetLine ${className}`.trim();
  const heading = (
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
  );
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {heading}
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </div>
  );

  if (collapsible) {
    return (
      <details className={`group ${frameClassName}`} open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 border-b border-umber/20 bg-white/20 px-3 py-3 marker:hidden sm:px-4">
          <div className="min-w-0 flex-1">{heading}</div>
          <ChevronDown className="h-5 w-5 shrink-0 text-umber transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          {action ? <div className="mb-3 flex justify-end">{action}</div> : null}
          {children}
        </div>
      </details>
    );
  }

  return (
    <section className={frameClassName}>
      <div className="border-b border-umber/20 bg-white/20 px-3 py-3 sm:px-4">
        {header}
      </div>
      <div className="px-3 py-3 sm:px-4 sm:py-4">{children}</div>
    </section>
  );
}

export default Panel;
