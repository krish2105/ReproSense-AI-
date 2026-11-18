import { API_URL, LIVE_API } from "./client";
import { wakeServer } from "./wake";

const ok = () => Promise.resolve(new Response("{}", { status: 200 }));
const down = () => Promise.resolve(new Response("", { status: 503 }));
const unreachable = () => Promise.reject(new TypeError("Network request failed"));

test("the app talks to the live API unless EXPO_PUBLIC_API_URL says otherwise", () => {
  expect(LIVE_API).toBe("https://reprosense-api.onrender.com");
  expect(API_URL).toBe(LIVE_API);
});

test("a server that is awake answers on the first try", async () => {
  const fetchImpl = jest.fn((_url: RequestInfo | URL, _init?: RequestInit) => ok());
  const ticks: number[] = [];
  await expect(wakeServer({ fetchImpl: fetchImpl as unknown as typeof fetch, onTick: (s) => ticks.push(s), sleep: () => Promise.resolve() })).resolves.toBe(true);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(fetchImpl.mock.calls[0]![0]).toBe(`${API_URL}/healthz`);
});

test("a sleeping server is asked again until it wakes", async () => {
  const answers = [unreachable, down, ok];
  const fetchImpl = jest.fn(() => answers.shift()!());
  let now = 0;
  const woke = await wakeServer({
    fetchImpl: fetchImpl as unknown as typeof fetch,
    now: () => now,
    sleep: (ms) => {
      now += ms;
      return Promise.resolve();
    },
  });
  expect(woke).toBe(true);
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});

test("it gives up after the deadline so the screen can offer Try again", async () => {
  const fetchImpl = jest.fn(unreachable);
  let now = 0;
  const woke = await wakeServer({
    fetchImpl: fetchImpl as unknown as typeof fetch,
    deadlineMs: 60_000,
    intervalMs: 3_000,
    now: () => now,
    sleep: (ms) => {
      now += ms;
      return Promise.resolve();
    },
  });
  expect(woke).toBe(false);
  expect(now).toBeGreaterThanOrEqual(60_000);
  expect(fetchImpl.mock.calls.length).toBeLessThanOrEqual(21);
});
