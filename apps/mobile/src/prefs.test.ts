import * as SecureStore from "expo-secure-store";
import pkg from "../package.json";
import { getPref, setPref, STORED_KEYS } from "./prefs";

// docs/21: no health data on the phone. Only the sign-in token and three display preferences, in the Keychain/Keystore.

test("the phone stores only the token and three display preferences", () => {
  expect([...STORED_KEYS].sort()).toEqual(["rs_locale", "rs_lock", "rs_theme", "rs_token"]);
});

test("every write stays on this device (no iCloud Keychain sync, no backup restore)", async () => {
  await setPref("token", "tok");
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith("rs_token", "tok", { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  expect(await getPref("token")).toBe("tok");
  await setPref("token", null);
  expect(await getPref("token")).toBeNull();
});

test("no general-purpose storage library is installed", () => {
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  expect(deps.filter((d) => /async-storage|mmkv|sqlite|realm|watermelon/i.test(d))).toEqual([]);
});
