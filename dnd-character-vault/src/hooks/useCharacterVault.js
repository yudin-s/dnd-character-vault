"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDefaultCharacter, createListItem, normalizeCharacter } from "@/lib/character";
import { adjustResourceValue, applyHitPointChange, resetResources, setDeathSave, toggleCondition, toggleEquipment, useEquipmentItem } from "@/lib/combat";
import {
  clearAllLocalData,
  downloadTextFile,
  exportBackup,
  importBackup,
  loadCharacter,
  loadHistory,
  restoreHistoryEntry,
  saveCharacter
} from "@/lib/storage";

const AUTOSAVE_DELAY_MS = 30000;

export function useCharacterVault() {
  const [character, setCharacter] = useState(() => createDefaultCharacter());
  const [history, setHistory] = useState([]);
  const [statusKey, setStatusKey] = useState("loading");
  const [notice, setNotice] = useState("");
  const [noticeKey, setNoticeKey] = useState("");
  const loaded = useRef(false);
  const saveTimer = useRef(null);
  const characterRef = useRef(character);

  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  useEffect(() => {
    const loadedCharacter = loadCharacter();
    setCharacter(loadedCharacter);
    setHistory(loadHistory());
    setStatusKey("saved");
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return undefined;
    setStatusKey("saving");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const result = saveCharacter(character, "Autosave");
      setHistory(result.history);
      setStatusKey("saved");
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(saveTimer.current);
  }, [character]);

  useEffect(() => {
    const flushAutosave = () => {
      if (!loaded.current) return;
      window.clearTimeout(saveTimer.current);
      const result = saveCharacter(characterRef.current, "Autosave");
      setHistory(result.history);
      setStatusKey("saved");
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushAutosave();
    };

    window.addEventListener("beforeunload", flushAutosave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", flushAutosave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const updatePath = useCallback((path, value) => {
    setCharacter((current) => normalizeCharacter(setByPath(current, path, value)));
  }, []);

  const updateCharacter = useCallback((updater) => {
    setCharacter((current) => {
      const draft = typeof updater === "function" ? updater(current) : updater;
      return normalizeCharacter(draft);
    });
  }, []);

  const changeHitPoints = useCallback((payload) => {
    setCharacter((current) => applyHitPointChange(current, payload));
  }, []);

  const changeResource = useCallback((index, delta) => {
    setCharacter((current) => adjustResourceValue(current, index, delta));
  }, []);

  const restResources = useCallback((restType) => {
    setCharacter((current) => resetResources(current, restType));
  }, []);

  const changeDeathSave = useCallback((type, index, value) => {
    setCharacter((current) => setDeathSave(current, type, index, value));
  }, []);

  const changeCondition = useCallback((condition) => {
    setCharacter((current) => toggleCondition(current, condition));
  }, []);

  const changeEquipment = useCallback((index) => {
    setCharacter((current) => toggleEquipment(current, index));
  }, []);

  const useEquipment = useCallback((index) => {
    setCharacter((current) => useEquipmentItem(current, index));
  }, []);

  const addItem = useCallback((listName) => {
    setCharacter((current) => {
      const next = structuredClone(current);
      if (listName === "attacks") next.attacks.push(createListItem("attacks"));
      if (listName === "resources") next.resources.push(createListItem("resources"));
      if (listName === "spells") next.spells.known.push(createListItem("spells"));
      return normalizeCharacter(next);
    });
  }, []);

  const removeItem = useCallback((path, id) => {
    setCharacter((current) => {
      const next = structuredClone(current);
      const list = getByPath(next, path);
      if (Array.isArray(list)) {
        const index = list.findIndex((item) => item.id === id);
        if (index >= 0) list.splice(index, 1);
      }
      return normalizeCharacter(next);
    });
  }, []);

  const manualSnapshot = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    const result = saveCharacter(character, "Manual snapshot");
    setHistory(result.history);
    setStatusKey("snapshot");
    setNoticeKey("generic.notice.snapshotSaved");
    setNotice("");
  }, [character]);

  const restoreSnapshot = useCallback((id) => {
    const restored = restoreHistoryEntry(id);
    if (!restored) return;
    window.clearTimeout(saveTimer.current);
    setCharacter(restored);
    const result = saveCharacter(restored, "Restored snapshot");
    setHistory(result.history);
    setNoticeKey("generic.status.restoredSnapshot");
    setNotice("");
  }, []);

  const exportFile = useCallback(() => {
    const text = exportBackup(character, history);
    const filename = `${slugify(character.identity.name || "character")}-backup.json`;
    downloadTextFile(filename, text);
    setNoticeKey("generic.notice.exported");
    setNotice("");
  }, [character, history]);

  const importFile = useCallback(async (file) => {
    const text = await file.text();
    const result = importBackup(text);
    window.clearTimeout(saveTimer.current);
    setCharacter(result.character);
    setHistory(loadHistory());
    setNotice(result.warnings.length ? result.warnings.join(" ") : "");
    setNoticeKey(result.warnings.length ? "" : "generic.notice.imported");
  }, []);

  const newCharacter = useCallback(() => {
    const blank = createDefaultCharacter();
    window.clearTimeout(saveTimer.current);
    setCharacter(blank);
    const result = saveCharacter(blank, "New character");
    setHistory(result.history);
    setNoticeKey("generic.notice.blankCreated");
    setNotice("");
  }, []);

  const clearLocal = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    clearAllLocalData();
    const blank = createDefaultCharacter();
    setCharacter(blank);
    setHistory([]);
    setStatusKey("cleared");
    setNoticeKey("generic.notice.localDataCleared");
    setNotice("");
  }, []);

  const api = useMemo(() => ({
    character,
    history,
    statusKey,
    notice,
    noticeKey,
    setNotice,
    setNoticeKey,
    updatePath,
    updateCharacter,
    changeHitPoints,
    changeResource,
    restResources,
    changeDeathSave,
    changeCondition,
    changeEquipment,
    useEquipment,
    addItem,
    removeItem,
    manualSnapshot,
    restoreSnapshot,
    exportFile,
    importFile,
    newCharacter,
    clearLocal
  }), [
    character,
    history,
    statusKey,
    notice,
    noticeKey,
    updatePath,
    updateCharacter,
    changeHitPoints,
    changeResource,
    restResources,
    changeDeathSave,
    changeCondition,
    changeEquipment,
    useEquipment,
    addItem,
    removeItem,
    manualSnapshot,
    restoreSnapshot,
    exportFile,
    importFile,
    newCharacter,
    clearLocal
  ]);

  return api;
}

function setByPath(root, path, value) {
  const next = structuredClone(root);
  const parts = path.split(".");
  let cursor = next;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (cursor[key] == null || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
  return next;
}

function getByPath(root, path) {
  return path.split(".").reduce((value, key) => value?.[key], root);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "character";
}
