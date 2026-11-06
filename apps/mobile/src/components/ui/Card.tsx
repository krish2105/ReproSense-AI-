import { Pressable, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/theme";
import type { Palette } from "@/theme/tokens";
import { Txt } from "./Txt";

/** Round card (22 pt) with a soft plum-tinted shadow (docs/06). */
export function Card({ style, tone = "sheet", ...rest }: ViewProps & { tone?: keyof Palette }) {
  const { c, dark, radius } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: c[tone],
          borderRadius: radius.card,
          padding: 16,
          borderWidth: 1,
          borderColor: c.rule,
          shadowColor: dark ? "#000000" : "#4B3653",
          shadowOpacity: dark ? 0.3 : 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
          gap: 10,
        },
        style,
      ]}
    />
  );
}

type TagKind = "urgent" | "soon" | "discuss" | "ok";

/** Status tag: always a word, never colour alone (mauve-charts). */
export function Tag({ kind, label }: { kind: TagKind; label: string }) {
  const { c } = useTheme();
  const tone = {
    urgent: { bg: c.urgentSoft, fg: c.urgent },
    soon: { bg: c.warnSoft, fg: c.warnText },
    discuss: { bg: c.warnSoft, fg: c.warnText },
    ok: { bg: c.okSoft, fg: c.okText },
  }[kind];
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: tone.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Txt variant="xs" weight={700} style={{ color: tone.fg }}>
        {label}
      </Txt>
    </View>
  );
}

/** Selectable pill (log form, filters). Selected state is announced to screen readers. */
export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: 999,
          justifyContent: "center",
          backgroundColor: selected ? c.plum : c.tint,
          borderWidth: 1,
          borderColor: selected ? c.plum : c.rule2,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Txt variant="small" weight={600} style={{ color: selected ? c.plumInk : c.ink }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Txt variant="h2" accessibilityRole="header" style={{ flexShrink: 1 }}>
          {title}
        </Txt>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Bullets({ items }: { items: string[] }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {items.map((it) => (
        <View key={it} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent, marginTop: 9 }} />
          <Txt variant="small" color="ink2" style={{ flex: 1 }}>
            {it}
          </Txt>
        </View>
      ))}
    </View>
  );
}
