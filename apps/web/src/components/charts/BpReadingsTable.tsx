import { getTranslations } from "next-intl/server";
import { TableScroll } from "@/components/ui/TableScroll";
import type { BpReading } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { bpLevel, bpText } from "@/lib/bp";
import { formatDayMonth } from "@/lib/format";

/**
 * Her blood-pressure readings as a table (build week K6), newest first, for her Patterns screen and the clinician's
 * record. A reading of 140/90 or 160/110 or higher carries the words, never colour alone (NICE NG133 levels, the same
 * numbers as the rules file). Digits stay left to right inside Arabic.
 */
export async function BpReadingsTable({ readings, locale, label }: { readings: BpReading[]; locale: Locale; label: string }) {
  const t = await getTranslations("bp");
  const rows = [...readings].sort((a, b) => `${b.date} ${b.time ?? ""}`.localeCompare(`${a.date} ${a.time ?? ""}`));
  return (
    <TableScroll label={label}>
      <table>
        <thead>
          <tr>
            <th scope="col">{t("colDate")}</th>
            <th scope="col">{t("colTime")}</th>
            <th scope="col">{t("colReading")}</th>
            <th scope="col">{t("colNote")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const level = bpLevel(r);
            return (
              <tr key={r.id}>
                <td>{formatDayMonth(r.date, locale)}</td>
                <td className="mono" dir="ltr">
                  {r.time ?? "–"}
                </td>
                <td className={level ? "mono hi" : "mono"} dir="ltr">
                  {bpText(r)}
                </td>
                <td className="xs">{level === "severe" ? t("noteSevere") : level === "raised" ? t("noteRaised") : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScroll>
  );
}
