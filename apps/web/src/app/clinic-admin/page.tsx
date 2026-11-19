import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { InvitePanel } from "@/components/clinicAdmin/InvitePanel";
import { StepUpExport } from "@/components/staff/StepUpExport";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { ClinicDashboard, InvitesResponse, TeamResponse } from "@/lib/api/types";
import { formatDate, formatNumber, regionKey } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clinicAdmin");
  return { title: t("metaTitle") };
}

// A clinic's own admin (A3): its follow-ups and PC008 part, the team, single-use clinician invites, and a CSV of counts.
// Counts under 10 come back as null (small-group protection) and are shown as "fewer than 10", never as 0.
export default async function ClinicAdminPage() {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("clinicAdmin");
  const tr = await getTranslations("regions");
  const [dash, team, invites] = await Promise.all([
    apiServer<ClinicDashboard>("/clinic-admin/dashboard"),
    apiServer<TeamResponse>("/clinic-admin/team"),
    apiServer<InvitesResponse>("/clinic-admin/invites"),
  ]);
  const n = (v: number | null) => (v === null ? t("fewer", { k: dash.k_min }) : formatNumber(v, locale));
  const f = dash.follow_ups;
  const figs = [
    { id: "open", label: t("open"), value: n(f.open) },
    { id: "booked", label: t("booked"), value: n(f.booked) },
    { id: "done", label: t("done"), value: n(f.done), note: f.done_pct === null ? undefined : t("donePct", { pct: formatNumber(f.done_pct, locale) }) },
    { id: "shared", label: t("shared"), value: n(dash.shared_records) },
  ];
  const pc = dash.pc008_glucose;

  return (
    <>
      <h1 className="page-title">{dash.clinic.name}</h1>
      <p className="page-intro">{t("intro", { region: tr.has(regionKey(dash.clinic.region)) ? tr(regionKey(dash.clinic.region)) : dash.clinic.region })}</p>

      <dl className="figs" aria-label={t("figsLabel")} style={{ marginTop: 22, marginBottom: 0 }}>
        {figs.map((x) => (
          <div key={x.id}>
            <dt className="label">{x.label}</dt>
            <dd className="big mono" style={{ margin: "6px 0 0", fontSize: x.value.length > 6 ? 18 : undefined }}>
              <span className="ltr">{x.value}</span>
            </dd>
            {x.note && <dd className="xs faint" style={{ margin: "6px 0 0" }}>{x.note}</dd>}
          </div>
        ))}
      </dl>
      <p className="xs faint" style={{ marginTop: 8 }}>
        {t("figsNote", { k: dash.k_min })}
      </p>

      <section className="panel" aria-labelledby="ca-pc008" style={{ padding: 20, marginTop: 20, background: "var(--sheet)" }}>
        <h2 id="ca-pc008" style={{ fontSize: 18 }}>
          {t("pc008Title")}
        </h2>
        {pc.suppressed ? (
          <p className="s" style={{ marginTop: 6 }}>{t("pc008Suppressed", { k: dash.k_min })}</p>
        ) : (
          <p className="s" style={{ marginTop: 6 }}>
            {t("pc008Counts", { done: n(pc.done), booked: n(pc.booked), open: n(pc.open) })}
          </p>
        )}
        <p className="xs faint" style={{ marginTop: 6 }}>{t("pc008Note")}</p>
      </section>

      <div className="ca-grid">
        <InvitePanel invites={invites.invites} />

        <section className="panel" aria-labelledby="ca-team" style={{ padding: 20, background: "var(--sheet)" }}>
          <h2 id="ca-team" style={{ fontSize: 18 }}>
            {t("teamTitle")}
          </h2>
          <ul className="ca-list">
            {team.clinicians.map((c) => (
              <li key={c.id}>
                <b>
                  <bdi>{c.alias}</bdi>
                </b>
                <span className="xs faint">
                  {c.joined_by_invite ? t("joinedInvite", { date: formatDate(c.joined_at.slice(0, 10), locale) }) : t("joinedSeed")}
                </span>
              </li>
            ))}
          </ul>
          <h2 id="ca-export" style={{ fontSize: 18, marginTop: 18 }}>
            {t("exportTitle")}
          </h2>
          <p className="s dim" style={{ marginTop: 4 }}>
            {t("exportBody", { k: dash.k_min })}
          </p>
          {/* The export asks for the passkey again (a one-tap confirm in a demo session): plan section 5 */}
          <div style={{ marginTop: 10 }}>
            <StepUpExport href="/api/v1/clinic-admin/export.csv" filename={`reprosense-${dash.clinic.id}-follow-ups.csv`} label={t("export")} />
          </div>
        </section>
      </div>
      <p className="xs faint" style={{ marginTop: 14 }}>
        {t("syntheticNote")}
      </p>
    </>
  );
}
