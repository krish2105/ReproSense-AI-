"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/i18n/config";
import { type Recognizer, speechCtor } from "@/lib/speech";

/**
 * Voice logging (build week K2): she says her note and the browser's own speech recognition turns it into text
 * (Arabic as ar-AE, English as en-US). Hidden where the browser has no speech recognition: she types instead.
 * The text goes to the same reader as a typed sentence; nothing is saved until she checks the form and saves.
 */
export function VoiceButton({ locale, onText }: { locale: Locale; onText: (text: string) => void }) {
  const t = useTranslations("log");
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);

  useEffect(() => {
    setSupported(Boolean(speechCtor()));
    return () => recRef.current?.stop();
  }, []);
  if (!supported) return null;

  const toggle = () => {
    const Ctor = speechCtor();
    if (!Ctor) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = locale === "ar" ? "ar-AE" : "en-US";
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const text = Array.from(ev.results, (r) => r[0]?.transcript ?? "").join(" ").trim();
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      setError(e?.error === "not-allowed" || e?.error === "service-not-allowed" ? t("voiceDenied") : t("voiceError"));
    };
    recRef.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={toggle} aria-pressed={listening} data-testid="voice-log">
        <Icon name="mic" size={16} /> {listening ? t("voiceStop") : t("voiceStart")}
      </Button>
      {listening && (
        <span className="xs faint" role="status">
          {t("voiceListening")}
        </span>
      )}
      {error && (
        <span className="xs" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
