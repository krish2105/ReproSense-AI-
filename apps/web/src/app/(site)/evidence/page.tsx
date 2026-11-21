import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { ErrorState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { TableScroll } from "@/components/ui/TableScroll";
import { apiServer } from "@/lib/api/server";
import { formatDate, formatNumber } from "@/lib/format";
import { REPO_URL, repoCommit, repoFile } from "@/lib/repo";
import buildWeek from "@/data/build-week.json";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("evidence");
  return { title: t("metaTitle") };
}

const ROUTES = ["crisis", "urgent", "refuse", "medicine", "answer"] as const;
type Route = (typeof ROUTES)[number];
type Score = { pass: number; of: number };
type Routes = Partial<Record<Route, Score>>;
type Outcome = "blocked" | "not_blocked" | "not_run";

// GET /v1/quality (backend/app/api/quality.py). Every number on this page comes from it; nothing is typed in here.
interface Quality {
  rules_version: string;
  rule_accuracy: Score;
  ai_eval: {
    questions: number;
    grounded_pct: number;
    grounded?: Score;
    refusals: Score;
    red_flags?: Score;
    red_flag_recall_pct: number;
    banned_phrases: number;
    answer_language_match_pct: number;
    mode?: string;
    heldout?: Routes;
    development?: Routes;
    heldout_with_model?: Routes & { model: string; round: number; date?: string };
  } | null;
  /** the published attack-suite score (app/security/attack_results.json); absent until the suite is on main */
  attack_suite?: {
    commit: string;
    date: string;
    total: number;
    blocked: number;
    not_run: number;
    attacks: { id: number; name: string; layer_label: string; result: Outcome }[];
  } | null;
  /** tools/record_evidence.py: test counts, the eval file's date (only while unchanged) and the last Lighthouse run */
  evidence?: {
    recorded: string | null;
    commit: string | null;
    tests: {
      backend: { passed: number; failed: number; skipped: number };
      web_unit: { passed: number; failed: number; files: number };
      e2e: { tests: number; per_project: Record<string, number> };
    } | null;
    eval_committed: string | null;
    lighthouse: {
      measured: string;
      tool: string;
      device: string;
      source: string;
      pages: { path: string; performance: number; accessibility: number; best_practices: number; seo: number; lcp_s: number; tbt_ms: number; cls: number }[];
    } | null;
  } | null;
}

const OUTCOME_TONE = { blocked: "ok", not_blocked: "urgent", not_run: "info" } as const;

/** One measured number: what it is and its result on the left; how it is measured and when on the right. */
function Row({ what, result, how, when }: { what: string; result: ReactNode; how: string; when?: string }) {
  return (
    <li>
      <div>
        <span className="label">{what}</span>
        <span className="ev-num mono">{result}</span>
      </div>
      <div>
        <p className="s dim">{how}</p>
        {when && (
          <p className="xs faint" style={{ marginTop: 4 }}>
            {when}
          </p>
        )}
      </div>
    </li>
  );
}

/** A pass rate drawn to scale (0 to 100% across the cell), with the count in words beside it. */
function Rate({ score, label, fill }: { score: Score; label: string; fill: string }) {
  const pct = score.of ? (100 * score.pass) / score.of : 0;
  return (
    <div className="ev-bar">
      <div className="bar" aria-hidden="true">
        <i style={{ width: `${pct}%`, background: fill }} />
      </div>
      <span className="mono s">{label}</span>
    </div>
  );
}

// The NYU judge's page (HANDOFF §5): every measured number, with how and when it was measured. Numbers are read at
// request time from GET /v1/quality; anything the API does not have is shown as "not measured yet".
export default async function EvidencePage() {
  const t = await getTranslations("evidence");
  const locale = (await getLocale()) as Locale;
  const day = (iso: string) => formatDate(iso, locale);
  const num = (n: number) => formatNumber(n, locale);
  let q: Quality | null = null;
  try {
    q = await apiServer<Quality>("/quality");
  } catch {
    q = null;
  }
  if (!q) return <ErrorState headingLevel={1} title={t("title")} body={t("unavailable")} />;

  const ev = q.evidence ?? null;
  const tests = ev?.tests ?? null;
  const e = q.ai_eval;
  const lh = ev?.lighthouse ?? null;
  const atk = q.attack_suite ?? null;
  const model = e?.heldout_with_model ?? null;
  const commitLink = (sha: string) =>
    function CommitLink(chunks: ReactNode) {
      return (
        <a href={repoCommit(sha)} target="_blank" rel="noopener noreferrer" dir="ltr">
          {chunks}
        </a>
      );
    };
  const notMeasured = <span className="faint">{t("notMeasured")}</span>;
  const of = (s: Score) => t("resultOf", { pass: num(s.pass), of: num(s.of) });
  const pct = (n: number) => t("resultPct", { pct: num(n) });
  const evalWhen = ev?.eval_committed ? t("whenEval", { date: day(ev.eval_committed) }) : t("whenEvalNoDate");
  const heldoutN = e?.heldout ? ROUTES.reduce((n, k) => n + (e.heldout?.[k]?.of ?? 0), 0) : 0;
  const modelWhen = model
    ? model.date
      ? t("modelWhen", { model: model.model, date: day(model.date) })
      : t("modelWhenNoDate", { model: model.model })
    : t("modelNone");

  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>
      {ev?.recorded && (
        <p className="s dim" style={{ marginTop: 10 }}>
          {ev.commit
            ? t.rich("recorded", { date: day(ev.recorded), commit: ev.commit, link: commitLink(ev.commit) })
            : t("recordedNoCommit", { date: day(ev.recorded) })}
        </p>
      )}

      <BuiltSinceAcceptance />

      <section className="panel" aria-labelledby="tests-title" style={{ padding: 22, marginTop: 20 }}>
        <h2 id="tests-title" style={{ fontSize: 19 }}>
          {t("testsTitle")}
        </h2>
        <ul className="ev-list">
          <Row
            what={t("tests.backend.what")}
            result={tests ? t("tests.backend.result", { passed: num(tests.backend.passed), failed: num(tests.backend.failed), skipped: num(tests.backend.skipped) }) : notMeasured}
            how={t("tests.backend.how")}
            when={tests && ev?.recorded ? t("whenCi", { date: day(ev.recorded) }) : ""}
          />
          <Row
            what={t("tests.web.what")}
            result={tests ? t("tests.web.result", { passed: num(tests.web_unit.passed), failed: num(tests.web_unit.failed), files: num(tests.web_unit.files) }) : notMeasured}
            how={t("tests.web.how")}
            when={tests && ev?.recorded ? t("whenCi", { date: day(ev.recorded) }) : ""}
          />
          <Row
            what={t("tests.e2e.what")}
            result={
              tests
                ? t("tests.e2e.result", {
                    tests: num(tests.e2e.tests),
                    desktop: num(tests.e2e.per_project.desktop ?? 0),
                    mobile: num(tests.e2e.per_project.mobile ?? 0),
                  })
                : notMeasured
            }
            how={t("tests.e2e.how")}
            when={tests && ev?.recorded ? t("whenE2e", { date: day(ev.recorded) }) : ""}
          />
        </ul>
      </section>

      <section className="panel" aria-labelledby="rules-title" style={{ padding: 22, marginTop: 20 }}>
        <h2 id="rules-title" style={{ fontSize: 19 }}>
          {t("rulesTitle")}
        </h2>
        <ul className="ev-list">
          <Row
            what={t("rules.what")}
            result={t("rules.result", { pass: num(q.rule_accuracy.pass), of: num(q.rule_accuracy.of) })}
            how={t("rules.how", { version: q.rules_version })}
            when={t("rules.when")}
          />
        </ul>
      </section>

      <section className="panel" aria-labelledby="eval-title" style={{ padding: 22, marginTop: 20 }}>
        {e ? (
          <>
            <h2 id="eval-title" style={{ fontSize: 19 }}>
              {t("evalTitle", { n: num(e.questions) })}
            </h2>
            <p className="s dim" style={{ marginTop: 6 }}>
              {t("evalIntro", {
                mode: !e.mode || e.mode.startsWith("extractive") ? t("modeNone") : t("modeWith", { name: e.mode.replace(/^with /, "") }),
              })}
            </p>
            <p className="xs faint" style={{ marginTop: 4 }}>
              {evalWhen}
            </p>
            <ul className="ev-list">
              <Row what={t("eval.grounded.what")} result={e.grounded ? of(e.grounded) : pct(e.grounded_pct)} how={t("eval.grounded.how")} />
              <Row what={t("eval.refusals.what")} result={of(e.refusals)} how={t("eval.refusals.how")} />
              <Row what={t("eval.redflags.what")} result={e.red_flags ? of(e.red_flags) : pct(e.red_flag_recall_pct)} how={t("eval.redflags.how")} />
              <Row what={t("eval.banned.what")} result={num(e.banned_phrases)} how={t("eval.banned.how")} />
              <Row what={t("eval.language.what")} result={pct(e.answer_language_match_pct)} how={t("eval.language.how")} />
            </ul>
          </>
        ) : (
          <>
            <h2 id="eval-title" style={{ fontSize: 19 }}>
              {t("evalHeading")}
            </h2>
            <p className="s" style={{ marginTop: 8 }}>
              {notMeasured}
            </p>
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="heldout-title" style={{ padding: 22, marginTop: 20 }}>
        <h2 id="heldout-title" style={{ fontSize: 19 }}>
          {t("heldoutTitle")}
        </h2>
        {e?.heldout ? (
          <>
            <p className="s dim" style={{ marginTop: 6 }}>
              {t("heldoutIntro")} {t("heldoutN", { n: num(heldoutN) })}
            </p>
            <TableScroll label={t("heldoutTitle")} style={{ marginTop: 12 }}>
              <table style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th scope="col">{t("colType")}</th>
                    <th scope="col">{t("colWords")}</th>
                    {model && <th scope="col">{t("colModel")}</th>}
                    {e.development && <th scope="col">{t("colDev")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {ROUTES.filter((k) => e.heldout?.[k]).map((k) => (
                    <tr key={k}>
                      <th scope="row" style={{ color: "var(--ink)", fontSize: 13.5 }}>
                        {t(`types.${k}`)}
                      </th>
                      <td>
                        <Rate score={e.heldout![k]!} label={of(e.heldout![k]!)} fill="var(--plum)" />
                      </td>
                      {model && <td>{model[k] ? <Rate score={model[k]!} label={of(model[k]!)} fill="var(--accent)" /> : notMeasured}</td>}
                      {e.development && <td className="mono s dim">{e.development[k] ? of(e.development[k]!) : notMeasured}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <p className="xs faint" style={{ marginTop: 10 }}>
              {t("heldoutWhen", { when: modelWhen })}
            </p>
            {e.development && (
              <p className="xs faint" style={{ marginTop: 4 }}>
                {t("devNote")}
              </p>
            )}
          </>
        ) : (
          <p className="s" style={{ marginTop: 8 }}>
            {notMeasured}
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="attack-title" style={{ padding: 22, marginTop: 20 }}>
        <h2 id="attack-title" style={{ fontSize: 19 }}>
          {t("attackTitle")}
        </h2>
        {atk ? (
          <>
            <ul className="ev-list">
              <Row
                what={t("attackWhat")}
                result={t("attackResult", { blocked: num(atk.blocked), total: num(atk.total) })}
                how={t("attackHow")}
                when={atk.not_run ? t("attackNotRun", { n: num(atk.not_run) }) : ""}
              />
            </ul>
            <p className="xs faint">{t.rich("attackWhen", { commit: atk.commit, date: day(atk.date), link: commitLink(atk.commit) })}</p>
            <TableScroll label={t("attackTitle")} style={{ marginTop: 12 }}>
              <table style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    <th scope="col">{t("colAttack")}</th>
                    <th scope="col">{t("colLayer")}</th>
                    <th scope="col">{t("colOutcome")}</th>
                  </tr>
                </thead>
                <tbody>
                  {atk.attacks.map((a) => (
                    <tr key={a.id}>
                      <td lang="en" dir="auto">
                        {t.has(`attacks.${a.id}.name`) ? t(`attacks.${a.id}.name`) : a.name}
                      </td>
                      <td lang="en" dir="auto" className="dim">
                        {t.has(`attacks.${a.id}.layer`) ? t(`attacks.${a.id}.layer`) : a.layer_label}
                      </td>
                      <td>
                        <Tag tone={OUTCOME_TONE[a.result]}>{t(`attackOutcome.${a.result}`)}</Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </>
        ) : (
          <p className="s" style={{ marginTop: 8 }}>
            {t("attackNone")}
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="lh-title" style={{ padding: 22, marginTop: 20 }}>
        <h2 id="lh-title" style={{ fontSize: 19 }}>
          {t("lighthouseTitle")}
        </h2>
        {lh ? (
          <>
            <p className="s dim" style={{ marginTop: 6 }}>
              {t("lighthouseIntro", {
                tool: lh.tool,
                device: lh.device === "desktop" ? t("devices.desktop") : t("devices.mobile"),
                date: day(lh.measured),
              })}
            </p>
            <TableScroll label={t("lighthouseTitle")} style={{ marginTop: 12 }}>
              <table style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th scope="col">{t("colPage")}</th>
                    <th scope="col">{t("colPerf")}</th>
                    <th scope="col">{t("colA11y")}</th>
                    <th scope="col">{t("colBest")}</th>
                    <th scope="col">{t("colSeo")}</th>
                    <th scope="col">{t("colLcp")}</th>
                    <th scope="col">{t("colTbt")}</th>
                    <th scope="col">{t("colCls")}</th>
                  </tr>
                </thead>
                <tbody className="mono">
                  {lh.pages.map((p) => (
                    <tr key={p.path}>
                      <th scope="row" style={{ color: "var(--ink)" }}>
                        <code dir="ltr">{p.path}</code>
                      </th>
                      <td>{num(p.performance)}</td>
                      <td>{num(p.accessibility)}</td>
                      <td>{num(p.best_practices)}</td>
                      <td>{num(p.seo)}</td>
                      <td>{t("seconds", { n: num(p.lcp_s) })}</td>
                      <td>{t("ms", { n: num(p.tbt_ms) })}</td>
                      <td>{num(p.cls)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <p className="xs faint" style={{ marginTop: 10 }}>
              {t("lighthouseNote")}{" "}
              <a href={repoFile(lh.source)} target="_blank" rel="noopener noreferrer">
                {t("lighthouseSource")}
              </a>
            </p>
          </>
        ) : (
          <p className="s" style={{ marginTop: 8 }}>
            {t("lighthouseNone")}
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="notyet-title" style={{ padding: 22, marginTop: 20 }}>
        <h2 id="notyet-title" style={{ fontSize: 19 }}>
          {t("notYetTitle")}
        </h2>
        <ul className="tier-list" style={{ marginTop: 10 }}>
          {(["n1", "n2", "n3"] as const).map((k) => (
            <li key={k}>{t(`notYet.${k}`)}</li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link href="/trust" className="btn btn-a btn-sm">
            {t("seeTrust")}
          </Link>
          <Link href="/status" className="btn btn-o btn-sm">
            {t("seeStatus")}
          </Link>
        </div>
      </section>
    </>
  );
}

/**
 * What the jury scores the prototype on: work built after the team was accepted. Every pull request merged since
 * build week began, listed from GitHub by tools/build_week.py (src/data/build-week.json), each linked to its code.
 */
async function BuiltSinceAcceptance() {
  const t = await getTranslations("evidence.built");
  const locale = (await getLocale()) as Locale;
  const day = (iso: string) => formatDate(iso, locale);
  const num = (n: number) => formatNumber(n, locale);
  const prs = buildWeek.prs;
  const perDay = Object.entries(
    prs.reduce<Record<string, number>>((acc, p) => ((acc[p.merged] = (acc[p.merged] ?? 0) + 1), acc), {}),
  );
  const most = Math.max(1, ...perDay.map(([, n]) => n));
  return (
    <section id="since-acceptance" className="panel" aria-labelledby="built-title" style={{ padding: 22, marginTop: 22 }}>
      <h2 id="built-title" style={{ fontSize: 19 }}>
        {t("title")}
      </h2>
      <p className="s" style={{ marginTop: 6 }}>
        {t("lead", { n: num(prs.length), since: day(buildWeek.since), people: num(buildWeek.authors.length) })}
      </p>
      <ul className="ev-days" style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 6 }} data-testid="built-per-day">
        {perDay.map(([d, n]) => (
          <li key={d} style={{ display: "grid", gridTemplateColumns: "minmax(90px, auto) 1fr", gap: 10, alignItems: "center" }}>
            <span className="s dim">{day(d)}</span>
            <div className="ev-bar">
              <div className="bar" aria-hidden="true">
                <i style={{ width: `${(100 * n) / most}%`, background: "var(--plum)" }} />
              </div>
              <span className="mono s">{num(n)}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="xs faint" style={{ marginTop: 10 }}>
        {t("before", { n: num(buildWeek.before) })}
      </p>
      <details style={{ marginTop: 12 }}>
        <summary className="s" style={{ cursor: "pointer", fontWeight: 600 }}>
          {t("show", { n: num(prs.length) })}
        </summary>
        <TableScroll label={t("title")} style={{ marginTop: 10 }}>
          <table style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th scope="col">{t("colPr")}</th>
                <th scope="col">{t("colWho")}</th>
                <th scope="col">{t("colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {prs.map((p) => (
                <tr key={p.number}>
                  <td lang="en" dir="auto">
                    <a href={`${REPO_URL}/pull/${p.number}`} target="_blank" rel="noopener noreferrer">
                      <span dir="ltr">#{p.number}</span> {p.title}
                    </a>
                  </td>
                  <td className="mono s dim" dir="ltr">
                    {p.author}
                  </td>
                  <td className="s dim">{day(p.merged)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </details>
      <p className="xs faint" style={{ marginTop: 10 }}>
        {t("when", { date: day(buildWeek.generated) })}
      </p>
    </section>
  );
}
