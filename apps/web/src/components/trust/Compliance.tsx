import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Tag } from "@/components/ui/Tag";
import { TableScroll } from "@/components/ui/TableScroll";
import { repoFile } from "@/lib/repo";

/** "in place" means built and tested today; "partly" names what is missing in the row's text; "roadmap" is not built. */
type Status = "inPlace" | "partly" | "roadmap";
const TONE = { inPlace: "ok", partly: "info", roadmap: "soon" } as const;

// ADHICS control domains, in the order of the published standard (DoH, 2019 edition; research 03 §2.3). Each row names
// the files where a reviewer can check the claim. Status is honest: UAE hosting, a penetration test and the formal
// assessment are roadmap, listed below the table.
const ADHICS: { key: string; status: Status; files: string[] }[] = [
  { key: "hr", status: "roadmap", files: [] },
  { key: "asset", status: "partly", files: ["backend/app/db/schema.sql", "backend/uv.lock"] },
  { key: "physical", status: "roadmap", files: ["docs/07_SECURITY_PRIVACY.md"] },
  { key: "access", status: "inPlace", files: ["backend/app/db/schema.sql", "backend/tests/test_rls.py", "backend/app/api/auth.py"] },
  {
    key: "ops",
    status: "inPlace",
    files: ["backend/app/security/audit.py", "backend/app/security/middleware.py", ".github/workflows/live-demo-check.yml"],
  },
  { key: "comms", status: "partly", files: ["backend/app/security/middleware.py", "apps/web/next.config.ts"] },
  { key: "health", status: "partly", files: ["backend/app/security/crypto.py", "backend/app/ai/redact.py", "backend/app/api/patient.py"] },
  { key: "third", status: "partly", files: ["docs/07_SECURITY_PRIVACY.md"] },
  { key: "dev", status: "inPlace", files: [".github/workflows/ci.yml"] },
  { key: "incident", status: "partly", files: ["docs/safety/INCIDENT_PROCESS.md"] },
  { key: "continuity", status: "partly", files: ["backend/app/agents/pipeline.py", "docs/07_SECURITY_PRIVACY.md"] },
];
const ROADMAP = ["hosting", "pentest", "assessment"] as const;
const AI = ["oversight", "transparency", "aiSwitch", "verifier", "heldout", "crisis"] as const;
const LAWS: { key: "law2019" | "pdpl"; ours: { key: string; status: Status }[] }[] = [
  { key: "law2019", ours: [{ key: "synthetic", status: "inPlace" }, { key: "inUae", status: "roadmap" }] },
  { key: "pdpl", ours: [{ key: "consent", status: "inPlace" }, { key: "export", status: "inPlace" }] },
];

/** /trust: the DoH and UAE compliance section (ADHICS, the AI Clinician Framework, the health data law and PDPL). */
export async function Compliance() {
  const t = await getTranslations("trust.uae");
  const status = (s: Status) => <Tag tone={TONE[s]}>{t(`status.${s}`)}</Tag>;
  return (
    <section aria-labelledby="uae-title" style={{ marginTop: 30 }}>
      <h2 id="uae-title" style={{ fontSize: 20 }}>
        {t("title")}
      </h2>
      <p className="s dim" style={{ marginTop: 6, maxWidth: "46em" }}>
        {t("intro")}
      </p>

      <section className="panel" aria-labelledby="adhics-title" style={{ padding: 20, marginTop: 16 }}>
        <h3 id="adhics-title" style={{ fontSize: 17 }}>
          {t("adhicsTitle")}
        </h3>
        <p className="s dim" style={{ marginTop: 6 }}>
          {t("adhicsIntro")}
        </p>
        <TableScroll label={t("adhicsTitle")} style={{ marginTop: 12 }}>
          <table className="trust-table">
            <thead>
              <tr>
                <th scope="col">{t("colDomain")}</th>
                <th scope="col">{t("colToday")}</th>
                <th scope="col">{t("colCheck")}</th>
                <th scope="col">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {ADHICS.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{t(`adhics.${r.key}.name`)}</th>
                  <td>{t(`adhics.${r.key}.today`)}</td>
                  <td>
                    {r.files.length ? (
                      <ul className="file-list" lang="en" dir="ltr">
                        {r.files.map((f) => (
                          <li key={f}>
                            <a href={repoFile(f)} target="_blank" rel="noopener noreferrer">
                              <code>{f}</code>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="faint">{t("noFile")}</span>
                    )}
                  </td>
                  <td>{status(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <h4 style={{ fontSize: 15, marginTop: 18 }}>{t("roadmapTitle")}</h4>
        <ul className="status-list">
          {ROADMAP.map((k) => (
            <li key={k}>
              {status("roadmap")}
              <span>{t(`roadmap.${k}`)}</span>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 14 }}>
          <Link href="/evidence" className="btn btn-o btn-sm">
            {t("seeEvidence")}
          </Link>
        </p>
      </section>

      <section aria-labelledby="ai-title" style={{ marginTop: 22 }}>
        <h3 id="ai-title" style={{ fontSize: 17 }}>
          {t("aiTitle")}
        </h3>
        <p className="s dim" style={{ marginTop: 6, maxWidth: "46em" }}>
          {t("aiIntro")}
        </p>
        <ul className="trust-list">
          {AI.map((k) => (
            <li key={k} className="panel">
              <p className="trust-head">
                <span className="label">{t(`ai.${k}.title`)}</span>
                {status("inPlace")}
              </p>
              <p className="s dim">{t(`ai.${k}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="law-title" style={{ marginTop: 22 }}>
        <h3 id="law-title" style={{ fontSize: 17 }}>
          {t("lawTitle")}
        </h3>
        <div className="two" style={{ marginTop: 12 }}>
          {LAWS.map((law) => (
            <article key={law.key} className="panel" aria-labelledby={`${law.key}-title`} style={{ padding: 20 }}>
              <h4 id={`${law.key}-title`} style={{ fontSize: 15 }}>
                {t(`${law.key}.name`)}
              </h4>
              <p className="label" style={{ marginTop: 10 }}>
                {t("lawAsks")}
              </p>
              <p className="s dim">{t(`${law.key}.asks`)}</p>
              <p className="label" style={{ marginTop: 10 }}>
                {t("lawOurs")}
              </p>
              <ul className="status-list">
                {law.ours.map((o) => (
                  <li key={o.key}>
                    {status(o.status)}
                    <span>{t(`${law.key}.${o.key}`)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
