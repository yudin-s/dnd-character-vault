"use client";

export function SegmentedToggle({
  label,
  options = [],
  value,
  onChange,
}) {
  return (
    <fieldset className="min-w-0 w-full space-y-2">
      {label ? (
        <legend className="mb-1 block w-full truncate font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
          {label}
        </legend>
      ) : null}
      <div className="inline-flex min-h-10 w-full min-w-0 overflow-hidden rounded-md border border-umber/30 bg-white/55">
        {options.map((option, index) => {
          const selected = option.value === value;
          const sharedClassName = [
            "min-h-10 min-w-0 flex-1 px-2 py-2 text-center font-ui text-[10px] font-black transition sm:text-xs",
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
              <span className="block min-w-0 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default SegmentedToggle;
