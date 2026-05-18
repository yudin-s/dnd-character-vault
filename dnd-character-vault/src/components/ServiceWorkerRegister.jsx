"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return undefined;
    }

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${basePath}/sw.js`;
    const scope = `${basePath}/`;

    const register = () => {
      navigator.serviceWorker.register(swUrl, { scope }).catch(() => {});
    };

    window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
