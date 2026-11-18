import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { getPref, setPref } from "@/prefs";
import { palettes, radius, type Palette } from "./tokens";

export type ThemeMode = "system" | "light" | "dark";

interface Theme {
  c: Palette;
  dark: boolean;
  mode: ThemeMode;
  setMode(mode: ThemeMode): void;
  radius: typeof radius;
}

const ThemeContext = createContext<Theme | null>(null);

/** Light and dark are both designed (docs/06): the palettes come from the web's tokens, never inverted. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    getPref("theme").then((m) => {
      if (m === "light" || m === "dark") setModeState(m);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    void setPref("theme", m === "system" ? null : m);
  }, []);

  const dark = mode === "dark" || (mode === "system" && system === "dark");
  const value = useMemo(() => ({ c: dark ? palettes.dark : palettes.light, dark, mode, setMode, radius }), [dark, mode, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error("useTheme outside ThemeProvider");
  return t;
}
