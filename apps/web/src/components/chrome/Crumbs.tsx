import Link from "next/link";
import { useTranslations } from "next-intl";
import { LinkPending } from "./LinkPending";

export interface Crumb {
  href?: string;
  label: string;
}

/** "Clinician › Fatima K." on a page below an area's home (docs/31 §A): every part but the last is a link back up, the
 *  last is this page. Names from the API go in <bdi> so an English name keeps its order inside Arabic. */
export function Crumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations("chrome");
  return (
    <nav aria-label={t("crumbsLabel")} className="crumbs">
      <ol>
        {items.map((c, i) => (
          <li key={`${i}-${c.label}`}>
            {c.href && i < items.length - 1 ? (
              <Link href={c.href}>
                <bdi>{c.label}</bdi>
                <LinkPending />
              </Link>
            ) : (
              <span aria-current="page">
                <bdi>{c.label}</bdi>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
