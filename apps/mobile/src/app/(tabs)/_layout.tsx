import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { useSession } from "@/auth/session";
import { Txt } from "@/components/ui/Txt";
import { useTheme } from "@/theme/theme";

type IconName = keyof typeof Ionicons.glyphMap;
/** The props expo-router passes to a custom tab bar (derived, so no deep import is needed). */
type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];
const ICONS: Record<string, IconName> = {
  home: "home-outline",
  patterns: "sparkles-outline",
  assistant: "chatbubble-ellipses-outline",
  report: "document-text-outline",
  more: "grid-outline",
};

/** The floating tab bar (docs/06): five tabs, an icon and a word each, above the home indicator. */
function FloatingTabBar({ state, navigateToTab, descriptors }: BottomTabBarProps) {
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: "absolute",
        start: 12,
        end: 12,
        bottom: Math.max(insets.bottom, 10),
        flexDirection: "row",
        backgroundColor: c.sheet,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: c.rule2,
        padding: 6,
        shadowColor: dark ? "#000000" : "#4B3653",
        shadowOpacity: dark ? 0.4 : 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const label = String(descriptors[route.key]?.options.title ?? route.name);
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={{ flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: focused ? c.plum : "transparent", gap: 2 }}
          >
            <Ionicons name={ICONS[route.name] ?? "ellipse-outline"} size={20} color={focused ? c.plumInk : c.ink2} />
            <Txt variant="xs" weight={focused ? 700 : 500} numberOfLines={1} style={{ color: focused ? c.plumInk : c.ink2, fontSize: 11 }}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const t = useTranslations("tabs");
  const m = useTranslations("mobile");
  const { token } = useSession();
  if (!token) return <Redirect href="/demo" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: t("home") }} />
      <Tabs.Screen name="patterns" options={{ title: t("insights") }} />
      <Tabs.Screen name="assistant" options={{ title: t("assistant") }} />
      <Tabs.Screen name="report" options={{ title: t("report") }} />
      <Tabs.Screen name="more" options={{ title: m("more") }} />
    </Tabs>
  );
}
