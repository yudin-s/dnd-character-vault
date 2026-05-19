"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const DICE_BOX_OPTIONS = {
  assetPath: "./",
  baseScale: 92,
  framerate: 1 / 60,
  gravity_multiplier: 420,
  light_intensity: 0.74,
  shadows: true,
  sounds: false,
  strength: 1.35,
  theme_colorset: "white",
  theme_material: "plastic",
  theme_surface: "green-felt",
  theme_texture: "none"
};

const SUPPORTED_SIDES = new Set([4, 6, 8, 10, 12, 20]);

function normalizeSides(value, fallbackSides) {
  const parsed = Number(value);
  const fallback = SUPPORTED_SIDES.has(Number(fallbackSides)) ? Number(fallbackSides) : 20;
  return SUPPORTED_SIDES.has(parsed) ? parsed : fallback;
}

function normalizeFaces(faces, fallbackSides) {
  if (!Array.isArray(faces)) return [];
  return faces
    .map((face, index) => {
      const descriptor = typeof face === "number" ? { value: face } : face || {};
      return {
        key: descriptor.key || `${descriptor.groupKey || "die"}-${index}`,
        sides: normalizeSides(descriptor.sides, fallbackSides)
      };
    })
    .filter((face) => SUPPORTED_SIDES.has(face.sides));
}

function buildNotation(faces, fallbackSides) {
  const normalized = normalizeFaces(faces, fallbackSides);
  if (!normalized.length) return "";
  return normalized.map((face) => `1d${face.sides}`).join("+");
}

function extractRollValues(result) {
  if (!result || typeof result !== "object") return [];
  if (Array.isArray(result.sets)) {
    return result.sets.flatMap((set) => (
      Array.isArray(set.rolls)
        ? set.rolls.map((roll) => Number(roll?.value)).filter(Number.isFinite)
        : []
    ));
  }
  if (Array.isArray(result.rolls)) {
    return result.rolls.map((roll) => Number(roll?.value ?? roll)).filter(Number.isFinite);
  }
  return [];
}

async function loadDiceBox() {
  const module = await import("@3d-dice/dice-box-threejs/dist/dice-box-threejs.umd.js");
  return module.default || module;
}

function disposeDiceBox(box, container) {
  if (!box) return;
  box.running = false;
  box.rolling = false;
  try {
    box.clearDice?.();
  } catch {
    // The library does not expose a formal destroy method.
  }
  try {
    box.renderer?.dispose?.();
  } catch {
    // Best-effort WebGL cleanup.
  }
  while (container?.firstChild) {
    container.firstChild.remove();
  }
}

export default function ThreeDiceStage({
  faces = [],
  fallbackSides = 20,
  isRolling = false,
  rollId,
  onSettledRoll,
  emptyText = ""
}) {
  const reactId = useId();
  const containerId = useMemo(
    () => `dice-box-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId]
  );
  const containerRef = useRef(null);
  const boxRef = useRef(null);
  const initializedRef = useRef(false);
  const rollTokenRef = useRef(null);
  const onSettledRollRef = useRef(onSettledRoll);
  const [isReady, setIsReady] = useState(false);
  const [hasDice, setHasDice] = useState(false);
  const normalizedFaces = useMemo(() => normalizeFaces(faces, fallbackSides), [faces, fallbackSides]);
  const notation = useMemo(() => buildNotation(faces, fallbackSides), [faces, fallbackSides]);

  useEffect(() => {
    onSettledRollRef.current = onSettledRoll;
  }, [onSettledRoll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let cancelled = false;

    loadDiceBox()
      .then(async (DiceBox) => {
        if (cancelled || !containerRef.current) return;
        const box = new DiceBox(`#${containerId}`, {
          ...DICE_BOX_OPTIONS,
          onRollComplete: (result) => {
            const token = rollTokenRef.current;
            const values = extractRollValues(result);
            rollTokenRef.current = null;
            if (values.length) {
              setHasDice(true);
              onSettledRollRef.current?.(values, token);
            }
          }
        });
        boxRef.current = box;
        await box.initialize();
        if (cancelled) {
          disposeDiceBox(box, container);
          return;
        }
        initializedRef.current = true;
        setIsReady(true);
      })
      .catch((error) => {
        console.error("Unable to initialize dice box", error);
        setIsReady(false);
      });

    return () => {
      cancelled = true;
      initializedRef.current = false;
      disposeDiceBox(boxRef.current, container);
      boxRef.current = null;
    };
  }, [containerId]);

  useEffect(() => {
    const box = boxRef.current;
    if (!initializedRef.current || !box || !isRolling || !rollId || !notation) return;
    if (rollTokenRef.current === rollId) return;

    rollTokenRef.current = rollId;
    setHasDice(true);
    box.roll(notation).catch((error) => {
      if (rollTokenRef.current !== rollId) return;
      rollTokenRef.current = null;
      console.error("Unable to roll dice", error);
    });
  }, [isReady, isRolling, notation, rollId]);

  return (
    <div className="dice-stage">
      <span className="dice-stage__glow" aria-hidden="true" />
      <div id={containerId} ref={containerRef} className="dice-stage__canvas" aria-hidden="true" />
      {!hasDice && !normalizedFaces.length ? (
        <div className="dice-stage__empty">
          {isReady ? emptyText : "Загрузка костей..."}
        </div>
      ) : null}
    </div>
  );
}
