import { expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildWorkbook } from "../packages/excel/src/index";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
import { companyAssumptions, runLbo } from "../packages/engine/src/index";
it("exports live formulas and cached engine results", async () => {
  const c = DEMO_COMPANIES[0],
    a = companyAssumptions(c),
    m = runLbo(c.financials.at(-1)!, c.adjustments, a);
  const bytes = await buildWorkbook(c, a);
  const w = new ExcelJS.Workbook();
  await w.xlsx.load(bytes as never);
  expect(w.worksheets.map((s) => s.name)).toEqual([
    "Read me",
    "Inputs",
    "Historical",
    "Sources & uses",
    "Projection",
    "Returns",
    "Sensitivity",
    "Evidence",
  ]);
  expect(w.getWorksheet("Returns")!.getCell("B8").result).toBeCloseTo(
    m.irr!,
    10,
  );
  expect(w.getWorksheet("Projection")!.getCell("F14").result).toBeCloseTo(
    m.projections[4].closingDebt,
    8,
  );
  expect(w.getWorksheet("Projection")!.getCell("F14").formula).toContain("F6");
  expect(w.getWorksheet("Evidence")!.rowCount).toBeGreaterThan(70);
});
it("keeps untrusted text as text and refuses incomplete research", async () => {
  const c = { ...DEMO_COMPANIES[0], name: '=HYPERLINK("https://bad.test")' };
  const bytes = await buildWorkbook(c, companyAssumptions(c));
  const w = new ExcelJS.Workbook();
  await w.xlsx.load(bytes as never);
  expect(w.getWorksheet("Read me")!.getCell("A1").type).toBe(
    ExcelJS.ValueType.String,
  );
  await expect(
    buildWorkbook(DEMO_COMPANIES[17], companyAssumptions(DEMO_COMPANIES[17])),
  ).rejects.toThrow(/incomplete/i);
});
it("keeps the latest five statement years aligned with formula references", async () => {
  const original = DEMO_COMPANIES[0];
  const c = {
    ...original,
    financials: [
      { ...original.financials[0], year: 2021 },
      ...original.financials,
    ],
  };
  const bytes = await buildWorkbook(c, companyAssumptions(c));
  const w = new ExcelJS.Workbook();
  await w.xlsx.load(bytes as never);
  expect(w.getWorksheet("Historical")!.getCell("F3").value).toBe(
    c.financials.at(-1)!.revenue,
  );
});
it("exports a short hold with margin expansion without inventing invalid assumptions", async () => {
  const c = DEMO_COMPANIES[0];
  await expect(
    buildWorkbook(c, {
      ...companyAssumptions(c),
      holdYears: 1,
      marginExpansion: 0.2,
    }),
  ).resolves.toBeInstanceOf(Uint8Array);
});
