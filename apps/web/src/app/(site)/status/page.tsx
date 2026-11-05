import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { apiServer } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("status");
  return { title: t("metaTitle") };
}

interface Quality {
  rules_version: string;
  rule_accuracy: { pass: number; of: number; detail: { persona: string; expected: string[]; got: string[]; pass: boolean }[] };
  ai_eval: {
    questions: number;
    grounded_pct: number;
    refusals: { pass: number; of: number };
    red_flag_recall_pct: number;
    banned_phrases: number;
    answer_language_match_pct: number;
    failures: { id: string }[];
  } | null;
}

// Team scorecard (HANDOFF §5 /status, GET /v1/quality). Only measured numbers; the mockup's projected scores are
// the team's estimates and are not shown as facts.
export default async function StatusPage() {
  const t = await getTranslations("status");
  let q: Quality | null = null;
  try {
    q = await apiServer<Quality>("/quality");
  } catch {
    q = null;
  }
  if (!q) return <ErrorState headingLevel={1} title={t("title")} body={t("unavailable")} />;
  const e = q.ai_eval;
  const figs = e
    ? [
        { label: t("grounded"), value: `${e.grounded_pct}%`, note: t("targetGrounded") },
        { label: t("refusals"), value: `${e.refusals.pass}/${e.refusals.of}`, note: null },
        { label: t("redflag"), value: `${e.red_flag_recall_pct}%`, note: null },
        { label: t("banned"), value: String(e.banned_phrases), note: null },
        { label: t("language"), value: `${e.answer_language_match_pct}%`, note: null },
      ]
    : [];
  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>

      <section className="panel" aria-labelledby="rules-title" style={{ padding: 22, marginTop: 22 }}>
        <div className="kv" style={{ flexWrap: "wrap" }}>
          <h2 id="rules-title" style={{ fontSize: 19 }}>
            {t("rules")}
          </h2>
          <span className="xs faint">{t("rulesVersion", { version: q.rules_version })}</span>
        </div>
        <p className="big mono" style={{ marginTop: 8 }}>
          <span className="ltr">
            {q.rule_accuracy.pass}/{q.rule_accuracy.of}
          </span>
        </p>
        <p className="s dim">{t("rulesValue", { pass: q.rule_accuracy.pass, of: q.rule_accuracy.of })}</p>
        <div className="tbl" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th scope="col">{t("colPersona")}</th>
                <th scope="col">{t("colExpected")}</th>
                <th scope="col">{t("colGot")}</th>
                <th scope="col">{t("colPass")}</th>
              </tr>
            </thead>
            <tbody>
              {q.rule_accuracy.detail.map((d) => (
                <tr key={d.persona}>
                  <td style={{ textTransform: "capitalize" }}>{d.persona}</td>
                  <td className="xs" dir="ltr">
                    <code>{d.expected.join(", ") || "—"}</code>
                  </td>
                  <td className="xs" dir="ltr">
                    <code>{d.got.join(", ") || "—"}</code>
                  </td>
                  <td>{d.pass ? <Tag tone="ok">{t("yes")}</Tag> : <Tag tone="urgent">{t("no")}</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {e && (
        <section className="panel" aria-labelledby="eval-title" style={{ padding: 22, marginTop: 20 }}>
          <h2 id="eval-title" style={{ fontSize: 19 }}>
            {t("evalTitle", { n: e.questions })}
          </h2>
          <dl className="figs" style={{ marginTop: 14, marginBottom: 0 }}>
            {figs.map((f) => (
              <div key={f.label}>
                <dt className="label">{f.label}</dt>
                <dd className="big mono" style={{ margin: "6px 0 0" }}>
                  <span className="ltr">{f.value}</span>
                </dd>
                {f.note && (
                  <dd className="xs faint" style={{ margin: "6px 0 0" }}>
                    {f.note}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          {e.failures.length > 0 && (
            <p className="s dim" style={{ marginTop: 12 }}>
              {t("misses", { ids: e.failures.map((f) => f.id).join(", ") })}
            </p>
          )}
        </section>
      )}

      <section className="panel" aria-labelledby="rubric-title" style={{ padding: 22, marginTop: 20 }}>
        <h2 id="rubric-title" style={{ fontSize: 19 }}>
          {t("rubricTitle")}
        </h2>
        <p className="s" style={{ marginTop: 6 }}>
          {t("rubric")}
        </p>
      </section>
    </>
  );
}
