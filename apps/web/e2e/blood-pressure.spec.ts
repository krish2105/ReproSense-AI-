import { ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// Build week K6: blood pressure in pregnancy and after birth (NICE NG133). Hessa is 24 weeks pregnant. A reading of
// 160/110 or higher (or 140/90 or higher with a severe headache, vision changes or sudden swelling the same day) raises
// RF7: the urgent card with 998 comes back with the save and is shown first, before the form.
const RF7_TITLE = "This blood pressure reading needs urgent care"; // backend/app/agents/copy.py RF_TITLES
const RF7_TITLE_AR = "قراءة ضغط الدم هذه تحتاج رعاية عاجلة";

test.describe("blood pressure", () => {
  test.describe.configure({ mode: "serial" });
  test.afterEach(resetDemo); // the first test saves a reading into Hessa's demo record

  test("Hessa logs 165/100 and the 998 card shows first", async ({ page }) => {
    await signIn(page, { persona: "hessa" });
    await page.goto("/app/log");
    const form = page.getByTestId("bp-form");
    await expect(form.getByRole("heading", { name: en.bp.title })).toBeVisible();
    await form.getByLabel(en.bp.systolic).fill("165");
    await form.getByLabel(en.bp.diastolic).fill("100");
    await form.getByRole("button", { name: en.bp.saveToday }).click();

    const urgent = form.getByRole("region", { name: RF7_TITLE });
    await expect(urgent).toBeVisible();
    await expect(urgent).toContainText(en.urgent.action);
    await expect(urgent.getByRole("link", { name: en.urgent.call })).toHaveAttribute("href", "tel:998");
    await expect(urgent).toContainText("blood pressure 165/100 mmHg");
    await expect(urgent.getByRole("link", { name: /NICE NG133/ })).toBeVisible();
    // First: the urgent card sits above the form fields and has focus
    const cardTop = (await urgent.boundingBox())!.y;
    const fieldTop = (await form.getByLabel(en.bp.systolic).boundingBox())!.y;
    expect(cardTop).toBeLessThan(fieldTop);
    await expect(form.getByText(`165/100`, { exact: true })).toBeVisible(); // the day's readings list
    await expectAccessible(page, "log screen with the blood-pressure red flag");

    // Home: the same urgent card at the top, the reading in the blood-pressure card
    await page.goto("/app");
    await expect(page.getByRole("region", { name: en.home.urgentTitle }).getByRole("region", { name: RF7_TITLE })).toBeVisible();
    await expect(page.getByTestId("bp-card")).toContainText("165/100");

    // Her clinician sees the reading and the red flag
    await signIn(page, { role: "clinician" });
    await page.goto("/clinic/patients/hessa");
    await expect(page.getByTestId("clinic-bp")).toContainText("165/100");
    await expect(page.getByTestId("clinic-bp")).toContainText(en.bp.noteSevere);
    await expect(page.getByRole("heading", { name: RF7_TITLE })).toBeVisible();
  });

  test("a slip is caught before saving", async ({ page }) => {
    await signIn(page, { persona: "hessa" });
    await page.goto("/app/log");
    const form = page.getByTestId("bp-form");
    await form.getByLabel(en.bp.systolic).fill("80");
    await form.getByLabel(en.bp.diastolic).fill("120");
    await form.getByRole("button", { name: en.bp.saveToday }).click();
    await expect(form.getByRole("alert")).toHaveText(en.bp.orderError);
    await expect(form.getByRole("region", { name: RF7_TITLE })).toHaveCount(0);
  });

  test("not offered outside pregnancy and the weeks after birth", async ({ page }) => {
    await signIn(page, { persona: "noura" });
    await page.goto("/app/log");
    await expect(page.getByRole("heading", { name: en.log.title })).toBeVisible();
    await expect(page.getByTestId("bp-form")).toHaveCount(0);
    await page.goto("/app");
    await expect(page.getByTestId("bp-card")).toHaveCount(0);
  });

  test("Fatima's readings after birth are on Patterns", async ({ page }) => {
    await signIn(page, { persona: "fatima" });
    await page.goto("/app/timeline?months=3");
    const table = page.getByTestId("bp-readings");
    await expect(table.getByRole("heading", { name: en.bp.tableTitle })).toBeVisible();
    await expect(table).toContainText("118/78");
    await expectNoSideScroll(page, "Patterns with blood-pressure readings");
  });
});

test.describe("blood pressure in Arabic, dark", () => {
  test.use({ colorScheme: "dark" });
  test.afterEach(resetDemo);

  test("the form and the urgent card read right to left", async ({ page }) => {
    await signIn(page, { persona: "hessa" });
    await useLanguage(page, "ar");
    await page.goto("/app/log");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const form = page.getByTestId("bp-form");
    await expect(form.getByRole("heading", { name: ar.bp.title })).toBeVisible();
    await form.getByLabel(ar.bp.systolic).fill("142");
    await form.getByLabel(ar.bp.diastolic).fill("112");
    await form.getByRole("button", { name: ar.bp.saveToday }).click();
    const urgent = form.getByRole("region", { name: RF7_TITLE_AR });
    await expect(urgent).toBeVisible();
    await expect(urgent).toContainText("ضغط الدم 142/112");
    await expectNoSideScroll(page, "Arabic log screen with the blood-pressure card");
    await expectAccessible(page, "Arabic dark log screen with the blood-pressure red flag");
  });
});
