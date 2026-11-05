import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Chat } from "@/components/assistant/Chat";
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
  const { questions } = await apiServer<SuggestedResponse>("/assistant/suggested", { query: { lang: locale } });
  return (
    <div className="app-col">
      <h1 className="sr-only">{t("title")}</h1>
      <Chat suggested={questions} persona={me.user_id} initialQuestion={q?.slice(0, 600)} />
    </div>
  );
}
