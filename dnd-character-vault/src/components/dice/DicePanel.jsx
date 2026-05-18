"use client";

import { Dices, RotateCcw, Smartphone, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Panel from "@/components/form/Panel";
import NumberStepper from "@/components/form/NumberStepper";
import SegmentedToggle from "@/components/form/SegmentedToggle";
import useDiceRoller from "@/hooks/useDiceRoller";
import { formatRoll, MAX_DICE_COUNT } from "@/lib/dice";

const DICE_ANIMATION_INTERVAL = 90;

function getRandomRoll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function getRollFaces(result) {
  if (!result) return [];
  if (Array.isArray(result.groups) && result.groups.length) {
    return result.groups.flatMap((group, groupIndex) => (
      group.rolls.map((value, index) => ({
        value,
        sides: group.sides,
        label: group.label,
        key: `${group.key || group.label || groupIndex}-${index}`
      }))
    ));
  }
  return (result.rolls || []).map((value, index) => ({
    value,
    sides: result.sides,
    label: result.label,
    key: `${result.id || "roll"}-${index}`
  }));
}

function getGroupRolls(group) {
  return (group.rolls || []).join(", ");
}

function DicePanelContent({
  t,
  dice,
  rollingRolls,
  isDrawer,
  showClose,
  onClose
}) {
  const displayedRolls = dice.isRolling ? rollingRolls : getRollFaces(dice.lastRoll);
  const resultText = dice.lastRoll ? formatRoll(dice.lastRoll) : `${dice.count}d${dice.selectedSides}`;
  const resultLabel = dice.rollLabel || dice.lastRoll?.label || "";
  const resultGroups = Array.isArray(dice.lastRoll?.groups) ? dice.lastRoll.groups : [];

  return (
    <Panel
      title={t("dice.title")}
      kicker={t("dice.kicker")}
      action={isDrawer && showClose ? (
        <button
          type="button"
          onClick={onClose}
          className="inline-grid h-11 w-11 place-items-center rounded-md border border-ink/70 bg-parchment text-ink shadow-insetLine transition hover:bg-vellum"
          aria-label={t("generic.close")}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      className={isDrawer
        ? "relative overflow-hidden !border-ink !bg-parchment shadow-[0_0_0_1px_rgba(140,31,36,0.28),0_26px_72px_rgba(37,24,19,0.48)]"
        : ""}
    >
      {isDrawer ? (
        <>
          <span className="pointer-events-none absolute left-4 right-4 top-3 h-px bg-oxblood/25" aria-hidden="true" />
          <span className="pointer-events-none absolute bottom-3 left-4 right-4 h-px bg-umber/25" aria-hidden="true" />
        </>
      ) : null}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4">
          <div>
            <div className="mb-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("dice.typeLabel")}</div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {dice.diceTypes.map((sides) => {
                const selected = dice.selectedSides === sides;
                return (
                  <button
                    key={sides}
                    type="button"
                    onClick={() => dice.setSelectedSides(sides)}
                    className={`min-h-14 rounded-md border font-ui text-sm font-black transition ${selected ? "border-oxblood bg-oxblood text-vellum" : "border-umber/40 bg-vellum text-ink hover:bg-parchment"}`}
                  >
                    d{sides}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_160px] sm:items-end">
            <label className="block">
              <span className="mb-2 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("dice.quantityLabel")}</span>
              <input
                type="range"
                min="1"
                max={MAX_DICE_COUNT}
                value={dice.count}
                onChange={(event) => dice.setCount(Number(event.target.value))}
                className="w-full accent-oxblood"
              />
            </label>
            <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
              <button
                type="button"
                onClick={() => dice.setCount(Math.max(1, dice.count - 1))}
                className="grid h-11 place-items-center rounded-md border border-umber/35 bg-vellum font-ui text-lg font-black"
                aria-label={t("dice.decreaseCount")}
              >
                -
              </button>
              <div className="grid h-11 place-items-center rounded-md border border-ink bg-parchment font-ui text-lg font-black">
                {dice.count}
              </div>
              <button
                type="button"
                onClick={() => dice.setCount(Math.min(MAX_DICE_COUNT, dice.count + 1))}
                className="grid h-11 place-items-center rounded-md border border-umber/35 bg-vellum font-ui text-lg font-black"
                aria-label={t("dice.increaseCount")}
              >
                +
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px] sm:items-end">
            <div className="rounded-md border border-umber/25 bg-vellum/80 px-3 py-2">
              <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("dice.result")}</div>
              <div className="mt-1 truncate font-display text-xl font-bold text-ink">
                {resultLabel || `${dice.count}d${dice.selectedSides}`}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("dice.modifier")}</span>
              <NumberStepper
                label={t("dice.modifier")}
                value={dice.modifier}
                onChange={dice.setModifier}
                signed
                className="bg-vellum"
                inputClassName="font-ui text-base font-black"
              />
            </label>
          </div>

          <SegmentedToggle
            label={t("dice.shakeRoll")}
            value={dice.shakeEnabled ? "on" : "off"}
            options={[
              { value: "off", label: t("generic.off") },
              { value: "on", label: t("generic.on") }
            ]}
            onChange={async (value) => {
              if (value === "on") {
                const permitted = await dice.requestMotionPermission?.();
                if (permitted !== false) dice.setShakeEnabled(true);
              } else {
                dice.setShakeEnabled(false);
              }
            }}
          />

          <div className="rounded-md border border-umber/30 bg-parchment p-3 font-ui text-xs leading-5 text-umber">
            <Smartphone className="mr-2 inline h-4 w-4 align-[-3px]" aria-hidden="true" />
            {t("dice.shakeRollHelp")}
          </div>
        </div>

        <div className="dice-tray order-first min-w-0 rounded-md border border-umber/35 p-4 lg:order-none">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("dice.result")}</div>
              <div className="truncate font-display text-2xl font-bold text-ink">{resultText}</div>
              {resultLabel ? (
                <div className="mt-1 max-w-44 truncate font-ui text-[11px] font-black uppercase tracking-[0.08em] text-oxblood">
                  {resultLabel}
                </div>
              ) : null}
            </div>
            <Dices className={`h-9 w-9 text-oxblood ${dice.isRolling ? "animate-bounce" : ""}`} aria-hidden="true" />
          </div>

          {resultGroups.length ? (
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              {resultGroups.map((group) => (
                <div key={group.key || group.label || group.notation} className="rounded-md border border-umber/25 bg-vellum/82 px-3 py-2 shadow-insetLine">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate font-ui text-[11px] font-black uppercase tracking-[0.08em] text-umber">
                      {group.label || group.notation}
                    </div>
                    <div className="shrink-0 font-ui text-lg font-black text-oxblood">{group.total}</div>
                  </div>
                  <div className="mt-1 truncate font-ui text-[11px] text-umber">{group.notation} / {getGroupRolls(group)}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="dice-stage">
            <span className="dice-stage__glow" aria-hidden="true" />
            {displayedRolls.length ? displayedRolls.map((value, index) => {
              const delay = (index % 5) * 0.08;
              const rotation = ((index * 31) % 46) - 23;
              const x = ((index % 4) - 1.5) * 16;
              const y = ((Math.floor(index / 4) % 3) - 1) * 12;
              return (
                <div
                  key={`${dice.lastRoll?.id || "preview"}-${value.key || index}`}
                  className={`dice-gem dice-gem--d${value.sides || dice.selectedSides} ${dice.isRolling ? "is-rolling" : "is-settled"}`}
                  style={{
                    ["--dice-delay"]: `${delay}s`,
                    ["--dice-rotation"]: `${rotation}deg`,
                    ["--dice-x"]: `${x}px`,
                    ["--dice-y"]: `${y}px`
                  }}
                >
                  <span className="dice-gem__value">{value.value ?? value}</span>
                  <span className="dice-gem__type">d{value.sides || dice.selectedSides}</span>
                </div>
              );
            }) : (
              <div className="relative z-10 grid min-h-24 place-items-center rounded-md border border-dashed border-umber/35 bg-vellum/40 px-4 text-center text-sm text-umber">
                {t("dice.rollHistoryEmpty")}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={dice.roll}
            className="dice-roll-button mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md border border-ink bg-oxblood px-4 font-ui text-sm font-black uppercase tracking-[0.1em] text-vellum shadow-insetLine transition hover:bg-oxblood/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={dice.isRolling}
          >
            <RotateCcw className={`h-5 w-5 ${dice.isRolling ? "animate-spin" : ""}`} aria-hidden="true" />
            {t("dice.roll")}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-umber/25 bg-parchment p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("dice.rollHistory")}</div>
          <button
            type="button"
            onClick={dice.clearHistory}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-oxblood/40 px-2 font-ui text-xs font-black text-oxblood hover:bg-oxblood hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("generic.clear")}
          </button>
        </div>
        {dice.history.length ? (
          <div className="scrollbar-thin flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1">
            {dice.history.map((item) => (
              <div key={item.id} className="min-w-32 rounded-md border border-umber/25 bg-vellum px-3 py-2">
                <div className="font-ui text-sm font-black">{formatRoll(item)}</div>
                <div className="mt-1 truncate font-ui text-[11px] text-umber">
                  {Array.isArray(item.groups) && item.groups.length
                    ? item.groups.map((group) => `${group.label || group.notation}: ${getGroupRolls(group)}`).join(" / ")
                    : item.rolls.join(", ")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-umber/30 px-3 py-4 text-sm text-umber">{t("dice.noRollsYet")}</div>
        )}
      </div>
    </Panel>
  );
}

export default function DicePanel({ t, isOpen, onClose, preset }) {
  const dice = useDiceRoller();
  const [rollingRolls, setRollingRolls] = useState([]);
  const timerRef = useRef(null);
  const handledPresetRef = useRef(null);
  const isDrawer = typeof isOpen === "boolean" || typeof onClose === "function";
  const hasCloseAction = typeof onClose === "function";
  const isOpenState = typeof isOpen === "boolean" ? isOpen : true;
  const { applyPreset, rollPreset } = dice;

  const closingAction = onClose || (() => {});

  useEffect(() => {
    if (!preset) return;
    if (handledPresetRef.current === preset.id) return;
    handledPresetRef.current = preset.id;
    if (preset.autoRoll) {
      rollPreset(preset);
      return;
    }
    applyPreset(preset);
  }, [preset?.id, applyPreset, preset, rollPreset]);

  useEffect(() => {
    if (!dice.isRolling) {
      setRollingRolls([]);
      return;
    }

    const activeGroups = Array.isArray(dice.rollGroups) && dice.rollGroups.length ? dice.rollGroups : null;
    const build = () => activeGroups
      ? activeGroups.flatMap((group, groupIndex) => Array.from(
          { length: Math.max(1, Number(group.count) || 1) },
          (_, index) => ({
            key: `rolling-${group.key || groupIndex}-${index}`,
            value: getRandomRoll(group.sides),
            sides: group.sides,
            label: group.label
          })
        ))
      : Array.from(
          { length: Math.max(1, dice.count) },
          (_, index) => ({
            key: `rolling-${index}`,
            value: getRandomRoll(dice.selectedSides),
            sides: dice.selectedSides
          })
        );

    setRollingRolls(build());

    timerRef.current = window.setInterval(() => {
      setRollingRolls(build());
    }, DICE_ANIMATION_INTERVAL);

    return () => {
      window.clearInterval(timerRef.current);
    };
  }, [dice.count, dice.isRolling, dice.rollGroups, dice.selectedSides]);

  useEffect(() => {
    if (!isDrawer || !isOpenState || !onClose || typeof window === "undefined") return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawer, isOpenState, onClose]);

  if (isDrawer && !isOpenState) return null;

  if (!isDrawer) {
    return (
      <DicePanelContent
        t={t}
        dice={dice}
        rollingRolls={rollingRolls}
        showClose={false}
        onClose={closingAction}
        isDrawer={false}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end p-3 pb-4 sm:items-center sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      style={{ animation: "dice-drawer-enter 220ms ease-out" }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-ink/85 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto rounded-md">
        <DicePanelContent
          t={t}
          dice={dice}
          rollingRolls={rollingRolls}
          onClose={closingAction}
          showClose={hasCloseAction}
          isDrawer={true}
        />
      </div>
    </div>
  );
}

export function DiceDrawer({ t, isOpen, onClose, preset }) {
  return <DicePanel t={t} isOpen={isOpen} onClose={onClose} preset={preset} />;
}
