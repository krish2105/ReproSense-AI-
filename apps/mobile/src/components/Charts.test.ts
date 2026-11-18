import { showLabel } from "./Charts";

test("up to seven points: every date is labelled", () => {
  expect([0, 1, 2, 3, 4, 5, 6].map((i) => showLabel(i, 7))).toEqual([true, true, true, true, true, true, true]);
});

test("twelve points: every second date and always the last, never two labels side by side", () => {
  const shown = Array.from({ length: 12 }, (_, i) => i).filter((i) => showLabel(i, 12));
  expect(shown).toEqual([0, 2, 4, 6, 8, 11]);
  expect(shown.every((v, k) => k === 0 || v - shown[k - 1]! >= 2)).toBe(true);
});
