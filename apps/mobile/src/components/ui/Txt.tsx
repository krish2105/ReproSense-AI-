import { Text, type TextProps, type TextStyle } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { useTheme } from "@/theme/theme";
import type { Palette } from "@/theme/tokens";

// Plus Jakarta Sans for English, IBM Plex Sans Arabic for Arabic (docs/06). Custom fonts on Android ignore
// fontWeight, so each weight is its own family.
const LATIN = {
  400: "PlusJakartaSans_400Regular",
  500: "PlusJakartaSans_500Medium",
  600: "PlusJakartaSans_600SemiBold",
  700: "PlusJakartaSans_700Bold",
  800: "PlusJakartaSans_800ExtraBold",
} as const;
const ARABIC = {
  400: "IBMPlexSansArabic_400Regular",
  500: "IBMPlexSansArabic_500Medium",
  600: "IBMPlexSansArabic_600SemiBold",
  700: "IBMPlexSansArabic_700Bold",
  800: "IBMPlexSansArabic_700Bold",
} as const;

export type Weight = keyof typeof LATIN;
export type Variant = "display" | "h1" | "h2" | "body" | "small" | "xs" | "label";

const SIZE: Record<Variant, { size: number; weight: Weight; tracking: number }> = {
  display: { size: 34, weight: 800, tracking: -1 },
  h1: { size: 26, weight: 800, tracking: -0.6 },
  h2: { size: 18, weight: 700, tracking: -0.2 },
  body: { size: 16, weight: 400, tracking: 0 },
  small: { size: 14, weight: 400, tracking: 0 },
  xs: { size: 12.5, weight: 500, tracking: 0 },
  label: { size: 13, weight: 700, tracking: 0.1 },
};

export function useFontFamily() {
  const { locale } = useI18n();
  return (w: Weight) => (locale === "ar" ? ARABIC[w] : LATIN[w]);
}

interface Props extends TextProps {
  variant?: Variant;
  weight?: Weight;
  color?: keyof Palette;
  align?: TextStyle["textAlign"];
}

export function Txt({ variant = "body", weight, color = "ink", align, style, ...rest }: Props) {
  const { c } = useTheme();
  const { locale } = useI18n();
  const font = useFontFamily();
  const v = SIZE[variant];
  const ar = locale === "ar";
  return (
    <Text
      maxFontSizeMultiplier={2}
      {...rest}
      style={[
        {
          fontFamily: font(weight ?? v.weight),
          fontSize: v.size,
          lineHeight: Math.round(v.size * (ar ? 1.65 : variant === "display" || variant === "h1" ? 1.15 : 1.45)),
          letterSpacing: ar ? 0 : v.tracking,
          color: c[color],
          textAlign: align ?? "auto",
          fontVariant: ["tabular-nums"],
        },
        style,
      ]}
    />
  );
}
