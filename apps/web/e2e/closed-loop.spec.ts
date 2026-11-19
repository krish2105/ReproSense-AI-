import { en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// The closed loop made visible (sections 4 and 8): each follow-up's history in the clinician's record view and in her
// own words on Home; the overdue flag in the clinician list; the loop metrics and the event timeline for the DoH
// network admin and a clinic admin. Every test starts from and leaves the seeded demo (the demo path closes Fatima's
// follow-up itself).
test.beforeAll(resetDemo);
test.afterEach(resetDemo);

const h = en.clinic.history;
const loop = en.loop;

test("the clinician drafts a reminder, books and closes Fatima's follow-up; the history tells it step by step", async ({ page }) => {
  await signIn(page, { role: "clinician" });
  await page.goto("/clinic/patients/fatima");
  const gaps = page.getByRole("region", { name: en.clinic.gapsTitle });
  await expect(gaps.getByText(en.clinic.gapType.postpartum_glucose_test)).toBeVisible();

  // The care navigator drafts the reminder; the clinician approves it and sends it herself. Nothing is sent.
  await gaps.getByRole("button", { name: en.clinic.reminder }).click();
  const dialog = page.getByRole("dialog", { name: en.clinic.reminderTitle });
  await expect(dialog).toContainText("after-birth glucose test");
  await expect(dialog).toContainText(en.clinic.reminderNote);
  await dialog.getByRole("button", { name: en.clinic.reminderApprove }).click();
  await expect(page.getByText(en.clinic.reminderApproved).first()).toBeAttached();

  await gaps.getByRole("button", { name: en.clinic.gapBook }).click();
  await expect(gaps.getByRole("button", { name: en.clinic.gapBook })).toHaveCount(0);
  await gaps.getByRole("button", { name: en.clinic.gapDone }).click();
  await expect(gaps.getByRole("button", { name: en.clinic.gapReopen })).toBeVisible();

  const story = gaps.getByTestId(/^history-/);
  await story.locator("summary").click();
  const steps = story.locator("li[data-step]");
  await expect(steps).toHaveCount(7);
  expect(await steps.evaluateAll((els) => els.map((e) => e.getAttribute("data-step")))).toEqual([
    "opened",
    "shared",
    "reminder",
    "reminder_approved",
    "booked",
    "done",
    "pending-result",
  ]);
  await expect(story).toContainText("CARE_POSTPARTUM_GLUCOSE_TEST"); // opened by which rule
  await expect(story.getByRole("link", { name: /ADA Standards of Care/ })).toBeVisible(); // and its source
  await expect(steps.nth(4)).toContainText("clin-01"); // booked by a clinician, pseudonymous id
  await expect(steps.nth(5)).toContainText(h.steps.done);
  await expect(steps.nth(6)).toContainText(h.pending.result);
  await expect(story).toContainText(/Audit entry #\d+/);
  await expectNoSideScroll(page, "clinician follow-up history");
  await expectAccessible(page, "clinician follow-up history");

  // She reads the same loop in her own words, with her clinic named and no staff id.
  await signIn(page, { persona: "fatima" });
  await page.goto("/app");
  const mine = page.getByTestId("follow-up-story");
  await expect(mine).toContainText("ReproSense opened this on");
  await expect(mine).toContainText("Your clinic drafted a reminder for you on");
  await expect(mine).toContainText("Your clinic booked this on");
  await expect(mine).toContainText("Your clinic marked this done on");
  await expect(mine).toContainText(en.followups.pending.result);
  await expect(mine).not.toContainText("clin-01");
  await expectAccessible(page, "her follow-ups");

  await useLanguage(page, "ar");
  await page.goto("/app");
  await expect(page.getByTestId("follow-up-story")).toContainText("حجزت عيادتك هذه المتابعة في");
  await expectNoSideScroll(page, "her follow-ups (ar)");
  await expectAccessible(page, "her follow-ups (ar)");
});

test("an overdue follow-up is flagged, sorted after urgent records and counted on /admin", async ({ page }) => {
  // A new mother 14 weeks after a birth with gestational diabetes: her glucose-test window (weeks 4-12) has ended
  const joined = await page.request.post("/api/v1/demo/signup", {
    data: {
      name: "Maryam",
      age: 31,
      region: "Al Ain",
      lang: "en",
      life_stage: "after_birth",
      weeks_since_birth: 14,
      gdm: true,
      clinic_id: "clinic_corniche",
      share_with_clinic: true,
    },
  });
  expect(joined.ok()).toBeTruthy();

  await signIn(page, { role: "clinician" });
  await page.goto("/clinic");
  const rows = page.getByRole("navigation", { name: en.clinic.listLabel }).getByRole("link");
  await expect(rows.nth(0)).toContainText("Sara"); // the red flag first
  await expect(rows.nth(1)).toContainText("Maryam");
  await expect(rows.nth(1)).toContainText(en.clinic.overdue);
  await expect(page.getByText(/Its window ended on \d+ \w+ and it has not been booked/).first()).toBeVisible();
  await expectAccessible(page, "clinician list with an overdue follow-up");

  await rows.nth(1).click();
  const gaps = page.getByRole("region", { name: en.clinic.gapsTitle });
  await expect(gaps.getByText(en.clinic.overdue, { exact: true })).toBeVisible();
  await gaps.getByRole("button", { name: en.clinic.reminder }).click();
  await expect(page.getByRole("dialog", { name: en.clinic.reminderTitle })).toContainText(en.clinic.reminderNote);

  await signIn(page, { role: "admin" });
  await page.goto("/admin");
  const metrics = page.getByTestId("loop-metrics");
  await expect(metrics.getByRole("heading", { name: loop.title })).toBeVisible();
  await expect(metrics.locator("[data-metric=overdue]")).toContainText("86"); // 85 in the synthetic cohort, plus hers
});

test("the event timeline: the network sees every clinic, filters and pages; a clinic admin sees only hers", async ({ page }) => {
  await signIn(page, { role: "clinician" });
  for (const pid of ["fatima", "noura", "sara", "priya", "hessa", "layla", "mariam"]) {
    for (let i = 0; i < 3; i += 1) expect((await page.request.get(`/api/v1/clinic/patients/${pid}`)).ok()).toBeTruthy();
  }

  await signIn(page, { role: "admin" });
  await page.goto("/admin");
  const tl = page.getByTestId("event-timeline");
  await expect(tl.getByRole("heading", { name: loop.eventsTitle })).toBeVisible();
  await expect(tl.getByText(/^Chain intact · \d+ entries$/)).toBeVisible();
  const table = tl.getByRole("region", { name: loop.eventsTitle });
  await expect(table.locator("tbody tr").first()).toBeVisible();
  await expect(tl.getByText(/^Page 1 of \d+ · \d+ events$/)).toBeVisible();
  await expect(table).not.toContainText(/Fatima|Noura|fatima|noura/); // pseudonymous ids only
  await expect(table).toContainText(/R-[0-9A-F]{8}/);
  await expectAccessible(page, "network event timeline");
  await expectNoSideScroll(page, "network event timeline");

  // Older events keep the first page's snapshot: the next page starts where this one ended
  const lastId = await table.locator("tbody tr").last().locator("time").getAttribute("datetime");
  await tl.getByRole("button", { name: loop.older }).click();
  await expect(tl.getByText(/^Page 2 of \d+/)).toBeVisible();
  const firstOnTwo = await table.locator("tbody tr").first().locator("time").getAttribute("datetime");
  expect(firstOnTwo! <= lastId!).toBeTruthy();

  await tl.getByLabel(loop.filterRole, { exact: true }).selectOption("clinician");
  await tl.getByLabel(loop.filterAction, { exact: true }).selectOption("view_record");
  await tl.getByRole("button", { name: loop.apply }).click();
  await expect(tl.getByText(/^Page 1 of 2 · 21 events$/)).toBeVisible();
  const roles = await table.locator("tbody tr td:nth-child(2)").allTextContents();
  expect(new Set(roles)).toEqual(new Set([loop.roles.clinician]));
  await tl.getByRole("button", { name: loop.clear }).click();
  await expect(tl.getByLabel(loop.filterRole, { exact: true })).toHaveValue("");

  await signIn(page, { role: "clinic_admin" });
  await page.goto("/clinic-admin");
  await expect(page.getByTestId("loop-metrics")).toBeVisible();
  const mine = page.getByTestId("event-timeline");
  await expect(mine.getByText(/^Chain intact/)).toBeVisible();
  await expect(mine.getByRole("region", { name: loop.eventsTitle }).locator("tbody tr").first()).toBeVisible();
  await expect(mine.getByLabel(loop.filterClinic, { exact: true })).toHaveCount(0); // her clinic only: there is nothing to choose
  await mine.getByLabel(loop.filterRole, { exact: true }).selectOption("clinician");
  await mine.getByRole("button", { name: loop.apply }).click();
  await expect(mine.getByRole("region", { name: loop.eventsTitle })).toContainText("clin-01");
  await expectAccessible(page, "clinic event timeline");
  await expectNoSideScroll(page, "clinic event timeline");
});
