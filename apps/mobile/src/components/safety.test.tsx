import { fireEvent, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import type { Card } from "@/api/types";
import { renderWithProviders } from "@/test-utils";
import { PatternCard } from "./PatternCard";
import { CrisisCard, SafetyStrip } from "./ui/Emergency";

// CLAUDE.md rule 5: red flags first and 998; EPDS item 10 opens support only, never a score or a pattern card.

const base: Card = {
  observation_id: "OBS_IRREGULAR_CYCLES",
  kind: "observation",
  title: "Your cycle lengths have been irregular",
  summary: "6 of your last 6 cycles were shorter than 21 or longer than 35 days.",
  explains: "Cycles shorter than 21 or longer than 35 days are described as irregular in the 2023 guideline.",
  why_we_noticed: [{ entry_id: "e1", date: "2026-11-04", text: "medium flow, pain 7/10" }],
  why_total: 8,
  values: {},
  what_to_consider: ["Consider discussing this pattern with a gynaecologist or family doctor."],
  questions_for_doctor: ["What could be causing my cycles to be this irregular?"],
  sources: [{ source_id: "pcos_guideline_2023", title: "International PCOS Guideline (2023)", url: "https://example.org/pcos" }],
  urgency: "discuss",
  entry_date: null,
  crisis_path: false,
  creates_care_gap: null,
  written_by: "template",
  verified_sentences: 4,
  dropped_sentences: 0,
};

test("the safety strip offers 998 and dials it", async () => {
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  await renderWithProviders(<SafetyStrip />);
  await fireEvent.press(await screen.findByText("Call 998"));
  expect(open).toHaveBeenCalledWith("tel:998");
});

test("the crisis card shows support and 998, and no score", async () => {
  await renderWithProviders(<CrisisCard />);
  expect(await screen.findByText("You deserve support right now")).toBeTruthy();
  expect(screen.getByText("Call 998")).toBeTruthy();
  expect(screen.queryByText(/of 30/)).toBeNull();
});

test("a pattern card shows its evidence, next steps and source, and never says 'you have'", async () => {
  await renderWithProviders(<PatternCard card={base} />);
  expect(await screen.findByText("Worth discussing")).toBeTruthy();
  expect(screen.getByText("medium flow, pain 7/10")).toBeTruthy();
  expect(screen.getByText("International PCOS Guideline (2023)")).toBeTruthy();
  expect(screen.getByText("What could be causing my cycles to be this irregular?")).toBeTruthy();
  expect(screen.queryByText(/you have/i)).toBeNull();
});

test("a red-flag card is shown as urgent guidance with 998 first, not as a pattern", async () => {
  await renderWithProviders(<PatternCard card={{ ...base, kind: "red_flag", urgency: "urgent", title: "Heavy bleeding with dizziness" }} />);
  expect(await screen.findByText("Call 998 or go to the nearest emergency department if this is happening now.")).toBeTruthy();
  expect(screen.getByText("Call 998")).toBeTruthy();
  expect(screen.queryByText("Worth discussing")).toBeNull();
});
