import { act, fireEvent, screen } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { Linking, Text } from "react-native";
import type { Postnatal, PrevisitBrief } from "@/api/types";
import { SessionProvider, useSession } from "@/auth/session";
import { renderWithProviders } from "@/test-utils";
import { BloodPressureCard } from "./BloodPressureCard";
import { BriefSection } from "./BriefSection";
import { PostnatalCard, recordDate } from "./PostnatalCard";

// Build-week features on the phone: the postnatal pathway (K1), the pre-visit brief (K3) and blood pressure (K6).

const src = [{ source_id: "doh_postnatal", title: "DoH Postnatal Care Program Standard", url: "https://example.org/doh" }];
const postnatal: Postnatal = {
  birth_date: "2026-10-01",
  discharge_date: "2026-10-03",
  discharge_assumed: true,
  days_since_birth: 20,
  weeks_since_birth: 2,
  done: 1,
  total: 3,
  steps: [
    { id: "teleconsult", from: "2026-10-05", to: "2026-10-06", status: "done", done_on: "2026-10-05", recordable: true, sources: [], source_links: src },
    { id: "visit_2w", from: "2026-10-10", to: "2026-10-17", status: "not_recorded", done_on: null, recordable: true, sources: [], source_links: src },
    { id: "visit_6w", from: "2026-11-12", to: "2026-11-19", status: "upcoming", done_on: null, recordable: true, sources: [], source_links: src },
  ],
};

const brief: PrevisitBrief = {
  since: "2026-08-20",
  since_basis: "default_90_days",
  ref_date: "2026-11-18",
  lang: "en",
  audience: "patient",
  crisis: false,
  ai_on: false,
  written_by: "template",
  dropped_sentences: 0,
  lines: [
    {
      id: "rf",
      kind: "red_flag",
      status: "urgent",
      rule_id: "RF1",
      text: "Very heavy bleeding with dizziness was logged on 12 Nov.",
      evidence: [{ entry_id: "e1", date: "2026-11-12", text: "12 Nov: heavy flow, dizzy" }],
      evidence_total: 1,
      sources: src,
      written_by: "template",
    },
  ],
};

test("'I had this' records the end of the window, or today while the window is still open", () => {
  expect(recordDate({ from: "2026-10-10", to: "2026-10-17" }, "2026-11-18")).toBe("2026-10-17");
  expect(recordDate({ from: "2026-11-12", to: "2026-11-19" }, "2026-11-18")).toBe("2026-11-18");
  expect(recordDate({ from: "2026-11-20", to: "2026-11-25" }, "2026-11-18")).toBe("2026-11-18");
});

test("the postnatal card offers 'I had this' only for a check that is open, and never 'missed'", async () => {
  await renderWithProviders(
    <SessionProvider>
      <PostnatalCard p={postnatal} refDate="2026-11-18" />
    </SessionProvider>,
  );
  expect(await screen.findByText("Your first 6 weeks")).toBeTruthy();
  expect(screen.getAllByText("I had this")).toHaveLength(1); // visit_2w only: teleconsult is done, visit_6w is coming up
  expect(screen.getByText("Not recorded")).toBeTruthy();
  expect(screen.queryByText(/missed/i)).toBeNull();
});

test("the clinician sees the pathway in clinic wording, with no buttons", async () => {
  await renderWithProviders(
    <SessionProvider>
      <PostnatalCard p={postnatal} refDate="2026-11-18" clinician />
    </SessionProvider>,
  );
  expect(await screen.findByText("After-birth pathway (DoH Postnatal Care Standard)")).toBeTruthy();
  expect(screen.queryByText("I had this")).toBeNull();
});

test("a very high reading is marked, and the card says when to call 998", async () => {
  const r = { id: "b1", date: "2026-11-17", time: "08:30", systolic: 162, diastolic: 104, source: "app" };
  await renderWithProviders(<BloodPressureCard bp={{ eligible: true, latest: r, recent: [r] }} />);
  expect(await screen.findByText("Very high: 160/110 or higher")).toBeTruthy();
  expect(screen.getByText(/162\/104/)).toBeTruthy();
  expect(screen.getByText(/Call 998 or go to your maternity unit/)).toBeTruthy();
});

test("her brief puts the urgent line first with Call 998", async () => {
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  await renderWithProviders(<BriefSection brief={brief} audience="patient" />);
  expect(await screen.findByText("Before your visit")).toBeTruthy();
  await fireEvent.press(screen.getByText("Call 998"));
  expect(open).toHaveBeenCalledWith("tel:998");
  expect(screen.getByText("12 Nov: heavy flow, dizzy")).toBeTruthy();
});

test("the clinician's brief uses clinic wording and no call button", async () => {
  await renderWithProviders(<BriefSection brief={{ ...brief, audience: "clinician" }} audience="clinician" />);
  expect(await screen.findByText("Since the last visit")).toBeTruthy();
  expect(screen.queryByText("Call 998")).toBeNull();
});

test("the clinician's token is kept in memory only, never in the Keychain", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ role: "clinician", user_id: "dr", token: "clin-tok" }), { status: 200 })) as unknown as typeof fetch;
  function Probe() {
    const { signInAsClinician, clinicianToken } = useSession();
    useEffect(() => {
      void signInAsClinician();
    }, [signInAsClinician]);
    return <Text>{clinicianToken ? "signed in" : "waiting"}</Text>;
  }
  await renderWithProviders(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  await act(async () => {});
  expect(await screen.findByText("signed in")).toBeTruthy();
  const writes = (SecureStore.setItemAsync as jest.Mock).mock.calls.map((c) => c[1]);
  expect(writes).not.toContain("clin-tok");
  const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0]!;
  expect(JSON.parse(init.body)).toEqual({ role: "clinician" });
  globalThis.fetch = realFetch;
});
