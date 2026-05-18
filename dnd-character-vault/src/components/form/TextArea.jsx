"use client";

export function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder = "",
  className = "",
  textareaClassName = "",
  id,
}) {
  const resolvedId = id || `textarea-${label || "field"}`.replace(/\s+/g, "-").toLowerCase();

  return (
    <label htmlFor={resolvedId} className={`block text-sm ${className}`.trim()}>
      <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
        {label}
      </span>
      <textarea
        id={resolvedId}
        rows={rows}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border border-umber/35 bg-white/65 px-3 py-2 text-base text-ink outline-none transition placeholder:text-umber/55 focus:border-slate focus:ring-2 focus:ring-slate/20 sm:text-sm ${textareaClassName}`.trim()}
      />
    </label>
  );
}

export default TextArea;
