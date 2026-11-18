import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/theme";
import { Txt } from "./Txt";

type Kind = "primary" | "secondary" | "urgent" | "ghost";

interface Props {
  label: string;
  onPress: () => void;
  kind?: Kind;
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}

/** Pill button (docs/06). Labels say the exact action. Touch target at least 48 pt tall. */
export function Button({ label, onPress, kind = "primary", disabled, busy, accessibilityLabel, accessibilityHint, style, small }: Props) {
  const { c } = useTheme();
  const bg = { primary: c.plum, secondary: c.sheet, urgent: c.urgent, ghost: "transparent" }[kind];
  const fg = { primary: c.plumInk, secondary: c.ink, urgent: "#FFFFFF", ghost: c.accentText }[kind];
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        {
          minHeight: small ? 44 : 50,
          paddingHorizontal: small ? 16 : 22,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: kind === "secondary" ? 1 : 0,
          borderColor: c.rule2,
          alignItems: "center",
          justifyContent: "center",
          opacity: off ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {busy && <ActivityIndicator size="small" color={fg} />}
        <Txt variant={small ? "small" : "body"} weight={700} style={{ color: fg }}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}
