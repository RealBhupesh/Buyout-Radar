import { expect, test } from "@playwright/test";

const modelPath = "/pilot/pilot-shanthi-gears/underwriting";

test("opens the Shanthi scenario, responds to input and exports the selected case", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pilot/pilot-shanthi-gears");
  await page.getByRole("link", { name: "Open underwriting model" }).click();
  await expect(
    page.getByRole("heading", { name: "Shanthi Gears underwriting" }),
  ).toBeVisible();
  await expect(page.getByText("-8.6%", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Income statement, FY2026, PDF page 139" }),
  ).toHaveAttribute("href", /#page=139$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  const resultValues = await page
    .locator(".shanthi-results dd:not(.shanthi-detail)")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().top),
    );
  expect(resultValues[0]).toBe(resultValues[1]);
  expect(resultValues[2]).toBe(resultValues[3]);
  const amount = page
    .getByRole("region", { name: "Transaction sources and uses" })
    .getByRole("row", { name: /Equity consideration/ })
    .getByRole("cell")
    .last();
  await expect(amount).toHaveCSS("text-align", "right");
  const input = page.getByRole("slider", { name: "Offer premium" });
  await page.setViewportSize({ width: 320, height: 844 });
  const selector = await page
    .getByRole("combobox", { name: "Operating case" })
    .boundingBox();
  const slider = await input.boundingBox();
  expect(selector!.y + selector!.height / 2).toBeCloseTo(
    slider!.y + slider!.height / 2,
    1,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await input.fill("30");
  await expect(page.getByText("₹560.69 / share")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Operating case" })
    .selectOption("downside");
  await expect(
    page.getByText(
      "The current funding gap prevents a hurdle-price calculation.",
    ),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Operating case" })
    .selectOption("recovery");
  const exportLink = page.getByRole("link", { name: "Export Excel" });
  await expect(exportLink).toHaveAttribute(
    "href",
    `${modelPath}/export?case=recovery&premium=30`,
  );
  const download = page.waitForEvent("download");
  await exportLink.click();
  expect((await download).suggestedFilename()).toBe(
    "SHANTIGEAR-underwriting.xlsx",
  );
});

test("renders the sourced base case before JavaScript runs", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto(modelPath);
  await expect(page.getByText("-8.6%", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Projected operating and debt schedule" }),
  ).toBeVisible();
  await context.close();
});
