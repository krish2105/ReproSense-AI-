import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SourceLinks } from "@/components/safety/SourceLinks";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import type { BriefLine, Evidence, PrevisitBrief, Source } from "@/lib/api/types";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/format";
import type { Tone } from "@/lib/rules";

const GROUPS: { key: string; kinds: BriefLine["kind"][] }[] = [
  { key: "urgent", kinds: ["red_flag"] },
  { key: "patterns", kinds: ["pattern"] },
  { key: "cycle", kinds: ["cycle", "pain"] },
  { key: "labs", kinds: ["lab"] },
  { key: "care", kinds: ["care_step"] },
  { key: "questions", kinds: ["question"] },
];
const TONE: Record<string, Tone> = {
  urgent: "urgent",
  new: "discuss",
  ongoing: "info",
  resolved: "ok",
  done: "ok",
  booked: "soon",
  due: "soon",
  H: "discuss",
  L: "discuss",
};
const SHOWN_EVIDENCE = 4;

/**
 * The pre-visit brief (K3): "what changed since the last visit", built from her entries by the rules. Every line
 * shows the entries behind it; on her screens a chip opens that day. Text is the API's, never rewritten here.
 * Shared by her report page and the clinician's record view: `audience` picks the wording and the links.
 */
export async function BriefSection({ brief, locale, audience }: { brief: PrevisitBrief; locale: Locale; audience: "patient" | "clinician" }) {
  const t = await getTranslations("brief");
  const tu = await getTranslations("urgent");
  const her = audience === "patient";
  const id = `brief-${audience}`;
  const date = formatDate(brief.since, locale);
  const lang = brief.lang;
  const groups = GROUPS.map((g) => ({ ...g, lines: brief.lines.filter((l) => g.kinds.includes(l.kind)) })).filter((g) => g.lines.length > 0);
  const nothingNew = !brief.lines.some((l) => l.kind !== "question" && l.status !== "ongoing");
  return (
    <section className={her ? "box" : undefined} aria-labelledby={id} data-testid="previsit-brief" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 id={id} style={{ fontSize: her ? 19 : 17 }}>
          {her ? t("title") : t("clinicTitle")}
        </h2>
        <p className="s dim">{her ? t(`since.${brief.since_basis}`, { date }) : t(`clinicSince.${brief.since_basis}`, { date })}</p>
      </div>
      {nothingNew && <p className="s">{t("empty", { date })}</p>}
      {groups.map((g) => (
        <div key={g.key}>
          <h3 className="label" style={{ marginBottom: 8 }}>
            {g.key === "questions" && !her ? t("groups.clinicQuestions") : t(`groups.${g.key}`)}
          </h3>
          <ul className="brief-list">
            {g.lines.map((l) => (
              <li key={l.id} className={l.kind === "red_flag" ? "obs urgent" : undefined}>
                {l.status && TONE[l.status] && (
                  <span>
                    <Tag tone={TONE[l.status]!}>{t(`status.${l.status}`)}</Tag>
                  </span>
                )}
                <p className="s" lang={lang} dir="auto">
                  {l.text}
                </p>
                {l.kind === "red_flag" && her && (
                  <a className="btn btn-a btn-sm" href="tel:998" style={{ alignSelf: "flex-start" }}>
                    <Icon name="phone" size={18} />
                    {tu("call")}
                  </a>
                )}
                {l.kind !== "question" && l.evidence.length > 0 && (
                  <Entries line={l} her={her} lang={lang} label={t("entries")} more={t("more", { n: l.evidence_total - Math.min(l.evidence.length, SHOWN_EVIDENCE) })} />
                )}
                {l.kind !== "question" && <SourceLinks sources={l.sources as Source[]} />}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="xs faint">
        {brief.written_by === "template"
          ? t(her ? "template" : "clinicTemplate")
          : t(her ? "model" : "clinicModel", { n: brief.dropped_sentences })}
      </p>
    </section>
  );
}

function href(e: Evidence): string {
  return e.entry_id.startsWith("lab-") ? "/app/documents" : `/app/log?date=${e.date}`;
}

function Entries({ line, her, lang, label, more }: { line: BriefLine; her: boolean; lang: string; label: string; more: string }) {
  const shown = line.evidence.slice(0, SHOWN_EVIDENCE);
  const rest = line.evidence_total - shown.length;
  return (
    <ul className="chips" aria-label={label} style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {shown.map((e) => (
        <li key={e.entry_id} lang={lang} dir="auto">
          {her ? (
            <Link className="ev" href={href(e)} style={{ display: "inline-block", textDecoration: "none", color: "inherit" }}>
              {e.text}
            </Link>
          ) : (
            <span className="ev" style={{ display: "inline-block" }}>
              {e.text}
            </span>
          )}
        </li>
      ))}
      {rest > 0 && <li className="ev ev-more">{more}</li>}
    </ul>
  );
}
