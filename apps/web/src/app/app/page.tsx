import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AfterBirthArc, CycleArc, PregnancyArc } from "@/components/charts/Arc";
import { DayPills } from "@/components/home/DayPills";
import { MoodRow } from "@/components/home/MoodRow";
import { NavigatorCard } from "@/components/home/NavigatorCard";
import { PatternSummary } from "@/components/home/PatternSummary";
import { Recommendations } from "@/components/home/Recommendations";
import { StageSwitch } from "@/components/home/StageSwitch";
import { isTabReady } from "@/components/chrome/tabs";
import { CrisisCard } from "@/components/safety/CrisisCard";
import { PregnancyWarning } from "@/components/safety/PregnancyWarning";
import { RedFlagCard } from "@/components/safety/RedFlagCard";
import { Box } from "@/components/ui/Box";
import { ButtonLink } from "@/components/ui/Button";
import Link from "next/link";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { HomeResponse } from "@/lib/api/types";
import { firstName, formatDate, isolate, shownName } from "@/lib/format";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return { title: t("metaTitle") };
}

// Home (HANDOFF §5, mockup tToday/todayTop/recs). Order: red flags, then her day, then what to do next.
export default async function Home() {
  await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations();
  const h = await apiServer<HomeResponse>("/me/home", { query: { lang: locale } });
  const name = firstName(h.profile.alias, locale);
  const soon = h.observations.find((o) => o.urgency === "soon");
  const gap = soon ? h.care_gaps.find((g) => g.type === soon.creates_care_gap) : undefined;
  const latestDraft = soon ? h.navigator_drafts.find((d) => d.rule_id === soon.observation_id && d.status !== "discarded") : undefined;
  const peri = h.observations.find((o) => o.observation_id === "OBS_PERIMENOPAUSE_SYMPTOMS");
  const vasomotor = peri ? Number(peri.values.vasomotor_days_90 ?? NaN) : NaN;

  return (
    <div className="home-grid">
      <div className="home-col">
        {h.crisis && <CrisisCard />}
        {h.red_flags.length > 0 && (
          <section aria-label={t("home.urgentTitle")} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {h.red_flags.map((c) => (
              <RedFlagCard key={c.observation_id} card={c} locale={locale} />
            ))}
          </section>
        )}

        <div className="kv" style={{ alignItems: "center" }}>
          <div className="hello">
            <p>{t("home.hello", { name: isolate(name) })}</p>
            <h1 style={{ fontSize: 22, marginTop: 2 }}>{t("home.sub", { date: formatDate(h.ref_date, locale) })}</h1>
          </div>
          <span className="ava" aria-hidden="true">
            {shownName(h.profile.alias, locale)[0]}
          </span>
        </div>
        {/* The stage switch opens a fictional demo person; on a record she started herself it would leave her own. */}
        {!h.profile.id.startsWith("guest-") && <StageSwitch current={h.profile.life_stage} />}

        {h.status.mode === "cycle" && <DayPills pills={h.day_pills} locale={locale} />}
        {h.status.mode === "cycle" && <CycleArc status={h.status} locale={locale} peri={h.profile.life_stage === "perimenopause"} />}
        {h.status.mode === "pregnancy" && <PregnancyArc status={h.status} />}
        {h.status.mode === "pregnancy" && <PregnancyWarning />}
        {h.status.mode === "after_birth" && <AfterBirthArc status={h.status} />}

        <ButtonLink href="/app/log" size="wide">
          {t("home.logButton")}
        </ButtonLink>

        {(h.status.mode === "after_birth" || h.status.mode === "pregnancy") && !h.crisis && (
          <Box>
            <p className="label">{t("checkin.cardTitle")}</p>
            <p className="s" style={{ margin: "4px 0 10px" }}>
              {t("checkin.cardBody")}
            </p>
            <ButtonLink href="/app/checkin" variant="outline" size="sm">
              {t("checkin.cardAction")}
            </ButtonLink>
          </Box>
        )}

        {soon && <NavigatorCard key={`${h.profile.id}-${soon.observation_id}`} card={soon} dueDate={gap?.due_date} latest={latestDraft} />}
      </div>

      <div className="home-col">
        <Recommendations items={h.recommendations} />

        <section aria-labelledby="mood-title" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 id="mood-title" style={{ fontSize: 17 }}>
            {t("home.moodTitle")}
          </h2>
          <MoodRow key={h.profile.id} initial={h.today_mood} />
        </section>

        {Number.isFinite(vasomotor) && (
          <Box>
            <p className="label">{t("home.periTitle")}</p>
            <p className="big" style={{ marginTop: 6 }}>
              {t("home.periDays", { count: vasomotor })}
            </p>
          </Box>
        )}

        {!h.crisis && <PatternSummary cards={h.observations} />}

        <p className="xs faint">
          {t("home.record", {
            count: h.days_logged,
            strength: t.has(`home.strength.${h.record_strength}`) ? t(`home.strength.${h.record_strength}`) : h.record_strength,
          })}
        </p>
        <nav className="box" aria-labelledby="more-title">
          <h2 id="more-title" style={{ fontSize: 15 }}>
            {t("more.title")}
          </h2>
          <ul className="links-list">
            <li>
              <Link href="/app/documents">{t("more.documents")}</Link>
            </li>
            <li>
              <Link href="/app/privacy">{t("more.privacy")}</Link>
            </li>
            <li>
              <Link href="/app/checkin">{t("more.checkin")}</Link>
            </li>
          </ul>
        </nav>
        {isTabReady("report") && (
          <ButtonLink href="/app/report" variant="outline" size="wide">
            {t("home.reportButton")}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
