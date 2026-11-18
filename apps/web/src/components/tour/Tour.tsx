"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/components/ui/Toast";
import { move, onStepPage, TOUR_KEY, TOUR_STEPS } from "./steps";

const START_EVENT = "rs-tour-start";

function readStep(): number | null {
  try {
    const v = sessionStorage.getItem(TOUR_KEY);
    const n = v === null ? NaN : Number(v);
    return Number.isInteger(n) && n >= 0 && n < TOUR_STEPS.length ? n : null;
  } catch {
    return null;
  }
}
function writeStep(n: number | null) {
  try {
    if (n === null) sessionStorage.removeItem(TOUR_KEY);
    else sessionStorage.setItem(TOUR_KEY, String(n));
  } catch {
    /* private mode: the tour still works on this page */
  }
}

/** Opens step `n` from step `from`. Same person and on that step's page: a quick client-side move. A new person: sign
 *  in, then a full page load (lib/enter.ts: nothing cached for the previous visitor may be reused). */
async function open(n: number, from: number, push: (path: string) => void) {
  const step = TOUR_STEPS[n]!;
  const prev = TOUR_STEPS[from]!;
  writeStep(n);
  if (onStepPage(window.location.pathname, step)) return false;
  if (step.as && onStepPage(window.location.pathname, prev) && JSON.stringify(step.as) === JSON.stringify(prev.as)) {
    push(step.path);
    return true;
  }
  if (step.as) await apiClient("/demo/login", { body: step.as });
  window.location.assign(step.path);
  return true;
}

/** "Show me in 3 minutes" (A2): starts the tour from its first step. */
export function TourStart({ className = "btn btn-o" }: { className?: string }) {
  const t = useTranslations("tour");
  return (
    <button
      type="button"
      className={className}
      title={t("startHint")}
      onClick={() => {
        writeStep(0);
        if (onStepPage(window.location.pathname, TOUR_STEPS[0]!)) window.dispatchEvent(new Event(START_EVENT));
        else window.location.assign(TOUR_STEPS[0]!.path);
      }}
    >
      {t("start")}
    </button>
  );
}

/** The judge tour card (A2): a small floating card per step that highlights what to look at. It is not modal and never
 *  covers the page, so every real button keeps working; the step lives in sessionStorage so it survives navigation. */
export function Tour() {
  const t = useTranslations("tour");
  const toast = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [index, setIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setIndex(readStep());
    const onStart = () => setIndex(readStep());
    window.addEventListener(START_EVENT, onStart);
    return () => window.removeEventListener(START_EVENT, onStart);
  }, [pathname]);

  const step = index === null ? null : TOUR_STEPS[index]!;
  const here = step ? onStepPage(pathname, step) : false;

  // Room under the page while the card is open, so any highlighted element can scroll clear of it.
  useEffect(() => {
    document.documentElement.classList.toggle("touring", index !== null);
    return () => document.documentElement.classList.remove("touring");
  }, [index]);

  // Highlight the step's element once it renders (client parts can arrive a moment later), and move focus to the card.
  useEffect(() => {
    if (!step || !here) return;
    heading.current?.focus({ preventScroll: true });
    let el: Element | null = null;
    let tries = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setInterval(() => {
      for (const sel of step.targets) {
        el = document.querySelector(sel);
        if (el) break;
      }
      if (el || ++tries > 25) {
        window.clearInterval(id);
        el?.classList.add("tour-on");
        el?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }
    }, 200);
    return () => {
      window.clearInterval(id);
      el?.classList.remove("tour-on");
    };
  }, [step, here]);

  const exit = useCallback(() => {
    writeStep(null);
    setIndex(null);
  }, []);

  const go = useCallback(
    async (n: number | null) => {
      if (n === null) {
        exit();
        toast(t("done"));
        return;
      }
      setBusy(true);
      try {
        const left = await open(n, index ?? n, router.push);
        if (!left) setIndex(n);
      } catch (e) {
        toast(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
      } finally {
        setBusy(false);
      }
    },
    [exit, index, router, t, toast],
  );

  if (index === null || !step) return null;
  const last = index === TOUR_STEPS.length - 1;
  const titleId = "tour-title";
  return (
    <div
      className="tour panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby="tour-body"
      onKeyDown={(e) => {
        if (e.key === "Escape") exit();
      }}
    >
      <div className="kv">
        <span className="xs faint">
          {t("label")} · {t("progress", { n: index + 1, total: TOUR_STEPS.length })}
        </span>
        <button type="button" className="tour-x" aria-label={t("exit")} onClick={exit}>
          ×
        </button>
      </div>
      <h2 id={titleId} ref={heading} tabIndex={-1} aria-live="polite">
        {t(`steps.${step.key}.title`)}
      </h2>
      <p id="tour-body" className="s">
        {t(`steps.${step.key}.body`)}
      </p>
      <div className="tour-dots" aria-hidden="true">
        {TOUR_STEPS.map((s, i) => (
          <i key={s.key} className={i === index ? "on" : undefined} />
        ))}
      </div>
      <div className="tour-acts">
        <button type="button" className="btn btn-o btn-sm" disabled={busy || index === 0} onClick={() => go(move(index, -1))}>
          {t("back")}
        </button>
        {here ? (
          <button type="button" className="btn btn-a btn-sm" disabled={busy} aria-busy={busy || undefined} onClick={() => go(move(index, 1))}>
            {last ? t("finish") : t("next")}
          </button>
        ) : (
          <button type="button" className="btn btn-a btn-sm" disabled={busy} aria-busy={busy || undefined} onClick={() => go(index)}>
            {t("goHere")}
          </button>
        )}
      </div>
    </div>
  );
}
