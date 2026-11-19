import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import type { LoopMetrics as Loop, LoopRatio } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

/**
 * The closed loop, measured (the venture story): how many days pass between its steps, how many follow-ups are done
 * inside their window, how many are overdue, how many postnatal steps happen inside their DoH window and how often a
 * clinician opened her record before the visit. Every group under k is "fewer than 10", never 0 (k-min, docs/07).
 * Bars are drawn to scale from the same numbers the text gives; the text carries the values.
 */
export async function LoopMetrics({ m, locale, scope }: { m: Loop; locale: Locale; scope: "network" | "clinic" }) {
  const t = await getTranslations("loop");
  const n = (v: number, d = 1) => formatNumber(v, locale, d);
  const hidden = t("hidden", { k: m.k_min });
  const median = (key: keyof Loop["median_days"]) => {
    const v = m.median_days[key];
    return v.days === null ? { value: hidden, note: null } : { value: t("days", { days: v.days }), note: t("ofFollowUps", { n: n(v.n ?? 0, 0) }) };
  };
  const figs = [
    { id: "opened_to_booked", label: t("openedToBooked"), ...median("opened_to_booked") },
    { id: "booked_to_done", label: t("bookedToDone"), ...median("booked_to_done") },
    { id: "opened_to_result", label: t("openedToResult"), ...median("opened_to_result") },
    {
      id: "overdue",
      label: t("overdue"),
      value: m.overdue.n === null ? hidden : n(m.overdue.n, 0),
      note: t("overdueNote"),
    },
  ];
  const ratios: { id: string; label: string; r: LoopRatio; note: string }[] = [
    { id: "done_in_window", label: t("doneInWindow"), r: m.done_in_window, note: t("doneInWindowNote") },
    { id: "postnatal_in_window", label: t("postnatalInWindow"), r: m.postnatal_in_window, note: t("postnatalNote") },
    { id: "record_opened_before_visit", label: t("recordBefore"), r: m.record_opened_before_visit, note: t("recordBeforeNote") },
  ];
  const titleId = `loop-${scope}`;
  return (
    <section className="panel" aria-labelledby={titleId} data-testid="loop-metrics" style={{ padding: 20, marginTop: 20 }}>
      <h2 id={titleId} style={{ fontSize: 18 }}>
        {t("title")}
      </h2>
      <p className="s dim" style={{ marginTop: 4 }}>
        {scope === "network" ? t("introNetwork") : t("introClinic")}
      </p>
      <dl className="figs loop-figs" aria-label={t("figsLabel")} style={{ marginTop: 14, marginBottom: 0 }}>
        {figs.map((f) => (
          <div key={f.id} data-metric={f.id}>
            <dt className="label">{f.label}</dt>
            <dd className="big mono" style={{ margin: "6px 0 0", fontSize: f.value.length > 8 ? 18 : 30 }}>
              <span dir="auto">{f.value}</span>
            </dd>
            {f.note && (
              <dd className="xs faint" style={{ margin: "6px 0 0" }}>
                {f.note}
              </dd>
            )}
          </div>
        ))}
      </dl>
      <ul className="loop-ratios">
        {ratios.map(({ id, label, r, note }) => (
          <li key={id} data-metric={id}>
            <div className="kv s">
              <span>{label}</span>
              <b className="mono">{r.suppressed || r.pct === null ? hidden : t("ratio", { n: n(r.n ?? 0, 0), of: n(r.of ?? 0, 0), pct: n(r.pct) })}</b>
            </div>
            <div className="bar" style={{ marginTop: 6 }} aria-hidden="true">
              <i style={{ width: `${r.suppressed || r.pct === null ? 0 : r.pct}%`, background: "var(--plum)" }} />
            </div>
            <p className="xs faint" style={{ marginTop: 4 }}>
              {note}
            </p>
          </li>
        ))}
      </ul>
      <p className="xs faint" style={{ marginTop: 12 }}>
        {t("note", { k: m.k_min })}
      </p>
    </section>
  );
}
