import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { TableScroll } from "@/components/ui/TableScroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return { title: t("metaTitle") };
}

// Price hypotheses and the market behind them (SaaS scorecard: pricing tiers, unit economics). Every number comes
// from research/2026-11-06/04-market-and-competitors.md; prices are hypotheses until the docs/12 interviews back them.
const SOURCES = [
  { n: 1, title: "DoH launches Rewarding Exceptional Quality programme (Abu Dhabi Media Office, 30 Jul 2025)", url: "https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-launches-rewarding-exceptional-quality-programme-recognising-excellence-by-healthcare-providers/" },
  { n: 2, title: "New Abu Dhabi initiative rewards excellence in fertility care (Gulf News, 31 Jul 2025)", url: "https://gulfnews.com/uae/health/new-abu-dhabi-initiative-rewards-excellence-in-fertility-care-1.500217482" },
  { n: 3, title: "Clinicea EMR pricing, Dubai (vendor page)", url: "https://clinicea.com/emr-management-software-dubai" },
  { n: 4, title: "Mindcat Clinic pricing (SaaSworthy listing)", url: "https://www.saasworthy.com/product/mindcat-clinic" },
  { n: 5, title: "Heidi Health review 2026 (Veroscribe)", url: "https://www.veroscribe.com/blog/heidi-health-review-2026" },
  { n: 6, title: "Get your doctor's appointment in seconds (Okadoc, Khaleej Times, 14 May 2019)", url: "https://www.khaleejtimes.com/get-your-doctors-appointment-in-seconds" },
] as const;
const TIERS = [
  { key: "women", bullets: ["b1", "b2", "b3"] },
  { key: "seat", bullets: ["b1", "b2", "b3", "b4"] },
  { key: "clinic", bullets: ["b1", "b2", "b3"] },
  { key: "network", bullets: ["b1", "b2", "b3"] },
] as const;
const Cite = ({ n }: { n: number }) => (
  <sup>
    <a href={`#price-src-${n}`} style={{ textDecoration: "none", fontWeight: 700 }}>
      [{n}]
    </a>
  </sup>
);
// Outside a sentence (the table's source column) a citation is a target of its own: at least 24 px (WCAG 2.5.8).
const CiteTarget = ({ n }: { n: number }) => (
  <a className="cite-target" href={`#price-src-${n}`}>
    [{n}]
  </a>
);

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>

      <ul className="tiers" aria-label={t("metaTitle")}>
        {TIERS.map(({ key, bullets }) => (
          <li key={key} className="panel tier">
            <h2 style={{ fontSize: 18 }}>{t(`tiers.${key}.name`)}</h2>
            <p className="tier-price">
              <span className="big">{t(`tiers.${key}.price`)}</span>{" "}
              <span className="xs dim">
                {key === "seat" ? t("per") : key === "clinic" ? `${t("perMonth")} · ${t("tiers.clinic.sub")}` : key === "network" ? t("tiers.network.sub") : ""}
              </span>
            </p>
            {key === "seat" && <p className="xs faint">{t("perYear")}</p>}
            <ul className="tier-list">
              {bullets.map((b) => (
                <li key={b}>{t(`tiers.${key}.${b}`)}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="two" style={{ marginTop: 20 }}>
        <section className="panel" aria-labelledby="pilot-title" style={{ padding: 20 }}>
          <h2 id="pilot-title" style={{ fontSize: 18 }}>
            {t("pilotTitle")}
          </h2>
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("pilotBody")}
          </p>
          <div style={{ marginTop: 12 }}>
            <ButtonLink href="/demo" size="sm">
              {t("pilotAction")}
            </ButtonLink>
          </div>
        </section>
        <section className="panel" aria-labelledby="payer-title" style={{ padding: 20 }}>
          <h2 id="payer-title" style={{ fontSize: 18 }}>
            {t("payerTitle")}
          </h2>
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("payerBody")}
          </p>
        </section>
      </div>

      <section aria-labelledby="why-title" className="sec" style={{ paddingTop: 36 }}>
        <h2 id="why-title" style={{ fontSize: 22 }}>
          {t("whyTitle")}
        </h2>
        <p className="dim" style={{ marginTop: 6 }}>
          {t("whyIntro")}
        </p>
        <TableScroll label={t("whyTitle")} style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th scope="col">{t("colWhat")}</th>
                <th scope="col">{t("colPrice")}</th>
                <th scope="col">{t("colSource")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("rowPractice")}</td>
                <td>{t("rowPracticePrice")}</td>
                <td>
                  <CiteTarget n={3} />
                  <CiteTarget n={4} />
                </td>
              </tr>
              <tr>
                <td>{t("rowScribe")}</td>
                <td>{t("rowScribePrice")}</td>
                <td>
                  <CiteTarget n={5} />
                </td>
              </tr>
              <tr>
                <td>{t("rowPortal")}</td>
                <td>{t("rowPortalPrice")}</td>
                <td>
                  <CiteTarget n={6} />
                </td>
              </tr>
            </tbody>
          </table>
        </TableScroll>
      </section>

      <section aria-labelledby="market-title" className="sec" style={{ paddingTop: 36 }}>
        <h2 id="market-title" style={{ fontSize: 22 }}>
          {t("marketTitle")}
        </h2>
        <div className="prose" style={{ marginTop: 8 }}>
          <p>
            {t("market1")} <Cite n={1} />
          </p>
          <p>{t("market2")}</p>
          <p>
            {t("market3")} <Cite n={1} /> <Cite n={2} />
          </p>
        </div>
        <h3 style={{ fontSize: 15, marginTop: 18 }}>{t("sourcesTitle")}</h3>
        <ol className="plain" style={{ marginTop: 8 }} lang="en">
          {SOURCES.map((s) => (
            <li key={s.n} id={`price-src-${s.n}`} className="src" style={{ marginTop: 6 }} dir="ltr">
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
        <p className="xs faint" style={{ marginTop: 12 }}>
          {t("note")}
        </p>
      </section>
    </>
  );
}
