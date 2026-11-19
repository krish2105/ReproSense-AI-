import { getTranslations } from "next-intl/server";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Tag } from "@/components/ui/Tag";
import type { Locale } from "@/i18n/config";
import type { FollowUpHistory, FollowUpStep } from "@/lib/api/types";
import { formatDayMonth, isolate } from "@/lib/format";
import { dubaiDay, stepKey } from "@/lib/followups";

/**
 * Her follow-ups told in her words, one line per step: "Your clinic booked this on 21 Nov". What opened it and its
 * source, when she shared, when her clinic acted, whether her result came back, and what has not happened yet.
 * The clinic is named; a staff member never is. Care steps and dates only: no score, no diagnosis.
 */
export async function FollowUpStory({ items, locale }: { items: FollowUpHistory[]; locale: Locale }) {
  const t = await getTranslations("followups");
  if (!items.length) return null;
  const day = (iso: string) => formatDayMonth(dubaiDay(iso), locale);
  const line = (s: FollowUpStep) =>
    t(`steps.${stepKey(s)}`, {
      date: day(s.at),
      clinic: isolate(s.evidence.clinic ?? t("yourClinic")),
      title: isolate(s.evidence.title ?? ""),
    });
  return (
    <section className="box" aria-labelledby="fu-title" data-testid="follow-up-story">
      <p className="eyebrow-s">{t("eyebrow")}</p>
      <h2 id="fu-title" style={{ fontSize: 17, marginTop: 4 }}>
        {t("title")}
      </h2>
      <p className="xs" style={{ margin: "6px 0 4px" }}>
        {t("intro")}
      </p>
      {items.map((h) => {
        const opened = h.steps.find((s) => s.step === "opened");
        const status = h.follow_up.status;
        return (
          <article key={h.follow_up.id} className="fu-item" data-follow-up={h.follow_up.type}>
            <div className="kv" style={{ alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 15 }}>{t.has(`type.${h.follow_up.type}`) ? t(`type.${h.follow_up.type}`) : t("type.other")}</h3>
              <span style={{ display: "inline-flex", gap: 6 }}>
                {h.follow_up.overdue && <Tag tone="soon">{t("overdue")}</Tag>}
                <Tag tone={status === "closed" ? "ok" : status === "in_progress" ? "info" : "soon"}>{t(`status.${status}`)}</Tag>
              </span>
            </div>
            <ol className="story story-her">
              {h.steps.map((s, i) => (
                <li key={`${s.step}-${i}`} data-step={s.step}>
                  <span className="story-when">
                    <time dateTime={s.at}>{day(s.at)}</time>
                  </span>
                  <div className="story-body">
                    <p className="s">{line(s)}</p>
                    {s.days !== null && s.days > 0 && <p className="xs faint">{t("daysAfter", { count: s.days })}</p>}
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
            {opened?.evidence.why && (
              <p className="xs dim" dir="auto">
                {opened.evidence.why}
              </p>
            )}
            <SourceLinks sources={opened?.evidence.sources ?? []} />
          </article>
        );
      })}
    </section>
  );
}
