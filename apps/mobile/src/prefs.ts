import * as SecureStore from "expo-secure-store";

// Everything the app keeps on the phone. No health record is stored here: only the sign-in token and
// three display preferences (docs/21 gate M-G2). SecureStore uses the iOS Keychain and the Android Keystore.
const KEYS = {
  token: "rs_token",
  locale: "rs_locale",
  theme: "rs_theme",
  lock: "rs_lock",
} as const;

export type PrefKey = keyof typeof KEYS;

/** The names stored on the phone, for the storage test (docs/21 risk "a phone stores health data by accident"). */
export const STORED_KEYS: readonly string[] = Object.values(KEYS);

// This device only: never synced to iCloud Keychain or restored from a backup onto another phone (M-G2).
const OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export async function getPref(key: PrefKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS[key], OPTIONS);
  } catch {
    return null;
  }
}

export async function setPref(key: PrefKey, value: string | null): Promise<void> {
  try {
    if (value === null) await SecureStore.deleteItemAsync(KEYS[key], OPTIONS);
    else await SecureStore.setItemAsync(KEYS[key], value, OPTIONS);
  } catch {
    // A failed preference write never blocks the app; the default applies next time.
  }
}
