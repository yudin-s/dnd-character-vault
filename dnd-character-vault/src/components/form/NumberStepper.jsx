"use client";

import { Minus, Plus } from "lucide-react";

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  let next = value;
  if (min !== undefined && min !== "") next = Math.max(numberOr(min, next), next);
  if (max !== undefined && max !== "") next = Math.min(numberOr(max, next), max);
  return next;
}

export default function NumberStepper({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  signed = false,
  inputMode,
  pattern,
  placeholder = "",
  className = "",
  inputClassName = "",
  buttonClassName = "",
  buttonWidth = "40px",
  disabled = false,
  style,
  ...inputProps
}) {
  const stepValue = Math.max(1, Math.abs(numberOr(step, 1)));
  const minValue = min !== undefined && min !== "" ? numberOr(min, undefined) : undefined;
  const maxValue = max !== undefined && max !== "" ? numberOr(max, undefined) : undefined;
  const currentValue = Number(value);
  const canDecrease = !disabled && (!Number.isFinite(currentValue) || minValue === undefined || currentValue > minValue);
  const canIncrease = !disabled && (!Number.isFinite(currentValue) || maxValue === undefined || currentValue < maxValue);
  const controlLabel = label || inputProps["aria-label"] || "";
  const resolvedInputMode = inputMode || (signed || (minValue !== undefined && minValue < 0) ? "decimal" : "numeric");
  const resolvedPattern = pattern || (signed || (minValue !== undefined && minValue < 0) ? "-?[0-9]*" : "[0-9]*");

  const changeBy = (delta) => {
    const base = Number.isFinite(currentValue) ? currentValue : (minValue ?? 0);
    onChange?.(clamp(base + delta, minValue, maxValue));
  };

  return (
    <div
      className={`grid min-h-11 overflow-hidden rounded-md border border-umber/35 bg-white/65 text-ink transition focus-within:border-slate focus-within:ring-2 focus-within:ring-slate/20 ${className}`.trim()}
      style={{ gridTemplateColumns: `${buttonWidth} minmax(0, 1fr) ${buttonWidth}`, ...style }}
    >
      <button
        type="button"
        onClick={() => changeBy(-stepValue)}
        disabled={!canDecrease}
        className={`grid min-h-11 place-items-center border-r border-umber/20 bg-parchment text-ink transition hover:bg-vellum disabled:cursor-not-allowed disabled:opacity-35 ${buttonClassName}`.trim()}
        aria-label={controlLabel ? `${controlLabel} -` : "-"}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <input
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value === "" ? "" : Number(event.target.value))}
        type="number"
        min={min}
        max={max}
        step={stepValue}
        inputMode={resolvedInputMode}
        pattern={resolvedPattern}
        placeholder={placeholder}
        disabled={disabled}
        className={`min-w-0 appearance-none border-0 bg-transparent px-2 py-2 text-center text-base outline-none [appearance:textfield] placeholder:text-umber/55 disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:text-sm ${inputClassName}`.trim()}
        aria-label={controlLabel || undefined}
        {...inputProps}
      />
      <button
        type="button"
        onClick={() => changeBy(stepValue)}
        disabled={!canIncrease}
        className={`grid min-h-11 place-items-center border-l border-umber/20 bg-parchment text-ink transition hover:bg-vellum disabled:cursor-not-allowed disabled:opacity-35 ${buttonClassName}`.trim()}
        aria-label={controlLabel ? `${controlLabel} +` : "+"}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
