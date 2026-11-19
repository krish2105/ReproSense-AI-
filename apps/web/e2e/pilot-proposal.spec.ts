import { ar, en, expect, expectAccessible, expectNoSideScroll, test, useLanguage } from "./fixtures";

/** Escapes every regular-expression metacharacter, backslash included (CodeQL js/incomplete-sanitization). */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The pilot proposal for a clinic (docs/29) on /pilot#proposal: scope, the five KPIs with how the app counts each,
// data protection, the 90 days, both sides' commitments, the price labelled a hypothesis, exit criteria, and the
// one-page PDF from GET /v1/pilot/proposal.pdf (WeasyPrint, built from these same messages). English and Arabic.
const KPIS = ["k1", "k2", "k3", "k4", "k5"] as const;

test("a clinic manager reads the proposal and downloads the one-page PDF", async ({ page }) => {
  await page.goto("/pilot");
  await page.getByRole("link", { name: en.pilotProposal.jump }).click();
  await expect(page).toHaveURL(/\/pilot#proposal$/);
  const proposal = page.locator("#proposal");
  await expect(proposal.getByRole("heading", { level: 2, name: en.pilotProposal.title })).toBeInViewport();
  await expect(proposal.getByTestId("proposal-draft-note")).toHaveText(en.pilotProposal.draftNote);

  // the five KPIs, each with how the app counts it
  const kpis = proposal.getByTestId("proposal-kpis");
  for (const k of KPIS) {
    const row = kpis.getByRole("row", { name: new RegExp(escapeRegExp(en.pilotProposal.kpis[k].name)) });
    await expect(row).toContainText(en.pilotProposal.kpis[k].how);
  }
  await expect(kpis.getByText(en.pilotProposal.basis.app, { exact: true })).toHaveCount(2);
  // every number is sourced or labelled: the Al Ain reference links to its study, the price is a hypothesis
  await expect(proposal.getByRole("link", { name: /Agarwal, Lal, Vyas, IJERPH 2022/ })).toHaveAttribute("href", "https://doi.org/10.3390/ijerph192113946");
  await expect(proposal.getByRole("link", { name: /PC008 Post-Partum Follow-Up/ })).toBeVisible();
  const price = proposal.getByTestId("proposal-price");
  await expect(price).toContainText(en.pilotProposal.price.pilot);
  await expect(price).toContainText("AED 399");
  await expect(price.getByText(en.pilotProposal.basis.hypothesis, { exact: true })).toBeVisible();
  await expect(proposal.getByRole("heading", { name: en.pilotProposal.exit.title })).toBeVisible();

  await expectAccessible(page, "pilot proposal");
  await expectNoSideScroll(page, "pilot proposal");

  // the PDF: a real download, and the response is a PDF
  const link = proposal.getByRole("link", { name: en.pilotProposal.download });
  await expect(link).toHaveAttribute("href", "/api/v1/pilot/proposal.pdf?lang=en");
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toBe("reprosense-pilot-proposal-en.pdf");
  const pdf = await page.request.get("/api/v1/pilot/proposal.pdf?lang=en");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await expect(proposal.getByRole("link", { name: en.pilotProposal.downloadOther })).toHaveAttribute("href", "/api/v1/pilot/proposal.pdf?lang=ar");
});

test("the proposal reads right to left in Arabic, and its PDF is Arabic", async ({ page }) => {
  await page.goto("/");
  await useLanguage(page, "ar");
  await page.goto("/pilot#proposal");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const proposal = page.locator("#proposal");
  await expect(proposal.getByRole("heading", { level: 2, name: ar.pilotProposal.title })).toBeVisible();
  for (const k of KPIS) await expect(proposal.getByTestId("proposal-kpis")).toContainText(ar.pilotProposal.kpis[k].name);
  await expect(proposal.getByTestId("proposal-price")).toContainText(ar.pilotProposal.price.after);
  await expectAccessible(page, "pilot proposal, Arabic");
  await expectNoSideScroll(page, "pilot proposal, Arabic");

  const link = proposal.getByRole("link", { name: ar.pilotProposal.download });
  await expect(link).toHaveAttribute("href", "/api/v1/pilot/proposal.pdf?lang=ar");
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toBe("reprosense-pilot-proposal-ar.pdf");
  const pdf = await page.request.get("/api/v1/pilot/proposal.pdf?lang=ar");
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect(pdf.headers()["content-disposition"]).toContain("reprosense-pilot-proposal-ar.pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await expect(proposal.getByRole("link", { name: ar.pilotProposal.downloadOther })).toHaveAttribute("href", "/api/v1/pilot/proposal.pdf?lang=en");
});

test.describe("dark theme", () => {
  test.use({ colorScheme: "dark" });
  test("the proposal keeps its contrast in the dark theme", async ({ page }) => {
    await page.goto("/pilot#proposal");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    await expect(page.locator("#proposal").getByRole("heading", { level: 2, name: en.pilotProposal.title })).toBeVisible();
    await expectAccessible(page, "pilot proposal (dark)");
  });
});
