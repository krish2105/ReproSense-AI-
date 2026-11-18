"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type PeriodicReg = ServiceWorkerRegistration & { periodicSync?: { register: (tag: string, o: { minInterval: number }) => Promise<void> } };
const PREF = "rs_reminders";
const DAY = 24 * 60 * 60 * 1000;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, v);
  } catch {
    /* private mode: the choice lasts for this visit */
  }
}

/** "Use it like an app" on her Home (A6): install (the browser's own prompt, or the iPhone's Share → Add to Home
 *  Screen), and daily log reminders that ask for notification permission only when she taps to turn them on. */
export function AppHint() {
  const t = useTranslations("pwa");
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [reminders, setReminders] = useState<"off" | "on" | "blocked" | "unsupported">("off");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    if (!("Notification" in window) || !("serviceWorker" in navigator)) setReminders("unsupported");
    else if (Notification.permission === "denied") setReminders("blocked");
    else if (Notification.permission === "granted" && read(PREF) === "on") setReminders("on");
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the browser's own mini-bar away; she installs from this box
      setInstall(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstall(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const turnOn = async () => {
    const permission = await Notification.requestPermission(); // asked only here, after her tap
    if (permission !== "granted") {
      setReminders(permission === "denied" ? "blocked" : "off");
      return;
    }
    write(PREF, "on");
    setReminders("on");
    const reg = (await navigator.serviceWorker.ready) as PeriodicReg;
    let daily = false;
    try {
      await reg.periodicSync?.register("rs-log-reminder", { minInterval: DAY });
      daily = Boolean(reg.periodicSync);
    } catch {
      daily = false;
    }
    reg.active?.postMessage("rs-remind-now"); // one now, so she sees what it looks like
    setNote(daily ? t("remindersDaily") : t("remindersOpen"));
  };
  const turnOff = () => {
    write(PREF, null);
    setReminders("off");
    setNote(null);
    navigator.serviceWorker.ready.then((reg) => (reg as PeriodicReg & { periodicSync?: { unregister?: (tag: string) => Promise<void> } }).periodicSync?.unregister?.("rs-log-reminder")).catch(() => undefined);
  };

  return (
    <section className="box" aria-labelledby="pwa-title" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 id="pwa-title" style={{ fontSize: 15 }}>
        {t("title")}
      </h2>
      {standalone ? (
        <p className="s dim">{t("installed")}</p>
      ) : install ? (
        <button
          type="button"
          className="btn btn-o btn-sm"
          style={{ alignSelf: "flex-start" }}
          onClick={async () => {
            await install.prompt();
            setInstall(null);
          }}
        >
          {t("install")}
        </button>
      ) : (
        <p className="s dim">{ios ? t("iosHint") : t("browserHint")}</p>
      )}
      {reminders !== "unsupported" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {reminders === "on" ? (
            <button type="button" className="link s" style={{ alignSelf: "flex-start" }} onClick={turnOff}>
              {t("remindersOff")}
            </button>
          ) : reminders === "blocked" ? (
            <p className="xs faint">{t("remindersBlocked")}</p>
          ) : (
            <button type="button" className="btn btn-o btn-sm" style={{ alignSelf: "flex-start" }} onClick={turnOn}>
              {t("remindersOn")}
            </button>
          )}
          <p className="xs faint" aria-live="polite">
            {note ?? t("remindersPrivacy")}
          </p>
        </div>
      )}
    </section>
  );
}
