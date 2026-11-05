import { useTranslations } from "next-intl";
import { SourceLinks } from "@/components/safety/SourceLinks";
import type { ReportPayload, Source } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { displayName, formatDate, formatDayMonth, isolate, regionKey } from "@/lib/format";

/**
 * The two-page summary as she and her doctor see it (mockup tReport; same payload as the PDF).
 * Clinical content comes from the payload in English and is marked lang="en"; headings follow the UI language.
 */
export function ReportDoc({ p, locale }: { p: ReportPayload; locale: Locale }) {
  const t = useTranslations();
  const lengths = p.cycles.filter((c) => c.length !== null).map((c) => c.length as number);
  const region = t.has(`regions.${regionKey(p.region)}`) ? t(`regions.${regionKey(p.region)}`) : p.region;
  const sources = new Map<string, Source>();
  for (const c of [...p.red_flags, ...p.patterns]) for (const s of c.sources) sources.set(s.source_id, s);
  return (
    <article className="doc" aria-labelledby="doc-title">
      <div className="kv" style={{ flexWrap: "wrap" }}>
        <b id="doc-title" style={{ fontFamily: "var(--f-display)", fontSize: 15 }}>
          {t("report.docTitle")}
        </b>
        <span className="xs faint mono">{formatDate(p.generated, locale)}</span>
      </div>
      <p>
        {t("report.identity", { name: isolate(displayName(p.alias)), age: p.age, region })} · {t("report.stage", { stage: t(`stages.${p.life_stage}`) })}
        {p.is_synthetic && <span className="tag t-info" style={{ marginInlineStart: 8 }}>{t("report.synthetic")}</span>}
      </p>
      <p className="s dim">
        {t("report.stats", { logs: p.stats.logs, periodDays: p.stats.period_days, severe: p.stats.severe_pain_days })}
      </p>

      {p.red_flags.length > 0 && (
        <>
          <h4>{t("report.redFlags")}</h4>
          <ul className="plain">
            {p.red_flags.map((c) => (
              <li key={c.observation_id} className="hi">
                <bdi lang="en">{c.title}</bdi>
                {c.entry_date ? ` (${formatDayMonth(c.entry_date, locale)})` : ""}
              </li>
            ))}
          </ul>
        </>
      )}

      <h4>{t("report.cycles")}</h4>
      <p className="mono" dir="ltr" style={{ textAlign: "start" }}>
        {lengths.length ? lengths.join(" · ") : t("report.cyclesNone")}
      </p>
      {p.stats.pbac_by_cycle.length > 0 && (
        <>
          <h4>{t("report.pbac")}</h4>
          <p className="mono" dir="ltr" style={{ textAlign: "start" }}>
            {p.stats.pbac_by_cycle.map((v, i) => (
              <span key={i} className={v >= 100 ? "hi" : undefined}>
                {i > 0 && " · "}
                {v}
              </span>
            ))}
          </p>
        </>
      )}

      <h4>{t("report.patterns")}</h4>
      {p.patterns.length ? (
        <ul className="plain">
          {p.patterns.map((c) => (
            <li key={c.observation_id}>
              <bdi lang="en">{c.title}</bdi> <span className="faint">· {t("report.patternEntries", { count: c.why_we_noticed.length })}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dim">{t("report.patternsNone")}</p>
      )}

      {p.labs.length > 0 && (
        <>
          <h4>{t("report.labs")}</h4>
          <div className="tbl">
            <table>
              <tbody>
                {p.labs.map((l) => (
                  <tr key={l.id}>
                    <td lang="en">{l.test}</td>
                    <td className={`mono${l.flag ? " hi" : ""}`} dir="ltr">
                      {l.value} {l.unit} {l.flag ? `(${l.flag})` : ""}
                    </td>
                    <td className="xs faint" dir="ltr">
                      {l.ref_low !== null && l.ref_high !== null ? t("report.labRange", { low: l.ref_low, high: l.ref_high }) : ""}
                    </td>
                    <td className="xs faint">{formatDayMonth(l.date, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {p.questions.length > 0 && (
        <>
          <h4>{t("report.questions")}</h4>
          <ul className="plain" lang="en" dir="auto">
            {p.questions.slice(0, 6).map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </>
      )}
      <SourceLinks sources={[...sources.values()]} />
    </article>
  );
}
