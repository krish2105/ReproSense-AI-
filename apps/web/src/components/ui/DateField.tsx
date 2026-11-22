"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { isLocale } from "@/i18n/config";
import {
  addDays,
  addMonths,
  clampDay,
  formatFull,
  formatPicked,
  inRange,
  isIsoDate,
  monthGrid,
  monthStart,
  monthTitle,
  weekdayIndex,
  weekdayNames,
} from "@/lib/dates";
import { Icon } from "./Icon";

export interface QuickDate {
  label: string;
  /** "YYYY-MM-DD", or null for "I don't remember" (clears the field). */
  value: string | null;
}

/**
 * One date picker for every date in the app (docs/31 §C). A button shows the date in her language ("Tue 10 Nov") and
 * opens a month calendar right under it, in the page flow, so it is never clipped inside a dialog or off a phone screen.
 * - Only allowed days can be picked (min, max); a half-typed date cannot exist.
 * - Keyboard: arrows move a day (mirrored in Arabic), PageUp/PageDown a month, Home/End the week, Enter or Space
 *   picks, Esc closes and returns focus to the button (and does not close a surrounding dialog).
 * - "Today" comes from the caller (the API's ref_date), never from the device clock.
 * - A hidden input carries "YYYY-MM-DD" under `name` for forms that post.
 */
export function DateField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  today,
  hint,
  quick,
  name,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  /** The API's ref_date for her dates; the real date only where the data is real time (the audit log). */
  today: string;
  hint?: string;
  quick?: QuickDate[];
  name?: string;
}) {
  const t = useTranslations("dateField");
  const raw = useLocale();
  const locale = isLocale(raw) ? raw : "en";
  const rtl = locale === "ar";
  const picked = isIsoDate(value) ? value : null;
  const start = picked ?? clampDay(today, min, max);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(monthStart(start));
  const [focus, setFocus] = useState(start);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLTableElement>(null);
  const moveFocus = useRef(false); // set when the keyboard (or opening) should move focus to the active day

  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const hintId = hint ? `${id}-hint` : undefined;
  const popId = `${id}-calendar`;
  const titleId = `${id}-month`;

  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`button[data-day="${focus}"]`)?.focus();
  }, [open, focus, month]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const show = () => {
    setFocus(start);
    setMonth(monthStart(start));
    moveFocus.current = true;
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const pick = (day: string | null) => {
    onChange(day ?? "");
    close();
  };
  const go = (day: string, byKeyboard: boolean) => {
    const c = clampDay(day, min, max);
    setFocus(c);
    setMonth(monthStart(c));
    moveFocus.current = byKeyboard;
  };

  const onGridKey = (e: KeyboardEvent<HTMLTableElement>) => {
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const fwd = rtl ? "ArrowLeft" : "ArrowRight";
    const moves: Record<string, () => string> = {
      [back]: () => addDays(focus, -1),
      [fwd]: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
      Home: () => addDays(focus, -weekdayIndex(focus)),
      End: () => addDays(focus, 6 - weekdayIndex(focus)),
    };
    const m = moves[e.key];
    if (m) {
      e.preventDefault();
      go(m(), true);
    }
  };
  const onPopKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault(); // keeps a surrounding <dialog> open: Esc closes the calendar first
      e.stopPropagation();
      close();
    }
  };

  const monthBefore = addDays(month, -1);
  const monthAfter = addMonths(month, 1);
  const longNames = weekdayNames(locale, "long");

  return (
    <div className="field datef" ref={box}>
      <label id={labelId} htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        ref={button}
        type="button"
        className="datef-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popId}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-describedby={hintId}
        onClick={() => (open ? close() : show())}
      >
        <Icon name="calendar" size={18} />
        <span id={valueId} className={picked ? undefined : "faint"}>
          {picked ? formatPicked(picked, locale) : t("pick")}
        </span>
      </button>
      {hint && (
        <span id={hintId} className="xs faint">
          {hint}
        </span>
      )}
      {name && <input type="hidden" name={name} value={picked ?? ""} />}
      {open && (
        <div id={popId} role="dialog" aria-label={t("choose", { label })} className="datef-pop" onKeyDown={onPopKey}>
          <div className="datef-head">
            <button
              type="button"
              className="datef-nav"
              aria-label={t("prev")}
              disabled={Boolean(min && monthBefore < min)}
              onClick={() => go(addMonths(focus, -1), false)}
            >
              <Icon name="chevron" size={16} className="-scale-x-100 rtl:scale-x-100" />
            </button>
            <strong id={titleId} aria-live="polite">
              {monthTitle(month, locale)}
            </strong>
            <button
              type="button"
              className="datef-nav"
              aria-label={t("next")}
              disabled={Boolean(max && monthAfter > max)}
              onClick={() => go(addMonths(focus, 1), false)}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>
          <table role="grid" aria-labelledby={titleId} className="datef-grid" ref={grid} onKeyDown={onGridKey}>
            <thead>
              <tr>
                {weekdayNames(locale, rtl ? "narrow" : "short").map((w, i) => (
                  <th key={longNames[i]} scope="col" abbr={longNames[i]}>
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid(month).map((week, wi) => (
                <tr key={`${month}-${wi}`}>
                  {week.map((day, di) =>
                    day ? (
                      <td key={day} role="gridcell" aria-selected={day === picked}>
                        <button
                          type="button"
                          className="datef-day"
                          data-day={day}
                          tabIndex={day === focus ? 0 : -1}
                          disabled={!inRange(day, min, max)}
                          aria-label={formatFull(day, locale)}
                          aria-current={day === today ? "date" : undefined}
                          onClick={() => pick(day)}
                        >
                          {Number(day.slice(8))}
                        </button>
                      </td>
                    ) : (
                      <td key={`blank-${wi}-${di}`} role="gridcell" aria-hidden="true" />
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {quick && quick.length > 0 && (
            <div className="datef-quick">
              {quick.map((q) => (
                <button key={q.label} type="button" disabled={q.value !== null && !inRange(q.value, min, max)} onClick={() => pick(q.value)}>
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
