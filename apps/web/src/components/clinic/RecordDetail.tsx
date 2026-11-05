import { getTranslations } from "next-intl/server";
import { BarsChart, CycleLengthChart } from "@/components/charts/AnalyticsCharts";
import { TraceButton } from "@/components/insights/CardActions";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Tag } from "@/components/ui/Tag";
import type { ClinicRecord } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { displayName, formatDayMonth, regionKey } from "@/lib/format";
import { SOURCES } from "@/lib/sources";
import { AskRecord, CareGaps, ReviewButton, VisitNote } from "./RecordActions";

/** The clinician's 30-second view of one consented record (mockup renderClinic). Clinical text is the API's. */
export async function RecordDetail({ r, locale }: { r: ClinicRecord; locale: Locale }) {
  const t = await getTranslations();
  const region = t.has(`regions.${regionKey(r.profile.region)}`) ? t(`regions.${regionKey(r.profile.region)}`) : r.profile.region;
  const flags = r.cards.filter((c) => c.kind === "red_flag");
  const rest = r.cards.filter((c) => c.kind !== "red_flag");
  const a = r.analytics;
  return (
    <div className="detail panel" style={{ background: "var(--sheet)" }}>
      <div className="kv" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <p className="label">{t("clinic.preVisit")}</p>
          <h1 style={{ fontSize: 26, marginTop: 4 }}>
            <bdi>{displayName(r.profile.alias)}</bdi>
          </h1>
          <p className="s dim">
            {t("demo.ageRegion", { age: r.profile.age, region })} · {t(`stages.${r.profile.life_stage}`)}
          </p>
          <p className="xs faint">{t("clinic.sharedNote", { count: r.timeline.days.length })}</p>
        </div>
        <ReviewButton pid={r.profile.id} reviewedAt={r.review?.reviewed_at ?? null} />
      </div>

      {r.crisis && (
        <section className="obs urgent" aria-labelledby="crisis-c">
          <h2 id="crisis-c" style={{ fontSize: 17 }}>
            {t("clinic.crisisTitle")}
          </h2>
          <p className="s">{t("clinic.crisisBody")}</p>
          <SourceLinks sources={[SOURCES.nice_cg192]} />
        </section>
      )}

      {flags.length > 0 && (
        <section aria-labelledby="flags-c" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="label" id="flags-c">
            {t("clinic.redFlagsTitle")}
          </p>
          {flags.map((c) => (
            <div key={c.observation_id} className="obs urgent">
              <h3 style={{ fontSize: 16 }} lang="en" dir="auto">
                {c.title}
              </h3>
              {c.entry_date && <p className="xs">{t("home.loggedOn", { date: formatDayMonth(c.entry_date, locale) })}</p>}
              {c.why_we_noticed[0] && (
                <p className="xs dim" lang="en" dir="auto">
                  {c.why_we_noticed[0].text}
                </p>
              )}
              <SourceLinks sources={c.sources} />
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="sbar-c">
        <p className="label" id="sbar-c" style={{ marginBottom: 8 }}>
          {t("clinic.sbarTitle")}
        </p>
        <div className="sbar" lang="en">
          <b aria-label={t("clinic.s")}>S</b>
          <span dir="auto">{r.sbar.situation}</span>
          <b aria-label={t("clinic.b")}>B</b>
          <span dir="auto">{r.sbar.background}</span>
          <b aria-label={t("clinic.a")}>A</b>
          <span dir="auto">{r.sbar.assessment.join(" ")}</span>
          <b aria-label={t("clinic.r")}>R</b>
          <span dir="auto">{r.sbar.recommendation.join(" ")}</span>
        </div>
      </section>

      {r.care_gaps.length > 0 && <CareGaps gaps={r.care_gaps} />}

      <AskRecord pid={r.profile.id} />

      {(a.cycles.some((c) => c.length !== null) || a.cycles.length > 0) && (
        <section aria-labelledby="charts-c" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p className="label" id="charts-c">
            {t("clinic.chartsTitle")}
          </p>
          <div className="two">
            {a.cycles.some((c) => c.length !== null) && <CycleLengthChart cycles={a.cycles} locale={locale} />}
            {a.cycles.length > 0 && (
              <BarsChart
                id={`pain-${r.profile.id}`}
                title={t("analytics.painTitle")}
                caption={t("analytics.painCaption")}
                summary={t("analytics.severe", { n: a.cycles.filter((c) => c.max_pain >= 7).length })}
                bars={a.cycles.map((c) => ({ start: c.start, value: c.max_pain, label: t("analytics.painBar", { date: formatDayMonth(c.start, locale), pain: c.max_pain }) }))}
                max={10}
                threshold={{ value: 7, label: "7" }}
                locale={locale}
              />
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="pat-c" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p className="label" id="pat-c">
          {t("clinic.patternsTitle")}
        </p>
        {rest.length === 0 && <p className="s dim">{t("report.patternsNone")}</p>}
        {rest.map((c) => (
          <article key={c.observation_id} className="obs">
            <span>
              <Tag tone={c.urgency}>{t(`tags.${c.urgency}`)}</Tag>
            </span>
            <h3 style={{ fontSize: 16 }} lang="en" dir="auto">
              {c.title}
            </h3>
            <p className="s dim" lang="en" dir="auto">
              {c.explains || c.summary}
            </p>
            {c.why_we_noticed.length > 0 && (
              <ul className="chips" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {c.why_we_noticed.slice(0, 8).map((e) => (
                  <li key={e.entry_id} className="ev" lang="en" dir="auto">
                    {e.text}
                  </li>
                ))}
              </ul>
            )}
            <div className="kv" style={{ flexWrap: "wrap" }}>
              <SourceLinks sources={c.sources} />
              <TraceButton card={c} trace={r.trace} version="0.2" />
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="labs-c">
        <p className="label" id="labs-c" style={{ marginBottom: 6 }}>
          {t("clinic.labsTitle")}
        </p>
        {r.labs.length === 0 ? (
          <p className="s dim">{t("clinic.labsNone")}</p>
        ) : (
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t("clinic.labTest")}</th>
                  <th scope="col">{t("clinic.labValue")}</th>
                  <th scope="col">{t("clinic.labRange")}</th>
                  <th scope="col">{t("clinic.labDate")}</th>
                </tr>
              </thead>
              <tbody>
                {r.labs.map((l) => (
                  <tr key={l.id}>
                    <td lang="en">{l.test}</td>
                    <td className={`mono${l.flag ? " hi" : ""}`} dir="ltr">
                      {l.value} {l.unit} {l.flag}
                    </td>
                    <td className="mono" dir="ltr">
                      {l.ref_low ?? ""}
                      {l.ref_low !== null && l.ref_high !== null ? "–" : ""}
                      {l.ref_high ?? ""}
                    </td>
                    <td className="mono">{formatDayMonth(l.date, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {r.her_questions.length > 0 && (
        <section aria-labelledby="q-c">
          <p className="label" id="q-c">
            {t("clinic.questionsTitle")}
          </p>
          <ul className="plain" lang="en" dir="auto">
            {r.her_questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>
      )}

      <VisitNote key={r.profile.id} pid={r.profile.id} initial={r.visit_note_draft} />
    </div>
  );
}
