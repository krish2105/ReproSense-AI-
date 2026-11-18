import { Switch, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { useTheme } from "@/theme/theme";
import { Txt, useFontFamily } from "./Txt";

/** A labelled text box (the label stays visible; never a placeholder-only field). */
export function Field({
  label,
  hint,
  value,
  onChangeText,
  keyboardType = "default",
  maxLength,
  autoComplete,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoComplete?: "nickname" | "off";
}) {
  const { c } = useTheme();
  const font = useFontFamily();
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" color="ink2">
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        accessibilityHint={hint}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoCorrect={false}
        style={{
          minHeight: 50,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.rule2,
          backgroundColor: c.sheet,
          paddingHorizontal: 16,
          color: c.ink,
          fontFamily: font(400),
          fontSize: 16,
          fontVariant: keyboardType === "number-pad" ? ["tabular-nums"] : undefined,
        }}
      />
      {hint ? (
        <Txt variant="xs" color="faintText">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

/** A yes/no choice she makes herself (consents start off). The whole row reads as one switch to screen readers. */
export function SwitchRow({ label, value, onValueChange, disabled }: { label: string; value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ true: c.plum, false: c.rule2 }}
        thumbColor="#FFFFFF"
      />
      <Txt variant="small" style={{ flex: 1 }}>
        {label}
      </Txt>
    </View>
  );
}
