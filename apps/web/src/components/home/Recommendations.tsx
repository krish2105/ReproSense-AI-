import { getTranslations } from "next-intl/server";
import type { Recommendation } from "@/lib/api/types";

// Two cards (docs/06 "Today's recommendation"): a next step and a question for the doctor, both from the rules.
const ICON = { next_step: "M12 5v14M5 12h14", question: "M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .8-1 1.5V14M12 17.5v.01" } as const;
const BLOB = { next_step: "var(--ph-m)", question: "var(--ph-l)" } as const;

export async function Recommendations({ items, heading = true }: { items: Recommendation[]; heading?: boolean }) {
  const t = await getTranslations("home");
  if (!items.length) return null;
  const cards = (
    <div className="recs">
      {items.slice(0, 2).map((r) => (
        <div className="rec" key={`${r.kind}-${r.rule}`}>
          <b>
            <span className="blob" style={{ background: BLOB[r.kind] }} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
                <path d={ICON[r.kind]} />
              </svg>
            </span>
            {r.kind === "next_step" ? t("nextStep") : t("askDoctor")}
          </b>
          <p dir="auto">{r.text}</p>
        </div>
      ))}
    </div>
  );
  if (!heading) return cards; // the landing's phone preview has no headings of its own
  return (
    <section aria-labelledby="recs-title" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 id="recs-title" style={{ fontSize: 17 }}>
        {t("recsTitle")}
      </h2>
      {cards}
    </section>
  );
}
