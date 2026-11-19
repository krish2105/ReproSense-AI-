import { readFile } from "node:fs/promises";
import { en, expect, signIn, test } from "./fixtures";

// What a clinic buyer checks (docs/09 C, Real SaaS): the trust centre maps the DoH Responsible AI Standard, each
// clinic's totals are visible to the network, the audit log exports for a compliance review, and support terms exist.

test("the trust centre maps the DoH AI standard and says what is not done yet", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: en.chrome.footerTrust }).click();
  await expect(page).toHaveURL(/\/trust$/);
  await expect(page.getByRole("heading", { name: en.trust.title, level: 1 })).toBeVisible();
  const clauses = page.getByRole("list").filter({ hasText: en.trust.rows.r9.asks }).getByRole("listitem");
  await expect(clauses).toHaveCount(13);
  await expect(clauses.filter({ hasText: en.trust.rows.r9.asks })).toContainText(en.trust.status.built); // AI opt-out works
  await expect(clauses.filter({ hasText: en.trust.rows.r7.asks })).toContainText(en.trust.status.planned); // UAE hosting: honest
  await expect(page.getByRole("region", { name: en.trust.notTitle })).toContainText(en.trust.not.n2);
  await expect(page.getByRole("link", { name: en.trust.sourceDoh })).toHaveAttribute("href", /doh\.gov\.ae/);
});

test("the network admin sees each clinic and downloads the audit log", async ({ page }) => {
  await signIn(page, { role: "admin" });
  await page.goto("/admin");
  const byClinic = page.locator("section").filter({ has: page.getByRole("heading", { name: en.admin.clinicsTitle }) });
  await expect(byClinic.getByRole("row")).toHaveCount(5); // header + four fictional clinics
  await expect(byClinic).toContainText(en.clinics.clinic_alain);
  // The export asks for a step-up first: a one-tap demo session confirms in one tap (plan section 5).
  await page.getByRole("button", { name: en.admin.auditExport }).click();
  const saved = page.waitForEvent("download");
  await page.getByRole("dialog").getByRole("button", { name: en.staffAuth.stepUp.demoButton }).click();
  const download = await saved;
  expect(download.suggestedFilename()).toBe("reprosense-audit-log.csv");
  const head = (await readFile(await download.path(), "utf8")).split(/\r?\n/)[0]; // RFC 4180 CSV lines end in CRLF
  expect(head).toBe("id,at,actor_role,actor_id,action,subject_id,target,prev_hash,hash");
});

test("the status page states the support terms", async ({ page }) => {
  await page.goto("/status");
  const support = page.getByRole("region", { name: en.status.supportTitle });
  await expect(support).toContainText("24 hours");
  await expect(support.getByRole("listitem")).toHaveCount(4);
  // Issue #30: a live check of the API each time the page opens, with its time
  const live = page.getByRole("region", { name: en.status.liveTitle });
  await expect(live).toContainText(en.status.liveUp);
  await expect(live).toContainText("Gulf time");
});

test("Ask the record offers 'mood since the birth' only for a record with a birth (#43 b)", async ({ page }) => {
  await signIn(page, { role: "clinician" });
  const mood = page.getByRole("region", { name: en.clinic.askTitle }).getByRole("button", { name: en.clinic.askChips.mood });
  await page.goto("/clinic/patients/fatima");
  await expect(page.getByRole("button", { name: en.clinic.askChips.cycles })).toBeVisible();
  await expect(mood).toBeVisible();
  await page.goto("/clinic/patients/noura");
  await expect(page.getByRole("button", { name: en.clinic.askChips.cycles })).toBeVisible();
  await expect(mood).toHaveCount(0);
});

test("Noura's record size is the same number on home, Patterns and the clinician view (#43 a)", async ({ page }) => {
  const days = async (path: string) => {
    await page.goto(path);
    const text = await page.getByText(/\d+ days logged/).first().innerText();
    return Number(/(\d+) days logged/.exec(text)![1]);
  };
  await signIn(page, { persona: "noura" });
  const home = await days("/app");
  const patterns = await days("/app/insights");
  await signIn(page, { role: "clinician" });
  const clinician = await days("/clinic/patients/noura");
  expect(home).toBeGreaterThan(0);
  expect([patterns, clinician]).toEqual([home, home]);
});
