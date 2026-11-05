import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Chat } from "@/components/assistant/Chat";
import { ButtonLink } from "@/components/ui/Button";
import { isLocale } from "@/i18n/config";
import { apiServer } from "@/lib/api/server";
import type { SuggestedResponse } from "@/lib/api/types";
import { requireRole } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("assistant");
  return { title: t("metaTitle") };
}

// AI Chat (HANDOFF §5 /app/assistant; mockup tAsk, msg). ?q= pre-fills a question from a pattern card.
export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireRole("patient");
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "en";
  const t = await getTranslations("assistant");
  const { q } = await searchParams;
  const [{ questions }, { ai_on }] = await Promise.all([
    apiServer<SuggestedResponse>("/assistant/suggested", { query: { lang: locale } }),
    apiServer<{ ai_on: boolean }>("/assistant/status"),
  ]);
  if (!ai_on) {
    // Her Privacy choice (DoH Responsible AI Standard 3.1.6.1): no chat box, so nothing can be sent to a model.
    return (
      <div className="app-col">
        <h1 className="page-title">{t("title")}</h1>
        <section className="panel" aria-labelledby="ai-off-title" style={{ padding: 20, marginTop: 16 }}>
          <h2 id="ai-off-title" style={{ fontSize: 18 }}>
            {t("offTitle")}
          </h2>
          <p className="s dim" style={{ marginTop: 6 }}>
            {t("offBody")}
          </p>
          <div style={{ marginTop: 12 }}>
            <ButtonLink href="/app/privacy" size="sm">
              {t("offAction")}
            </ButtonLink>
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="app-col">
      <h1 className="sr-only">{t("title")}</h1>
      <Chat suggested={questions} persona={me.user_id} initialQuestion={q?.slice(0, 600)} />
    </div>
  );
}
