import { en, expect, expectAccessible, resetDemo, signIn, test } from "./fixtures";

// What a clinic buyer checks (docs/09 C, Real SaaS): the trust centre maps the DoH Responsible AI Standard, each
// clinic's totals are visible to the network, the audit log exports for a compliance review, support terms exist,
// and an invited clinician sees only her own clinic's patients (each clinic is its own tenant).
test.afterAll(resetDemo); // the invite test adds a demo clinician

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
  const link = page.getByRole("link", { name: en.admin.auditExport });
  const res = await page.request.get((await link.getAttribute("href"))!);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const head = (await res.text()).split(/\r?\n/)[0]; // RFC 4180 CSV lines end in CRLF
  expect(head).toBe("id,at,actor_role,actor_id,action,subject_id,target,prev_hash,hash");
});

test("the status page states the support terms", async ({ page }) => {
  await page.goto("/status");
  const support = page.getByRole("region", { name: en.status.supportTitle });
  await expect(support).toContainText("24 hours");
  await expect(support.getByRole("listitem")).toHaveCount(4);
});

test("a clinician invited to another clinic sees only that clinic's patients", async ({ page }) => {
  await signIn(page, { role: "admin" });
  await page.goto("/admin");
  const panel = page.getByRole("region", { name: en.admin.inviteTitle });
  await panel.getByLabel(en.admin.inviteClinic).selectOption("clinic_north");
  await panel.getByRole("button", { name: en.admin.inviteCreate }).click();
  const open = panel.getByRole("link", { name: en.admin.inviteOpen });
  await expect(panel.getByRole("img", { name: en.admin.inviteQrLabel })).toBeVisible();
  const href = (await open.getAttribute("href"))!;
  expect(href).toMatch(/^\/join\/clinician\?invite=/);

  await page.context().clearCookies(); // the invite is opened by someone who is not signed in
  await page.goto(href);
  await expect(page.getByRole("heading", { name: `Join ${en.clinics.clinic_north}` })).toBeVisible();
  await expectAccessible(page, "clinician invite");
  await page.getByLabel(en.joinClinician.name).fill("Dr Rana");
  await page.getByRole("button", { name: en.joinClinician.join }).click();
  await expect(page).toHaveURL(/\/clinic$/);
  await expect(page.getByText(en.clinic.emptyTitle)).toBeVisible(); // nobody shares with North Island

  await page.goto("/join/clinician?invite=not-a-real-invite-token-000");
  await expect(page.getByRole("heading", { name: en.joinClinician.invalidTitle })).toBeVisible();
});
