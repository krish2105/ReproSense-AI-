import { en, expect, expectAccessible, test } from "./fixtures";

// A2 · Judge guided tour: "Show me in 3 minutes" on the landing walks the demo path with one small card per step,
// highlights what to look at and never blocks the real buttons. Runs on desktop and mobile. Read-only.
const steps = en.tour.steps;
const PATH: Array<[keyof typeof steps, RegExp]> = [
  ["people", /\/demo$/],
  ["home", /\/app$/],
  ["log", /\/app\/log$/],
  ["patterns", /\/app\/insights$/],
  ["assistant", /\/app\/assistant$/],
  ["report", /\/app\/report$/],
  ["afterBirth", /\/app$/],
  ["clinic", /\/clinic$/],
  ["gap", /\/clinic\/patients\/fatima$/],
  ["network", /\/admin$/],
];

test("the tour walks the whole demo path and ends cleanly", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: en.tour.start }).click();

  for (const [i, [key, url]] of PATH.entries()) {
    await expect(page).toHaveURL(url);
    const card = page.getByRole("dialog", { name: steps[key].title });
    await expect(card).toBeVisible();
    await expect(card).toContainText(`Step ${i + 1} of ${PATH.length}`);
    await expect(page.locator(".tour-on")).toHaveCount(1); // the element to look at is highlighted
    await expect(card.getByRole("heading", { name: steps[key].title })).toBeFocused(); // announced and reachable

    if (key === "patterns") await expectAccessible(page, "patterns with the tour card");
    if (key === "gap") {
      // The card never covers the page's own controls: the real follow-up button still takes the click.
      await page.getByRole("region", { name: en.clinic.gapsTitle }).getByRole("button", { name: en.clinic.gapDone }).first().click({ trial: true });
    }
    await card.getByRole("button", { name: i === PATH.length - 1 ? en.tour.finish : en.tour.next }).click();
  }

  await expect(page.getByRole("dialog", { name: steps.network.title })).toBeHidden();
  await expect(page.locator(".tour-on")).toHaveCount(0);
  await expect(page.getByText(en.tour.done).first()).toBeVisible();
});

test("Back returns a step, Escape and the close button exit", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: en.tour.start }).click();
  const people = page.getByRole("dialog", { name: steps.people.title });
  await expect(people.getByRole("button", { name: en.tour.back })).toBeDisabled();
  await people.getByRole("button", { name: en.tour.next }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("dialog", { name: steps.home.title }).getByRole("button", { name: en.tour.back }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(people).toBeVisible();
  await page.keyboard.press("Escape"); // focus is on the card's heading
  await expect(people).toBeHidden();

  // A fresh start, then the close button; the tour does not come back after a reload.
  await page.getByRole("button", { name: en.tour.start }).click();
  await people.getByRole("button", { name: en.tour.exit }).click();
  await expect(people).toBeHidden();
  await page.reload();
  await expect(people).toBeHidden();
});
