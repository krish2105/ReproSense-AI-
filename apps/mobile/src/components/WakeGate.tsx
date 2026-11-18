import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslations } from "use-intl";
import { wakeServer } from "@/api/wake";
import { useTheme } from "@/theme/theme";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { call998 } from "./ui/Emergency";
import { Screen } from "./ui/Screen";
import { Txt } from "./ui/Txt";

/**
 * The app's first call: wake the demo API (Render's free tier sleeps when idle) before any screen asks it for data.
 * While it starts she sees a plain wait with the seconds counted, and 998 is one tap away the whole time.
 */
export function WakeGate({ children }: { children: React.ReactNode }) {
  const m = useTranslations("mobile");
  const u = useTranslations("urgent");
  const { c } = useTheme();
  const [state, setState] = useState<"waking" | "awake" | "failed">("waking");
  const [seconds, setSeconds] = useState(0);
  const alive = useRef(true);

  const run = useCallback(() => {
    void wakeServer({ onTick: (s) => alive.current && setSeconds(s) }).then((ok) => {
      if (alive.current) setState(ok ? "awake" : "failed");
    });
  }, []);

  // The first try starts with the screen (state already says "waking"); Try again resets the count first.
  useEffect(() => {
    alive.current = true;
    run();
    return () => {
      alive.current = false;
    };
  }, [run]);

  const retry = () => {
    setState("waking");
    setSeconds(0);
    run();
  };

  if (state === "awake") return <>{children}</>;
  return (
    <Screen tabs={false}>
      <Card accessibilityLiveRegion="polite">
        {state === "waking" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={c.plum} />
            <Txt variant="h2">{m("wakeTitle")}</Txt>
          </View>
        ) : (
          <Txt variant="h2" accessibilityRole="alert">
            {m("wakeFailedTitle")}
          </Txt>
        )}
        <Txt variant="small" color="ink2">
          {state === "waking" ? m("wakeBody") : m("wakeFailedBody")}
        </Txt>
        {state === "waking" && seconds > 0 ? (
          <Txt variant="xs" color="faintText">
            {m("wakeSeconds", { seconds })}
          </Txt>
        ) : null}
        {state === "failed" && <Button label={m("wakeRetry")} kind="secondary" onPress={retry} />}
      </Card>
      <Card tone="urgentSoft" style={{ borderColor: "transparent", gap: 8 }}>
        <Txt variant="small" weight={600}>
          {m("wakeEmergency")}
        </Txt>
        <Button label={u("call")} kind="urgent" small onPress={call998} accessibilityHint="Opens the phone app to call 998" />
      </Card>
    </Screen>
  );
}
