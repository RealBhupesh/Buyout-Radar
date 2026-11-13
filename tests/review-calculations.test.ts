import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  runLbo,
  solveHurdle,
} from "../packages/engine/src/index";
import { buildWorkbook } from "../packages/excel/src/index";
import { base } from "./fixtures";

const company = {
  name: "Synthetic independent review case",
  dataKind: "demo" as const,
  qualityIssues: [],
  financials: Array.from({ length: 5 }, (_, i) => ({
    ...base,
    year: 2022 + i,
  })),
  adjustments: [],
  sources: [],
};

it("R1 finds a reachable growth hurdle even when the upper endpoint is unfunded", () => {
  const a = {
    ...DEFAULT_ASSUMPTIONS,
    workingCapitalRate: 0.5,
    exitMultiple: 12,
  };
  expect(runLbo(base, [], { ...a, growthRate: 0 }).irr).toBeLessThan(0.2);
  expect(runLbo(base, [], { ...a, growthRate: 0.05 }).irr).toBeGreaterThan(0.2);
  expect(runLbo(base, [], { ...a, growthRate: 0.5 }).fundingGap).toBeGreaterThan(0);
  const root = solveHurdle(base, [], a, "growthRate");
  expect(root).not.toBeNull();
  expect(runLbo(base, [], { ...a, growthRate: root! }).irr).toBeCloseTo(0.2, 7);
});

// Exercise saved formulas in an independent spreadsheet application, rather than
// asserting that the workbook's cached engine results match the same engine.
// Portable npm test skips only these integration cases if Calc is unavailable.
const hasCalc = spawnSync("libreoffice", ["--version"], { timeout: 10_000 }).status === 0;
async function recalculate(bytes: Uint8Array, edit?: (w: ExcelJS.Workbook) => void) {
  const directory = await mkdtemp(join(tmpdir(), "buyout-review-"));
  try {
    const input = join(directory, "model.xlsx");
    const output = join(directory, "recalculated");
    await mkdir(output);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as never);
    edit?.(workbook);
    // Clear caches so Calc must evaluate every formula, including formulas whose
    // cached value is a status string. Opening a file alone can preserve caches.
    for (const sheet of workbook.worksheets)
      sheet.eachRow((row) => row.eachCell((cell) => {
        if (cell.formula) cell.value = { formula: cell.formula };
      }));
    await writeFile(input, new Uint8Array(await workbook.xlsx.writeBuffer()));
    execFileSync("libreoffice", [
      `-env:UserInstallation=${pathToFileURL(join(directory, "profile")).href}`,
      "--headless", "--convert-to", "xlsx", "--outdir", output, input,
    ], { timeout: 30_000, stdio: "pipe" });
    const recalculated = new ExcelJS.Workbook();
    await recalculated.xlsx.load(await readFile(join(output, "model.xlsx")) as never);
    return recalculated;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe.skipIf(!hasCalc)("independent Calc recalculation", () => {
  it.each([-0.2, -0.3])("R2 withholds returns for nonpositive forecast EBITDA (%s margin change)", async (marginExpansion) => {
    const a = {
      ...DEFAULT_ASSUMPTIONS,
      leverage: 0,
      growthRate: -0.5,
      marginExpansion,
      taxRate: 0,
      capexRate: 0,
      workingCapitalRate: 1,
    };
    const model = runLbo(base, [], a);
    expect(model.fundingGap).toBe(0);
    expect(model.projections.at(-1)!.ebitda).toBeLessThanOrEqual(0);
    expect(model.irr).toBeNull();
    const w = await recalculate(await buildWorkbook(company, a));
    expect(w.getWorksheet("Returns")!.getCell("B8").result).toBe("Invalid");
    expect(w.getWorksheet("Returns")!.getCell("B9").result).toBe("Invalid");
  }, 45_000);

  it("R2 withholds returns after editing entry price below new debt", async () => {
    const a = { ...DEFAULT_ASSUMPTIONS, exitMultiple: 0 };
    expect(() => runLbo(base, [], { ...a, entryMultiple: 0.5 })).toThrow(/positive sponsor/);
    const w = await recalculate(await buildWorkbook(company, a), (book) => {
      book.getWorksheet("Inputs")!.getCell("B3").value = 0.5;
    });
    expect(w.getWorksheet("Returns")!.getCell("B8").result).toBe("Invalid");
    expect(w.getWorksheet("Returns")!.getCell("B9").result).toBe("Invalid");
  }, 45_000);

  it("R3 uses the engine's funding-gap tolerance after recalculation", async () => {
    const a = {
      ...DEFAULT_ASSUMPTIONS,
      holdYears: 1,
      growthRate: 0,
      taxRate: 0,
      // EBITDA 200 - interest 77 - amortization 35 - capex = 5e-9 shortfall.
      capexRate: (200 - 77 - 35 + 5e-9) / 1000,
    };
    const model = runLbo(base, [], a);
    expect(model.fundingGap).toBeGreaterThan(0);
    expect(model.fundingGap).toBeLessThan(1e-8);
    expect(model.investable).toBe(true);
    const w = await recalculate(await buildWorkbook(company, a));
    expect(w.getWorksheet("Returns")!.getCell("B8").result).toBeCloseTo(model.irr!, 9);
    expect(w.getWorksheet("Returns")!.getCell("B9").result).toBeCloseTo(model.moic!, 9);
  }, 45_000);
});

it("R4 documents the acquisition funding identity without counting target cash twice", async () => {
  const m = runLbo(base, [], DEFAULT_ASSUMPTIONS);
  expect(m.sponsorEquity + m.initialDebt).toBeCloseTo(m.entryEV + m.fees, 10);
  expect(m.sponsorEquity + m.initialDebt + m.existingCash).not.toBeCloseTo(m.entryEV + m.fees, 10);
  const design = await readFile(new URL("../docs/design.md", import.meta.url), "utf8");
  expect(design).toContain("Sponsor equity + new debt = entry EV + fees.");
});
