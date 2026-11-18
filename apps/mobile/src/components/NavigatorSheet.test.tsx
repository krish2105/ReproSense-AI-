import { fireEvent, screen } from "@testing-library/react-native";
import { SessionProvider } from "@/auth/session";
import { renderWithProviders } from "@/test-utils";
import { NavigatorSheet } from "./NavigatorSheet";

// CLAUDE.md rule 11: the care navigator only drafts. She approves first; only then can she copy it. Nothing is sent.

const draft = {
  id: 7,
  profile_id: "noura",
  rule_id: "OBS_IRREGULAR_CYCLES",
  status: "draft",
  created_at: "2026-11-22T08:00:00Z",
  approved_at: null,
  draft: {
    rule_id: "OBS_IRREGULAR_CYCLES",
    to: "Gynaecology clinic, Seaside Women's Clinic (fictional)",
    subject: "Request: appointment to discuss a pattern in my record",
    message_en: "Hello, I would like an appointment.",
    message_ar: "مرحباً",
    questions_en: ["What could be causing my cycles to be this irregular?"],
    questions_ar: [],
    bring_en: ["This ReproSense summary"],
    bring_ar: [],
    sources: ["pcos_guideline_2023"],
  },
};

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("approve comes first; copy appears only after she approves, and nothing is sent", async () => {
  const calls: string[] = [];
  globalThis.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const path = String(url).replace(/^.*\/v1/, "");
    calls.push(`${init?.method ?? "GET"} ${path}`);
    const body =
      path === "/navigator"
        ? { available: [], drafts: [] }
        : path === "/navigator/drafts"
          ? draft
          : { ...draft, status: "approved", approved_at: "2026-11-22T08:01:00Z", sent: false, message: "Approved." };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;

  await renderWithProviders(
    <SessionProvider>
      <NavigatorSheet target={{ ruleId: "OBS_IRREGULAR_CYCLES", title: "Your cycle lengths have been irregular", sources: [] }} onClose={() => {}} />
    </SessionProvider>,
  );
  expect(await screen.findByText("Approve draft")).toBeTruthy();
  expect(screen.queryByText("Copy message")).toBeNull();
  await fireEvent.press(screen.getByText("Approve draft"));
  expect(await screen.findByText("Copy message")).toBeTruthy();
  expect(screen.queryByText("Approve draft")).toBeNull();
  expect(screen.getByText(/Nothing was sent/)).toBeTruthy();
  expect(calls).toEqual(["GET /navigator", "POST /navigator/drafts", "POST /navigator/drafts/7/approve"]);
});

test("an existing draft for the pattern is reused, not drafted again", async () => {
  const calls: string[] = [];
  globalThis.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${String(url).replace(/^.*\/v1/, "")}`);
    return new Response(JSON.stringify({ available: [], drafts: [{ ...draft, status: "approved" }] }), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  await renderWithProviders(
    <SessionProvider>
      <NavigatorSheet target={{ ruleId: "OBS_IRREGULAR_CYCLES", title: "Irregular", sources: [] }} onClose={() => {}} />
    </SessionProvider>,
  );
  expect(await screen.findByText("Copy message")).toBeTruthy();
  expect(calls).toEqual(["GET /navigator"]);
});
