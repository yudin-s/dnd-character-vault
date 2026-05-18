"use client";

import { useId } from "react";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  placeholder = "",
  inputClassName = "",
  hideLabel = false,
  id,
  className = "",
  ...inputProps
}) {
  const uid = useId();
  const fieldId = id || `field-${uid}`;
  const isCheckbox = type === "checkbox";
  const commonInputClassName = [
    "min-h-11 w-full rounded-md border border-umber/35 bg-white/65 px-3 py-2 text-base text-ink outline-none transition placeholder:text-umber/55 focus:border-slate focus:ring-2 focus:ring-slate/20 sm:text-sm",
    inputClassName,
  ].join(" ").trim();

  const checkboxClassName = [
    "h-5 w-5 shrink-0 rounded border-umber/50 text-oxblood focus:ring-2 focus:ring-slate/30",
    inputClassName,
  ].join(" ").trim();

  if (isCheckbox) {
    return (
      <label
        className={`${hideLabel ? "inline-grid h-7 w-7 place-items-center rounded-md" : "inline-flex min-h-11 items-center justify-start gap-2 rounded-md border border-umber/25 bg-white/45 px-2 py-1.5 text-sm"} ${className}`.trim()}
        htmlFor={fieldId}
      >
        <input
          id={fieldId}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange?.(event.target.checked)}
          className={checkboxClassName}
          {...inputProps}
        />
        <span className={hideLabel ? "sr-only" : "text-ink"}>{label}</span>
      </label>
    );
  }

  return (
    <label htmlFor={fieldId} className={`block text-sm ${className}`.trim()}>
      <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">
        {label}
      </span>
      <input
        id={fieldId}
        value={value ?? ""}
        onChange={(event) => {
          const nextValue = type === "number" && event.target.value !== ""
            ? Number(event.target.value)
            : event.target.value;
          onChange?.(nextValue);
        }}
        type={type}
        min={type === "number" ? min : undefined}
        max={type === "number" ? max : undefined}
        placeholder={placeholder}
        className={commonInputClassName}
        {...inputProps}
      />
    </label>
  );
}

export default Field;
