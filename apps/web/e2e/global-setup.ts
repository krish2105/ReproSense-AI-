import { API, resetDemo } from "./fixtures";

// Start every run from the seeded demo data (an earlier run or a rehearsal may have approved drafts or closed gaps).
// In CI the API may still be starting, so wait for it first.
export default async function globalSetup() {
  const until = Date.now() + 90_000;
  for (;;) {
    const up = await fetch(`${API}/healthz`).then((r) => r.ok).catch(() => false);
    if (up) break;
    if (Date.now() > until) throw new Error(`the API at ${API} did not answer within 90 s`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  await resetDemo();
}
