import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { request, type CDPSession, type Page } from "@playwright/test";
import { API, ar, en, expect, expectAccessible, expectNoSideScroll, resetDemo, signIn, test, useLanguage } from "./fixtures";

// Staff and DoH sign-in (the team's plan section 5). Two doors: /staff/signin (clinicians and clinic admins, a passkey
// only) and /doh/signin (the DoH network admin: a passkey, then a code from an authenticator app). Sign-out revokes the
// session on the server, exports ask for the passkey again, and the judges' one-tap demo logins keep working.
// Chromium's virtual authenticator (CDP WebAuthn domain) stands in for Face ID or a fingerprint, as in sign-in.spec.ts.
test.afterAll(resetDemo);

const sa = en.staffAuth;

async function virtualAuthenticator(page: Page): Promise<{ cdp: CDPSession; id: string }> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });
  return { cdp, id: authenticatorId };
}

const header = (page: Page) => page.getByRole("banner");
const cookieToken = async (page: Page) => (await page.context().cookies()).find((c) => c.name === "rs_token")?.value ?? "";

/** The token a browser held before signing out must now be refused by the API itself (a copied cookie stops working). */
async function expectRevoked(token: string) {
  const api = await request.newContext({ baseURL: API });
  const r = await api.get("/v1/demo/whoami", { headers: { authorization: `Bearer ${token}` } });
  expect(r.status()).toBe(401);
  expect(r.headers()["x-session-ended"]).toBe("revoked");
  await api.dispose();
}

/** Clicks an export button, confirms the step-up in the dialog, and returns the saved file's name and text. */
async function exportWithStepUp(page: Page, label: string, confirm: string) {
  await page.getByRole("button", { name: label }).click();
  const saved = page.waitForEvent("download");
  await page.getByRole("dialog").getByRole("button", { name: confirm }).click();
  const download = await saved;
  return { name: download.suggestedFilename(), text: await readFile(await download.path(), "utf8") };
}

// RFC 6238 TOTP (SHA-1, 30 s, 6 digits), the same codes an authenticator app shows.
function base32(s: string): Buffer {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    value = (value << 5) | A.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
function totp(secret: string, at = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const h = createHmac("sha1", base32(secret)).update(counter).digest();
  const o = h[h.length - 1]! & 15;
  const n = ((h[o]! & 127) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!;
  return String(n % 1_000_000).padStart(6, "0");
}

test("a clinic admin adds a passkey in Your sign-in, signs out for real, and comes back through the staff door", async ({ page }) => {
  test.setTimeout(120_000);
  await virtualAuthenticator(page);
  await signIn(page, { role: "clinic_admin" }); // the judges' one tap, unchanged
  await page.goto("/clinic-admin");
  await header(page).getByRole("button", { name: en.chrome.account, exact: true }).click(); // the Account menu (docs/31 §A)
  await header(page).getByRole("link", { name: en.chrome.nav.signIn, exact: true }).click();
  await expect(page).toHaveURL(/\/clinic-admin\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1, name: sa.panel.title })).toBeVisible();
  await expect(page.getByText(sa.panel.shared)).toBeVisible(); // a shared fictional demo account says so
  await expect(page.getByText(sa.panel.sharedEverywhere)).toBeVisible();
  await expectAccessible(page, "staff Your sign-in");
  await expectNoSideScroll(page, "staff Your sign-in");

  await page.getByRole("button", { name: sa.panel.add, exact: true }).click();
  await expect(page.getByRole("button", { name: new RegExp(`^${sa.panel.remove}: `) })).toBeVisible();

  // Sign out revokes the session on the server: the old cookie gets 401 even if someone copied it.
  const before = await cookieToken(page);
  await header(page).getByRole("button", { name: en.chrome.signOut, exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/signin\?signed_out=1$/);
  await expect(page.getByText(sa.ended.signedOut)).toBeVisible();
  await expectRevoked(before);

  // The staff door: a passkey only, then her own area.
  await page.getByRole("button", { name: sa.staff.passkeyButton }).click();
  await expect(page).toHaveURL(/\/clinic-admin$/);
  await page.goto("/clinic-admin/sign-in");
  await expect(page.getByText(sa.panel.how.passkey).first()).toBeVisible();

  // The clinic CSV asks for the passkey again (step-up), then downloads.
  await page.goto("/clinic-admin");
  const file = await exportWithStepUp(page, en.clinicAdmin.export, sa.stepUp.passkeyButton);
  expect(file.name).toBe("reprosense-clinic_corniche-follow-ups.csv");
  expect(file.text.split(/\r?\n/)[0]).toBe("clinic_id,breakdown,group,follow_up_type,status,count,suppressed");
});

test("an invited clinician adds a passkey right after joining and signs in with it at the staff door", async ({ page, browser }) => {
  test.setTimeout(120_000);
  await signIn(page, { role: "clinic_admin" });
  await page.goto("/clinic-admin");
  await page.getByRole("button", { name: en.clinicAdmin.inviteNew }).click();
  const link = (await page.getByTestId("invite-link").textContent())!.trim();

  const other = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: "en-GB", timezoneId: "Asia/Dubai" });
  const doc = await other.newPage();
  await virtualAuthenticator(doc);
  await doc.goto(link);
  await doc.getByLabel(en.clinicInvite.nameLabel).fill("Salma");
  await doc.getByRole("button", { name: en.clinicInvite.accept }).click();
  await expect(doc.getByText(en.clinicInvite.passkeyBody)).toBeVisible(); // a passkey is offered right away
  await doc.getByRole("button", { name: en.clinicInvite.addPasskey }).click();
  await expect(doc.getByText(en.clinicInvite.passkeyAdded)).toBeVisible();
  await doc.getByRole("button", { name: en.clinicInvite.open }).click();
  await expect(doc).toHaveURL(/\/clinic$/);

  await header(doc).getByRole("button", { name: en.chrome.signOut, exact: true }).click();
  await expect(doc).toHaveURL(/\/staff\/signin\?signed_out=1$/);
  await doc.getByRole("button", { name: sa.staff.passkeyButton }).click();
  await expect(doc).toHaveURL(/\/clinic$/);
  await expect(doc.getByRole("navigation", { name: en.clinic.listLabel })).toBeVisible();
  await other.close();
});

test("the DoH admin sets up a passkey and an authenticator app from the operator's link, then signs in with both", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "the setup link comes from the operator's CLI, which needs the API's database");
  test.setTimeout(150_000);
  await virtualAuthenticator(page);
  // The operator's CLI (no HTTP route makes DoH accounts or setup links).
  const out = execFileSync("uv", ["run", "--frozen", "python", "-m", "app.security.create_doh_admin", "--setup", "doh-01", "--json"], {
    cwd: path.resolve(process.cwd(), "../../backend"),
    env: process.env,
    encoding: "utf8",
  });
  const { token } = JSON.parse(out) as { token: string };

  await page.goto(`/doh/setup/${token}`);
  await expect(page.getByRole("heading", { level: 1, name: sa.setup.title })).toBeVisible();
  await page.getByRole("button", { name: sa.setup.addPasskey }).click();
  await expect(page.getByRole("img", { name: sa.setup.qrLabel })).toBeVisible();
  const secret = (await page.getByTestId("totp-secret").getAttribute("data-secret"))!;
  expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  await expectAccessible(page, "DoH setup");
  await page.getByLabel(sa.setup.codeLabel).fill(totp(secret));
  await page.getByRole("button", { name: sa.setup.finish }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // The link works once.
  await page.goto(`/doh/setup/${token}`);
  await expect(page.getByRole("heading", { level: 1, name: sa.setup.gone.used })).toBeVisible();

  // Sign out, then the DoH door: the passkey, then the next code from the app.
  await page.goto("/admin/sign-in");
  await expect(page.getByText(sa.panel.how.passkey_code).first()).toBeVisible();
  await header(page).getByRole("button", { name: en.chrome.signOut, exact: true }).click();
  await expect(page).toHaveURL(/\/doh\/signin\?signed_out=1$/);
  await page.getByRole("button", { name: sa.doh.passkeyButton }).click();
  await expect(page.getByText(sa.doh.passkeyOk)).toBeVisible();
  await page.getByLabel(sa.doh.codeLabel).fill(totp(secret, Date.now() + 30_000));
  await page.getByRole("button", { name: sa.doh.submit, exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // The audit log export asks for the passkey again.
  const file = await exportWithStepUp(page, en.admin.auditExport, sa.stepUp.passkeyButton);
  expect(file.name).toBe("reprosense-audit-log.csv");
  expect(file.text).toContain("doh_setup_complete");
  expect(file.text).toContain("step_up");
});

test("the judges' one tap stays beside the staff doors, and an ended session says why", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("link", { name: en.demo.staffSignin, exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/signin$/);
  await expect(page.getByRole("heading", { level: 1, name: sa.staff.title })).toBeVisible();
  await expectAccessible(page, "staff sign-in");
  await expectNoSideScroll(page, "staff sign-in");

  await page.goto("/staff/signin?ended=idle&area=clinician");
  await expect(page.getByText(sa.ended.idle.replace("{minutes}", "30"))).toBeVisible();
  await page.getByRole("link", { name: sa.demoArea.clinician }).click(); // still one tap
  await expect(page).toHaveURL(/\/clinic$/);
  await expect(header(page).getByRole("button", { name: en.chrome.account, exact: true })).toBeVisible();
});

test("the DoH door in Arabic", async ({ page }) => {
  await useLanguage(page, "ar");
  await page.goto("/doh/signin");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1, name: ar.staffAuth.doh.title })).toBeVisible();
  await expect(page.getByRole("link", { name: ar.staffAuth.demoArea.admin })).toBeVisible();
  await expectAccessible(page, "DoH sign-in, Arabic");
  await expectNoSideScroll(page, "DoH sign-in, Arabic");
});
