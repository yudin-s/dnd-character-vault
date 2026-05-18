"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DICE_TYPES, MAX_DICE_COUNT, rollCompositeDice, rollDice } from "@/lib/dice";

const ANIMATION_FALLBACK_MS = 2600;
const SHAKE_THRESHOLD = 18;
const SHAKE_COOLDOWN_MS = 900;

function clampSides(value) {
  const normalized = Number(value);
  const sides = DICE_TYPES.includes(normalized)
    ? normalized
    : DICE_TYPES.reduce((best, current) => {
        const bestDiff = Math.abs(best - normalized);
        const currentDiff = Math.abs(current - normalized);
        return currentDiff < bestDiff ? current : best;
      }, DICE_TYPES[0]);
  return sides;
}

function clampDiceCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  const rounded = Math.round(parsed);
  if (rounded < 1) return 1;
  if (rounded > MAX_DICE_COUNT) return MAX_DICE_COUNT;
  return rounded;
}

function normalizeModifier(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /Mobi|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent)
  );
}

function normalizeResultStatus(status) {
  if (status === "granted" || status === "denied" || status === "restricted" || status === "prompt") {
    return status;
  }
  return "unknown";
}

function normalizeResolvedValue(value, sides) {
  const parsed = Number(value);
  const clampedSides = clampSides(sides);
  if (!Number.isFinite(parsed)) return 1;
  const normalized = Math.max(1, Math.min(clampedSides, Math.round(parsed)));
  return normalized;
}

function rebuildRollFromResolved(result, resolvedValues) {
  if (!result || !Array.isArray(resolvedValues)) return null;
  const values = resolvedValues.map((value) => Number(value)).filter((value) => Number.isFinite(value));

  if (Array.isArray(result.groups) && result.groups.length) {
    let cursor = 0;
    let allResolved = true;
    const restoredGroups = result.groups.map((group) => {
      const count = Math.max(1, Number(group.count) || 1);
      const groupValues = [];
      for (let index = 0; index < count; index += 1) {
        if (cursor >= values.length) {
          allResolved = false;
          break;
        }
        groupValues.push(normalizeResolvedValue(values[cursor], group.sides));
        cursor += 1;
      }
      const diceTotal = groupValues.reduce((sum, value) => sum + value, 0);
      const modifier = normalizeModifier(group.modifier);
      return {
        ...group,
        rolls: groupValues,
        diceTotal,
        total: diceTotal + modifier
      };
    });

    if (!allResolved || cursor !== values.length) return null;

    return {
      ...result,
      groups: restoredGroups,
      rolls: restoredGroups.flatMap((group) => group.rolls),
      diceTotal: restoredGroups.reduce((sum, group) => sum + group.diceTotal, 0),
      total: restoredGroups.reduce((sum, group) => sum + group.total, 0)
    };
  }

  if (values.length !== result.count) return null;
  const rolls = values.map((value) => normalizeResolvedValue(value, result.sides));
  const diceTotal = rolls.reduce((sum, value) => sum + value, 0);

  return {
    ...result,
    rolls,
    diceTotal,
    total: diceTotal + normalizeModifier(result.modifier)
  };
}

export default function useDiceRoller() {
  const [selectedSides, setSelectedSidesState] = useState(DICE_TYPES[0]);
  const [count, setCountState] = useState(1);
  const [lastRoll, setLastRoll] = useState(null);
  const [pendingRoll, setPendingRoll] = useState(null);
  const [history, setHistory] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [modifier, setModifierState] = useState(0);
  const [rollLabel, setRollLabel] = useState("");
  const [rollGroups, setRollGroups] = useState(null);
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [motionSupported, setMotionSupported] = useState(false);
  const [motionPermission, setMotionPermission] = useState("unknown");
  const [mobileMode] = useState(isMobileDevice());

  const animationTimerRef = useRef(null);
  const cooldownRef = useRef(0);
  const pendingRollRef = useRef(null);
  const rollTokenRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    setMotionSupported(Boolean(window.DeviceMotionEvent));
  }, []);

  const executeRoll = useCallback((rollSides, rollCount, rollModifier = modifier, label = rollLabel) => {
    const result = rollDice({ sides: rollSides, count: rollCount, modifier: rollModifier, label });
    setPendingRoll(result);
    pendingRollRef.current = result;
    rollTokenRef.current = result.id;
    setIsRolling(true);
    window.clearTimeout(animationTimerRef.current);

    animationTimerRef.current = window.setTimeout(() => {
      const finalRoll = pendingRollRef.current || result;
      setLastRoll(finalRoll);
      setHistory((current) => [finalRoll, ...current]);
      setPendingRoll(null);
      pendingRollRef.current = null;
      rollTokenRef.current = null;
      setIsRolling(false);
    }, ANIMATION_FALLBACK_MS);
  }, [modifier, rollLabel]);

  const executeCompositeRoll = useCallback((groups = [], label = rollLabel) => {
    if (!groups.length) return;
    const result = rollCompositeDice({ label, groups });
    setPendingRoll(result);
    pendingRollRef.current = result;
    rollTokenRef.current = result.id;
    setIsRolling(true);
    window.clearTimeout(animationTimerRef.current);

    animationTimerRef.current = window.setTimeout(() => {
      const finalRoll = pendingRollRef.current || result;
      setLastRoll(finalRoll);
      setHistory((current) => [finalRoll, ...current]);
      setPendingRoll(null);
      pendingRollRef.current = null;
      rollTokenRef.current = null;
      setIsRolling(false);
    }, ANIMATION_FALLBACK_MS);
  }, [rollLabel]);

  const applySettledRoll = useCallback((resolvedValues, rollToken) => {
    if (!Array.isArray(resolvedValues) || !resolvedValues.length) return;
    if (rollToken && rollToken !== rollTokenRef.current) return;
    const base = pendingRollRef.current;
    if (!base) return;
    const rebuilt = rebuildRollFromResolved(base, resolvedValues);
    if (!rebuilt) return;
    pendingRollRef.current = rebuilt;
    rollTokenRef.current = null;
    window.clearTimeout(animationTimerRef.current);
    setPendingRoll(null);
    setLastRoll(rebuilt);
    setHistory((current) => [rebuilt, ...current]);
    setIsRolling(false);
  }, []);

  const roll = useCallback(() => {
    if (isRolling) return;
    if (Array.isArray(rollGroups) && rollGroups.length) {
      executeCompositeRoll(rollGroups, rollLabel);
      return;
    }

    executeRoll(selectedSides, count, modifier, rollLabel);
  }, [count, executeCompositeRoll, executeRoll, isRolling, modifier, rollGroups, rollLabel, selectedSides]);

  const rollPreset = useCallback((preset = {}) => {
    if (isRolling) return;
    if (Array.isArray(preset.groups) && preset.groups.length) {
      const firstGroup = preset.groups[0];
      const presetLabel = String(preset.label || "");
      setSelectedSidesState(clampSides(firstGroup.sides ?? selectedSides));
      setCountState(clampDiceCount(firstGroup.count ?? count));
      setModifierState(normalizeModifier(firstGroup.modifier));
      setRollLabel(presetLabel);
      setRollGroups(preset.groups);
      executeCompositeRoll(preset.groups, presetLabel);
      return;
    }
    const presetSides = clampSides(preset.sides ?? selectedSides);
    const presetCount = clampDiceCount(preset.count ?? count);
    const presetModifier = normalizeModifier(preset.modifier);
    const presetLabel = String(preset.label || "");
    setSelectedSidesState(presetSides);
    setCountState(presetCount);
    setModifierState(presetModifier);
    setRollLabel(presetLabel);
    setRollGroups(null);
    executeRoll(presetSides, presetCount, presetModifier, presetLabel);
  }, [count, executeCompositeRoll, executeRoll, isRolling, selectedSides]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastRoll(null);
    setPendingRoll(null);
    pendingRollRef.current = null;
    rollTokenRef.current = null;
  }, []);

  useEffect(() => {
    pendingRollRef.current = pendingRoll;
  }, [pendingRoll]);

  const requestMotionPermission = useCallback(async () => {
    if (typeof window === "undefined") return false;
    const motionEvent = window.DeviceMotionEvent;
    if (!motionEvent) return false;

    if (typeof motionEvent.requestPermission !== "function") {
      setMotionPermission("granted");
      return true;
    }

    try {
      const status = await motionEvent.requestPermission();
      const normalized = normalizeResultStatus(status);
      setMotionPermission(normalized);
      return normalized === "granted";
    } catch {
      setMotionPermission("denied");
      return false;
    }
  }, []);

  const triggerShakeRoll = useCallback(() => {
    const now = performance.now();
    if (now - cooldownRef.current < SHAKE_COOLDOWN_MS) return;
    if (isRolling) return;

    cooldownRef.current = now;
    if (Array.isArray(rollGroups) && rollGroups.length) {
      executeCompositeRoll(rollGroups, rollLabel);
      return;
    }
    executeRoll(selectedSides, count);
  }, [count, executeCompositeRoll, executeRoll, isRolling, rollGroups, rollLabel, selectedSides]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!mobileMode || !shakeEnabled || !motionSupported) return undefined;

    const needsPermission =
      typeof window.DeviceMotionEvent?.requestPermission === "function" && motionPermission !== "granted";
    if (needsPermission) return undefined;

    const onMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity || event.acceleration || {};
      const x = Number(acceleration.x) || 0;
      const y = Number(acceleration.y) || 0;
      const z = Number(acceleration.z) || 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude >= SHAKE_THRESHOLD) {
        triggerShakeRoll();
      }
    };

    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [mobileMode, shakeEnabled, motionPermission, motionSupported, triggerShakeRoll]);

  useEffect(() => {
    return () => {
      window.clearTimeout(animationTimerRef.current);
    };
  }, []);

  const setSelectedSides = useCallback((value) => {
    setRollGroups(null);
    setSelectedSidesState(clampSides(value));
  }, []);

  const setCount = useCallback((value) => {
    setRollGroups(null);
    setCountState(clampDiceCount(value));
  }, []);

  const setModifier = useCallback((value) => {
    setRollGroups(null);
    setModifierState(normalizeModifier(value));
  }, []);

  const applyPreset = useCallback((preset = {}) => {
    if (Array.isArray(preset.groups) && preset.groups.length) {
      const firstGroup = preset.groups[0];
      setSelectedSidesState(clampSides(firstGroup.sides ?? selectedSides));
      setCountState(clampDiceCount(firstGroup.count ?? count));
      setModifierState(normalizeModifier(firstGroup.modifier));
      setRollLabel(String(preset.label || ""));
      setRollGroups(preset.groups);
      return;
    }
    if ("sides" in preset) setSelectedSidesState(clampSides(preset.sides));
    if ("count" in preset) setCountState(clampDiceCount(preset.count));
    if ("modifier" in preset) setModifierState(normalizeModifier(preset.modifier));
    if ("label" in preset) setRollLabel(String(preset.label || ""));
    setRollGroups(null);
  }, [count, selectedSides]);

  return {
    diceTypes: DICE_TYPES,
    selectedSides,
    setSelectedSides,
    count,
    setCount,
    modifier,
    setModifier,
    rollLabel,
    setRollLabel,
    rollGroups,
    applyPreset,
    lastRoll,
    pendingRoll,
    history,
    isRolling,
    roll,
    rollPreset,
    applySettledRoll,
    clearHistory,
    shakeEnabled,
    setShakeEnabled,
    motionSupported,
    requestMotionPermission
  };
}
