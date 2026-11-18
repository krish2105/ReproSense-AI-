import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DevSettings, I18nManager } from "react-native";
import { getLocales } from "expo-localization";
import * as Updates from "expo-updates";
import { IntlProvider } from "use-intl";
import { getPref, setPref } from "@/prefs";
import { defaultLocale, isLocale, type Locale } from "./locale";
import ar from "./messages/ar.json";
import en from "./messages/en.json";
import mobileAr from "./mobile.ar.json";
import mobileEn from "./mobile.en.json";

// The same EN/AR messages as the web app (synced by scripts/sync-shared.mjs), so every health sentence on the phone
// is one that was already reviewed for the web. Arabic switches the whole layout to right to left, which React
// Native applies only after a reload.

interface I18n {
  locale: Locale;
  ready: boolean;
  /** True when the layout direction does not match the language yet (it applies after the app reopens). */
  directionPending: boolean;
  setLocale(locale: Locale): Promise<void>;
}

const I18nContext = createContext<I18n | null>(null);
// A few words only the phone needs (lock, back, more) live in mobile.*.json; the Arabic is marked AR-REVIEW in
// docs/AR_REVIEW.md until a native speaker reviews it.
const MESSAGES = { en: { ...en, mobile: mobileEn }, ar: { ...ar, mobile: mobileAr } } as const;

function deviceLocale(): Locale {
  return getLocales()[0]?.languageCode === "ar" ? "ar" : defaultLocale;
}

async function reload() {
  try {
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload();
  }
}

function applyDirection(locale: Locale): boolean {
  const rtl = locale === "ar";
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return true;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getPref("locale").then((stored) => {
      const l = isLocale(stored) ? stored : deviceLocale();
      setLocaleState(l);
      setReady(true);
      // Never reload here: where a reload does not apply the direction (Expo Go), it would reload forever. The flag
      // set here takes effect at the next launch; until then the top bar asks her to reopen the app.
      applyDirection(l);
    });
  }, []);

  const setLocale = useCallback(async (l: Locale) => {
    await setPref("locale", l);
    setLocaleState(l);
    if (applyDirection(l)) await reload();
  }, []);

  const directionPending = ready && I18nManager.isRTL !== (locale === "ar");
  const value = useMemo(() => ({ locale, ready, directionPending, setLocale }), [locale, ready, directionPending, setLocale]);
  return (
    <I18nContext.Provider value={value}>
      <IntlProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Dubai" onError={() => undefined}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}
