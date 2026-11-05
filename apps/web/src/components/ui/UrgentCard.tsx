import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Red-flag card (.obs.urgent). The first line is always the action (clinical-copy-guard "Urgent wording"),
 * never behind a tap. Title and body come from the API's red-flag text.
 */
export function UrgentCard({ title, children, headingLevel = 2 }: { title: string; children?: ReactNode; headingLevel?: 2 | 3 }) {
  const t = useTranslations("urgent");
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className="obs urgent" aria-label={title}>
      <p>
        <b>{t("action")}</b>
      </p>
      <H>{title}</H>
      {children}
      <a className="btn btn-a btn-sm" href="tel:998" style={{ alignSelf: "flex-start" }}>
        <Icon name="phone" size={18} />
        {t("call")}
      </a>
    </section>
  );
}
