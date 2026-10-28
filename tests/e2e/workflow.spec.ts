import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { DEFAULT_BUY_BOX } from "../../apps/web/lib/research";
import { companyAssumptions } from "../../packages/engine/src/index";
import { DEMO_COMPANIES } from "../../apps/web/lib/demo";
const noteKey = "buyout:note:demo-01:v1";
const backupValues = {
  "buyout:saved:v1": ["demo-01"],
  "buyout:buybox:v1": DEFAULT_BUY_BOX,
  "buyout:screens:v1": [
    { id: "screen-test", name: "Imported screen", box: DEFAULT_BUY_BOX },
  ],
  "buyout:scenarios:v1": [
    {
      id: "scenario-test",
      name: "Imported scenario",
      companyId: "demo-01",
      assumptions: companyAssumptions(DEMO_COMPANIES[0]),
      updatedAt: "2026-10-28T00:00:00Z",
    },
  ],
  "buyout:workflows:v1": [
    {
      companyId: "demo-01",
      stage: "Diligence",
      tasks: [{ id: "task-test", text: "Verify sources", done: true }],
      nextAction: { text: "Read filing", dueDate: "2000-01-01" },
    },
  ],
  [noteKey]: "Imported private thesis",
};
function backupFile(values = backupValues) {
  return {
    name: "research.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "buyout-radar",
        version: 1,
        exportedAt: "2026-10-28T00:00:00Z",
        values,
      }),
    ),
  };
}

test("saved screens support save, rename, load, delete and reload; CSV includes all filtered rows", async ({
  page,
}) => {
  await page.goto("/");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const csv = await readFile((await (await download).path())!, "utf8");
  expect(csv.trim().split("\r\n")).toHaveLength(51);
  await page.getByRole("textbox", { name: "Search companies" }).fill("SIM001");
  await page
    .getByRole("button", { name: "Saved screens", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Screen name", exact: true })
    .fill("Precision");
  await page
    .getByRole("button", { name: "Save current screen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rename screen Precision", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Rename screen", exact: true })
    .fill("Priority screen");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Saved screens", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load screen Priority screen", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("textbox", { name: "Search companies" }),
  ).toHaveValue("SIM001");
  const filtered = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect(
    (await readFile((await (await filtered).path())!, "utf8"))
      .trim()
      .split("\r\n"),
  ).toHaveLength(2);
  await page
    .getByRole("button", { name: "Saved screens", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete screen Priority screen", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("No saved screens yet");
});

test("company comparison caps four selections and handles invalid query selections", async ({
  page,
}) => {
  await page.goto("/");
  const choices = page.getByRole("table").getByRole("checkbox");
  for (let i = 0; i < 4; i++) await choices.nth(i).check();
  await expect(choices.nth(4)).toBeDisabled();
  await choices.nth(0).uncheck();
  await choices.nth(4).check();
  await page
    .getByRole("link", { name: "Compare companies", exact: true })
    .click();
  await expect(
    page
      .getByRole("table", { name: "Company comparison at base assumptions" })
      .getByRole("columnheader"),
  ).toHaveCount(5);
  await page.goto(
    "/compare?ids=demo-01,demo-01,missing,demo-02,demo-18,demo-03",
  );
  await expect(
    page.getByText("Duplicate company selections were removed."),
  ).toBeVisible();
  await expect(page.getByText(/first four selections/)).toBeVisible();
  await expect(page.getByText(/no longer published/)).toBeVisible();
  await expect(page.getByRole("row", { name: /Model IRR/ })).toContainText(
    "Unavailable",
  );
  await page.goto("/compare?ids=missing");
  await expect(
    page.getByRole("heading", { name: "Select at least two companies." }),
  ).toBeVisible();
});

test("scenario library saves, compares, renames, loads and deletes assumptions", async ({
  page,
}) => {
  await page.goto("/company/demo-01");
  const slider = page.getByRole("slider", {
    name: "Revenue growth",
    exact: true,
  });
  await slider.fill("0.15");
  await page.getByRole("button", { name: "Scenarios", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Scenario name", exact: true })
    .fill("Growth case");
  await page
    .getByRole("button", { name: "Save current scenario", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Compare scenario Growth case",
      exact: true,
    })
    .check();
  await expect(
    page.getByRole("table", {
      name: "Scenario comparison using current financials",
    }),
  ).toContainText("15.0%");
  await page
    .getByRole("button", { name: "Rename scenario Growth case", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Rename scenario", exact: true })
    .fill("Reviewed growth");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Scenarios", exact: true }).click();
  await page
    .getByRole("button", { name: "Load scenario Reviewed growth", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(slider).toHaveValue("0.15");
  await page.getByRole("button", { name: "Scenarios", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Delete scenario Reviewed growth",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Save your first scenario",
  );
});

test("scenario comparison and print memo withhold unfunded and incomplete returns", async ({
  page,
}) => {
  await page.goto(
    "/company/demo-01?scenario=" +
      encodeURIComponent(JSON.stringify({ capexRate: 0.8 })),
  );
  await page.getByRole("button", { name: "Scenarios", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Scenario name", exact: true })
    .fill("Unfunded");
  await page
    .getByRole("button", { name: "Save current scenario", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Compare scenario Unfunded", exact: true })
    .check();
  const table = page.getByRole("table", {
    name: "Scenario comparison using current financials",
  });
  await expect(
    table.getByRole("row", { name: /Research status/ }),
  ).toContainText("Funding shortfall");
  await expect(table.getByRole("row", { name: /Model IRR/ })).toContainText(
    "Unavailable",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Print memo", exact: true }).click();
  await expect(page.locator(".memo-preview")).toContainText(
    "Funding shortfall",
  );
  await expect(
    page.locator(".memo-preview").getByText("Unavailable", { exact: true }),
  ).toHaveCount(2);
  await page.keyboard.press("Escape");
  await page.goto("/company/demo-18");
  await page.getByRole("button", { name: "Print memo", exact: true }).click();
  await expect(page.locator(".memo-preview")).toContainText("Data incomplete");
  await expect(
    page.locator(".memo-preview").getByText("Unavailable", { exact: true }),
  ).toHaveCount(2);
});

test("diligence, research stages and next actions persist and filter saved research", async ({
  page,
}) => {
  await page.goto("/company/demo-01?view=notes");
  await page
    .getByRole("button", { name: "Save research", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Research stage", exact: true })
    .selectOption("Diligence");
  await page
    .getByRole("textbox", { name: "New diligence task", exact: true })
    .fill("Check capex");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit task Check capex", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Edit diligence task", exact: true })
    .fill("Review maintenance capex");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Review maintenance capex", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Add starter checklist", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add starter checklist", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Diligence and next action" })
      .getByRole("checkbox"),
  ).toHaveCount(6);
  await page
    .getByRole("button", {
      name: "Delete task Review maintenance capex",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Next action", exact: true })
    .fill("Read annual report");
  await page
    .getByLabel("Next action due date", { exact: true })
    .fill("2000-01-01");
  await page
    .getByRole("button", { name: "Save next action", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Research stage", exact: true }),
  ).toHaveValue("Diligence");
  await expect(
    page.getByRole("textbox", { name: "Next action", exact: true }),
  ).toHaveValue("Read annual report");
  await page.getByRole("link", { name: "Saved research", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Filter research stage" })
    .selectOption("Diligence");
  await page
    .getByRole("combobox", { name: "Filter next actions" })
    .selectOption("overdue");
  await expect(
    page.getByRole("link", { name: "Aster Precision", exact: false }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Filter next actions" })
    .selectOption("upcoming");
  await expect(
    page.getByRole("heading", { name: "No companies in this view." }),
  ).toBeVisible();
  await page.goto("/company/demo-01?view=notes");
  await page
    .getByRole("button", { name: "Complete next action", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Next action", exact: true }),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  await page
    .getByRole("button", { name: "Save research", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Research stage", exact: true }),
  ).toHaveValue("Diligence");
});

test("backup imports every record, synchronizes views, previews conflicts and round trips into a fresh browser", async ({
  page,
  browser,
}) => {
  await page.goto("/watchlist");
  await page
    .getByRole("button", { name: "Backup & restore", exact: true })
    .click();
  await page
    .getByLabel("Choose a backup to preview")
    .setInputFiles(backupFile());
  await expect(
    page.getByRole("region", { name: "Restore preview" }),
  ).toContainText("new records");
  await page
    .getByRole("button", { name: "Restore research", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("combobox", { name: "Research stage for Aster Precision" }),
  ).toHaveValue("Diligence");
  await page
    .getByRole("button", { name: "Saved screens", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Load screen Imported screen",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/company/demo-01?view=notes");
  await expect(
    page.getByRole("textbox", { name: "Investment research note" }),
  ).toHaveValue("Imported private thesis");
  await expect(
    page.getByRole("checkbox", { name: "Verify sources", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Scenarios", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Load scenario Imported scenario",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Print memo", exact: true }).click();
  await expect(page.locator(".memo-preview")).toContainText(
    "Imported private thesis",
  );
  await expect(page.locator(".memo-preview")).toContainText("Read filing");
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printRequested = "yes";
    };
  });
  await page
    .getByRole("button", { name: "Print / Save as PDF", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-print-requested",
    "yes",
  );
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".memo-print")).toBeVisible();
  await expect(page.locator(".app-shell")).toBeHidden();
  await page.emulateMedia({ media: "screen" });
  await page.keyboard.press("Escape");
  await page.goto("/watchlist");
  await page
    .getByRole("button", { name: "Backup & restore", exact: true })
    .click();
  const changed = { ...backupValues, [noteKey]: "Replacement thesis" };
  await page
    .getByLabel("Choose a backup to preview")
    .setInputFiles(backupFile(changed));
  await expect(
    page.getByRole("region", { name: "Restore preview" }),
  ).toContainText("1 conflicts");
  await page
    .getByRole("button", { name: "Restore research", exact: true })
    .click();
  expect(await page.evaluate((k) => localStorage.getItem(k), noteKey)).toBe(
    JSON.stringify("Imported private thesis"),
  );
  await page
    .getByLabel("Choose a backup to preview")
    .setInputFiles(backupFile(changed));
  await page
    .getByRole("combobox", { name: "Conflicting records" })
    .selectOption("replace");
  await page
    .getByRole("button", { name: "Restore research", exact: true })
    .click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download backup", exact: true })
    .click();
  const backup = await readFile((await (await downloaded).path())!);
  const context = await browser.newContext(),
    fresh = await context.newPage();
  await fresh.goto("/watchlist");
  await fresh
    .getByRole("button", { name: "Backup & restore", exact: true })
    .click();
  await fresh.getByLabel("Choose a backup to preview").setInputFiles({
    name: "roundtrip.json",
    mimeType: "application/json",
    buffer: backup,
  });
  await fresh
    .getByRole("button", { name: "Restore research", exact: true })
    .click();
  await fresh.keyboard.press("Escape");
  await fresh.goto("/company/demo-01?view=notes");
  await expect(
    fresh.getByRole("textbox", { name: "Investment research note" }),
  ).toHaveValue("Replacement thesis");
  await context.close();
});

test("invalid backups and storage failures are reported without losing current research", async ({
  page,
}) => {
  await page.goto("/watchlist");
  await page
    .getByRole("button", { name: "Backup & restore", exact: true })
    .click();
  await page.getByLabel("Choose a backup to preview").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
  await expect(page.getByRole("dialog")).toContainText("not valid JSON");
  await expect(
    page.getByRole("button", { name: "Restore research", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.goto("/company/demo-01?view=notes");
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page
    .getByRole("textbox", { name: "Investment research note" })
    .fill("Session-only research");
  await expect(
    page.getByRole("region", { name: "Research notes", exact: true }),
  ).toContainText("Could not save");
  await page.getByRole("button", { name: "Print memo", exact: true }).click();
  await expect(page.locator(".memo-preview")).toContainText(
    "Session-only research",
  );
});

test("new research tools stay readable on mobile and with reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const url of [
    "/",
    "/watchlist",
    "/compare?ids=demo-01,demo-02,demo-18,demo-03",
    "/company/demo-01?view=notes",
  ]) {
    await page.goto(url);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  for (const name of ["Scenarios", "Print memo"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Close dialog" }).click();
  }
});

test("research stays synchronized across tabs, and scenario selection caps three saved cases", async ({
  page,
  context,
}) => {
  await page.goto("/company/demo-01?view=notes");
  const second = await context.newPage();
  await second.goto("/company/demo-01?view=notes");
  await page
    .getByRole("textbox", { name: "Investment research note" })
    .fill("Shared browser research");
  await expect(
    second.getByRole("textbox", { name: "Investment research note" }),
  ).toHaveValue("Shared browser research");
  await second
    .getByRole("combobox", { name: "Research stage", exact: true })
    .selectOption("Reviewing");
  await expect(
    page.getByRole("combobox", { name: "Research stage", exact: true }),
  ).toHaveValue("Reviewing");
  await page.getByRole("button", { name: "Scenarios", exact: true }).click();
  for (let i = 1; i <= 4; i++) {
    await page
      .getByRole("textbox", { name: "Scenario name", exact: true })
      .fill(`Case ${i}`);
    await page
      .getByRole("button", { name: "Save current scenario", exact: true })
      .click();
    if (i < 4)
      await page
        .getByRole("checkbox", {
          name: `Compare scenario Case ${i}`,
          exact: true,
        })
        .check();
  }
  await expect(
    page.getByRole("checkbox", {
      name: "Compare scenario Case 4",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Compare scenario Case 1", exact: true })
    .uncheck();
  await page
    .getByRole("checkbox", { name: "Compare scenario Case 4", exact: true })
    .check();
  await expect(
    page
      .getByRole("table", {
        name: "Scenario comparison using current financials",
      })
      .getByRole("columnheader"),
  ).toHaveCount(5);
  await second.close();
});
