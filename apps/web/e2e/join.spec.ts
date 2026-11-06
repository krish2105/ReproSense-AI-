import { en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test } from "./fixtures";

// Start your own record (MVP scorecard: sign up, consent, log and see value in under three minutes) and the clinic's
// patient invite (SaaS scorecard: clinic onboarding). The new records are removed by the reset after this file.
test.describe.configure({ mode: "serial" });
test.afterAll(resetDemo);

const CLINIC = "Seaside Women's Clinic (fictional)";
const hello = (name: string) => new RegExp(`Hi, \\u2068?${name}\\u2069?`);

test("a patient invited by the clinic's QR starts a record, shares it, and the clinician sees her follow-up", async ({ page }) => {
  test.setTimeout(90_000);
  const started = Date.now();
  await page.goto("/join?clinic=clinic_corniche");
  await expect(page.getByText(`Invited by ${CLINIC}`)).toBeVisible();
  await expect(page.getByText(en.join.demoNote)).toBeVisible(); // never real health information
  await expectAccessible(page, "join step 1");
  await page.getByRole("button", { name: en.join.continue }).click();

  await expect(page.getByRole("heading", { name: en.join.aboutTitle })).toBeFocused();
  await page.getByLabel(en.join.name).fill("Maryam");
  await page.getByLabel(en.join.age).fill("31");
  await page.getByRole("group", { name: en.join.region }).getByRole("radio", { name: "Al Ain", exact: true }).check();
  await page.getByRole("group", { name: en.join.stage }).getByRole("radio", { name: en.stages.after_birth, exact: true }).check();
  await expectAccessible(page, "join step 2");
  await page.getByRole("button", { name: en.join.continue }).click();

  await page.getByLabel(en.join.weeksSinceBirth).fill("6");
  await page.getByRole("group", { name: en.join.gdm }).getByRole("radio", { name: en.join.gdmYes, exact: true }).check();
  const share = page.getByRole("checkbox", { name: /Share my record with/ });
  await expect(share).not.toBeChecked(); // sharing is her choice, never the default
  await share.check();
  await expectNoSideScroll(page, "join step 3");
  await page.getByRole("button", { name: en.join.create }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(hello("Maryam"))).toBeVisible();
  await expect(page.getByText("Week 6", { exact: true }).first()).toBeVisible(); // her after-birth arc, from what she typed
  expect(Date.now() - started, "sign up and see her record in under three minutes").toBeLessThan(180_000);

  // The clinician now finds her, with the glucose follow-up her answers opened.
  await signIn(page, { role: "clinician" });
  await page.goto("/clinic");
  const row = page.getByRole("navigation", { name: en.clinic.listLabel }).getByRole("link", { name: /Maryam/ });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByRole("region", { name: en.clinic.gapsTitle })).toContainText(en.clinic.gapType.postpartum_glucose_test);
});

test("a new record without a clinic starts from her last period, and nothing is shared", async ({ page }) => {
  await page.goto("/join");
  await expect(page.getByText(/Invited by/)).toHaveCount(0);
  await page.getByRole("button", { name: en.join.continue }).click();
  await page.getByLabel(en.join.name).fill("Huda");
  await page.getByLabel(en.join.age).fill("26");
  await page.getByRole("group", { name: en.join.region }).getByRole("radio", { name: "Abu Dhabi City", exact: true }).check();
  await page.getByRole("group", { name: en.join.stage }).getByRole("radio", { name: en.stages.periods, exact: true }).check();
  await page.getByRole("button", { name: en.join.continue }).click();
  await page.getByLabel(en.join.lastPeriod).fill("2026-11-10");
  await expect(page.getByRole("checkbox", { name: /Share my record with/ })).toHaveCount(0); // no clinic, no sharing question
  await expect(page.getByRole("checkbox", { name: en.join.useAi })).not.toBeChecked(); // AI stays off unless she ticks it
  await page.getByRole("button", { name: en.join.create }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(hello("Huda"))).toBeVisible();
  await expect(page.getByText("Day 13", { exact: true }).first()).toBeVisible(); // 10 Nov to the demo's 22 Nov

  await signIn(page, { role: "clinician" });
  await page.goto("/clinic");
  await expect(page.getByRole("navigation", { name: en.clinic.listLabel }).getByRole("link", { name: /Huda/ })).toHaveCount(0);
});

test("the join steps refuse to move on with missing answers", async ({ page }) => {
  await page.goto("/join");
  await page.getByRole("button", { name: en.join.continue }).click();
  await page.getByLabel(en.join.name).fill("Noor");
  await page.getByRole("button", { name: en.join.continue }).click(); // no age, region or stage yet
  await expect(page.getByRole("alert").filter({ hasText: en.join.required })).toBeVisible();
  await expect(page.getByRole("heading", { name: en.join.aboutTitle })).toBeVisible();
});

test("the clinic shows a patient QR that opens the invite", async ({ page }) => {
  await signIn(page, { role: "clinician" });
  await page.goto("/clinic");
  const invite = page.getByRole("region", { name: en.clinic.inviteTitle });
  await expect(invite.getByRole("img", { name: en.clinic.inviteQrLabel })).toBeVisible();
  await expect(invite).toContainText("/join?clinic=clinic_corniche");
  await expect(invite.getByRole("link", { name: en.clinic.inviteOpen })).toHaveAttribute("href", "/join?clinic=clinic_corniche");
});
