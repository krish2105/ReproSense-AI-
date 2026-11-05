import "server-only";
import { unstable_cache } from "next/cache";
import type { Card, HomeResponse, TimelineResponse } from "./api/types";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8010";

export interface Showcase {
  cycles: TimelineResponse["cycles"];
  daysLogged: number;
  observation: Card | null;
  refDate: string;
}

// The landing page shows Noura's real (fictional) record without touching the visitor's session: the server signs
// in as her with a demo token (DEMO_MODE only) and reads her timeline and home. Failures are not cached.
async function load(locale: string): Promise<Showcase> {
  const login = await fetch(`${API_URL}/v1/demo/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ persona: "noura" }),
    cache: "no-store",
  });
  if (!login.ok) throw new Error(`login ${login.status}`);
  const { token } = (await login.json()) as { token: string };
  const headers = { cookie: `rs_token=${token}`, accept: "application/json" };
  const [tl, home] = await Promise.all([
    fetch(`${API_URL}/v1/timeline?months=12`, { headers, cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<TimelineResponse>) : Promise.reject(new Error(`timeline ${r.status}`)))),
    fetch(`${API_URL}/v1/me/home?lang=${locale}`, { headers, cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<HomeResponse>) : Promise.reject(new Error(`home ${r.status}`)))),
  ]);
  const obs = home.observations.find((o) => o.observation_id === "OBS_IRREGULAR_PLUS_ANDROGEN") ?? home.observations[0] ?? null;
  return { cycles: tl.cycles, daysLogged: tl.days.length, observation: obs, refDate: tl.to };
}

const cached = unstable_cache(load, ["showcase-noura-v1"], { revalidate: 600 });

export async function getShowcase(locale: string): Promise<Showcase | null> {
  try {
    return await cached(locale);
  } catch {
    return null; // the page still renders, without the live record
  }
}
