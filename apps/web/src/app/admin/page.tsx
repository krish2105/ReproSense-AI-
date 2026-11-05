import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { RegionSection } from "@/components/admin/RegionSection";
import { RoiCalculator } from "@/components/admin/RoiCalculator";
import { Tag } from "@/components/ui/Tag";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { AdminMetricsFull, AuditVerify, FairnessRow } from "@/lib/api/types";
import { formatNumber, regionKey } from "@/lib/format";
import { TableScroll } from "@/components/ui/TableScroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("metaTitle") };
}

// DoH Jawda primary-care quality indicators, version 7 (research/2026-11-06/01, source S16).
const JAWDA_PC_URL = "https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/Jawda-Quarterly-Submission-Guidelines/PrimaryCare-JAWDA---Update-2022.ashx";

// Status colours always travel with words (mauve-charts): open = accent, booked = warn, done = ok.
const STATUS = [
  { key: "open", color: "var(--accent)" },
  { key: "in_progress", color: "var(--warn)" },
  { key: "closed", color: "var(--ok)" },
] as const;

// Network admin (HANDOFF §5 /admin; mockup renderAdmin). Synthetic cohort + the live demo follow-ups.
export default async function AdminPage() {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations();
  const [m, audit] = await Promise.all([apiServer<AdminMetricsFull>("/admin/metrics"), apiServer<AuditVerify>("/admin/audit/verify")]);
  const n = (v: number, d = 0) => formatNumber(v, locale, d);
  const k = m.kpis;
  const figs = [
    { id: "cohort", label: t("admin.cohort"), value: n(m.cohort.n), note: null },
    { id: "shared", label: t("admin.shared"), value: n(k.reports_shared), note: t("admin.consented") + ": " + n(k.consented) },
    { id: "closed", label: t("admin.closed"), value: n(k.care_gaps_closed), note: t("admin.ofTotal", { total: n(k.care_gaps_total) }) },
    { id: "rate", label: t("admin.closeRate"), value: t("admin.closeRateValue", { pct: n(k.close_rate_pct, 1) }), note: t("admin.open") + ": " + n(k.care_gaps_open) },
  ];
  const live = m.live_demo_gaps;
  const pc = m.pc008_glucose;
  const funnelMax = Math.max(1, ...m.funnel.map((f) => f.n));
  const region = (r: string) => (t.has(`regions.${regionKey(r)}`) ? t(`regions.${regionKey(r)}`) : r);
  const fairTable = (title: string, rows: FairnessRow[], id: string) => (
    <TableScroll label={title}>
      <table aria-labelledby={id}>
        <caption id={id} className="label" style={{ textAlign: "start", paddingBottom: 6 }}>
          {title}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("admin.colGroup")}</th>
            <th scope="col">{t("admin.colWomen")}</th>
            <th scope="col">{t("admin.colFlagged")}</th>
            <th scope="col">{t("admin.colShared")}</th>
            <th scope="col">{t("admin.colCheck")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.g}>
              <td lang="en" dir="auto">
                {r.g}
              </td>
              <td className="mono">{r.n === null ? "—" : n(r.n)}</td>
              <td className="mono">{r.pct_obs === null ? "—" : t("admin.pct", { n: n(r.pct_obs, 1) })}</td>
              <td className="mono">{r.pct_shared === null ? "—" : t("admin.pct", { n: n(r.pct_shared, 1) })}</td>
              <td>
                {r.flag.startsWith("check") ? (
                  <Tag tone="discuss">{t("admin.flagCheck")}</Tag>
                ) : r.flag.startsWith("suppressed") ? (
                  <Tag tone="info">{t("admin.flagSuppressed")}</Tag>
                ) : (
                  <Tag tone="ok">{t("admin.flagOk")}</Tag>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );

  return (
    <>
      <div className="kv" style={{ flexWrap: "wrap", alignItems: "baseline" }}>
        <h1 className="page-title">{t("admin.title")}</h1>
        <AutoRefresh />
      </div>
      <p className="page-intro">{t("admin.intro")}</p>

      <dl className="figs" aria-label={t("admin.kpiLabel")} style={{ marginTop: 22, marginBottom: 0 }}>
        {figs.map((f) => (
          <div key={f.id}>
            <dt className="label">{f.label}</dt>
            <dd className="big mono" style={{ margin: "6px 0 0" }}>
              <span className="ltr">{f.value}</span>
            </dd>
            {f.note && <dd className="xs faint" style={{ margin: "6px 0 0" }}>{f.note}</dd>}
          </div>
        ))}
      </dl>

      <section className="panel" aria-labelledby="live-title" style={{ padding: 20, marginTop: 20, background: "var(--sheet)" }}>
        <h2 id="live-title" style={{ fontSize: 18 }}>
          {t("admin.liveTitle")}
        </h2>
        <p className="s dim" style={{ marginTop: 4 }}>
          {t("admin.liveBody")}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {STATUS.map((s) => (
            <li key={s.key}>
              <span className="tag" style={{ background: "var(--tint)", color: "var(--ink)", fontSize: 14, padding: "6px 14px" }}>
                <i aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: s.color, marginInlineEnd: 8 }} />
                {t("admin.liveStatus", { status: t(`clinic.gapStatus.${s.key}`), n: live[s.key] ?? 0 })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="pc008-title" style={{ padding: 20, marginTop: 20 }}>
        <h2 id="pc008-title" style={{ fontSize: 18 }}>
          {t("admin.pc008Title")}
        </h2>
        <p className="s dim" style={{ marginTop: 4 }}>
          {t("admin.pc008Body")}
        </p>
        {pc.due === null || pc.done === null ? (
          <p className="s" style={{ marginTop: 12 }}>
            {t("admin.pc008Hidden")}
          </p>
        ) : (
          <div style={{ marginTop: 14 }}>
            <div className="kv s">
              <span>{t("admin.pc008Glucose")}</span>
              <b className="mono">{t("admin.pc008Value", { done: n(pc.done), due: n(pc.due) })}</b>
            </div>
            <div className="bar" style={{ marginTop: 6 }} aria-hidden="true">
              <i style={{ width: `${pc.done_pct ?? 0}%`, background: "var(--ok)" }} />
            </div>
            <p className="xs dim" style={{ marginTop: 6 }}>
              {t("admin.pc008Detail", { pct: n(pc.done_pct ?? 0, 1), booked: n(pc.booked ?? 0), open: n(pc.open ?? 0) })}
            </p>
          </div>
        )}
        <p className="xs faint" style={{ marginTop: 10 }}>
          {t("admin.pc008Note")}{" "}
          <a href={JAWDA_PC_URL} target="_blank" rel="noopener noreferrer">
            {t("admin.pc008Source")}
          </a>
        </p>
      </section>

      <RegionSection regions={m.regions} names={Object.fromEntries(m.regions.map((r) => [r.region, region(r.region)]))} />

      <div className="two" style={{ marginTop: 20 }}>
        <section className="panel" aria-labelledby="funnel-title" style={{ padding: 20 }}>
          <h2 id="funnel-title" style={{ fontSize: 18 }}>
            {t("admin.funnelTitle")}
          </h2>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {m.funnel.map((f, i) => (
              <div key={f.stage}>
                <div className="kv s">
                  <span>{t.has(`admin.funnel.${i}`) ? t(`admin.funnel.${i}`) : f.stage}</span>
                  <b className="mono">{n(f.n)}</b>
                </div>
                <div className="bar" style={{ marginTop: 6 }} aria-hidden="true">
                  <i style={{ width: `${(f.n / funnelMax) * 100}%`, background: i === 2 ? "var(--ok)" : "var(--plum)" }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="regions-title" style={{ padding: 20 }}>
          <h2 id="regions-title" style={{ fontSize: 18 }}>
            {t("admin.regionsTitle")}
          </h2>
          <p className="xs faint" style={{ marginTop: 4 }}>
            {t("admin.regionsNote")}
          </p>
          <ul className="leg" style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
            {STATUS.map((s) => (
              <li key={s.key}>
                <i style={{ background: s.color }} aria-hidden="true" />
                {t(`clinic.gapStatus.${s.key}`)}
              </li>
            ))}
          </ul>
          <TableScroll label={t("admin.regionsTitle")} style={{ marginTop: 8 }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t("admin.colRegion")}</th>
                  <th scope="col">{t("admin.colWomen")}</th>
                  <th scope="col">{t("admin.colOpen")}</th>
                  <th scope="col">{t("admin.colBooked")}</th>
                  <th scope="col">{t("admin.colDone")}</th>
                </tr>
              </thead>
              <tbody>
                {m.regions.map((r) => {
                  const tot = r.open + r.in_progress + r.closed || 1;
                  return (
                    <tr key={r.region}>
                      <td>
                        {region(r.region)}
                        <div className="bar" style={{ marginTop: 6, display: "flex", gap: 2, background: "transparent" }} aria-hidden="true">
                          <i style={{ width: `${(r.open / tot) * 100}%`, background: STATUS[0].color }} />
                          <i style={{ width: `${(r.in_progress / tot) * 100}%`, background: STATUS[1].color }} />
                          <i style={{ width: `${(r.closed / tot) * 100}%`, background: STATUS[2].color }} />
                        </div>
                      </td>
                      <td className="mono">{r.n === null ? t("admin.hidden") : n(r.n)}</td>
                      <td className="mono">{n(r.open)}</td>
                      <td className="mono">{n(r.in_progress)}</td>
                      <td className="mono">{n(r.closed)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        </section>
      </div>

      <section className="panel" aria-labelledby="fair-title" style={{ padding: 20, marginTop: 20 }}>
        <h2 id="fair-title" style={{ fontSize: 18 }}>
          {t("admin.fairnessTitle")}
        </h2>
        <p className="s dim" style={{ marginTop: 4 }}>
          {t("admin.fairnessIntro")}
        </p>
        <p className="s" style={{ marginTop: 8 }}>
          {t("admin.overall", { obs: n(m.fairness.overall.pct_obs, 1), shared: n(m.fairness.overall.pct_shared, 1) })}
        </p>
        <div className="two" style={{ marginTop: 12 }}>
          {fairTable(t("admin.nationality"), m.fairness.nationality_group, "fair-nat")}
          {fairTable(t("admin.ageBand"), m.fairness.age_band, "fair-age")}
        </div>
      </section>

      <div className="two" style={{ marginTop: 20 }}>
        <section className="panel" aria-labelledby="roi-title" style={{ padding: 20 }}>
          <h2 id="roi-title" style={{ fontSize: 18 }}>
            {t("admin.roiTitle")}
          </h2>
          <p className="s dim" style={{ marginTop: 4, marginBottom: 12 }}>
            {t("admin.roiIntro")}
          </p>
          <RoiCalculator reports={m.roi_inputs.reports_shared} assumptions={m.roi_inputs.assumptions} />
        </section>
        <section className="panel" aria-labelledby="audit-title" style={{ padding: 20 }}>
          <h2 id="audit-title" style={{ fontSize: 18 }}>
            {t("admin.auditTitle")}
          </h2>
          <p className="s" style={{ marginTop: 8 }}>
            {audit.chain_ok ? (
              <Tag tone="ok">{t("admin.auditOk", { n: audit.entries })}</Tag>
            ) : (
              <Tag tone="urgent">{t("admin.auditBad", { id: audit.first_bad_id ?? 0 })}</Tag>
            )}
          </p>
          <p className="xs faint" lang="en" dir="auto" style={{ marginTop: 10 }}>
            {m.cohort.note}
          </p>
        </section>
      </div>
    </>
  );
}
