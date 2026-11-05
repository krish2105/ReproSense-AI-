import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { ConsentToggles, DeleteData, DiscreetToggle, FhirCheck } from "@/components/privacy/PrivacyActions";
import { Box } from "@/components/ui/Box";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { PrivacyResponse } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return { title: t("metaTitle") };
}

// Privacy centre (HANDOFF §5 /app/privacy): choices, who saw her data, what is stored, her copy, discreet mode, delete.
export default async function PrivacyPage() {
  await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("privacy");
  const p = await apiServer<PrivacyResponse>("/privacy");
  const discreet = (await cookies()).get("rs_discreet")?.value === "1";
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
  return (
    <div className="app-col">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Image src="/images/sections/privacy-vault.png" alt="" width={72} height={72} />
        <div>
          <h1 style={{ fontSize: 22 }}>{t("title")}</h1>
          <p className="s dim">{t("intro")}</p>
        </div>
      </div>

      <Box>
        <h2 style={{ fontSize: 16 }}>{t("promisesTitle")}</h2>
        <ul className="plain" style={{ marginTop: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>{t(`promises.${i}`)}</li>
          ))}
        </ul>
      </Box>

      <Box>
        <h2 style={{ fontSize: 16 }}>{t("consentsTitle")}</h2>
        <ConsentToggles consents={p.consents} />
      </Box>

      <Box>
        <h2 style={{ fontSize: 16 }}>{t("whoTitle")}</h2>
        {p.audit.length === 0 ? (
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("whoNone")}
          </p>
        ) : (
          <ol style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
            {p.audit.slice(0, 20).map((a, i) => (
              <li key={i} className="s" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span>
                  {t("whoRow", {
                    who: t.has(`roles.${a.actor_role}`) ? t(`roles.${a.actor_role}`) : a.actor_role,
                    action: t.has(`actions.${a.action}`) ? t(`actions.${a.action}`) : t("actions.other"),
                  })}
                </span>
                <span className="xs faint">
                  {formatDate(a.at.slice(0, 10), locale)} · {time.format(new Date(a.at))}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Box>

      <Box>
        <h2 style={{ fontSize: 16 }}>{t("storedTitle")}</h2>
        <dl style={{ margin: "8px 0 0", display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 12px" }} className="s">
          {Object.entries(p.stored).map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt className="dim">{t.has(`stored.${k}`) ? t(`stored.${k}`) : k}</dt>
              <dd style={{ margin: 0 }} className="mono">
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </Box>

      <Box>
        <h2 style={{ fontSize: 16 }}>{t("exportTitle")}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <a className="btn btn-o btn-sm" href="/api/v1/export" download="reprosense-my-data.json" style={{ alignSelf: "flex-start" }}>
            {t("exportJson")}
          </a>
          <FhirCheck />
        </div>
      </Box>

      <Box>
        <h2 style={{ fontSize: 16 }}>{t("discreetTitle")}</h2>
        <p className="s dim" style={{ margin: "4px 0 10px" }}>
          {t("discreetBody")}
        </p>
        <DiscreetToggle initial={discreet} />
      </Box>

      <Box>
        <h2 style={{ fontSize: 16 }}>{t("deleteTitle")}</h2>
        <p className="s dim" style={{ margin: "4px 0 10px" }}>
          {t("deleteBody")}
        </p>
        <DeleteData />
      </Box>
    </div>
  );
}
