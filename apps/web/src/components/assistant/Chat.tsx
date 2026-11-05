"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { AskResponse } from "@/lib/api/types";
import { parseAnswer } from "@/lib/answer";

interface Turn {
  id: string;
  q: string;
  a?: AskResponse;
  error?: string;
}

// Minimal Web Speech API types (Chrome/Safari). The mic button only renders where the API exists (rule 8).
interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface Recognizer {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognizerCtor = new () => Recognizer;
const speechCtor = (): RecognizerCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const storeKey = (persona: string) => `rs_chat_${persona}`;

/** AI Chat (mockup tAsk/msg): every answer shows its sources; urgent answers lead with 998; crisis shows support only. */
export function Chat({ suggested, persona, initialQuestion }: { suggested: string[]; persona: string; initialQuestion?: string }) {
  const t = useTranslations("assistant");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState(initialQuestion ?? "");
  const [pending, start] = useTransition();
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognizer | null>(null);
  const uid = useId().replace(/:/g, "");

  // Per-viewer convenience: keep this session's conversation when she moves between tabs.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storeKey(persona));
      if (saved) setTurns(JSON.parse(saved) as Turn[]);
    } catch {
      /* storage unavailable: start empty */
    }
    setCanSpeak(Boolean(speechCtor()));
  }, [persona]);
  useEffect(() => {
    try {
      sessionStorage.setItem(storeKey(persona), JSON.stringify(turns.filter((x) => x.a)));
    } catch {
      /* ignore */
    }
  }, [turns, persona]);

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || pending) return;
    const id = `${Date.now()}`;
    setTurns((x) => [...x, { id, q: text }]);
    setQ("");
    start(async () => {
      try {
        const a = await apiClient<AskResponse>("/assistant/ask", { body: { question: text, lang: locale } });
        setTurns((x) => x.map((turn) => (turn.id === id ? { ...turn, a } : turn)));
      } catch (e) {
        const detail = e instanceof ApiError ? e.detail : String(e);
        setTurns((x) => x.map((turn) => (turn.id === id ? { ...turn, error: detail } : turn)));
      }
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  const toggleMic = () => {
    const Ctor = speechCtor();
    if (!Ctor) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = locale === "ar" ? "ar-AE" : "en-GB";
    rec.interimResults = false;
    rec.onresult = (ev) => setQ(Array.from(ev.results, (r) => r[0]?.transcript ?? "").join(" "));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <div className="box chat" style={{ gap: 14 }}>
      <div className="cop">
        <div>
          <Image src="/images/app/copilot-avatar.png" alt="" width={40} height={40} />
          <span>
            <b>{t("title")}</b>
            <small>{t("subtitle")}</small>
          </span>
        </div>
        {turns.length > 0 && (
          <button type="button" className="link xs" onClick={() => setTurns([])}>
            {t("clear")}
          </button>
        )}
      </div>

      {turns.length === 0 && <p className="s dim">{t("intro")}</p>}

      <ol className="chat" aria-live="polite" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {turns.map((turn) => (
          <li key={turn.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p className="msg me">
              <span className="sr-only">{t("you")}: </span>
              <span dir="auto" style={{ display: "block" }}>
                {turn.q}
              </span>
            </p>
            {turn.a ? (
              <Answer a={turn.a} anchor={`${uid}-${turn.id}`} />
            ) : turn.error ? (
              <div className="msg ai" role="alert">
                <p>{t("failed", { detail: turn.error })}</p>
                <Button variant="outline" size="sm" style={{ marginTop: 8 }} onClick={() => ask(turn.q)}>
                  {t("send")}
                </Button>
              </div>
            ) : (
              <p className="msg ai" aria-busy="true">
                {t("thinking")}…
              </p>
            )}
          </li>
        ))}
      </ol>

      <div>
        <p className="label" style={{ marginBottom: 6 }}>
          {t("suggested")}
        </p>
        <div className="sugg">
          {suggested.map((s) => (
            <button key={s} type="button" dir="auto" disabled={pending} onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <form method="post" className="askbar" onSubmit={submit}>
        <label htmlFor={`${uid}-q`} className="sr-only">
          {t("inputLabel")}
        </label>
        <input id={`${uid}-q`} type="text" dir="auto" value={q} maxLength={600} placeholder={t("placeholder")} onChange={(e) => setQ(e.target.value)} />
        {canSpeak && (
          <button type="button" onClick={toggleMic} aria-pressed={listening} aria-label={listening ? t("listening") : t("mic")} title={t("mic")}>
            <Icon name="mic" size={18} />
          </button>
        )}
        <button type="submit" aria-label={t("send")} disabled={pending || !q.trim()}>
          <Icon name="send" size={18} />
        </button>
      </form>
      <p className="xs faint">{t("disclaimer")}</p>
    </div>
  );
}

function Answer({ a, anchor }: { a: AskResponse; anchor: string }) {
  const t = useTranslations("assistant");
  const ts = useTranslations("safety");
  const urgent = Boolean(a.urgent) || a.crisis;
  const parts = parseAnswer(a.answer);
  return (
    <div className={`msg ai${urgent ? " urg" : ""}`}>
      <span className="sr-only">{t("copilot")}: </span>
      <p dir="auto">
        {parts.map((p, i) =>
          p.kind === "text" ? (
            <span key={i}>{p.text}</span>
          ) : (
            <sup key={i}>
              <a href={`#${anchor}-c${p.n}`} style={{ textDecoration: "none", fontWeight: 700 }}>
                [{p.n}]
              </a>
            </sup>
          ),
        )}
      </p>
      {urgent && (
        <a className="btn btn-a btn-sm" href="tel:998" style={{ marginTop: 8 }}>
          {ts("call")}
        </a>
      )}
      {a.citations.length > 0 && (
        <ol className="cites" style={{ listStyle: "none", padding: 0 }} aria-label={t("sources")}>
          {a.citations.map((c) => (
            <li key={c.n} id={`${anchor}-c${c.n}`}>
              [{c.n}]{" "}
              <a href={c.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      )}
      {!a.grounded && a.citations.length > 0 && <p className="xs faint">{t("notGrounded")}</p>}
    </div>
  );
}
