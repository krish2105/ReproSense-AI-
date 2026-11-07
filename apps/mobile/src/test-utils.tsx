import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "@/i18n/i18n";
import { ThemeProvider } from "@/theme/theme";

const metrics = { frame: { x: 0, y: 0, width: 402, height: 874 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

/** Renders with the same safe area, theme and EN messages the app uses (render is async in Testing Library 14). */
export async function renderWithProviders(ui: ReactElement) {
  return await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <I18nProvider>{ui}</I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}
