"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { pickVoice } from "@/lib/readAloud";

type State = "idle" | "playing" | "paused";

/** "Read aloud" (A5): the browser's own speech synthesis reads the given text in the app's language (an Arabic voice
 *  in Arabic, English otherwise). Hidden when the browser has no voice for that language. Nothing leaves the device.
 *  Only one item speaks at a time: starting one stops any other. */
export function ReadAloud({ text, what }: { text: string; what: string }) {
  const t = useTranslations("chrome.read");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [state, setState] = useState<State>("idle");
  const mine = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const load = () => setVoice(pickVoice(synth.getVoices(), locale) ?? null);
    load();
    synth.addEventListener("voiceschanged", load);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      if (mine.current && (synth.speaking || synth.pending)) synth.cancel();
    };
  }, [locale]);

  if (!voice || !text) return null;
  const synth = window.speechSynthesis;

  const play = () => {
    if (state === "paused") {
      synth.resume();
      setState("playing");
      return;
    }
    synth.cancel(); // one voice at a time across the page
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.95;
    u.onend = u.onerror = () => {
      if (mine.current === u) setState("idle");
    };
    mine.current = u;
    synth.speak(u);
    setState("playing");
  };
  const pause = () => {
    synth.pause();
    setState("paused");
  };
  const stop = () => {
    synth.cancel();
    setState("idle");
  };

  return (
    <span className="read" role="group" aria-label={t("group", { what })}>
      {state === "playing" ? (
        <button type="button" className="link xs" onClick={pause}>
          {t("pause")}
        </button>
      ) : (
        <button type="button" className="link xs" onClick={play}>
          {state === "paused" ? t("resume") : t("play")}
        </button>
      )}
      {state !== "idle" && (
        <button type="button" className="link xs" onClick={stop}>
          {t("stop")}
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {state === "playing" ? t("playing") : state === "paused" ? t("paused") : ""}
      </span>
    </span>
  );
}
