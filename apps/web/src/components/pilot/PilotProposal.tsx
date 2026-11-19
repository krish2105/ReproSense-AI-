import { getLocale, getTranslations } from "next-intl/server";
import { Tag } from "@/components/ui/Tag";
import { TableScroll } from "@/components/ui/TableScroll";
import { SOURCES } from "@/lib/sources";

// The pilot proposal for a clinic (docs/29). A draft offer, not an agreement: every number is either the app's own
// recorded data, a cited source (knowledge_base/sources.yaml, mirrored in src/lib/sources.ts), or labelled a
// hypothesis. The one-page PDF (backend/app/reports/pilot_proposal.py) is built from these same messages.
const CITED = ["doh_jawda_pc_v7", "agarwal_2022_gdm_followup", "bashir_2022_gdm_mutabaah", "doh_postnatal_standard_2025", "lewis_sus_2018"] as const;
const KPIS = [
  { key: "k1", basis: "source", cites: [1, 2] },
  { key: "k2", basis: "source", cites: [4] },
  { key: "k3", basis: "app", cites: [] },
  { key: "k4", basis: "app", cites: [] },
  { key: "k5", basis: "source", cites: [5] },
] as const;
const TONE = { source: "info", app: "ok", hypothesis: "soon" } as const;
const PHASES = ["p1", "p2", "p3", "p4"] as const;
const DESIGN = ["women", "clinicians", "length", "roles", "start"] as const;
const LOI_URL = "https://github.com/krish2105/ReproSense-AI-/blob/main/docs/29_PILOT_PROPOSAL_AND_LOI.md";

/** The proposal PDF in one language (public API path, proxied same-origin). */
export const proposalPdf = (lang: "en" | "ar") => `/api/v1/pilot/proposal.pdf?lang=${lang}`;

// A citation alone in a table cell is a target of its own: at least 24 px (WCAG 2.5.8), like /pricing.
const Cite = ({ n }: { n: number }) => (
  <a className="cite-target" href={`#proposal-src-${n}`}>
    [{n}]
  </a>
);

function Items({ keys, t, prefix }: { keys: readonly string[]; t: (k: string) => string; prefix: string }) {
  return (
    <ul className="tier-list" style={{ marginTop: 8 }}>
      {keys.map((k) => (
        <li key={k}>{t(`${prefix}.${k}`)}</li>
      ))}
    </ul>
  );
}

export async function PilotProposal() {
  const t = await getTranslations("pilotProposal");
  const lang = (await getLocale()) === "ar" ? "ar" : "en";
  const other = lang === "ar" ? "en" : "ar";
  return (
    <section id="proposal" aria-labelledby="proposal-title" className="proposal" style={{ marginTop: 44, scrollMarginTop: 96 }}>
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2 id="proposal-title" style={{ fontSize: "clamp(24px, 2.6vw, 32px)", marginTop: 12 }}>
        {t("title")}
      </h2>
      <p className="dim" style={{ marginTop: 8, maxWidth: "46em" }}>
        {t("intro")}
      </p>
      <p className="s faint" style={{ marginTop: 8, maxWidth: "46em" }} data-testid="proposal-draft-note">
        {t("draftNote")}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <a className="btn btn-a btn-sm" href={proposalPdf(lang)} download={`reprosense-pilot-proposal-${lang}.pdf`} data-testid="proposal-pdf">
          {t("download")}
        </a>
        <a className="btn btn-o btn-sm" href={proposalPdf(other)} download={`reprosense-pilot-proposal-${other}.pdf`} hrefLang={other}>
          {t("downloadOther")}
        </a>
        <a className="btn btn-o btn-sm" href={LOI_URL} target="_blank" rel="noopener noreferrer" hrefLang="en">
          {t("loi")}
        </a>
      </div>

      <div className="two" style={{ marginTop: 22 }}>
        <section className="panel" aria-labelledby="prop-who" style={{ padding: 20 }}>
          <h3 id="prop-who" style={{ fontSize: 17 }}>
            {t("who.title")}
          </h3>
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("who.body")}
          </p>
          <h3 id="prop-scope" style={{ fontSize: 17, marginTop: 16 }}>
            {t("scope.title")}
          </h3>
          <Items keys={["s1", "s2", "s3", "s4", "s5"]} t={t} prefix="scope.items" />
        </section>
        <section className="panel" aria-labelledby="prop-design" style={{ padding: 20 }}>
          <h3 id="prop-design" style={{ fontSize: 17 }}>
            {t("design.title")}
          </h3>
          <Items keys={DESIGN} t={t} prefix="design" />
          <p className="s" style={{ marginTop: 12 }}>
            {t("design.small")} <Cite n={3} />
          </p>
        </section>
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 id="prop-kpis" style={{ fontSize: 20 }}>
          {t("kpis.title")}
        </h3>
        <p className="dim" style={{ marginTop: 6, maxWidth: "46em" }}>
          {t("kpis.intro")}
        </p>
        <TableScroll label={t("kpis.title")} style={{ marginTop: 12 }}>
          <table data-testid="proposal-kpis">
            <thead>
              <tr>
                <th scope="col">{t("kpis.colMeasure")}</th>
                <th scope="col">{t("kpis.colHow")}</th>
                <th scope="col">{t("kpis.colBasis")}</th>
              </tr>
            </thead>
            <tbody>
              {KPIS.map(({ key, basis, cites }) => (
                <tr key={key}>
                  <th scope="row" style={{ fontSize: 14, color: "var(--ink)", minWidth: 150 }}>
                    {t(`kpis.${key}.name`)}
                  </th>
                  <td style={{ minWidth: 220 }}>{t(`kpis.${key}.how`)}</td>
                  <td style={{ minWidth: 200 }}>
                    <Tag tone={TONE[basis]}>{t(`basis.${basis}`)}</Tag>
                    <span style={{ display: "block", marginTop: 6 }}>{t(`kpis.${key}.basis`)}</span>
                    {cites.length > 0 && (
                      <span style={{ display: "block", marginTop: 4 }}>
                        {cites.map((n) => (
                          <Cite key={n} n={n} />
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="xs faint" style={{ marginTop: 10, maxWidth: "52em" }}>
          {t("kpis.baseline")}
        </p>
      </div>

      <div className="two" style={{ marginTop: 22 }}>
        <section className="panel" aria-labelledby="prop-timeline" style={{ padding: 20 }}>
          <h3 id="prop-timeline" style={{ fontSize: 17 }}>
            {t("timeline.title")}
          </h3>
          <ol className="prop-steps">
            {PHASES.map((p) => (
              <li key={p}>
                <span className="prop-when">{t(`timeline.${p}.when`)}</span>
                <span className="s">
                  <b>{t(`timeline.${p}.what`)}.</b> <span className="dim">{t(`timeline.${p}.body`)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="panel" aria-labelledby="prop-data" style={{ padding: 20 }}>
          <h3 id="prop-data" style={{ fontSize: 17 }}>
            {t("data.title")}
          </h3>
          <Items keys={["d1", "d2", "d3", "d4", "d5", "d6"]} t={t} prefix="data.items" />
        </section>
      </div>

      <div className="two" style={{ marginTop: 20 }}>
        <section className="panel" aria-labelledby="prop-clinic" style={{ padding: 20 }}>
          <h3 id="prop-clinic" style={{ fontSize: 17 }}>
            {t("clinic.title")}
          </h3>
          <Items keys={["c1", "c2", "c3", "c4", "c5"]} t={t} prefix="clinic.items" />
        </section>
        <section className="panel" aria-labelledby="prop-ours" style={{ padding: 20 }}>
          <h3 id="prop-ours" style={{ fontSize: 17 }}>
            {t("ours.title")}
          </h3>
          <Items keys={["o1", "o2", "o3", "o4", "o5"]} t={t} prefix="ours.items" />
        </section>
      </div>

      <div className="two" style={{ marginTop: 20, alignItems: "start" }}>
        <section className="panel" aria-labelledby="prop-price" style={{ padding: 20 }} data-testid="proposal-price">
          <div className="trust-head">
            <h3 id="prop-price" style={{ fontSize: 17 }}>
              {t("price.title")}
            </h3>
            <Tag tone={TONE.hypothesis}>{t("basis.hypothesis")}</Tag>
          </div>
          <p style={{ marginTop: 8, fontWeight: 700 }}>{t("price.pilot")}</p>
          <p className="s dim" style={{ marginTop: 4 }}>
            {t("price.after")}
          </p>
        </section>
        <section className="panel" aria-labelledby="prop-exit" style={{ padding: 20 }}>
          <div className="trust-head">
            <h3 id="prop-exit" style={{ fontSize: 17 }}>
              {t("exit.title")}
            </h3>
            <Tag tone={TONE.hypothesis}>{t("basis.hypothesis")}</Tag>
          </div>
          <p className="xs faint" style={{ marginTop: 6 }}>
            {t("exit.intro")}
          </p>
          <h4 style={{ fontSize: 14, marginTop: 12 }}>{t("exit.continueTitle")}</h4>
          <Items keys={["c1", "c2", "c3"]} t={t} prefix="exit.continue" />
          <h4 style={{ fontSize: 14, marginTop: 12 }}>{t("exit.stopTitle")}</h4>
          <Items keys={["s1", "s2", "s3"]} t={t} prefix="exit.stop" />
        </section>
      </div>

      <h3 style={{ fontSize: 15, marginTop: 24 }}>{t("sourcesTitle")}</h3>
      <ol className="plain" style={{ marginTop: 8 }} lang="en">
        {CITED.map((id, i) => (
          <li key={id} id={`proposal-src-${i + 1}`} className="src" style={{ marginTop: 6 }} dir="ltr">
            <a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer">
              {SOURCES[id].title}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
