import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { TimelineDay } from "@/lib/api/types";
import { slug } from "@/lib/vocab";

/** The logged-data tiles for one day (mockup calBox "Last logged"), with the clay icons cut from E9. */
export async function DayDetail({ entry, dateLabel }: { entry: TimelineDay | undefined; dateLabel: string }) {
  const t = await getTranslations();
  if (!entry)
    return (
      <section className="box" aria-labelledby="day-title">
        <h2 id="day-title" style={{ fontSize: 16 }}>
          {t("log.dayEmpty", { date: dateLabel })}
        </h2>
        <p className="xs faint" style={{ marginTop: 4 }}>
          {t("log.dayEmptyHint")}
        </p>
      </section>
    );
  const sym = entry.symptoms.length ? entry.symptoms.map((s) => (t.has(`symptoms.${slug(s)}`) ? t(`symptoms.${slug(s)}`) : s)).join(", ") : t("log.none");
  const impact = t.has(`impacts.${slug(entry.impact)}`) ? t(`impacts.${slug(entry.impact)}`) : entry.impact;
  const tiles = [
    { icon: "flow", label: t("log.tileFlow"), value: t(`flows.${entry.flow}`) },
    { icon: "pain", label: t("log.tilePain"), value: t("log.painValue", { pain: entry.pain }) },
    { icon: "symptoms", label: t("log.tileSymptoms"), value: sym },
    { icon: "energy", label: t("log.tileImpact"), value: impact },
  ];
  return (
    <section aria-labelledby="day-title" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 id="day-title" style={{ fontSize: 16 }}>
        {t("log.dayTitle", { date: dateLabel })}
      </h2>
      <div className="ldata">
        {tiles.map((x) => (
          <div key={x.label}>
            <Image src={`/images/icons/logged-data/${x.icon}.png`} alt="" width={30} height={30} />
            <span>
              <b>{x.label}</b>
              <small>{x.value}</small>
            </span>
          </div>
        ))}
      </div>
      {(entry.pbac > 0 || entry.sites.length > 0 || entry.note) && (
        <dl className="box s" style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px" }}>
          {entry.pbac > 0 && (
            <>
              <dt className="dim">{t("log.tilePbac")}</dt>
              <dd style={{ margin: 0 }} className={entry.pbac >= 100 ? "hi mono" : "mono"}>
                {entry.pbac}
              </dd>
            </>
          )}
          {entry.sites.length > 0 && (
            <>
              <dt className="dim">{t("log.tileSites")}</dt>
              <dd style={{ margin: 0 }}>{entry.sites.map((s) => (t.has(`sites.${slug(s)}`) ? t(`sites.${slug(s)}`) : s)).join(", ")}</dd>
            </>
          )}
          {entry.note && (
            <>
              <dt className="dim">{t("log.tileNote")}</dt>
              <dd style={{ margin: 0 }} dir="auto">
                {entry.note}
              </dd>
            </>
          )}
        </dl>
      )}
    </section>
  );
}
