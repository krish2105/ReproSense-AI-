import { Platform } from "react-native";

const LIVE_SITE = "https://reprosense.vercel.app";
const strip = (u: string) => u.replace(/\/$/, "");

/** The public website (trust centre, live status). Set EXPO_PUBLIC_WEB_URL for other deployments. */
export const SITE_URL = strip(process.env.EXPO_PUBLIC_WEB_URL || LIVE_SITE);

/**
 * Where a shared-report link opens. The web app that serves it must talk to the same API that issued the token, so a
 * development build (local API) links to the local web app on :3000, and a build with EXPO_PUBLIC_API_URL to the site.
 */
export const SHARE_WEB_URL = strip(
  process.env.EXPO_PUBLIC_WEB_URL ||
    (process.env.EXPO_PUBLIC_API_URL ? LIVE_SITE : Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://127.0.0.1:3000"),
);
