"use client";

export function SegmentedToggle({
  label,
  options = [],
  value,
  onChange,
}) {
  return (
    <fieldset className="space-y-2">
      {label ? (
        <legend className="mb-1 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
          {label}
        </legend>
      ) : null}
      <div className="inline-flex min-h-10 overflow-hidden rounded-md border border-umber/30 bg-white/55">
        {options.map((option, index) => {
          const selected = option.value === value;
          const sharedClassName = [
            "min-h-10 px-3 py-2 font-ui text-xs font-black transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate/30 focus-visible:ring-inset",
            index === 0 ? "rounded-l-md" : "",
            index === options.length - 1 ? "rounded-r-md" : "",
            selected ? "bg-ink text-vellum" : "bg-white/55 text-umber hover:bg-vellum",
          ].join(" ").trim();

          return (
            <button
              key={option.value}
              type="button"
              className={sharedClassName}
              role="button"
              aria-pressed={selected}
              aria-label={option.label}
              onClick={() => onChange?.(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default SegmentedToggle;
