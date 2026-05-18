"use client";

import { Dices, RotateCcw, Smartphone, Trash2 } from "lucide-react";
import Panel from "@/components/form/Panel";
import SegmentedToggle from "@/components/form/SegmentedToggle";
import useDiceRoller from "@/hooks/useDiceRoller";
import { formatRoll, MAX_DICE_COUNT } from "@/lib/dice";

export default function DicePanel({ t }) {
  const dice = useDiceRoller();

  return (
    <Panel
      title={t("dice.title")}
      kicker={t("dice.kicker")}
      action={
        <button
          type="button"
          onClick={dice.roll}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-ink bg-oxblood px-3 font-ui text-xs font-black uppercase tracking-[0.08em] text-vellum shadow-insetLine transition hover:bg-oxblood/90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={dice.isRolling}
        >
          <RotateCcw className={`h-4 w-4 ${dice.isRolling ? "animate-spin" : ""}`} aria-hidden="true" />
          {t("dice.roll")}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <div>
            <div className="mb-2 font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("dice.typeLabel")}</div>
            <div className="grid grid-cols-5 gap-2">
              {dice.diceTypes.map((sides) => {
                const selected = dice.selectedSides === sides;
                return (
                  <button
                    key={sides}
                    type="button"
                    onClick={() => dice.setSelectedSides(sides)}
                    className={`min-h-14 rounded-md border font-ui text-sm font-black transition ${selected ? "border-oxblood bg-oxblood text-vellum" : "border-umber/30 bg-white/45 text-ink hover:bg-vellum"}`}
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
                className="grid h-11 place-items-center rounded-md border border-umber/30 bg-white/45 font-ui text-lg font-black"
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
                className="grid h-11 place-items-center rounded-md border border-umber/30 bg-white/45 font-ui text-lg font-black"
                aria-label={t("dice.increaseCount")}
              >
                +
              </button>
            </div>
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

          <div className="rounded-md border border-umber/25 bg-white/25 p-3 font-ui text-xs leading-5 text-umber">
            <Smartphone className="mr-2 inline h-4 w-4 align-[-3px]" aria-hidden="true" />
            {t("dice.shakeRollHelp")}
          </div>
        </div>

        <div className="rounded-md border border-umber/25 bg-white/25 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="font-ui text-[11px] font-black uppercase tracking-[0.12em] text-umber">{t("dice.result")}</div>
              <div className="font-display text-2xl font-bold">{dice.lastRoll ? formatRoll(dice.lastRoll) : `${dice.count}d${dice.selectedSides}`}</div>
            </div>
            <Dices className={`h-9 w-9 text-oxblood ${dice.isRolling ? "animate-bounce" : ""}`} aria-hidden="true" />
          </div>

          <div className="grid min-h-24 grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4">
            {dice.lastRoll?.rolls?.length ? dice.lastRoll.rolls.map((value, index) => (
              <div
                key={`${dice.lastRoll.id}-${index}`}
                className={`grid aspect-square place-items-center rounded-md border border-ink bg-parchment font-ui text-lg font-black shadow-insetLine ${dice.isRolling ? "animate-pulse" : ""}`}
              >
                {value}
              </div>
            )) : (
              <div className="col-span-full grid min-h-24 place-items-center rounded-md border border-dashed border-umber/35 text-sm text-umber">
                {t("dice.rollHistoryEmpty")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-umber/20 bg-white/20 p-3">
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
          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
            {dice.history.map((item) => (
              <div key={item.id} className="min-w-32 rounded-md border border-umber/20 bg-vellum/70 px-3 py-2">
                <div className="font-ui text-sm font-black">{formatRoll(item)}</div>
                <div className="mt-1 truncate font-ui text-[11px] text-umber">{item.rolls.join(", ")}</div>
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
