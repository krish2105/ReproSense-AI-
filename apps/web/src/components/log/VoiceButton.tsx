"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/i18n/config";

/** The parts of the Web Speech API this button uses (not in TypeScript's DOM types yet). */
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Voice logging (build week K2): the browser turns her speech into text in the app's language (ar-AE or en-US).
 * The text is handed to `onText`, which fills the form through POST /v1/logs/parse; she still checks and saves.
 * Hidden where the browser has no speech recognition, so typing always works.
 */
export function VoiceButton({ locale, onText }: { locale: Locale; onText: (text: string) => void }) {
  const t = useTranslations("log");
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const finalText = useRef("");

  useEffect(() => {
    setSupported(recognitionCtor() !== null);
    return () => rec.current?.stop();
  }, []);

  if (!supported) return null;

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = locale === "ar" ? "ar-AE" : "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    finalText.current = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) finalText.current += res[0]!.transcript;
        else interim += res[0]!.transcript;
      }
      setHeard((finalText.current + interim).trim());
    };
    r.onerror = (e) => setProblem(e.error === "not-allowed" || e.error === "service-not-allowed" ? t("voiceBlocked") : t("voiceError"));
    r.onend = () => {
      setListening(false);
      const text = finalText.current.trim();
      if (text) onText(text);
    };
    setProblem(null);
    setHeard("");
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setProblem(t("voiceError"));
    }
  };

  return (
    <div className="voice" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Button variant={listening ? "primary" : "outline"} size="sm" aria-pressed={listening} onClick={listening ? () => rec.current?.stop() : start}>
        <Icon name="mic" size={18} />
        {listening ? t("voiceStop") : t("voiceStart")}
      </Button>
      <p className="xs faint" role="status" aria-live="polite" dir="auto">
        {problem ?? (listening ? heard || t("voiceListening") : heard ? t("voiceHeard", { text: heard }) : t("voiceNote"))}
      </p>
    </div>
  );
}
