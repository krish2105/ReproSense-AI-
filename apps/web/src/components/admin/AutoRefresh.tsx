"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Re-reads the server data every 10 s so the network figures move live when a clinician closes a follow-up. */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [at, setAt] = useState<string>("");
  useEffect(() => {
    const stamp = () => setAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    stamp();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
        stamp();
      }
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return (
    <span className="xs faint" aria-live="off">
      {at ? t("refreshed", { time: at }) : " "}
    </span>
  );
}
