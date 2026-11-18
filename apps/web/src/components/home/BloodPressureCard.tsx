import { useTranslations } from "next-intl";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import type { BpSummary } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { bpLevel, bpText } from "@/lib/bp";
import { formatDayMonth } from "@/lib/format";
import { SOURCES } from "@/lib/sources";

/**
 * Her latest blood-pressure reading on home (build week K6), in pregnancy and the 12 weeks after birth. A number and
 * a link to log the next one; any urgent card for a reading is already at the top of home (red flags first).
 */
export function BloodPressureCard({ bp, locale }: { bp: BpSummary; locale: Locale }) {
  const t = useTranslations("bp");
  const r = bp.latest;
  const level = r ? bpLevel(r) : null;
  return (
    <section className="box" aria-labelledby="bp-home-title" data-testid="bp-card">
      <div className="kv" style={{ alignItems: "baseline" }}>
        <h2 id="bp-home-title" style={{ fontSize: 17 }}>
          {t("title")}
        </h2>
        {level && <Tag tone={level === "severe" ? "urgent" : "soon"}>{t(level === "severe" ? "noteSevere" : "noteRaised")}</Tag>}
      </div>
      {r ? (
        <>
          <p className="big" style={{ marginTop: 6 }}>
            <bdi className="mono">{bpText(r)}</bdi> <span className="s dim">{t("unit")}</span>
          </p>
          <p className="xs faint">
            {t("homeLatest", {
              when: r.time ? t("at", { date: formatDayMonth(r.date, locale), time: r.time }) : formatDayMonth(r.date, locale),
            })}
          </p>
        </>
      ) : (
        <p className="s" style={{ marginTop: 6 }}>
          {t("homeNone")}
        </p>
      )}
      <p className="xs" style={{ margin: "8px 0 10px" }}>
        {t("warn")}
      </p>
      <ButtonLink href="/app/log" variant="outline" size="sm">
        {t("homeAction")}
      </ButtonLink>
      <SourceLinks sources={[SOURCES.nice_ng133]} />
    </section>
  );
}
