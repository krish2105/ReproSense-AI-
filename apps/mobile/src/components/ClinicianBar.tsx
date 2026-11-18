import { router } from "expo-router";
import { View } from "react-native";
import { useTranslations } from "use-intl";
import { useSession } from "@/auth/session";
import { useTheme } from "@/theme/theme";
import { Button } from "./ui/Button";
import { Txt } from "./ui/Txt";

/** Marks every clinician screen as the clinician's view (a separate role), with the way back to Demo people. */
export function ClinicianBar() {
  const m = useTranslations("mobile");
  const clinic = useTranslations("clinic");
  const { signOutClinician } = useSession();
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.plum, borderRadius: 18, padding: 12, gap: 8 }} accessibilityRole="summary">
      <Txt variant="label" style={{ color: c.plumInk }}>
        {m("clinicRole")}
      </Txt>
      <Txt variant="small" weight={700} style={{ color: c.plumInk }}>
        {clinic("title")}
      </Txt>
      <Button
        label={m("clinicLeave")}
        kind="secondary"
        small
        onPress={() => {
          signOutClinician();
          router.replace("/demo");
        }}
      />
    </View>
  );
}
