"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// The refresh is not her activity: a short-lived cookie tells the API not to move the staff session's idle clock, so an
// unattended dashboard still signs out after 30 minutes. Any click or key clears it at once (apiServer, rs_bg).
const BACKGROUND = "rs_bg";
const markBackground = (on: boolean) => {
  document.cookie = `${BACKGROUND}=${on ? "1" : ""}; path=/; max-age=${on ? 8 : 0}; samesite=lax`;
};

/** Re-reads the server data every 10 s so the network figures move live when a clinician closes a follow-up. */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [at, setAt] = useState<string>("");
  useEffect(() => {
    const stamp = () => setAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    stamp();
    const active = () => markBackground(false);
    window.addEventListener("pointerdown", active, true);
    window.addEventListener("keydown", active, true);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        markBackground(true);
        router.refresh();
        stamp();
      }
    }, seconds * 1000);
    return () => {
      clearInterval(id);
      window.removeEventListener("pointerdown", active, true);
      window.removeEventListener("keydown", active, true);
      markBackground(false);
    };
  }, [router, seconds]);
  return (
    <span className="xs faint" aria-live="off">
      {at ? t("refreshed", { time: at }) : " "}
    </span>
  );
}
