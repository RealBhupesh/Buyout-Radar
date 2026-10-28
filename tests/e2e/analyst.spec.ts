import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { DEFAULT_BUY_BOX } from "../../apps/web/lib/research";

test("analyst brief explains hurdle context without overwriting a shared scenario", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (box) =>
      localStorage.setItem(
        "buyout:buybox:v1",
        JSON.stringify({ ...box, minIrr: 0.16 }),
      ),
    DEFAULT_BUY_BOX,
  );
  const scenario = encodeURIComponent(JSON.stringify({ hurdleRate: 0.27 }));
  await page.goto(`/company/demo-01?scenario=${scenario}`);
  const brief = page.getByRole("region", { name: "Decision brief" });
  await expect(brief).toContainText("Minimum interest coverage");
  await expect(brief).toContainText("Screening hurdle: 16%");
  await expect(brief).toContainText("scenario’s hurdle: 27%");
  await page
    .getByRole("button", { name: "Inspect evidence & diligence" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Move the research forward." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Filing evidence", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Cash taxes paid Sample ledger/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Cash taxes paid");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /Cash taxes paid Sample ledger/ }),
  ).toBeFocused();
  await page.goto("/company/demo-18");
  await expect(
    page.getByRole("region", { name: "Live scenario returns" }),
  ).toContainText("Unavailable");
});

test("opportunity map supports exact selection and expanded axes", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Focus a company on map" })
    .selectOption("demo-01");
  await expect(page.locator(".map-focus")).toContainText("Aster Precision");
  await page.getByRole("button", { name: "Expand clustered points" }).click();
  await expect(
    page.getByRole("button", { name: "Expand clustered points" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".map-scale-note")).toContainText("Expanded axes");
  await page
    .getByRole("link", { name: "Aster Precision", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Aster Precision", exact: true }),
  ).toBeVisible();
});

test("all three pilot histories expose original units and source pages while returns stay gated", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/pilot");
  await expect(
    page.getByRole("heading", { name: "The evidence comes first." }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export sourced facts" }).click();
  const csv = await readFile((await (await download).path())!, "utf8");
  expect(csv.split("\r\n")).toHaveLength(16);
  expect(csv).toContain("Independent review pending");
  for (const id of [
    "pilot-shanthi-gears",
    "pilot-racl-geartech",
    "pilot-mayur-uniquoters",
  ]) {
    await page.goto(`/pilot/${id}`);
    await expect(
      page
        .getByRole("region", { name: "Pilot reported financial history" })
        .getByRole("row"),
    ).toHaveCount(6);
    await page
      .getByRole("button", { name: "Inspect FY2022 revenue", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Standalone");
    await expect(dialog).toContainText("SHA-256");
    await expect(
      dialog.getByRole("link", { name: "Open original filing" }),
    ).toHaveAttribute(
      "href",
      /^https:\/\/www\.(shanthigears|raclgeartech|mayuruniquoters)\.com\/.+#page=\d+$/,
    );
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Inspect FY2022 revenue" }),
    ).toBeFocused();
    await page
      .getByRole("button", { name: "Profit after tax", exact: true })
      .click();
    await expect(
      page.getByRole("img", { name: /profit after tax, FY2022/ }),
    ).toBeVisible();
    await expect(page.locator(".pilot-question")).toContainText("Unavailable");
  }
  await expect(
    page.getByRole("link", { name: "Filing pilot", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const blocked = await page.request.get(
    "/api/companies/pilot-mayur-uniquoters/export",
  );
  expect(blocked.status()).toBe(404);
  expect(errors).toEqual([]);
});

test("pilot research persists, joins workload filters and CSV, and round trips through backup", async ({
  page,
  browser,
}) => {
  await page.goto("/pilot/pilot-shanthi-gears");
  await page
    .getByRole("button", { name: "Save research", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Research stage", exact: true })
    .selectOption("Diligence");
  await page
    .getByRole("textbox", { name: "Investment research note" })
    .fill("Private pilot thesis: verify the order book.");
  await page.getByRole("button", { name: "Add starter checklist" }).click();
  await page
    .getByRole("checkbox", {
      name: "Verify filing sources and accounting policies",
    })
    .check();
  await page
    .getByRole("textbox", { name: "Next action", exact: true })
    .fill("Reconcile cash flow");
  await page.getByLabel("Next action due date").fill("2000-01-01");
  await page
    .getByRole("button", { name: "Save next action", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Investment research note" }),
  ).toHaveValue(/Private pilot thesis/);
  await page.getByRole("button", { name: "Print memo", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Private pilot thesis");
  await expect(page.getByRole("dialog")).toContainText(
    "Model IRR: Unavailable",
  );
  await expect(page.getByRole("dialog")).toContainText("1 / 5 tasks complete");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Saved research", exact: true }).click();
  const workload = page.getByRole("region", { name: "Research workload" });
  await expect(workload).toContainText("1companies");
  await expect(workload).toContainText("1actions");
  await expect(
    page.getByRole("region", { name: "Saved filing pilot" }),
  ).toContainText("Shanthi Gears");
  await page
    .getByRole("combobox", { name: "Filter research stage" })
    .selectOption("Diligence");
  await page
    .getByRole("combobox", { name: "Filter next actions" })
    .selectOption("overdue");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const csv = await readFile((await (await download).path())!, "utf8");
  expect(csv).toContain("Shanthi Gears");
  expect(csv.split("\r\n")).toHaveLength(2);
  await page.getByRole("checkbox", { name: "In my Buy Box only" }).check();
  await expect(
    page.getByRole("region", { name: "Saved pilot companies" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Export CSV", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "In my Buy Box only" }).uncheck();
  await page
    .getByRole("combobox", { name: "Sector", exact: true })
    .selectOption("Materials");
  await page.getByRole("link", { name: "Radar", exact: true }).first().click();
  await expect(
    page.getByRole("combobox", { name: "Sector", exact: true }),
  ).toHaveValue("Materials");
  await page.getByRole("link", { name: "Saved research", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Sector", exact: true })
    .selectOption("All sectors");
  await page.getByRole("button", { name: "Backup & restore" }).click();
  const backupDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download backup", exact: true })
    .click();
  const content = await readFile(
    (await (await backupDownload).path())!,
    "utf8",
  );
  expect(content).toContain("Private pilot thesis");
  const fresh = await browser.newContext(),
    other = await fresh.newPage();
  await other.goto("/watchlist");
  await other.getByRole("button", { name: "Backup & restore" }).click();
  await other.getByLabel("Choose a backup to preview").setInputFiles({
    name: "pilot.json",
    mimeType: "application/json",
    buffer: Buffer.from(content),
  });
  await other
    .getByRole("button", { name: "Restore research", exact: true })
    .click();
  await other.keyboard.press("Escape");
  await expect(
    other.getByRole("region", { name: "Saved filing pilot" }),
  ).toContainText("Shanthi Gears");
  await fresh.close();
});

test("pilot facts remain visible before JavaScript and print includes private research", async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("/pilot/pilot-mayur-uniquoters");
  await expect(
    staticPage.getByRole("heading", { name: "Mayur Uniquoters", exact: true }),
  ).toBeVisible();
  await expect(
    staticPage.getByRole("button", { name: "Inspect FY2022 revenue" }),
  ).toContainText("630.9525");
  await context.close();
  await page.goto("/pilot/pilot-mayur-uniquoters");
  await page.getByRole("button", { name: "Start from reported facts" }).click();
  await expect(
    page.getByRole("textbox", { name: "Investment research note" }),
  ).toHaveValue(/941.71/);
  await page.getByRole("button", { name: "Print memo", exact: true }).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("body > .memo-print")).toBeVisible();
  await expect(page.locator(".app-shell")).toBeHidden();
  await expect(page.locator("body > .memo-print")).toContainText("630.9525");
  await expect(page.locator("body > .memo-print")).toContainText(
    "Official filing pilot",
  );
  await page.emulateMedia({ media: "screen" });
});

test("pilot and analyst screens reflow, keep keyboard focus, and support reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const url of [
    "/",
    "/pilot",
    "/pilot/pilot-mayur-uniquoters",
    "/watchlist",
    "/company/demo-01",
  ]) {
    await page.goto(url);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole("heading").first()).toBeVisible();
  }
  await page.goto("/pilot/pilot-mayur-uniquoters");
  await page.getByRole("button", { name: "Inspect FY2026 revenue" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Inspect FY2026 revenue" }),
  ).toBeFocused();
});
