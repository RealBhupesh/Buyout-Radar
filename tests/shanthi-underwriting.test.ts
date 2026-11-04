import { expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  SHANTHI_ID,
  marketEquity,
  shanthiBase,
  shanthiHistory,
  shanthiScenario,
  underwritingIssues,
} from "../apps/web/lib/shanthi-underwriting";
import { GET } from "../apps/web/app/pilot/[id]/underwriting/export/route";
import { pilotCsv, PILOT_COMPANIES } from "../apps/web/lib/pilot";

const params = { params: Promise.resolve({ id: SHANTHI_ID }) };
const request = (query: string) =>
  new Request(`http://localhost/export?${query}`);

it("reconciles all reported years and separates operating EBITDA and debt-like payables", () => {
  expect(underwritingIssues()).toEqual([]);
  expect(shanthiHistory.map(({ financial }) => financial.ebitda)).toEqual([
    60.05, 89.83, 101.79, 128.73, 99.13,
  ]);
  expect(shanthiBase.workingCapital).toBe(156.49);
  expect(shanthiBase.financial.payables).toBe(71.97);
  expect(shanthiBase.financial.debt).toBe(0.48);
  expect(marketEquity).toBeCloseTo(3308.75473989, 8);
  expect(shanthiBase.afterCapexCash).toBe(17.12);
});

it("ties sources to uses, projects first-year cash independently and solves the hurdle price", () => {
  const { model, assumptions, hurdleSharePrice, stress } = shanthiScenario(
    "base",
    20,
  );
  const entryEV = (431.3 * 1.2 * 76_715_853) / 1e7 + 0.48 - 1.33;
  const equity = entryEV * 1.02 - 99.13 * 3;
  const ebitda = 99.13 * 1.05;
  const interest = 99.13 * 3 * 0.11;
  const tax = (ebitda - 16.06 * 1.05 - interest) * 0.25168;
  const yearOne =
    ebitda -
    interest -
    tax -
    (518.72 * 1.05 * 118.26) / 2442.11 -
    156.49 * 0.05;
  expect(model.entryEV).toBeCloseTo(entryEV, 8);
  expect(model.sponsorEquity).toBeCloseTo(equity, 8);
  expect(model.totalUses).toBeCloseTo(
    model.sponsorEquity + model.initialDebt + model.existingCash,
    8,
  );
  expect(model.projections[0].freeCashFlow).toBeCloseTo(yearOne, 8);
  expect(model.irr).toBeCloseTo((model.exitEquity / equity) ** (1 / 5) - 1, 8);
  expect(model.irr).toBeCloseTo(-0.0858021, 6);
  const hurdleEV = (hurdleSharePrice! * 76_715_853) / 1e7 + 0.48 - 1.33;
  expect(
    (model.exitEquity / (hurdleEV * 1.02 - model.initialDebt)) ** (1 / 5) - 1,
  ).toBeCloseTo(assumptions.hurdleRate, 8);
  expect(stress.fundingGap).toBeGreaterThan(12);
});

it("withholds unfunded returns and keeps published pilot CSV returns unavailable", () => {
  const { model, hurdleSharePrice } = shanthiScenario("downside", 20);
  expect(model.fundingGap).toBeGreaterThan(83);
  expect(model.irr).toBeNull();
  expect(model.moic).toBeNull();
  expect(hurdleSharePrice).toBeNull();
  expect(
    pilotCsv(PILOT_COMPANIES)
      .split("\r\n")
      .slice(1)
      .every((row) => row.endsWith(',"Unavailable"')),
  ).toBe(true);
});

it("exports the selected scenario with formula-backed results and explicit draft status", async () => {
  const res = await GET(request("case=recovery&premium=30"), params);
  expect(res.status).toBe(200);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load((await res.arrayBuffer()) as never);
  const { model, assumptions } = shanthiScenario("recovery", 30);
  expect(book.getWorksheet("Read me")!.getCell("A2").value).toMatch(
    /independent review pending/i,
  );
  expect(book.getWorksheet("Historical")!.getCell("F4").value).toBe(99.13);
  const entry = book.getWorksheet("Inputs")!.getCell("B3");
  expect(entry.value).toBeCloseTo(assumptions.entryMultiple, 9);
  expect(entry.dataValidation.formulae?.[1]).toBe(100);
  expect(book.getWorksheet("Returns")!.getCell("B8").result).toBeCloseTo(
    model.irr!,
    8,
  );
  expect((await GET(request("case=unknown"), params)).status).toBe(400);
  expect((await GET(request("premium=61"), params)).status).toBe(400);
  expect(
    (
      await GET(request(""), {
        params: Promise.resolve({ id: "pilot-racl-geartech" }),
      })
    ).status,
  ).toBe(404);
});
