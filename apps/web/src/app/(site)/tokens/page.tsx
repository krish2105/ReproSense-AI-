import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { formatDayMonth } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { UrgentCard } from "@/components/ui/UrgentCard";
import { TokenActions } from "./TokenActions";
import { TokenValue } from "./TokenValue";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tokens");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

// Token names are code identifiers (shown as-is in both languages); everything a person reads comes from messages.
const GROUPS = [
  { key: "surfaces", tokens: ["--paper", "--sheet", "--tint", "--rule", "--rule-2"] },
  { key: "text", tokens: ["--ink", "--ink-2", "--ink-3"] },
  { key: "actions", tokens: ["--plum", "--plum-ink", "--accent", "--accent-soft"] },
  { key: "phases", tokens: ["--ph-m", "--ph-f", "--ph-o", "--ph-l"] },
  { key: "states", tokens: ["--ok", "--ok-soft", "--warn", "--warn-soft", "--urgent", "--urgent-soft"] },
] as const;

export default async function TokensPage() {
  const t = await getTranslations();
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  // Weekday initials for the calendar specimen, Monday first (2026-11-16 is a Monday).
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 10, 16 + i, 12))),
  );
  const tabs = ["home", "log", "timeline", "insights", "assistant", "report"] as const;
  const tabIcons = ["home", "calendar", "analytics", "patterns", "chat", "report"] as const;
  return (
    <>
      <h1 className="page-title">{t("tokens.title")}</h1>
      <p className="page-intro">{t("tokens.intro")}</p>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("tokens.colours")}</h2>
      {GROUPS.map((g) => (
        <section key={g.key} aria-labelledby={`g-${g.key}`} style={{ marginTop: 16 }}>
          <h3 id={`g-${g.key}`} className="label" style={{ marginBottom: 8 }}>
            {t(`tokens.${g.key}`)}
          </h3>
          <div className="sw">
            {g.tokens.map((name) => (
              <div key={name}>
                <i style={{ background: `var(${name})` }} />
                <p>
                  <b className="ltr">{name}</b>
                  <br />
                  <TokenValue name={name} />
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("tokens.type")}</h2>
      <div className="gal">
        <section>
          <p style={{ fontSize: "clamp(38px,5.2vw,64px)", fontWeight: 700, letterSpacing: "-.035em", lineHeight: 1.04 }}>Aa 64</p>
          <p style={{ fontSize: "clamp(28px,3.3vw,42px)", fontWeight: 700, letterSpacing: "-.03em" }}>Aa 42</p>
          <p style={{ fontSize: 22, fontWeight: 700 }}>Aa 22</p>
          <p style={{ fontSize: 16 }}>Aa 16</p>
          <p className="s">Aa 14</p>
          <p className="label">Aa 13 label</p>
          <p className="xs">Aa 12.5</p>
          <p className="big mono">28 · 35 · 42</p>
          <p lang="ar" dir="rtl" style={{ fontFamily: "var(--f-ar)", fontSize: 18 }}>
            {t("chrome.footer")}
          </p>
        </section>
        <section>
          <h3>{t("tokens.shape")}</h3>
          <div className="box">22px · --shadow-s</div>
          <div className="panel" style={{ padding: 14 }}>
            24px · panel
          </div>
          <div style={{ background: "var(--sheet)", borderRadius: 24, padding: 14, boxShadow: "var(--shadow)" }}>24px · --shadow</div>
          <span className="tag t-info" style={{ alignSelf: "flex-start" }}>
            999px
          </span>
        </section>
      </div>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("tokens.components")}</h2>
      <div style={{ marginTop: 12 }}>
        <TokenActions />
      </div>
      <p className="s dim" style={{ marginTop: 12 }}>
        {t("tokens.specimenNote")}
      </p>
      <div className="gal" inert>
        <section>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="btn btn-a">{t("demo.openClinic")}</span>
            <span className="btn btn-o">{t("demo.reset")}</span>
            <span className="btn btn-a btn-sm">{t("urgent.call")}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Tag tone="urgent">{t("tags.urgent")}</Tag>
            <Tag tone="soon">{t("tags.soon")}</Tag>
            <Tag tone="discuss">{t("tags.discuss")}</Tag>
            <Tag tone="ok">{t("tags.ok")}</Tag>
            <Tag tone="info">{t("stages.periods")}</Tag>
          </div>
          <div className="days">
            {[18, 19, 20, 21, 22, 23, 24].map((d, i) => (
              <div key={d} className={`dp${i === 4 ? " now" : i > 4 ? " fut" : ""}`}>
                <span className="ltr">{d}</span>
                <i>{i < 4 ? <Icon name="check" size={14} /> : null}</i>
              </div>
            ))}
          </div>
          <div className="pills">
            <button type="button" aria-pressed="false">3</button>
            <button type="button" aria-pressed="true">6</button>
            <button type="button" aria-pressed="false">12</button>
          </div>
          <div className="seg">
            <button type="button" aria-pressed="true">{t("stages.periods")}</button>
            <button type="button" aria-pressed="false">{t("stages.pregnancy")}</button>
            <button type="button" aria-pressed="false">{t("stages.after_birth")}</button>
          </div>
          <div className="chips">
            <button type="button">{formatDayMonth("2026-10-22", locale)}</button>
            <button type="button">{formatDayMonth("2026-11-04", locale)}</button>
          </div>
          <span className="meter" aria-hidden="true">
            <i className="on" />
            <i className="on" />
            <i className="on" />
            <i />
          </span>
        </section>
        <section>
          <div className="obs">
            <span className="tag t-discuss" style={{ alignSelf: "flex-start" }}>
              {t("tags.discuss")}
            </span>
            <h4>{t("tags.discuss")}</h4>
            <p className="s dim">{t("meta.description")}</p>
          </div>
          <UrgentCard title={t("tags.urgent")} headingLevel={3} />
        </section>
        <section>
          <div className="chat">
            <div className="msg me">{t("tags.discuss")}?</div>
            <div className="msg ai">
              {t("meta.description")}
              <div className="cites">
                <span>[1] NICE NG88</span>
              </div>
            </div>
            <div className="msg ai urg">{t("urgent.action")}</div>
          </div>
          <div className="sugg">
            <button type="button">{t("tags.discuss")}</button>
          </div>
          <div className="askbar">
            <input type="text" aria-label={t("tabs.assistant")} defaultValue="" />
            <button type="button" aria-label={t("tabs.assistant")}>
              <Icon name="mic" size={18} />
            </button>
            <button type="submit" aria-label={t("tabs.assistant")}>
              <Icon name="send" size={18} />
            </button>
          </div>
        </section>
        <section>
          <div className="cal">
            {weekdays.map((d, i) => (
              <span key={i} className="h">
                {d}
              </span>
            ))}
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className={i < 2 ? "o" : i >= 4 && i <= 8 ? "bl" : i === 11 ? "td" : ""}>
                {i + 1}
              </span>
            ))}
          </div>
          <div className="ldata">
            <div>
              <b>{t("tabs.log")}</b>
              <small>{t("tags.ok")}</small>
            </div>
            <div>
              <b>{t("tabs.timeline")}</b>
              <small>{t("tags.discuss")}</small>
            </div>
          </div>
          <div className="moods">
            {["🙂", "😴", "😣", "😔", "⚡"].map((e) => (
              <button key={e} type="button">
                <em>{e}</em>
              </button>
            ))}
          </div>
          <div style={{ position: "relative", height: 84 }}>
            <div className="tabbar" style={{ position: "absolute", insetInline: 0, bottom: 0 }}>
              {tabs.map((k, i) => (
                <a key={k} aria-current={i === 0 ? "page" : undefined}>
                  <Icon name={tabIcons[i]!} />
                  <span>{t(`tabs.${k}`)}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
