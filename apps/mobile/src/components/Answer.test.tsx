import { fireEvent, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import type { AskResponse } from "@/api/types";
import { renderWithProviders } from "@/test-utils";
import { Answer } from "./Answer";

// CLAUDE.md rules 5 and 6: urgent and crisis replies lead with 998; every answer shows its sources.

const base: AskResponse = {
  answer: "Heavy bleeding means soaking a pad or tampon every hour or two. [1]",
  sentences: [],
  citations: [{ n: 1, source_id: "nice_ng88", title: "NICE NG88 Heavy menstrual bleeding", url: "https://www.nice.org.uk/guidance/ng88" }],
  urgent: null,
  crisis: false,
  refused: false,
  grounded: true,
} as unknown as AskResponse;

test("a normal answer shows its words, the [n] marker and the source, and no 998 button", async () => {
  await renderWithProviders(<Answer a={base} />);
  expect(await screen.findByText(/soaking a pad/)).toBeTruthy();
  expect(screen.getByText("[1] NICE NG88 Heavy menstrual bleeding")).toBeTruthy();
  expect(screen.queryByText("Call 998")).toBeNull();
});

test("an urgent answer leads with the action and dials 998", async () => {
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  const urgent = {
    ...base,
    answer: "Call 998 or go to the nearest emergency department if this is happening now. [1]",
    urgent: { kind: "pain", message: "Call 998 or go to the nearest emergency department if this is happening now.", number: "998" },
  } as unknown as AskResponse;
  await renderWithProviders(<Answer a={urgent} />);
  await fireEvent.press(await screen.findByText("Call 998"));
  expect(open).toHaveBeenCalledWith("tel:998");
});

test("a crisis reply is support and 998 only, with no mood-check note and no score", async () => {
  const crisis = {
    ...base,
    answer: "You deserve support right now. Call 998 now. You are not alone. [1]",
    citations: [{ n: 1, source_id: "nice_cg192", title: "NICE CG192 Antenatal and postnatal mental health", url: "https://www.nice.org.uk/guidance/cg192" }],
    crisis: true,
    urgent: { kind: "crisis", message: "You deserve support right now.", number: "998" },
  } as unknown as AskResponse;
  await renderWithProviders(<Answer a={crisis} />);
  expect(await screen.findByText(/You deserve support right now/)).toBeTruthy();
  expect(screen.getByText("Call 998")).toBeTruthy();
  expect(screen.queryByText(/mood check/)).toBeNull();
  expect(screen.queryByText(/score/i)).toBeNull();
});
