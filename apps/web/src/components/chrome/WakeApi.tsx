"use client";

import { useEffect } from "react";

/**
 * The live API runs on a free instance that sleeps after about 15 idle minutes and takes up to a minute to wake.
 * Public pages ask it to wake once per visit, so it is ready by the time someone opens a demo person. Fire and forget:
 * no data is sent or read, and a failure changes nothing on screen.
 */
export function WakeApi() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("rs_woke")) return;
      sessionStorage.setItem("rs_woke", "1");
    } catch {
      /* storage blocked: ping anyway */
    }
    fetch("/api/v1/ping", { cache: "no-store", keepalive: true }).catch(() => undefined);
  }, []);
  return null;
}
