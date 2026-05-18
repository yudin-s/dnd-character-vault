"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DICE_TYPES, MAX_DICE_COUNT, rollDice } from "@/lib/dice";

const ANIMATION_DURATION_MS = 700;
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

export default function useDiceRoller() {
  const [selectedSides, setSelectedSidesState] = useState(DICE_TYPES[0]);
  const [count, setCountState] = useState(1);
  const [lastRoll, setLastRoll] = useState(null);
  const [history, setHistory] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [modifier, setModifierState] = useState(0);
  const [rollLabel, setRollLabel] = useState("");
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [motionSupported, setMotionSupported] = useState(false);
  const [motionPermission, setMotionPermission] = useState("unknown");
  const [mobileMode] = useState(isMobileDevice());

  const animationTimerRef = useRef(null);
  const cooldownRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    setMotionSupported(Boolean(window.DeviceMotionEvent));
  }, []);

  const executeRoll = useCallback((rollSides, rollCount, rollModifier = modifier, label = rollLabel) => {
    setIsRolling(true);
    window.clearTimeout(animationTimerRef.current);

    animationTimerRef.current = window.setTimeout(() => {
      const result = rollDice({ sides: rollSides, count: rollCount, modifier: rollModifier, label });
      setLastRoll(result);
      setHistory((current) => [result, ...current]);
      setIsRolling(false);
    }, ANIMATION_DURATION_MS);
  }, [modifier, rollLabel]);

  const roll = useCallback(() => {
    if (isRolling) return;

    executeRoll(selectedSides, count, modifier, rollLabel);
  }, [executeRoll, isRolling, selectedSides, count, modifier, rollLabel]);

  const rollPreset = useCallback((preset = {}) => {
    if (isRolling) return;
    const presetSides = clampSides(preset.sides ?? selectedSides);
    const presetCount = clampDiceCount(preset.count ?? count);
    const presetModifier = normalizeModifier(preset.modifier);
    const presetLabel = String(preset.label || "");
    setSelectedSidesState(presetSides);
    setCountState(presetCount);
    setModifierState(presetModifier);
    setRollLabel(presetLabel);
    executeRoll(presetSides, presetCount, presetModifier, presetLabel);
  }, [count, executeRoll, isRolling, selectedSides]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastRoll(null);
  }, []);

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
    executeRoll(selectedSides, count);
  }, [count, executeRoll, isRolling, selectedSides]);

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
    setSelectedSidesState(clampSides(value));
  }, []);

  const setCount = useCallback((value) => {
    setCountState(clampDiceCount(value));
  }, []);

  const setModifier = useCallback((value) => {
    setModifierState(normalizeModifier(value));
  }, []);

  const applyPreset = useCallback((preset = {}) => {
    if ("sides" in preset) setSelectedSidesState(clampSides(preset.sides));
    if ("count" in preset) setCountState(clampDiceCount(preset.count));
    if ("modifier" in preset) setModifierState(normalizeModifier(preset.modifier));
    if ("label" in preset) setRollLabel(String(preset.label || ""));
  }, []);

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
    applyPreset,
    lastRoll,
    history,
    isRolling,
    roll,
    rollPreset,
    clearHistory,
    shakeEnabled,
    setShakeEnabled,
    motionSupported,
    requestMotionPermission
  };
}
