import { en, expect, expectAccessible, expectNoSideScroll, signIn, test } from "./fixtures";

// Her care plan after a diagnosis (22 Nov): Salma's doctor diagnosed PCOS and set a plan. She sees today's dose with a
// tick she can undo, the next checks with their sources, her monthly check-in and what to watch for; her clinician
// sees the same plan read-only. The test puts the tick back, so the demo data is unchanged.
test("Salma ticks today's dose of the plan her doctor set, and can undo it", async ({ page }) => {
  await signIn(page, { persona: "salma" });
  await page.goto("/app");
  const card = page.getByTestId("care-plan-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("Living with PCOS");
  await expect(card).toContainText("Metformin 500 mg");
  await expect(card.getByTestId("taken-last-7")).toHaveText("Ticked on 6 of the last 7 days");
  await expect(card).toContainText(en.carePlan.checks.glucose);
  await expect(card).toContainText(en.carePlan.watch.emergency);
  await expect(card.getByTestId("care-plan-checkin")).toContainText(en.carePlan.checkinDue);

  const tick = card.getByRole("checkbox");
  await expect(tick).not.toBeChecked();
  await tick.check();
  await expect(tick).toBeChecked();
  await expect(page.getByText(en.carePlan.saved).first()).toBeVisible();
  await tick.uncheck(); // put the demo back as it was
  await expect(tick).not.toBeChecked();
  await expectAccessible(page, "care plan on Home");
  await expectNoSideScroll(page, "care plan on Home");
});

test("her clinician sees the care plan, read-only", async ({ page }) => {
  await signIn(page, { role: "clinician" });
  await page.goto("/clinic/patients/salma");
  const panel = page.getByTestId("clinic-care-plan");
  await expect(panel).toContainText("Her care plan: PCOS");
  await expect(panel).toContainText("Ticked on 6 of the last 7 days");
  await expect(panel.getByRole("checkbox")).toHaveCount(0);
});
