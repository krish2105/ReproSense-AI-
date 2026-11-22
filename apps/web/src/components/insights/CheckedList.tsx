import { getTranslations } from "next-intl/server";
import { SourceLinks } from "@/components/safety/SourceLinks";
import type { CheckedItem } from "@/lib/api/types";

/**
 * What the period rules checked and did not show: her own numbers next to each rule's threshold, with its source.
 * The text comes from the API (backend/app/services/checked.py). It explains an absent card, e.g. acne without
 * irregular cycles; it never reassures and never diagnoses, and the note under the list says so.
 */
export async function CheckedList({ items, open }: { items: CheckedItem[]; open: boolean }) {
  const t = await getTranslations("insights");
  if (!items.length) return null;
  return (
    <section className="box" data-testid="checked-list">
      <details open={open}>
        <summary>{t("checkedTitle")}</summary>
        <p className="xs dim" style={{ margin: "0 0 10px" }}>
          {t("checkedIntro")}
        </p>
        <ul className="plain" style={{ display: "grid", gap: 12 }}>
          {items.map((c) => (
            <li key={c.id} data-check={c.id}>
              <p className="s" style={{ margin: 0, fontWeight: 600 }} dir="auto">
                {c.label}
              </p>
              <p className="s" dir="auto" style={{ margin: "2px 0 0" }}>
                {c.text}
              </p>
              <SourceLinks sources={c.source_links} />
            </li>
          ))}
        </ul>
        <p className="xs faint" style={{ marginTop: 12 }}>
          {t("checkedNote")}
        </p>
      </details>
    </section>
  );
}
