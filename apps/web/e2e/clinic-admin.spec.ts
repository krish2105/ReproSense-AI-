import { en, expect, expectAccessible, expectNoSideScroll, signIn, test } from "./fixtures";

// A3 · Clinic onboarding screens on Krishna's K4 API: the clinic admin invites a clinician by a single-use link,
// the clinician accepts and lands in the clinician view, the link cannot be used twice, and the export has no names.
const ca = en.clinicAdmin;

test("a clinic admin invites a clinician, who joins once; the team and export follow", async ({ page, browser }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: en.demo.openClinicAdmin }).click();
  await expect(page).toHaveURL(/\/clinic-admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("(fictional)");
  await expect(page.getByLabel(ca.figsLabel)).toBeVisible();
  await expectAccessible(page, "clinic admin");
  await expectNoSideScroll(page, "clinic admin");

  await page.getByRole("button", { name: ca.inviteNew }).click();
  const made = page.getByRole("status", { name: ca.madeLabel });
  await expect(made.getByRole("img", { name: ca.qrLabel })).toBeVisible();
  const link = (await made.getByTestId("invite-link").textContent())!.trim();
  expect(link).toMatch(/\/clinic-invite\/[\w-]{20,}$/);
  const invites = page.getByRole("list", { name: ca.listTitle });
  await expect(invites.getByText(ca.status.pending).first()).toBeVisible();

  // The clinician opens the link in her own browser, with no session.
  const other = await browser.newContext();
  const doc = await other.newPage();
  await doc.goto(link);
  await expect(doc.getByRole("heading", { level: 1 })).toContainText("Join");
  await doc.getByLabel(en.clinicInvite.nameLabel).fill("Reem");
  await doc.getByRole("button", { name: en.clinicInvite.accept }).click();
  await expect(doc).toHaveURL(/\/clinic$/);
  await expect(doc.getByRole("navigation", { name: en.clinic.listLabel })).toBeVisible();

  // The same link a second time is refused, with a way forward.
  await doc.goto(link);
  await expect(doc.getByRole("heading", { level: 1, name: en.clinicInvite.gone.accepted })).toBeVisible();
  await other.close();

  await page.reload();
  await expect(page.getByRole("region", { name: ca.teamTitle })).toContainText("Reem (demo)");
  await expect(invites.getByText(ca.status.accepted).first()).toBeVisible();

  const csv = await page.request.get("/api/v1/clinic-admin/export.csv");
  expect(csv.ok()).toBeTruthy();
  const body = await csv.text();
  expect(body.split(/\r?\n/)[0]).toBe("clinic_id,breakdown,group,follow_up_type,status,count,suppressed");
  expect(body).not.toContain("Reem");
  await expect(page.getByRole("link", { name: ca.export })).toHaveAttribute("href", "/api/v1/clinic-admin/export.csv");
});

test("a pending invite can be withdrawn, and its link then says so", async ({ page }) => {
  await signIn(page, { role: "clinic_admin" });
  await page.goto("/clinic-admin");
  await page.getByRole("button", { name: ca.inviteNew }).click();
  const link = (await page.getByTestId("invite-link").textContent())!.trim();
  await page.getByRole("list", { name: ca.listTitle }).getByRole("button", { name: ca.withdraw }).first().click();
  await expect(page.getByText(ca.withdrawn).first()).toBeVisible();
  await page.goto(link);
  await expect(page.getByRole("heading", { level: 1, name: en.clinicInvite.gone.revoked })).toBeVisible();
});

test("the clinic admin area is its own role", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/clinic-admin");
  await expect(page).toHaveURL(/\/demo\?need=clinic_admin$/);
  await expect(page.getByText(en.demo.need.clinic_admin)).toBeVisible();
  await page.goto("/clinic-invite/not-a-real-token-at-all-000000");
  await expect(page.getByRole("heading", { level: 1, name: en.clinicInvite.gone.unknown })).toBeVisible();
});
