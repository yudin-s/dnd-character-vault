import { SCHEMA_VERSION, deepClone, normalizeCharacter, summarizeCharacter } from "./character";

export const STORAGE_KEY = "dnd-character-vault:character:v2";
export const HISTORY_KEY = "dnd-character-vault:history:v2";
export const MAX_HISTORY = 50;

export function loadCharacter() {
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return normalizeCharacter();
  const parsed = parseJson(raw);
  return parsed.ok ? normalizeCharacter(parsed.value) : normalizeCharacter();
}

export function saveCharacter(character, reason = "Autosave") {
  const normalized = normalizeCharacter(character);
  const previousRaw = readStorage(STORAGE_KEY);
  const serialized = JSON.stringify(normalized);
  const changed = previousRaw !== serialized;
  const history = loadHistory();
  const now = Date.now();

  if (changed) {
    history.unshift({
      id: createHistoryId(),
      timestamp: now,
      reason,
      summary: summarizeCharacter(normalized),
      character: deepClone(normalized)
    });
  }

  writeStorage(STORAGE_KEY, serialized);
  writeStorage(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));

  return {
    character: deepClone(normalized),
    history: history.slice(0, MAX_HISTORY),
    changed,
    timestamp: now
  };
}

export function loadHistory() {
  const raw = readStorage(HISTORY_KEY);
  if (!raw) return [];
  const parsed = parseJson(raw);
  if (!parsed.ok || !Array.isArray(parsed.value)) return [];
  return parsed.value.map(normalizeHistoryEntry).filter(Boolean).slice(0, MAX_HISTORY);
}

export function restoreHistoryEntry(id) {
  const entry = loadHistory().find((item) => item.id === id);
  return entry ? deepClone(entry.character) : null;
}

export function clearAllLocalData() {
  removeStorage(STORAGE_KEY);
  removeStorage(HISTORY_KEY);
}

export function exportBackup(character, history = loadHistory()) {
  return JSON.stringify({
    app: "5e-character-vault",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    character: normalizeCharacter(character),
    history: Array.isArray(history) ? history.map(normalizeHistoryEntry).filter(Boolean) : []
  }, null, 2);
}

export function importBackup(jsonText) {
  const parsed = parseJson(String(jsonText || ""));
  const warnings = [];

  if (!parsed.ok) {
    throw new Error("Backup file is not valid JSON.");
  }

  const payload = parsed.value;
  const hasWrapper = payload && typeof payload === "object" && "character" in payload;
  const character = normalizeCharacter(hasWrapper ? payload.character : payload);
  const importedHistory = hasWrapper && Array.isArray(payload.history)
    ? payload.history.map(normalizeHistoryEntry).filter(Boolean).slice(0, MAX_HISTORY)
    : [];

  if (hasWrapper && payload.history && !Array.isArray(payload.history)) {
    warnings.push("History in this backup was skipped because it is malformed.");
  }

  if (!hasWrapper) {
    warnings.push("Imported a raw character file without history.");
  }

  if (importedHistory.length) {
    writeStorage(HISTORY_KEY, JSON.stringify(importedHistory));
  }

  writeStorage(STORAGE_KEY, JSON.stringify(character));

  return {
    character,
    historyImported: importedHistory.length,
    warnings
  };
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "character-backup.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const character = normalizeCharacter(entry.character);
  return {
    id: typeof entry.id === "string" ? entry.id : createHistoryId(),
    timestamp: Number.isFinite(Number(entry.timestamp)) ? Number(entry.timestamp) : Date.now(),
    reason: typeof entry.reason === "string" ? entry.reason : "Saved",
    summary: entry.summary && typeof entry.summary === "object"
      ? entry.summary
      : summarizeCharacter(character),
    character
  };
}

function createHistoryId() {
  return `history-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error };
  }
}

function readStorage(key) {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function removeStorage(key) {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}
