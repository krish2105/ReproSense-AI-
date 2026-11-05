import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { Tag } from "@/components/ui/Tag";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { DocumentRow } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("documents");
  return { title: t("metaTitle") };
}

// Lab reports (HANDOFF §5 /app/documents): upload → editable extracted rows → confirm. Fatima's demo OGTT
// (data/synthetic/demo_uploads, copied to /demo) closes her after-birth follow-up once confirmed.
export default async function DocumentsPage() {
  const me = await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("documents");
  const docs = await apiServer<DocumentRow[]>("/documents");
  return (
    <div className="app-col">
      <h1 style={{ fontSize: 22, textAlign: "center" }}>{t("title")}</h1>
      <p className="s dim" style={{ textAlign: "center" }}>
        {t("intro")}
      </p>
      <DocumentUploader demoFile={me.user_id === "fatima" ? "/demo/fatima_postnatal_ogtt.txt" : undefined} />
      <section className="box" aria-labelledby="docs-list">
        <h2 id="docs-list" style={{ fontSize: 16 }}>
          {t("listTitle")}
        </h2>
        {docs.length === 0 ? (
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("none")}
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {docs.map((d) => (
              <li key={d.id} className="kv" style={{ flexWrap: "wrap" }}>
                <span className="s" dir="auto">
                  {d.filename} <span className="xs faint">· {formatDate(d.created_at.slice(0, 10), locale)}</span>
                </span>
                <Tag tone={d.status === "confirmed" ? "ok" : "soon"}>{t(`status.${d.status}`)}</Tag>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
