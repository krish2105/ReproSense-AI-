import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import type { NavigatorDecision, NavigatorDraft, NavigatorList, Source } from "@/api/types";
import { useSession } from "@/auth/session";
import { useI18n } from "@/i18n/i18n";
import { useTheme } from "@/theme/theme";
import { SourceLinks } from "./SourceLinks";
import { Button } from "./ui/Button";
import { Bullets, Card, Tag } from "./ui/Card";
import { Txt } from "./ui/Txt";

type Call = ReturnType<typeof useSession>["call"];

/** Reuse her open or approved draft for this pattern, as the web does; draft a new one only when there is none. */
export async function findOrCreateDraft(call: Call, ruleId: string): Promise<NavigatorDraft> {
  const list = await call<NavigatorList>("/navigator");
  const found = list.drafts.find((d) => d.rule_id === ruleId && d.status !== "discarded");
  return found ?? (await call<NavigatorDraft>("/navigator/drafts", { body: { rule_id: ruleId } }));
}

/** The pattern a draft is for: its rule, the title she saw and the sources behind it. */
export interface DraftTarget {
  ruleId: string;
  title: string;
  sources: Source[];
}

/**
 * The care navigator's draft (CLAUDE.md rule 11): it only drafts. She approves it, and only then copies the message
 * to send or show it herself. The app never sends anything.
 */
export function NavigatorSheet({ target, onClose, onChanged }: { target: DraftTarget | null; onClose: () => void; onChanged?: () => void }) {
  if (!target) return null;
  return <DraftSheet key={target.ruleId} target={target} onClose={onClose} onChanged={onChanged} />;
}

function DraftSheet({ target, onClose, onChanged }: { target: DraftTarget; onClose: () => void; onChanged?: () => void }) {
  const t = useTranslations("navigator");
  const states = useTranslations("states");
  const { call } = useSession();
  const { locale } = useI18n();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<NavigatorDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<"approve" | "discard" | null>(null);

  useEffect(() => {
    let cancelled = false;
    findOrCreateDraft(call, target.ruleId).then(
      (d) => {
        if (!cancelled) setDraft(d);
      },
      (e: unknown) => {
        if (!cancelled) setError(e instanceof ApiError ? e.detail : String(e));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [call, target.ruleId]);

  async function decide(action: "approve" | "discard") {
    if (!draft) return;
    setBusy(action);
    try {
      const res = await call<NavigatorDecision>(`/navigator/drafts/${draft.id}/${action}`, { method: "POST" });
      setDraft({ ...draft, status: res.status, approved_at: res.approved_at });
      setNote(action === "approve" ? t("approved") : t("discarded"));
      onChanged?.();
    } catch (e) {
      setNote(t("failed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setBusy(null);
    }
  }

  const d = draft?.draft;
  const message = d ? (locale === "ar" ? d.message_ar : d.message_en) : "";
  const questions = d ? (locale === "ar" ? d.questions_ar : d.questions_en) : [];
  const bring = d ? (locale === "ar" ? d.bring_ar : d.bring_en) : [];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={{ backgroundColor: c.paper }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 14 }}>
        <Txt variant="h1" accessibilityRole="header">
          {t("dialogTitle")}
        </Txt>
        {error ? (
          <Card tone="urgentSoft" accessibilityRole="alert">
            <Txt variant="small">{t("failed", { detail: error })}</Txt>
          </Card>
        ) : !draft || !d ? (
          <Txt variant="small" color="ink2" accessibilityLiveRegion="polite">
            {t("drafting")}
          </Txt>
        ) : (
          <>
            <Tag kind={draft.status === "approved" ? "ok" : "soon"} label={t(`status.${draft.status}`)} />
            <Txt variant="h2">{target.title}</Txt>
            <Txt variant="small" color="ink2">
              {t("note")}
            </Txt>
            <Card>
              <Txt variant="label" color="ink2">
                {t("to")}
              </Txt>
              <Txt variant="body">{d.to}</Txt>
              <Txt variant="label" color="ink2">
                {t("subject")}
              </Txt>
              <Txt variant="body">{d.subject}</Txt>
              <Txt variant="label" color="ink2">
                {t("message")}
              </Txt>
              <Txt variant="body">{message}</Txt>
            </Card>
            {questions.length > 0 && (
              <Card>
                <Txt variant="label" color="ink2">
                  {t("questions")}
                </Txt>
                <Bullets items={questions} />
              </Card>
            )}
            {bring.length > 0 && (
              <Card>
                <Txt variant="label" color="ink2">
                  {t("bring")}
                </Txt>
                <Bullets items={bring} />
              </Card>
            )}
            <Txt variant="xs" color="faintText">
              {t("drafted")}
            </Txt>
            <SourceLinks sources={target.sources} label={t("sources")} />
          </>
        )}
        {note && (
          <Card tone="okSoft" accessibilityLiveRegion="polite">
            <Txt variant="small" weight={600}>
              {note}
            </Txt>
          </Card>
        )}
        <View style={{ gap: 10 }}>
          {draft?.status === "draft" && (
            <>
              <Button label={t("approve")} busy={busy === "approve"} disabled={busy !== null} onPress={() => void decide("approve")} />
              <Button label={t("discard")} kind="ghost" busy={busy === "discard"} disabled={busy !== null} onPress={() => void decide("discard")} />
            </>
          )}
          {draft?.status === "approved" && (
            <Button
              label={t("copy")}
              kind="secondary"
              onPress={() => {
                void Clipboard.setStringAsync(message);
                setNote(t("copied"));
              }}
            />
          )}
          <Button label={states("close")} kind="secondary" onPress={onClose} />
        </View>
      </ScrollView>
    </Modal>
  );
}
