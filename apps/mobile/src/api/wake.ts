import { API_URL } from "./client";

export interface WakeOptions {
  /** Give up after this long (Render's free tier takes up to about a minute to start). */
  deadlineMs?: number;
  /** Wait between tries. */
  intervalMs?: number;
  /** Each try's own limit, so one hung request can't use the whole minute. */
  tryTimeoutMs?: number;
  /** Seconds waited so far, for the "Waking the demo server" line. */
  onTick?: (seconds: number) => void;
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Asks GET /healthz until the API answers 200 or the deadline passes. The first call of a session goes here, so a
 * sleeping Render server shows a friendly wait instead of a failed sign-in. Returns false when it never woke.
 */
export async function wakeServer(o: WakeOptions = {}): Promise<boolean> {
  const { deadlineMs = 60_000, intervalMs = 3_000, tryTimeoutMs = 10_000, onTick } = o;
  const fetchImpl = o.fetchImpl ?? fetch;
  const now = o.now ?? Date.now;
  const sleep = o.sleep ?? pause;
  const start = now();
  for (;;) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), tryTimeoutMs);
    try {
      const res = await fetchImpl(`${API_URL}/healthz`, { signal: controller.signal, credentials: "omit" });
      if (res.ok) return true;
    } catch {
      // Asleep or unreachable: try again below.
    } finally {
      clearTimeout(timer);
    }
    const waited = now() - start;
    if (waited >= deadlineMs) return false;
    onTick?.(Math.round(waited / 1000));
    await sleep(Math.min(intervalMs, deadlineMs - waited));
  }
}
