import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { CycleArc } from "@/components/charts/Arc";
import { Recommendations } from "@/components/home/Recommendations";
import { CycleLedger } from "@/components/landing/CycleLedger";
import { HeroStage } from "@/components/landing/HeroStage";
import { OpenPersona } from "@/components/landing/OpenPersona";
import { ringBeads } from "@/components/landing/ring";
import { SpiralSection } from "@/components/landing/SpiralSection";
import { spiralCycles } from "@/components/landing/spiral";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { isLocale } from "@/i18n/config";
import { isKnownCycle } from "@/lib/api/types";
import { displayName, firstName, formatDate, isolate } from "@/lib/format";
import { getShowcase } from "@/lib/showcase";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { title: { absolute: t("metaTitle") } };
}

// Evidence sources (docs/05_EVIDENCE_AND_RESEARCH.md; DoH programme also in knowledge_base/sources.yaml).
const EVIDENCE = [
  { n: 1, title: "UAE Healthy Future Study, Int J Women's Health 2023", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9939944" },
  { n: 2, title: "Dubai hospital records study, IJERPH 2023", url: "https://pubmed.ncbi.nlm.nih.gov/37174235/" },
  { n: 3, title: "Endometriosis diagnostic delay, scoping review, medRxiv 2024", url: "https://www.medrxiv.org/content/10.1101/2024.01.08.24300988v1.full-text" },
  { n: 4, title: "GDM prevalence in the UAE, Frontiers in Endocrinology 2022", url: "https://www.frontiersin.org/journals/endocrinology/articles/10.3389/fendo.2022.1069477/full" },
  { n: 5, title: "Postpartum diabetes screening after GDM, Diabetic Medicine 2016", url: "https://eprints.soton.ac.uk/394697" },
  { n: 6, title: "Abu Dhabi Programme for the Future of Reproductive Health (DoH, Sept 2026)", url: "https://www.mediaoffice.abudhabi/en/health/abu-dhabi-programme-for-the-future-of-reproductive-health-an-integrated-ecosystem-shaping-standards-research-and-innovation/" },
] as const;
const PARAS = [
  { key: "ev1", cites: [1, 2] },
  { key: "ev2", cites: [3] },
  { key: "ev3", cites: [4, 5] },
  { key: "ev4", cites: [6] },
] as const;
const STAGES = [
  { stage: "periods", persona: "noura", name: "Noura", img: "periods" },
  { stage: "trying_to_conceive", persona: "mariam", name: "Mariam", img: "trying" },
  { stage: "pregnancy", persona: "hessa", name: "Hessa", img: "pregnancy" },
  { stage: "after_birth", persona: "fatima", name: "Fatima", img: "after-birth" },
  { stage: "perimenopause", persona: "layla", name: "Layla", img: "perimenopause" },
] as const;

// Landing (issue #7; mockup view "home"). The first screen shows the product working on Noura's real record.
export default async function Landing() {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations();
  const show = await getShowcase(locale);
  const complete = show ? show.cycles.filter((c) => c.length_days !== null) : [];
  const last6 = complete.slice(-6);
  const outside6 = last6.filter((c) => (c.length_days as number) < 21 || (c.length_days as number) > 35).length;
  const spiral = show ? spiralCycles(show.cycles, show.refDate) : [];

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div>
          <span className="eyebrow">{t("landing.eyebrow")}</span>
          <h1 id="hero-title">{t("landing.h1")}</h1>
          <p className="lede">{t("landing.lede")}</p>
          <div className="acts">
            <OpenPersona persona="noura" className="btn btn-a">
              {t("landing.cta1")}
            </OpenPersona>
            <a className="btn btn-o" href="#evidence">
              {t("landing.cta2")}
            </a>
          </div>
          <p className="who">{t("landing.who")}</p>
        </div>
        {show?.status && isKnownCycle(show.status) ? (
          <HeroStage beads={ringBeads(show.status)} label={t("landing.phoneLabel")}>
            {/* Noura's home screen as she sees it today (mockup #heroPhone), from the same API and components. */}
            <div className="device mini" style={{ height: 680 }}>
              <div className="status" aria-hidden="true">
                <span>9:41</span>
                <span className="xs">●●●</span>
              </div>
              <div className="dev-body" style={{ paddingBottom: 20, overflow: "hidden" }}>
                <div className="kv" style={{ alignItems: "center" }}>
                  <div className="hello">
                    <p>{t("home.hello", { name: isolate(firstName(show.alias)) })}</p>
                    <p className="h">{t("home.sub", { date: formatDate(show.refDate, locale) })}</p>
                  </div>
                  <span className="ava" aria-hidden="true">
                    {displayName(show.alias)[0]}
                  </span>
                </div>
                <CycleArc status={show.status} locale={locale} />
                <OpenPersona persona="noura" to="/app/log" className="btn btn-a btn-wide">
                  {t("home.logButton")}
                </OpenPersona>
                <Recommendations items={show.recommendations} heading={false} />
              </div>
            </div>
            {show.observation && (
              <div className="floatc a">
                <Tag tone="discuss" className="self-start">
                  {t("tags.discuss")}
                </Tag>
                <b dir="auto">{show.observation.title}</b>
                <span className="xs dim">{t("landing.floatFrom", { count: show.observation.why_we_noticed.length })}</span>
              </div>
            )}
            <div className="floatc b">
              <span className="xs faint">{t("landing.floatCopilot")}</span>
              <span>{t("landing.floatQuestion")}</span>
              <span className="xs" style={{ color: "var(--accent-text)", fontWeight: 700 }} dir="ltr">
                {t("landing.floatCites")}
              </span>
            </div>
          </HeroStage>
        ) : (
          <div className="hero-vis">
            <p className="s dim">{t("landing.noData")}</p>
          </div>
        )}
      </section>

      {spiral.length > 0 && (
        <section className="sec" aria-labelledby="spiral-title">
          <span className="eyebrow">{t("landing.spiralEyebrow")}</span>
          <h2 id="spiral-title" style={{ marginTop: 14 }}>
            {t("landing.spiralTitle")}
          </h2>
          <p className="intro">{t("landing.spiralIntro")}</p>
          <div className="spiral-grid">
            <SpiralSection cycles={spiral} />
            <div className="panel chart-panel">
              <div className="cap">
                <h3 style={{ fontSize: 16 }}>{t("landing.chartTitle")}</h3>
                <span className="xs faint">{t("landing.chartMeta", { cycles: complete.length, days: show?.daysLogged ?? 0 })}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <CycleLedger cycles={show?.cycles ?? []} locale={locale} />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sec" aria-labelledby="stages-title">
        <span className="eyebrow">{t("landing.stagesEyebrow")}</span>
        <h2 id="stages-title" style={{ marginTop: 14 }}>
          {t("landing.stagesTitle")}
        </h2>
        <p className="intro">{t("landing.stagesIntro")}</p>
        <ul className="stages" style={{ listStyle: "none", padding: 0 }}>
          {STAGES.map((s) => (
            <li key={s.stage} style={{ display: "flex" }}>
              <OpenPersona persona={s.persona} className="stage">
                <Image src={`/images/stages/${s.img}.png`} alt="" width={56} height={56} />
                <b>{t(`stages.${s.stage}`)}</b>
                <span>{t(`landing.stageDesc.${s.stage}`)}</span>
                <span className="xs" style={{ color: "var(--accent-text)", fontWeight: 700 }}>
                  {t("landing.stageOpen", { name: s.name })}
                </span>
              </OpenPersona>
            </li>
          ))}
        </ul>
      </section>

      <section className="sec" id="evidence" aria-labelledby="evidence-title" style={{ scrollMarginTop: 100 }}>
        <h2 id="evidence-title">{t("landing.evidenceTitle")}</h2>
        <div className="evid">
          <div className="prose">
            {PARAS.map((p) => (
              <p key={p.key}>
                {t(`landing.${p.key}`)}{" "}
                {p.cites.map((n) => (
                  <sup key={n}>
                    <a href={`#src-${n}`} style={{ textDecoration: "none", fontWeight: 700 }}>
                      [{n}]
                    </a>
                  </sup>
                ))}
              </p>
            ))}
          </div>
          <div className="panel fig">
            <div className="row">
              <h3 style={{ fontSize: 15 }}>{t("landing.sources")}</h3>
              <ol className="plain" style={{ marginTop: 8 }} lang="en">
                {EVIDENCE.map((e) => (
                  <li key={e.n} id={`src-${e.n}`} className="src" style={{ marginTop: 6 }} dir="ltr">
                    <a href={e.url} target="_blank" rel="noopener noreferrer">
                      {e.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {show && (
        <section className="sec" aria-labelledby="trace-title">
          <h2 id="trace-title">{t("landing.traceTitle")}</h2>
          <p className="intro">{t("landing.traceIntro")}</p>
          <ol className="trace" style={{ listStyle: "none", padding: 0 }}>
            {[
              { v: "t1Verb", h: "t1Title", b: t("landing.t1Body", { days: show.daysLogged }) },
              { v: "t2Verb", h: "t2Title", b: t("landing.t2Body", { outside: outside6, count: last6.length }) },
              { v: "t3Verb", h: "t3Title", b: t("landing.t3Body") },
              { v: "t4Verb", h: "t4Title", b: t("landing.t4Body") },
            ].map((s) => (
              <li key={s.v}>
                <span className="verb">{t(`landing.${s.v}`)}</span>
                <h3 style={{ fontSize: 15 }}>{t(`landing.${s.h}`)}</h3>
                <p className="s dim">{s.b}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="sec" aria-labelledby="model-title">
        <h2 id="model-title">{t("landing.modelTitle")}</h2>
        <div className="split">
          <div>
            <h3>{t("landing.womenTitle")}</h3>
            <p>{t("landing.womenBody")}</p>
            <p className="price">{t("landing.womenPrice")}</p>
          </div>
          <div>
            <h3>{t("landing.clinicTitle")}</h3>
            <p>{t("landing.clinicBody")}</p>
            <p className="price">{t("landing.clinicPrice")}</p>
            <Link className="link s" href="/pricing">
              {t("landing.pricingLink")}
            </Link>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="promises-title">
        <h2 id="promises-title">{t("landing.promisesTitle")}</h2>
        <dl className="commit">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <dt>{t(`landing.p${i}t`)}</dt>
              <dd>{t(`landing.p${i}b`)}</dd>
            </div>
          ))}
        </dl>
        <div style={{ marginTop: 28 }}>
          <div className="acts" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ButtonLink href="/demo">{t("landing.finalCta")}</ButtonLink>
            <ButtonLink href="/join" variant="outline">
              {t("join.tryAction")}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
