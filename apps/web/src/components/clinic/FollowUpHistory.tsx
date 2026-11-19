import { getTranslations } from "next-intl/server";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Tag } from "@/components/ui/Tag";
import type { Locale } from "@/i18n/config";
import type { FollowUpHistory as History, FollowUpStep } from "@/lib/api/types";
import { formatDayMonth, isolate } from "@/lib/format";
import { dubaiDay, stepKey, stepTone } from "@/lib/followups";

/**
 * One follow-up's loop for the clinician, one line per step: when, who (role and pseudonymous id), how many days it
 * took, and the evidence (the rule and its source, the chained audit entry, her confirmed result). Then what has not
 * happened yet. Read from the audit log; nothing here can be edited. Clinical text from the API stays in English.
 */
export async function FollowUpHistory({ h, locale }: { h: History; locale: Locale }) {
  const t = await getTranslations("clinic.history");
  const day = (iso: string) => formatDayMonth(dubaiDay(iso), locale);
  const clock = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
  const span = (n: number | null) => (n === null ? t("none") : t("dayCount", { count: n }));
  const line = (s: FollowUpStep) => {
    const e = s.evidence;
    switch (stepKey(s)) {
      case "opened":
        return t("steps.opened", { rule: isolate(e.rule_id ?? "") });
      case "shared":
        return t("steps.shared", { clinic: isolate(e.clinic ?? "") });
      case "sharedBefore":
        return t("steps.sharedBefore", { clinic: isolate(e.clinic ?? "") });
      case "result":
        return t("steps.result", { tests: isolate((e.tests ?? []).map((x) => `${x.test} ${x.value}${x.unit ? ` ${x.unit}` : ""}`).join("; ")) });
      default:
        return t(`steps.${stepKey(s)}`);
    }
  };
  return (
    <details className="loop-story" data-testid={`history-${h.follow_up.id}`}>
      <summary>{t("toggle", { count: h.steps.length })}</summary>
      <ol className="story">
        {h.steps.map((s, i) => (
          <li key={`${s.step}-${i}`} data-step={s.step}>
            <span className="story-when">
              <time dateTime={s.at}>{day(s.at)}</time>
              <span className="xs faint" dir="ltr">
                {clock.format(new Date(s.at))}
              </span>
            </span>
            <div className="story-body">
              <p className="s">
                <b>{line(s)}</b> <Tag tone={stepTone(s)}>{t(`kind.${s.step}`)}</Tag>
              </p>
              <p className="xs faint">
                {s.actor_id && s.actor_role !== "system" ? t("actorWithId", { role: t(`roles.${s.actor_role}`), id: isolate(s.actor_id) }) : t(`roles.${s.actor_role}`)}
                {s.days !== null && !s.evidence.before_opened && <> · {t("daysAfter", { count: s.days })}</>}
              </p>
              {s.step === "opened" && (
                <>
                  {s.evidence.title && (
                    <p className="xs" lang="en" dir="auto">
                      {s.evidence.title}
                    </p>
                  )}
                  {s.evidence.why && (
                    <p className="xs dim" lang="en" dir="auto">
                      {s.evidence.why}
                    </p>
                  )}
                  {(s.evidence.entries ?? []).length > 0 && (
                    <ul className="chips" style={{ listStyle: "none", padding: 0, margin: "4px 0 0" }}>
                      {(s.evidence.entries ?? []).map((x) => (
                        <li key={x} className="ev" lang="en" dir="auto">
                          {x}
                        </li>
                      ))}
                    </ul>
                  )}
                  <SourceLinks sources={s.evidence.sources ?? []} />
                </>
              )}
              {s.step === "done" && s.actor_role === "clinician" && (
                <p className="xs dim">
                  {s.evidence.record_opened_before ? t("recordOpened", { date: day(s.evidence.record_opened_before) }) : t("recordNotOpened")}
                </p>
              )}
              {s.evidence.audit_id !== undefined && (
                <p className="xs faint">
                  {t("auditEntry", { id: s.evidence.audit_id })}{" "}
                  <code className="mono" dir="ltr">
                    {s.evidence.audit_hash}
                  </code>
                </p>
              )}
            </div>
          </li>
        ))}
        {h.pending.map((p) => (
          <li key={p} className="pending" data-step={`pending-${p}`}>
            <span className="story-when" aria-hidden="true">
              ·
            </span>
            <div className="story-body">
              <p className="s dim">{t(`pending.${p}`)}</p>
            </div>
          </li>
        ))}
      </ol>
      <dl className="story-sum xs">
        <div>
          <dt className="faint">{t("sumBooked")}</dt>
          <dd>{span(h.summary.opened_to_booked)}</dd>
        </div>
        <div>
          <dt className="faint">{t("sumDone")}</dt>
          <dd>{span(h.summary.booked_to_done)}</dd>
        </div>
        <div>
          <dt className="faint">{t("sumResult")}</dt>
          <dd>{span(h.summary.opened_to_result)}</dd>
        </div>
      </dl>
    </details>
  );
}
