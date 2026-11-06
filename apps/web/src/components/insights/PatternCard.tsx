import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Tag } from "@/components/ui/Tag";
import type { Card, TraceStep } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { formatDayMonth } from "@/lib/format";
import { DraftButton, TraceButton } from "./CardActions";

const STRENGTH: Record<string, number> = { early: 1, building: 2, strong: 4 };

/**
 * A full pattern card (mockup obsBlock(full)): what pattern, which entries support it (chips open the day),
 * what to consider next, questions for the doctor, sources, and how it was produced (CLAUDE.md rule 3).
 */
export async function PatternCard({
  card,
  trace,
  version,
  strength,
  cycles,
  days,
  locale,
}: {
  card: Card;
  trace: TraceStep[];
  version: string;
  strength: string;
  cycles: number;
  days: number;
  locale: Locale;
}) {
  const t = await getTranslations();
  const filled = STRENGTH[strength] ?? 1;
  return (
    <article className="obs" id={card.observation_id} aria-labelledby={`${card.observation_id}-t`} style={{ scrollMarginTop: 120 }}>
      <span>
        <Tag tone={card.urgency}>{t(`tags.${card.urgency}`)}</Tag>
      </span>
      <h2 id={`${card.observation_id}-t`} style={{ fontSize: 17 }} dir="auto">
        {card.title}
      </h2>
      <p className="s" dir="auto">
        {card.summary}
      </p>
      {card.explains && (
        <p className="s dim" dir="auto">
          {card.explains}
        </p>
      )}
      {card.why_we_noticed.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 6 }}>
            {t("insights.why")}
          </p>
          <ul className="chips" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {card.why_we_noticed.map((e) => (
              <li key={e.entry_id}>
                <Link className="ev" href={`/app/log?date=${e.date}`} dir="auto" style={{ display: "inline-block", textDecoration: "none", color: "inherit" }}>
                  {e.text || formatDayMonth(e.date, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="kv" style={{ flexWrap: "wrap" }}>
        <span className="xs dim">
          {t("insights.strength", { strength: t.has(`home.strength.${strength}`) ? t(`home.strength.${strength}`) : strength })}
          <span className="meter" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <i key={i} className={i <= filled ? "on" : undefined} />
            ))}
          </span>
          {t("insights.strengthDetail", { cycles, days })}
        </span>
        <TraceButton card={card} trace={trace} version={version} />
      </div>
      {card.what_to_consider.length > 0 && (
        <details>
          <summary>{t("insights.consider")}</summary>
          <ul className="plain">
            {card.what_to_consider.map((x) => (
              <li key={x} dir="auto">
                {x}
              </li>
            ))}
          </ul>
        </details>
      )}
      {card.questions_for_doctor.length > 0 && (
        <details>
          <summary>{t("insights.questions")}</summary>
          <ul className="plain">
            {card.questions_for_doctor.map((x) => (
              <li key={x} dir="auto">
                {x}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {card.urgency !== "urgent" && <DraftButton card={card} />}
        <Link className="link xs" href={`/app/assistant?q=${encodeURIComponent(card.questions_for_doctor[0] ?? card.title)}`}>
          {t("insights.ask")}
        </Link>
      </div>
      <p className="xs faint">
        {t("insights.written", { by: card.written_by === "claude" ? "claude" : "template", verified: card.verified_sentences, dropped: card.dropped_sentences })}
      </p>
      <SourceLinks sources={card.sources} />
    </article>
  );
}
