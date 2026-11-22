import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { isLocale } from "@/i18n/config";
import { API_URL, apiServer } from "@/lib/api/server";
import { formatDate } from "@/lib/format";
import { TableScroll } from "@/components/ui/TableScroll";

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
    heldout?: Partial<Record<"crisis" | "urgent" | "refuse" | "medicine" | "answer", { pass: number; of: number }>> & { misses?: { id: string }[] };
    /** the same held-out round with the language model's second check (build week K7); absent until it is run with a key */
    heldout_with_model?: Partial<Record<"crisis" | "urgent" | "refuse" | "medicine" | "answer", { pass: number; of: number }>> & { model: string; round: number };
  } | null;
  /** The attack suite's last published run (backend/app/security/attack_results.json); absent on an older API. */
  attack_suite?: AttackSuite | null;
}

type AttackResult = "blocked" | "not_blocked" | "not_run";
interface AttackSuite {
  commit: string;
  date: string;
  total: number;
  blocked: number;
  attacks: { id: number; name: string; layer: string; layer_label: string; result: AttackResult }[];
}
const RESULT_TONE: Record<AttackResult, "ok" | "urgent" | "info"> = { blocked: "ok", not_blocked: "urgent", not_run: "info" };

/** One live check of the API's readiness (database reachable) each time the page opens (issue #30). */
async function checkApi(): Promise<{ up: boolean; ms: number; at: Date }> {
  const t0 = Date.now();
  const up = await fetch(new URL("/readyz", API_URL), { cache: "no-store", signal: AbortSignal.timeout(10_000) })
    .then((r) => r.ok)
    .catch(() => false);
  return { up, ms: Date.now() - t0, at: new Date() };
}

// Team scorecard (HANDOFF §5 /status, GET /v1/quality). Only measured numbers; the mockup's projected scores are
// the team's estimates and are not shown as facts.
export default async function StatusPage() {
  const t = await getTranslations("status");
  const live = await checkApi();
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const checkedAt = new Intl.DateTimeFormat(rawLocale, { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" }).format(live.at);
  // Set where the service is hosted (docs/16): the external uptime monitor and the pilot support inbox. Hidden if unset.
  const monitor = process.env.STATUS_MONITOR_URL;
  const support = process.env.SUPPORT_EMAIL;
  const liveSection = (
    <section className="panel" aria-labelledby="live-title" style={{ padding: 22, marginTop: 22 }}>
      <div className="kv" style={{ flexWrap: "wrap" }}>
        <h2 id="live-title" style={{ fontSize: 19 }}>
          {t("liveTitle")}
        </h2>
        {live.up ? <Tag tone="ok">{t("liveUp")}</Tag> : <Tag tone="urgent">{t("liveDown")}</Tag>}
      </div>
      <p className="s dim" style={{ marginTop: 6 }}>
        {live.up ? t("liveUpBody", { ms: live.ms, at: checkedAt }) : t("liveDownBody", { at: checkedAt })}
      </p>
      {(monitor || support) && (
        <ul className="tier-list" style={{ marginTop: 10 }}>
          {monitor && (
            <li>
              <a href={monitor} rel="noopener noreferrer" target="_blank">
                {t("liveMonitor")}
              </a>
            </li>
          )}
          {support && (
            <li>
              {t("liveSupport")}{" "}
              <a href={`mailto:${support}`} dir="ltr">
                {support}
              </a>
            </li>
          )}
        </ul>
      )}
    </section>
  );
  let q: Quality | null = null;
  try {
    q = await apiServer<Quality>("/quality");
  } catch {
    q = null;
  }
  if (!q)
    return (
      <>
        <ErrorState headingLevel={1} title={t("title")} body={t("unavailable")} />
        {liveSection}
      </>
    );
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
      <p className="s" style={{ marginTop: 10 }}>
        <Link href="/evidence">{t("seeEvidence")}</Link>
      </p>

      {liveSection}

      <section className="panel" aria-labelledby="rules-title" style={{ padding: 22, marginTop: 20 }}>
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
        <TableScroll label={t("rules")} style={{ marginTop: 12 }}>
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
        </TableScroll>
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
          {e.heldout && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 15 }}>{t("heldoutTitle")}</h3>
              <p className="s dim" style={{ marginTop: 4 }}>
                {t("heldoutIntro")}
              </p>
              <p className="xs faint" style={{ marginTop: 4 }}>
                {t("heldoutCount", {
                  n: (["crisis", "urgent", "refuse", "medicine", "answer"] as const).reduce((n, k) => n + (e.heldout?.[k]?.of ?? 0), 0),
                })}
              </p>
              <ul className="tier-list" style={{ marginTop: 8 }}>
                {(["crisis", "urgent", "refuse", "medicine", "answer"] as const).map((k) =>
                  e.heldout?.[k] ? (
                    <li key={k}>{t(`heldout.${k}`, { pass: e.heldout[k]!.pass, of: e.heldout[k]!.of })}</li>
                  ) : null,
                )}
              </ul>
              <p className="s dim" style={{ marginTop: 8 }}>
                {t("heldoutAfter")}
              </p>
              <h3 style={{ fontSize: 15, marginTop: 14 }}>{t("heldoutModelTitle")}</h3>
              {e.heldout_with_model ? (
                <>
                  <p className="s dim" style={{ marginTop: 4 }}>
                    {t("heldoutModelIntro", { model: e.heldout_with_model.model })}
                  </p>
                  <ul className="tier-list" style={{ marginTop: 8 }}>
                    {(["crisis", "urgent", "refuse", "medicine", "answer"] as const).map((k) =>
                      e.heldout_with_model?.[k] ? (
                        <li key={k}>{t(`heldout.${k}`, { pass: e.heldout_with_model[k]!.pass, of: e.heldout_with_model[k]!.of })}</li>
                      ) : null,
                    )}
                  </ul>
                </>
              ) : (
                <p className="s dim" style={{ marginTop: 4 }}>
                  {t("heldoutModelNone")}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {q.attack_suite && <AttackSection suite={q.attack_suite} t={t} locale={locale} />}

      <section className="panel" aria-labelledby="support-title" style={{ padding: 22, marginTop: 20 }}>
        <h2 id="support-title" style={{ fontSize: 19 }}>
          {t("supportTitle")}
        </h2>
        <p className="s dim" style={{ marginTop: 6 }}>
          {t("supportIntro")}
        </p>
        <ul className="tier-list" style={{ marginTop: 10 }}>
          {(["support1", "support2", "support3", "support4"] as const).map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </section>

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

/** "Attack suite: N of N blocked" and each attack with the layer that stops it (docs/07, "Attack suite"). Names and
 * layers come from the messages by id and key, so both languages read naturally; the API's English is the fallback. */
function AttackSection({ suite, t, locale }: { suite: AttackSuite; t: Awaited<ReturnType<typeof getTranslations<"status">>>; locale: "en" | "ar" }) {
  return (
    <section className="panel" aria-labelledby="attack-title" style={{ padding: 22, marginTop: 20 }}>
      <h2 id="attack-title" style={{ fontSize: 19 }}>
        {t("attackTitle", { blocked: suite.blocked, total: suite.total })}
      </h2>
      <p className="s dim" style={{ marginTop: 6 }}>
        {t("attackIntro")}
      </p>
      <p className="xs faint" style={{ marginTop: 4 }}>
        {t("attackRun", { date: formatDate(suite.date, locale), commit: suite.commit })}
      </p>
      <TableScroll label={t("attackTitle", { blocked: suite.blocked, total: suite.total })} style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{t("attackColAttack")}</th>
              <th scope="col">{t("attackColLayer")}</th>
              <th scope="col">{t("attackColResult")}</th>
            </tr>
          </thead>
          <tbody>
            {suite.attacks.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.id}</td>
                <td>{t.has(`attacks.a${a.id}`) ? t(`attacks.a${a.id}`) : a.name}</td>
                <td className="xs">{t.has(`attackLayers.${a.layer}`) ? t(`attackLayers.${a.layer}`) : a.layer_label}</td>
                <td>
                  <Tag tone={RESULT_TONE[a.result] ?? "info"}>{t.has(`attackResult.${a.result}`) ? t(`attackResult.${a.result}`) : a.result}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </section>
  );
}
