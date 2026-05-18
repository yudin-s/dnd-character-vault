"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { DEFAULT_LOCALE, normalizeLocale, translate } from "@/lib/i18n";

const LOCALE_STORAGE_KEY = "dnd-character-vault:locale";

function getBrowserLocale() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return DEFAULT_LOCALE;

  const language = navigator.language || (Array.isArray(navigator.languages) ? navigator.languages[0] : "") || "";
  return normalizeLocale(language);
}

function readStoredLocale() {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored ? normalizeLocale(stored) : null;
    } catch {
      return null;
    }
}

export function useLocale() {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const nextLocale = readStoredLocale() || getBrowserLocale();
    setLocaleState(nextLocale);
  }, []);

  const setLocale = useCallback((nextLocale) => {
    const normalized = normalizeLocale(nextLocale);

    setLocaleState(normalized);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
    } catch {
      // ignore storage errors
    }
  }, []);

  const t = useCallback((key, values) => translate(locale, key, values), [locale]);

  return useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
}

export default useLocale;
