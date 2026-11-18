import { API_URL, LIVE_API } from "@/api/client";

const LIVE_SITE = "https://reprosense.vercel.app";
const strip = (u: string) => u.replace(/\/$/, "");

/** The public website (trust centre, live status). Set EXPO_PUBLIC_WEB_URL for other deployments. */
export const SITE_URL = strip(process.env.EXPO_PUBLIC_WEB_URL || LIVE_SITE);

/**
 * Where a shared-report link opens. The web app that serves it must talk to the same API that issued the token, so the
 * live API links to the live site, and a local API (EXPO_PUBLIC_API_URL) to the local web app on :3000 of that host.
 */
export const SHARE_WEB_URL = strip(
  process.env.EXPO_PUBLIC_WEB_URL || (API_URL === LIVE_API ? LIVE_SITE : API_URL.replace(/:\d+$/, ":3000")),
);
