import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { OpenPersona } from "@/components/landing/OpenPersona";
import { Tag } from "@/components/ui/Tag";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("trust");
  return { title: t("metaTitle") };
}

// DoH Responsible AI Standard V1 (research/2026-11-06/01 §5.1, read in full). Status is honest: "planned" means not built.
const DOH_RAI_URL = "https://www.doh.gov.ae/-/media/Feature/Resources/Standards/2025/Responsible-AI-Standard-V1.ashx";
const ROWS = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10", "r11", "r12", "r13"] as const;
const NOT = ["n1", "n2", "n3", "n4", "n5", "n6"] as const;
const TONE = { built: "ok", partly: "info", planned: "soon" } as const;

export default async function TrustPage() {
  const t = await getTranslations("trust");
  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>

      <section className="panel" aria-labelledby="intended-title" style={{ padding: 20, marginTop: 22 }}>
        <h2 id="intended-title" style={{ fontSize: 18 }}>
          {t("intendedTitle")}
        </h2>
        <p className="s" style={{ marginTop: 6 }}>
          {t("intendedBody")}
        </p>
      </section>

      <section aria-labelledby="rai-title" style={{ marginTop: 26 }}>
        <h2 id="rai-title" style={{ fontSize: 20 }}>
          {t("tableTitle")}
        </h2>
        <ol className="trust-list">
          {ROWS.map((r) => {
            const status = t(`rows.${r}.status`) as keyof typeof TONE;
            return (
              <li key={r} className="panel">
                <p className="trust-head">
                  <span className="label mono" dir="ltr">
                    {t("colClause")} {t(`rows.${r}.clause`)}
                  </span>
                  <Tag tone={TONE[status]}>{t(`status.${status}`)}</Tag>
                </p>
                <h3 style={{ fontSize: 15 }}>{t(`rows.${r}.asks`)}</h3>
                <p className="s dim">{t(`rows.${r}.ours`)}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="two" style={{ marginTop: 20 }}>
        <section className="panel" aria-labelledby="not-title" style={{ padding: 20 }}>
          <h2 id="not-title" style={{ fontSize: 18 }}>
            {t("notTitle")}
          </h2>
          <ul className="tier-list" style={{ marginTop: 10 }}>
            {NOT.map((n) => (
              <li key={n}>{t(`not.${n}`)}</li>
            ))}
          </ul>
        </section>
        <section className="panel" aria-labelledby="data-title" style={{ padding: 20 }}>
          <h2 id="data-title" style={{ fontSize: 18 }}>
            {t("dataTitle")}
          </h2>
          <ul className="tier-list" style={{ marginTop: 10 }}>
            <li>{t("data1")}</li>
            <li>{t("data2")}</li>
            <li>{t("data3")}</li>
            <li>{t("data4")}</li>
          </ul>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <OpenPersona persona="noura" to="/app/privacy" className="btn btn-a btn-sm">
              {t("seePrivacy")}
            </OpenPersona>
            <Link href="/status" className="btn btn-o btn-sm">
              {t("seeScorecard")}
            </Link>
          </div>
        </section>
      </div>

      <section aria-labelledby="src-title" className="sec" style={{ marginTop: 36 }}>
        <h2 id="src-title" style={{ fontSize: 15 }}>
          {t("sourcesTitle")}
        </h2>
        <p className="s" style={{ marginTop: 6 }} lang="en" dir="ltr">
          <a href={DOH_RAI_URL} target="_blank" rel="noopener noreferrer">
            {t("sourceDoh")}
          </a>
        </p>
      </section>
    </>
  );
}
