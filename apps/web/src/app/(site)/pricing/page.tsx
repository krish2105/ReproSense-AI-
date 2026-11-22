import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return { title: t("metaTitle") };
}

// How ReproSense will be paid for (22 Nov: no prices). ReproSense is a hackathon prototype, so it shows the model and
// how the price will be set with the first pilot clinic, never a number. Buyers increasingly pay for measured outcomes
// rather than per enrolled person (sources below), which is why the price waits for the pilot's measurement.
const SOURCES = [
  { n: 1, title: "Peterson Health Technology Institute: Playbook on Performance-Based Contracting (2026)", url: "https://phti.org/wp-content/uploads/sites/3/2026/08/PHTI-Playbook-on-Performance-Based-Contracting.pdf" },
  { n: 2, title: "Stripe: Pricing models for AI healthcare tools", url: "https://stripe.com/gb/resources/more/pricing-models-for-ai-healthcare-tools" },
] as const;
const PAYERS = ["women", "clinics", "insurers"] as const;
const STEPS = ["s1", "s2", "s3"] as const;

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  return (
    <>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-intro">{t("intro")}</p>

      <ul className="tiers" aria-label={t("whoTitle")} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
        {PAYERS.map((key) => (
          <li key={key} className="panel tier">
            <h2 style={{ fontSize: 18 }}>{t(`who.${key}.name`)}</h2>
            <p className="tier-price">
              <span className="big">{t(`who.${key}.tag`)}</span>
            </p>
            <p className="s dim" style={{ marginTop: 6 }}>
              {t(`who.${key}.body`)}
            </p>
          </li>
        ))}
      </ul>

      <div className="two" style={{ marginTop: 20 }}>
        <section className="panel" aria-labelledby="how-title" style={{ padding: 20 }}>
          <h2 id="how-title" style={{ fontSize: 18 }}>
            {t("howTitle")}
          </h2>
          <ol className="tier-list" style={{ marginTop: 10 }}>
            {STEPS.map((s) => (
              <li key={s}>{t(`how.${s}`)}</li>
            ))}
          </ol>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <ButtonLink href="/pilot#proposal" size="sm">
              {t("actionPilot")}
            </ButtonLink>
            <ButtonLink href="/demo" variant="outline" size="sm">
              {t("actionDemo")}
            </ButtonLink>
          </div>
        </section>
        <section className="panel" aria-labelledby="why-title" style={{ padding: 20 }}>
          <h2 id="why-title" style={{ fontSize: 18 }}>
            {t("whyTitle")}
          </h2>
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("whyBody")}
            <sup>
              <a href="#price-src-1" style={{ textDecoration: "none", fontWeight: 700 }}>
                [1]
              </a>
            </sup>
            <sup>
              <a href="#price-src-2" style={{ textDecoration: "none", fontWeight: 700 }}>
                [2]
              </a>
            </sup>
          </p>
        </section>
      </div>

      <section aria-labelledby="src-title" className="sec" style={{ paddingTop: 30 }}>
        <h3 id="src-title" style={{ fontSize: 15 }}>
          {t("sourcesTitle")}
        </h3>
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
