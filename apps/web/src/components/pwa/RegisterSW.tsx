"use client";

import { useEffect } from "react";

/** Registers the service worker (A6) in production builds only, so `next dev` never serves stale code. */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined); // the app works the same without it
  }, []);
  return null;
}
