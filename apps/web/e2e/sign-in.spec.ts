import type { CDPSession, Page } from "@playwright/test";
import { en, expect, expectAccessible, expectNoSideScroll, pickDate, resetDemo, signIn, test } from "./fixtures";

// Her own sign-in (K5): she starts a record, adds a passkey, and opens the same record on another device that holds
// the passkey (a synced passkey). Chromium's virtual authenticator (CDP WebAuthn domain) stands in for Face ID or a
// fingerprint: a platform authenticator with resident keys and user verification. The records are removed after.
test.describe.configure({ mode: "serial" });
test.afterAll(resetDemo);

const hello = (name: string) => new RegExp(`Hi, \\u2068?${name}\\u2069?`);

type Credential = { credentialId: string; isResidentCredential: boolean; rpId?: string; privateKey: string; userHandle?: string; signCount: number };

async function virtualAuthenticator(page: Page): Promise<{ cdp: CDPSession; id: string }> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return { cdp, id: authenticatorId };
}

async function joinAsNewRecord(page: Page, name: string) {
  await page.goto("/join");
  await page.getByRole("button", { name: en.join.continue }).click();
  await page.getByLabel(en.join.name).fill(name);
  await page.getByLabel(en.join.age).fill("27");
  await page.getByRole("group", { name: en.join.region }).getByRole("radio", { name: "Abu Dhabi City", exact: true }).check();
  await page.getByRole("group", { name: en.join.stage }).getByRole("radio", { name: en.stages.periods, exact: true }).check();
  await page.getByRole("button", { name: en.join.continue }).click();
  await pickDate(page, en.join.lastPeriod, "2026-11-12");
  await page.getByRole("button", { name: en.join.create }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(hello(name))).toBeVisible();
}

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("she adds a passkey to her new record and opens it on another device with it", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const device = await virtualAuthenticator(page);
  await joinAsNewRecord(page, "Huda");

  // Home tells a record she started herself how to keep it; the demo people never see this card.
  await expect(page.getByText(en.home.signinTitle)).toBeVisible();
  await page.getByRole("link", { name: en.home.signinAction }).click();
  await expect(page).toHaveURL(/\/app\/privacy#sign-in$/);
  const box = page.locator("#sign-in");
  await expect(box.getByText(en.privacy.signin.none)).toBeVisible();
  await expect(box.getByText(en.privacy.signin.emailOff)).toBeVisible(); // no email key in CI: the code option is off
  await expectAccessible(page, "privacy with no passkey");

  await box.getByRole("button", { name: en.privacy.signin.add, exact: true }).click();
  await expect(box.getByRole("button", { name: new RegExp(`^${en.privacy.signin.remove}: Passkey`) })).toBeVisible();
  await expect(box.getByText(en.privacy.signin.none)).toHaveCount(0);
  await expectNoSideScroll(page, "privacy with a passkey");

  const { credentials } = (await device.cdp.send("WebAuthn.getCredentials", { authenticatorId: device.id })) as { credentials: Credential[] };
  expect(credentials).toHaveLength(1);
  expect(credentials[0]!.isResidentCredential).toBe(true); // she signs in later without typing a name or address

  // Another device that holds the same (synced) passkey, with no session: a fresh browser context.
  const other = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: "en-GB", timezoneId: "Asia/Dubai" });
  const phone = await other.newPage();
  const errors = trackErrors(phone);
  const second = await virtualAuthenticator(phone);
  await second.cdp.send("WebAuthn.addCredential", { authenticatorId: second.id, credential: credentials[0]! });

  await phone.goto("/app");
  await expect(phone).toHaveURL(/\/demo/); // no session on this device yet
  await phone.goto("/demo");
  await phone.getByRole("link", { name: en.signin.fromDemo }).click();
  await expect(phone).toHaveURL(/\/signin$/);
  await expect(phone.getByRole("heading", { level: 1, name: en.signin.title })).toBeVisible();
  await expect(phone.getByRole("heading", { name: en.signin.emailTitle })).toHaveCount(0); // hidden without an email key
  await phone.getByRole("button", { name: en.signin.passkeyButton }).click();
  await expect(phone).toHaveURL(/\/app$/);
  await expect(phone.getByText(hello("Huda"))).toBeVisible();

  // After sign-in: her privacy page lists the sign-in, and export and delete work.
  await phone.goto("/app/privacy");
  await expect(phone.getByText(`${en.privacy.roles.patient} · ${en.privacy.actions.sign_in}`).first()).toBeVisible();
  const exported = await phone.request.get("/api/v1/export");
  expect(exported.ok()).toBeTruthy();
  expect(((await exported.json()) as { profile: { alias: string } }).profile.alias).toBe("Huda (demo)");
  await phone.getByRole("button", { name: en.privacy.deleteButton }).click();
  await phone.getByRole("button", { name: en.privacy.deleteConfirm }).click();
  await expect(phone.getByText(en.privacy.deleted).first()).toBeAttached();
  expect(errors, "errors in the second device's console").toEqual([]);
  await other.close();
});

test("the demo people still open with one tap and cannot add a passkey", async ({ page }) => {
  await signIn(page, { persona: "noura" });
  await page.goto("/app");
  await expect(page.getByText(en.home.signinTitle)).toHaveCount(0);
  await page.goto("/app/privacy");
  await expect(page.getByText(en.privacy.signin.demoPerson)).toBeVisible();
  await expect(page.getByRole("button", { name: en.privacy.signin.add, exact: true })).toHaveCount(0);
});
