import * as WebBrowser from "expo-web-browser";
import { Pressable, View } from "react-native";
import type { Source } from "@/api/types";
import { useTheme } from "@/theme/theme";
import { Txt } from "./ui/Txt";

/** The sources behind a card or answer (CLAUDE.md rule 6). Each opens in the in-app browser. */
export function SourceLinks({ sources, label }: { sources: Source[]; label: string }) {
  const { c } = useTheme();
  if (!sources.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" color="ink2">
        {label}
      </Txt>
      {sources.map((s) => (
        <Pressable
          key={s.source_id}
          accessibilityRole="link"
          accessibilityHint="Opens the source in the browser"
          onPress={() => void WebBrowser.openBrowserAsync(s.url)}
          hitSlop={6}
          style={{ minHeight: 32, justifyContent: "center" }}
        >
          <Txt variant="small" weight={600} style={{ color: c.accentText, textDecorationLine: "underline" }}>
            {s.title}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}
