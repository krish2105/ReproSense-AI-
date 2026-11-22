import { getTranslations } from "next-intl/server";
import { TableScroll } from "@/components/ui/TableScroll";
import type { Locale } from "@/i18n/config";
import type { PopulationView as Population } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

/**
 * What a health department would see and clinic records cannot show (showcase day, 22 Nov): how many women's entries
 * match a pattern worth discussing, and how many of them have shared a report with a clinic, by region; patterns by
 * age band; fertility-assessment timing. Counts from the synthetic cohort only; groups under 10 arrive hidden (null)
 * from the API. A pattern is a rule match, never a diagnosis, and the panel says so. One series per figure (plum
 * bars with the number beside each), so nothing is told apart by colour alone (mauve-charts).
 */
export async function PopulationView({ p, locale, regionNames }: { p: Population; locale: Locale; regionNames: Record<string, string> }) {
  const t = await getTranslations("admin");
  const n = (v: number, d = 0) => formatNumber(v, locale, d);
  const hidden = t("hidden");
  const o = p.overall;
  const pct = (v: number | null) => (v === null ? hidden : t("population.pct", { pct: n(v, 1) }));

  return (
    <section className="panel" aria-labelledby="pop-title" style={{ padding: 20, marginTop: 20 }} data-testid="population-view">
      <h2 id="pop-title" style={{ fontSize: 18 }}>
        {t("population.title")}
      </h2>
      <p className="s dim" style={{ marginTop: 4 }}>
        {t("population.body")}
      </p>

      {o.with_pattern === null || o.shared === null || o.not_shared === null ? (
        <p className="s" style={{ marginTop: 12 }}>
          {t("pc008Hidden")}
        </p>
      ) : (
        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "14px 0 0" }}>
          {[
            { id: "matched", label: t("population.matched"), value: n(o.with_pattern) },
            { id: "shared", label: t("population.shared"), value: n(o.shared) },
            { id: "not-shared", label: t("population.notShared"), value: n(o.not_shared) },
          ].map((f) => (
            <div key={f.id} data-pop={f.id} style={{ background: "var(--tint)", borderRadius: 14, padding: "12px 14px" }}>
              <dt className="label">{f.label}</dt>
              <dd className="big mono" style={{ margin: "6px 0 0" }}>
                <span className="ltr">{f.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="two" style={{ marginTop: 18 }}>
        <div>
          <h3 className="label" id="pop-region">
            {t("population.regionTitle")}
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "grid", gap: 12 }} aria-labelledby="pop-region">
            {p.regions.map((r) => (
              <li key={r.region} data-region={r.region}>
                <div className="kv s">
                  <span>{regionNames[r.region] ?? r.region}</span>
                  <b className="mono">
                    {r.with_pattern === null || r.shared === null || r.shared_pct === null
                      ? hidden
                      : t("population.regionRow", { shared: n(r.shared), total: n(r.with_pattern), pct: n(r.shared_pct, 1) })}
                  </b>
                </div>
                <div className="bar" style={{ marginTop: 6 }} aria-hidden="true">
                  <i style={{ width: `${r.shared_pct ?? 0}%`, background: "var(--plum)" }} />
                </div>
              </li>
            ))}
          </ul>
          <h3 className="label" style={{ marginTop: 18 }}>
            {t("population.tryingTitle")}
          </h3>
          <p className="s" style={{ marginTop: 6 }} data-pop="trying">
            {p.trying.trying === null || p.trying.due === null || p.trying.shared === null || p.trying.not_shared === null
              ? t("pc008Hidden")
              : t("population.tryingBody", {
                  due: n(p.trying.due),
                  trying: n(p.trying.trying),
                  shared: n(p.trying.shared),
                  not_shared: n(p.trying.not_shared),
                })}
          </p>
        </div>

        <div>
          <TableScroll label={t("population.ageTitle")}>
            <table aria-labelledby="pop-age">
              <caption id="pop-age" className="label" style={{ textAlign: "start", paddingBottom: 6 }}>
                {t("population.ageTitle")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("population.colAge")}</th>
                  <th scope="col">{t("colWomen")}</th>
                  <th scope="col">{t("population.colCycles")}</th>
                  <th scope="col">{t("population.colPain")}</th>
                  <th scope="col">{t("population.colHeavy")}</th>
                </tr>
              </thead>
              <tbody>
                {p.age_bands.map((a) => (
                  <tr key={a.age_band}>
                    <th scope="row" className="mono" style={{ fontWeight: 600 }}>
                      <span className="ltr">{a.age_band}</span>
                    </th>
                    <td className="mono">{a.n === null ? hidden : n(a.n)}</td>
                    <td className="mono">{pct(a.cycles)}</td>
                    <td className="mono">{pct(a.pain)}</td>
                    <td className="mono">{pct(a.heavy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <p className="xs dim" style={{ marginTop: 6 }}>
            {t("population.ageNote")}
          </p>
        </div>
      </div>

      <p className="s" style={{ marginTop: 14 }}>
        {t("population.use")}
      </p>
      <p className="xs faint" style={{ marginTop: 6 }}>
        {t("population.note")}
      </p>
    </section>
  );
}
