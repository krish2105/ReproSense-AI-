import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useState } from "react";
import { Switch, TextInput, View } from "react-native";
import { useTranslations } from "use-intl";
import { apiUpload } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { DocumentRow, DocumentUpload, ExtractedRow } from "@/api/types";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/Button";
import { Card, Section, Tag } from "@/components/ui/Card";
import { BackBar } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { ErrorBox, Loading } from "@/components/ui/States";
import { Txt, useFontFamily } from "@/components/ui/Txt";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/i18n";
import { DEMO_LAB_FILE, DEMO_LAB_TEXT } from "@/shared/demoLab";
import { formatDate } from "@/shared/format";
import { useTheme } from "@/theme/theme";

type Row = ExtractedRow & { keep: boolean };

const range = (r: ExtractedRow) =>
  `${r.ref_low ?? ""}${r.ref_low !== null && r.ref_high !== null ? "–" : r.ref_high !== null ? "< " : ""}${r.ref_high ?? ""}`;

/** One extracted value she checks against her paper copy: keep it or not, and correct the number if it was misread. */
function ValueRow({ row, onChange }: { row: Row; onChange: (patch: Partial<Row>) => void }) {
  const t = useTranslations("documents");
  const { c } = useTheme();
  const font = useFontFamily();
  return (
    <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: c.tint, opacity: row.keep ? 1 : 0.6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Switch
          value={row.keep}
          onValueChange={(keep) => onChange({ keep })}
          accessibilityLabel={`${t("colKeep")}: ${row.test}`}
          trackColor={{ true: c.plum, false: c.rule2 }}
          thumbColor="#FFFFFF"
        />
        <Txt variant="small" weight={700} style={{ flex: 1 }}>
          {row.test}
        </Txt>
        {row.flag ? <Tag kind="soon" label={row.flag} /> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <TextInput
          value={String(row.value)}
          onChangeText={(value) => onChange({ value })}
          keyboardType="decimal-pad"
          accessibilityLabel={`${t("colValue")}: ${row.test}`}
          style={{
            minWidth: 96,
            minHeight: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.rule2,
            backgroundColor: c.sheet,
            paddingHorizontal: 12,
            color: c.ink,
            fontFamily: font(600),
            fontSize: 16,
            fontVariant: ["tabular-nums"],
            writingDirection: "ltr",
          }}
        />
        <Txt variant="small" color="ink2">
          {row.unit ?? ""}
        </Txt>
        {range(row) ? (
          <Txt variant="xs" color="faintText" style={{ fontVariant: ["tabular-nums"] }}>
            {t("colRange")}: {range(row)}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Lab reports (web /app/documents): upload → she checks and edits every value → confirm. Nothing is saved before she
 * confirms. Photo reading (OCR) is not in this build, so the picker offers PDF and text files, as the web does.
 */
export default function Documents() {
  const t = useTranslations("documents");
  const { locale } = useI18n();
  const { token } = useSession();
  const me = useApi<{ user_id: string }>("/demo/whoami");
  const list = useApi<DocumentRow[]>("/documents");
  const [doc, setDoc] = useState<DocumentUpload | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<"upload" | "confirm" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const { call } = useSession();

  async function upload(file: File) {
    setBusy("upload");
    setError(null);
    setDone(null);
    const form = new FormData();
    form.append("file", file, file.name); // an expo-file-system File is a Blob, which Expo's fetch sends as the file part
    try {
      const d = await apiUpload<DocumentUpload>("/documents", form, token);
      setDoc(d);
      setRows(d.rows.map((r) => ({ ...r, keep: true })));
      void list.reload();
    } catch (e) {
      setError(t("uploadFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setBusy(null);
    }
  }

  async function choose() {
    const res = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "text/plain"], copyToCacheDirectory: true, multiple: false });
    const a = res.canceled ? undefined : res.assets[0];
    if (!a) return;
    // Keep her file's own name (the API stores it), whatever path the picker copied it to.
    const dir = new Directory(Paths.cache, "lab-uploads");
    dir.create({ idempotent: true, intermediates: true });
    const named = new File(dir, a.name);
    if (named.exists) named.delete();
    await new File(a.uri).copy(named);
    await upload(named);
  }

  async function openDemoReport() {
    const file = new File(Paths.cache, DEMO_LAB_FILE);
    if (file.exists) file.delete();
    file.create();
    await file.write(DEMO_LAB_TEXT);
    await upload(file);
  }

  async function confirm() {
    if (!doc) return;
    setBusy("confirm");
    setError(null);
    try {
      const kept: ExtractedRow[] = rows
        .filter((r) => r.keep)
        .map((r) => ({ code: r.code, test: r.test, value: r.value, unit: r.unit, ref_low: r.ref_low, ref_high: r.ref_high, flag: r.flag, date: r.date }));
      const res = await call<{ saved: number; patterns: string[] }>(`/documents/${doc.id}/confirm`, { body: { rows: kept } });
      setDone(t("confirmed", { n: res.saved }));
      setDoc(null);
      setRows([]);
      void list.reload();
    } catch (e) {
      setError(t("confirmFailed", { detail: e instanceof ApiError ? e.detail : String(e) }));
    } finally {
      setBusy(null);
    }
  }

  const edit = (i: number, patch: Partial<Row>) => setRows((x) => x.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Screen tabs={false}>
      <BackBar />
      <Txt variant="h1" accessibilityRole="header">
        {t("title")}
      </Txt>
      <Txt variant="small" color="ink2">
        {t("intro")}
      </Txt>
      <Card>
        <Button label={t("choose")} kind="secondary" busy={busy === "upload"} disabled={busy !== null} onPress={() => void choose()} />
        {me.data?.user_id === "fatima" && <Button label={t("demo")} busy={busy === "upload"} disabled={busy !== null} onPress={() => void openDemoReport()} />}
        <View accessibilityLiveRegion="polite" style={{ gap: 8 }}>
          {busy === "upload" && (
            <Txt variant="small" color="ink2">
              {t("reading")}…
            </Txt>
          )}
          {error && (
            <Card tone="urgentSoft" accessibilityRole="alert">
              <Txt variant="small">{error}</Txt>
            </Card>
          )}
          {done && (
            <Card tone="okSoft">
              <Txt variant="small" weight={600}>
                {done}
              </Txt>
            </Card>
          )}
        </View>
      </Card>

      {doc && (
        <Section title={t("tableTitle")}>
          <Txt variant="xs" color="ink2">
            {doc.message}
          </Txt>
          {doc.sample_date && <Txt variant="xs">{t("sampleDate", { date: formatDate(doc.sample_date, locale) })}</Txt>}
          {doc.injection_lines_removed > 0 && (
            <Card tone="warnSoft">
              <Txt variant="xs">{t("injected", { n: doc.injection_lines_removed })}</Txt>
            </Card>
          )}
          {rows.length === 0 ? (
            <Txt variant="small">{t("noRows")}</Txt>
          ) : (
            <>
              {rows.map((r, i) => (
                <ValueRow key={`${r.code}-${i}`} row={r} onChange={(patch) => edit(i, patch)} />
              ))}
              <Button label={t("confirm")} busy={busy === "confirm"} disabled={busy !== null} onPress={() => void confirm()} />
            </>
          )}
        </Section>
      )}

      <Section title={t("listTitle")}>
        {list.error ? <ErrorBox error={list.error} onRetry={() => void list.reload()} /> : null}
        {!list.data && !list.error ? <Loading /> : null}
        {list.data?.length === 0 && (
          <Txt variant="small" color="ink2">
            {t("none")}
          </Txt>
        )}
        {list.data?.map((d) => (
          <Card key={d.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <View style={{ flex: 1, minWidth: 160, gap: 2 }}>
              <Txt variant="small" weight={600}>
                {d.filename}
              </Txt>
              <Txt variant="xs" color="faintText">
                {formatDate(d.created_at.slice(0, 10), locale)}
              </Txt>
            </View>
            <Tag kind={d.status === "confirmed" ? "ok" : "soon"} label={t(`status.${d.status}`)} />
          </Card>
        ))}
      </Section>
    </Screen>
  );
}
