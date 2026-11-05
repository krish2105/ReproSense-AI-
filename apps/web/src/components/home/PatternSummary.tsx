import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Tag } from "@/components/ui/Tag";
import { isTabReady } from "@/components/chrome/tabs";
import type { Card } from "@/lib/api/types";

/** Up to three pattern cards on Home (compact form of the mockup's obsBlock). Full cards live on Patterns. */
export async function PatternSummary({ cards }: { cards: Card[] }) {
  const t = await getTranslations();
  const linkReady = isTabReady("insights");
  return (
    <section aria-labelledby="patterns-title" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="sec-head">
        <h2 id="patterns-title">{t("home.patternsTitle")}</h2>
        {linkReady && cards.length > 0 && (
          <Link className="link" href="/app/insights">
            {t("home.seeAll")}
          </Link>
        )}
      </div>
      {cards.length === 0 ? (
        <div className="obs">
          <span>
            <Tag tone="ok">{t("tags.ok")}</Tag>
          </span>
          <h3 style={{ fontSize: 16 }}>{t("home.noneTitle")}</h3>
          <p className="xs faint">{t("home.noneBody")}</p>
        </div>
      ) : (
        <div>
          {cards.slice(0, 3).map((c) => (
            <article className="obs" key={c.observation_id}>
              <span>
                <Tag tone={c.urgency}>{t(`tags.${c.urgency}`)}</Tag>
              </span>
              <h3 style={{ fontSize: 16 }} dir="auto">
                {linkReady ? (
                  <Link href={`/app/insights#${c.observation_id}`} style={{ textDecoration: "none" }}>
                    {c.title}
                  </Link>
                ) : (
                  c.title
                )}
              </h3>
              <p className="xs dim" dir="auto">
                {c.summary}
              </p>
              <p className="xs faint">{t("home.fromEntries", { count: c.why_we_noticed.length })}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
