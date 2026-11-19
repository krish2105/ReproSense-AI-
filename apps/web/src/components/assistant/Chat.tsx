"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { AskResponse, Citation, Evidence, NavigatorDecision, NextStepItem } from "@/lib/api/types";
import { parseAnswer } from "@/lib/answer";
import { ReadAloud } from "@/components/ui/ReadAloud";
import { answerText } from "@/lib/readAloud";

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
  const ts = useTranslations("safety");
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
        const detail = e instanceof ApiError ? (e.detail === "ai_off" ? t("offBody") : e.detail) : String(e);
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

      {/* Safety by design: the 998 route never depends on the assistant recognising a message (it can miss things). */}
      <div className="safety-strip" role="note">
        <span className="s">{t("safetyLine")}</span>
        <a className="btn btn-o btn-sm" href="tel:998">
          {ts("call")}
        </a>
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
  if (a.lane === "record" && a.record) return <RecordAnswer a={a} anchor={anchor} />;
  if (a.lane === "next_step" && a.next_steps) return <NextSteps a={a} anchor={anchor} />;
  return <KnowledgeAnswer a={a} anchor={anchor} />;
}

/** Numbered sources under an answer; each [n] in the text points here. */
function Cites({ citations, anchor }: { citations: Citation[]; anchor: string }) {
  const t = useTranslations("assistant");
  if (!citations.length) return null;
  return (
    <ol className="cites" style={{ listStyle: "none", padding: 0 }} aria-label={t("sources")}>
      {citations.map((c) => (
        <li key={c.n} id={`${anchor}-c${c.n}`}>
          [{c.n}]{" "}
          <a href={c.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
            {c.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Dated chips for the entries behind a line; each opens that day in her calendar. */
function EntryChips({ evidence, total, label }: { evidence: Evidence[]; total?: number; label: string }) {
  const t = useTranslations("assistant");
  if (!evidence.length) return null;
  const more = (total ?? evidence.length) - evidence.length;
  return (
    <ul className="chips" aria-label={label} style={{ listStyle: "none", padding: 0, margin: "6px 0 0" }}>
      {evidence.map((e, i) => (
        <li key={`${e.entry_id}-${i}`}>
          <Link className="ev" href={`/app/log?date=${e.date.slice(0, 10)}`} dir="auto" style={{ display: "inline-block", textDecoration: "none", color: "inherit" }}>
            {e.text}
          </Link>
        </li>
      ))}
      {more > 0 && (
        <li className="ev ev-more" style={{ cursor: "default" }}>
          {t("moreEntries", { n: more })}
        </li>
      )}
    </ul>
  );
}

/** Lane (b): her own numbers, counted by code from her entries ("the model narrates, code computes"). */
function RecordAnswer({ a, anchor }: { a: AskResponse; anchor: string }) {
  const t = useTranslations("assistant");
  const rec = a.record!;
  return (
    <div className="msg ai rec">
      <span className="sr-only">{t("copilot")}: </span>
      <p className="rec-label">
        <Icon name="calendar" size={14} /> {t("fromEntries")}
      </p>
      {rec.lines.map((line, i) => (
        <div key={i}>
          <p dir="auto">{line.text}</p>
          <EntryChips evidence={line.evidence} total={line.evidence_total} label={t("entriesLabel")} />
        </div>
      ))}
      <Cites citations={a.citations} anchor={anchor} />
      <p className="xs faint">{rec.written_by === "code" ? t("recordCode") : t("recordReworded")}</p>
      <ReadAloud text={answerText(a, t("sources"))} what={t("copilot")} />
    </div>
  );
}

/** Lane (c): red flags first, then patterns and care steps, each with a draft she approves. Nothing is sent. */
function NextSteps({ a, anchor }: { a: AskResponse; anchor: string }) {
  const t = useTranslations("assistant");
  const ts = useTranslations("safety");
  const urgent = Boolean(a.urgent) || a.crisis;
  return (
    <div className={`msg ai rec wide${urgent ? " urg" : ""}`}>
      <span className="sr-only">{t("copilot")}: </span>
      <p className="rec-label">
        <Icon name="calendar" size={14} /> {t("nextLabel")}
      </p>
      <p dir="auto">{a.lead ?? a.answer}</p>
      {urgent && (
        <a className="btn btn-a btn-sm" href="tel:998" style={{ marginTop: 8, alignSelf: "flex-start" }}>
          {ts("call")}
        </a>
      )}
      {a.next_steps!.length > 0 && (
        <ol className="plain next-list">
          {a.next_steps!.map((item) => (
            <li key={item.id}>
              <NextStep item={item} anchor={`${anchor}-${item.id.replace(/[^a-zA-Z0-9_-]/g, "")}`} />
            </li>
          ))}
        </ol>
      )}
      <Cites citations={a.citations} anchor={anchor} />
      <p className="xs faint">{t("nextDraftOnly")}</p>
    </div>
  );
}

const KIND_TONE = { red_flag: "urgent", pattern: "discuss", care_step: "soon", postnatal_step: "soon" } as const;

function NextStep({ item, anchor }: { item: NextStepItem; anchor: string }) {
  const t = useTranslations("assistant");
  const tn = useTranslations("navigator");
  const toast = useToast();
  const [status, setStatus] = useState(item.draft?.status ?? null);
  const [pending, start] = useTransition();
  const draft = item.draft;
  const decide = (action: "approve" | "discard") =>
    start(async () => {
      if (!draft) return;
      try {
        const res = await apiClient<NavigatorDecision>(`/navigator/drafts/${draft.id}/${action}`, { method: "POST" });
        setStatus(res.status);
        toast(action === "approve" ? tn("approvedState") : tn("discarded"));
      } catch (e) {
        toast(t("decideFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      }
    });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft?.message ?? "");
      toast(tn("copied"));
    } catch {
      toast(t("decideFailed", { detail: "clipboard" }));
    }
  };
  return (
    <article className="next-item" aria-labelledby={`${anchor}-t`}>
      <span style={{ alignSelf: "flex-start" }}>
        <Tag tone={KIND_TONE[item.kind]}>{t(`nextKinds.${item.kind}`)}</Tag>
      </span>
      <h3 id={`${anchor}-t`} dir="auto" style={{ fontSize: 15 }}>
        {item.title}
      </h3>
      <p dir="auto">{item.text}</p>
      <EntryChips evidence={item.evidence} label={t("entriesLabel")} />
      {item.questions.length > 0 && (
        <>
          <p className="label">{t("nextQuestions")}</p>
          <ul className="plain">
            {item.questions.map((q) => (
              <li key={q} dir="auto">
                {q}
              </li>
            ))}
          </ul>
        </>
      )}
      {draft && status !== "discarded" && (
        <div className="doc">
          <h4>{t("nextDraft")}</h4>
          <p dir="auto">{draft.to}</p>
          <p dir="auto">{draft.message}</p>
          <span style={{ alignSelf: "flex-start" }}>
            <Tag tone={status === "approved" ? "ok" : "soon"}>{tn(`status.${status ?? "draft"}`)}</Tag>
          </span>
        </div>
      )}
      {draft && status === "draft" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button size="sm" pending={pending} onClick={() => decide("approve")}>
            {tn("approve")}
          </Button>
          <Button variant="outline" size="sm" disabled={pending} onClick={() => decide("discard")}>
            {tn("discard")}
          </Button>
        </div>
      )}
      {draft && status === "approved" && (
        <>
          <p className="notice" role="status">
            {tn("approved")}
          </p>
          <Button variant="outline" size="sm" style={{ alignSelf: "flex-start" }} onClick={copy}>
            {tn("copy")}
          </Button>
        </>
      )}
      {draft && status === "discarded" && (
        <p className="xs faint" role="status">
          {tn("discarded")}
        </p>
      )}
      <SourceLinks sources={item.sources} />
    </article>
  );
}

function KnowledgeAnswer({ a, anchor }: { a: AskResponse; anchor: string }) {
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
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <a className="btn btn-a btn-sm" href="tel:998">
            {ts("call")}
          </a>
          {a.urgent?.support_line && (
            <a className="btn btn-o btn-sm" href={`tel:${a.urgent.support_line.tel}`}>
              {ts("callSakina")}
            </a>
          )}
        </div>
      )}
      <Cites citations={a.citations} anchor={anchor} />
      {!a.grounded && a.citations.length > 0 && <p className="xs faint">{t("notGrounded")}</p>}
      {!urgent && <ReadAloud text={answerText(a, t("sources"))} what={t("copilot")} />}
    </div>
  );
}
