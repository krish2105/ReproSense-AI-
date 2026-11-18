import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { I18nManager, Pressable, View } from "react-native";
import { useTranslations } from "use-intl";
import { useTheme } from "@/theme/theme";
import { Txt } from "./Txt";

/** A tappable list row with a chevron that points the reading direction (mirrored in Arabic). */
export function Row({ label, hint, onPress }: { label: string; hint?: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: c.sheet,
        borderWidth: 1,
        borderColor: c.rule,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Txt variant="body" weight={600} style={{ flex: 1 }}>
        {label}
      </Txt>
      <Ionicons name="chevron-forward" size={18} color={c.ink3} style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
    </Pressable>
  );
}

/** "Back" for screens pushed over the tabs. */
export function BackBar() {
  const t = useTranslations("mobile");
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("back")}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
        hitSlop={8}
        style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4, paddingEnd: 12 }}
      >
        <Ionicons name="chevron-back" size={20} color={c.accentText} style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
        <Txt variant="body" weight={700} color="accentText">
          {t("back")}
        </Txt>
      </Pressable>
    </View>
  );
}
