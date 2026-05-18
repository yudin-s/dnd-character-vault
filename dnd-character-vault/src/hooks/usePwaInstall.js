"use client";

import { useCallback, useEffect, useState } from "react";

function isDisplayStandalone() {
  if (typeof window === "undefined") return false;

  const mediaMode = window.matchMedia("(display-mode: standalone)").matches;
  const iosMode = Boolean(window.navigator?.standalone);

  return mediaMode || iosMode;
}

export default function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(isDisplayStandalone());
  const [canInstall, setCanInstall] = useState(false);

  const updateStandalone = useCallback(() => {
    const nextStandalone = isDisplayStandalone();
    setIsStandalone(nextStandalone);
    if (nextStandalone) setCanInstall(false);
  }, []);

  useEffect(() => {
    updateStandalone();
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener?.("change", updateStandalone);

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (isDisplayStandalone()) return;
      setPromptEvent(event);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setCanInstall(false);
      setPromptEvent(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      mediaQuery.removeEventListener?.("change", updateStandalone);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [updateStandalone]);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return null;

    const event = promptEvent;
    let choiceResult = null;

    try {
      await event.prompt();
      choiceResult = await event.userChoice;
      return choiceResult;
    } finally {
      setPromptEvent(null);
      setCanInstall(false);
      if (choiceResult?.outcome === "accepted") setIsStandalone(true);
    }
  }, [promptEvent]);

  return {
    canInstall,
    isStandalone,
    promptInstall,
  };
}
