import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/Button";
import { Txt } from "@/components/ui/Txt";
import { getPref, setPref } from "@/prefs";
import { useTheme } from "@/theme/theme";

// Opt-in app lock (docs/21 M8): phones are often shared, so she can require Face ID, a fingerprint or the phone's
// passcode each time the app opens. Off by default; turned on in Privacy. While it is on, the app switcher shows a
// plain cover instead of her screen (iOS), and Android keeps the app out of recents thumbnails (FLAG_SECURE).

// Read synchronously when the app leaves the foreground: the switcher snapshot is taken before an async read returns.
let lockOn = false;

function protectRecents(on: boolean) {
  if (Platform.OS !== "android") return;
  void (on ? ScreenCapture.preventScreenCaptureAsync("app-lock") : ScreenCapture.allowScreenCaptureAsync("app-lock")).catch(() => {});
}

export async function lockEnabled(): Promise<boolean> {
  lockOn = (await getPref("lock")) === "on";
  return lockOn;
}

export async function setLockEnabled(on: boolean): Promise<boolean> {
  if (on) {
    const ok = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!ok || !enrolled) return false;
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: "ReproSense" });
    if (!res.success) return false;
  }
  await setPref("lock", on ? "on" : null);
  lockOn = on;
  protectRecents(on);
  return true;
}

export function LockGate({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const t = useTranslations("mobile");
  const brand = useTranslations("chrome");
  const [locked, setLocked] = useState<boolean | null>(null);
  const [cover, setCover] = useState(false);
  const state = useRef(AppState.currentState);

  const unlock = useCallback(async () => {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: "ReproSense" });
    if (res.success) setLocked(false);
  }, []);

  useEffect(() => {
    lockEnabled().then((on) => {
      protectRecents(on);
      setLocked(on);
      if (on) void unlock();
    });
    const sub = AppState.addEventListener("change", (next) => {
      const prev = state.current;
      state.current = next;
      if (!lockOn) return setCover(false);
      if (next === "inactive") setCover(true); // the switcher, a call or the Face ID sheet: hide her screen
      if (next === "background") {
        setCover(true);
        setLocked(true); // back from the background: ask again
      }
      if (next === "active") {
        setCover(false);
        if (prev === "background") void unlock();
      }
    });
    return () => sub.remove();
  }, [unlock]);

  if (locked === null) return null;
  if (locked) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <Txt variant="h1" align="center">
          {t("locked")}
        </Txt>
        <Button label={t("unlock")} onPress={() => void unlock()} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      {children}
      {cover && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.paper, alignItems: "center", justifyContent: "center" }]} accessibilityElementsHidden>
          <Txt variant="h1">{brand("brand")}</Txt>
        </View>
      )}
    </View>
  );
}
