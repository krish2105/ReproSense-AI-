import { Pressable, RefreshControl, ScrollView, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { useI18n } from "@/i18n/i18n";
import { useTheme } from "@/theme/theme";
import { Txt } from "./Txt";

/** Space kept free at the bottom for the floating tab bar. */
export const TAB_BAR_SPACE = 104;

function Toggle({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        minHeight: 36,
        minWidth: 44,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: c.rule2,
        backgroundColor: c.sheet,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Txt variant="xs" weight={700}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** The bar on every screen: the name, the "Demo data — fictional" badge (CLAUDE.md rule 4), language and theme. */
export function TopBar() {
  const t = useTranslations("chrome");
  const { c, dark, setMode } = useTheme();
  const { locale, setLocale, directionPending } = useI18n();
  const m = useTranslations("mobile");
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Txt variant="h2" weight={800} accessibilityRole="header">
          {t("brand")}
        </Txt>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Toggle label={t("lang.toggle")} a11y={t("lang.label")} onPress={() => void setLocale(locale === "ar" ? "en" : "ar")} />
          <Toggle
            label={dark ? t("theme.toLight") : t("theme.toDark")}
            a11y={dark ? t("theme.labelToLight") : t("theme.labelToDark")}
            onPress={() => setMode(dark ? "light" : "dark")}
          />
        </View>
      </View>
      <View style={{ alignSelf: "flex-start", backgroundColor: c.accentSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
        <Txt variant="xs" weight={700} color="accentText">
          {t("badge")}
        </Txt>
      </View>
      {directionPending && (
        <Txt variant="xs" color="ink2" accessibilityLiveRegion="polite">
          {m("reopen")}
        </Txt>
      )}
    </View>
  );
}

export function Screen({
  children,
  refreshing,
  onRefresh,
  tabs = true,
  scrollRef,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  tabs?: boolean;
  scrollRef?: React.Ref<ScrollViewInstance>;
}) {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + (tabs ? TAB_BAR_SPACE : 24),
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.plum} /> : undefined}
      >
        <TopBar />
        {children}
      </ScrollView>
      {/* Content scrolls under this strip, never behind the clock or the Dynamic Island. */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, start: 0, end: 0, height: insets.top, backgroundColor: c.paper }} />
    </View>
  );
}
