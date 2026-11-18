import { Redirect, Stack } from "expo-router";
import { useSession } from "@/auth/session";
import { useTheme } from "@/theme/theme";

/**
 * The clinician's side: its own route group, layout and role (CLAUDE.md rule 9). No patient tab bar here, and the
 * clinician token lives in memory only. Without it the app goes back to Demo people.
 */
export default function ClinicianLayout() {
  const { clinicianToken } = useSession();
  const { c } = useTheme();
  if (!clinicianToken) return <Redirect href="/demo" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }} />;
}
