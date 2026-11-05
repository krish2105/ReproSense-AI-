import Image from "next/image";
import { useTranslations } from "next-intl";
import { UrgentCard } from "@/components/ui/UrgentCard";
import type { Card } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { formatDayMonth } from "@/lib/format";
import { SourceLinks } from "./SourceLinks";

/** A red-flag rule hit from the API, rendered before anything else (CLAUDE.md rule 5). */
export function RedFlagCard({ card, locale, headingLevel = 2 }: { card: Card; locale: Locale; headingLevel?: 2 | 3 }) {
  const t = useTranslations("home");
  const ev = card.why_we_noticed[0];
  return (
    <UrgentCard title={card.title} headingLevel={headingLevel}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Image src="/images/app/red-flag.png" alt="" width={44} height={44} style={{ flex: "none" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          {card.entry_date && <p className="xs">{t("loggedOn", { date: formatDayMonth(card.entry_date, locale) })}</p>}
          {ev && (
            <p className="xs dim" dir="auto">
              {ev.text}
            </p>
          )}
          <SourceLinks sources={card.sources} />
        </div>
      </div>
    </UrgentCard>
  );
}
