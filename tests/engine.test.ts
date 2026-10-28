import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  runLbo,
  irr,
  debtCapacity,
  normalizedEbitda,
  cashMetrics,
  solveHurdle,
  sensitivity,
} from "../packages/engine/src/index";
import type { FinancialYear } from "../packages/engine/src/types";
import { base } from "./fixtures";
describe("independent finance identities", () => {
  it("matches a paper unlevered no-growth LBO", () => {
    const a = {
      ...DEFAULT_ASSUMPTIONS,
      leverage: 0,
      growthRate: 0,
      feesRate: 0,
      taxRate: 0,
      capexRate: 0,
      workingCapitalRate: 0,
    };
    const m = runLbo(base, [], a);
    expect(m.sponsorEquity).toBe(1600);
    expect(m.exitEquity).toBe(2600);
    expect(m.moic).toBe(1.625);
    expect(m.irr).toBeCloseTo(Math.pow(1.625, 0.2) - 1, 12);
  });
  it("reconciles sources and uses and value bridge", () => {
    const m = runLbo(base, [], DEFAULT_ASSUMPTIONS);
    expect(m.initialDebt + m.sponsorEquity + m.existingCash).toBeCloseTo(
      m.totalUses,
      10,
    );
    expect(
      m.bridge.growth +
        m.bridge.multiple +
        m.bridge.deleveraging +
        m.bridge.fees,
    ).toBeCloseTo(m.exitEquity - m.sponsorEquity, 8);
    for (const p of m.projections) {
      expect(p.closingDebt).toBeGreaterThanOrEqual(0);
      expect(p.openingDebt - p.mandatory - p.sweep).toBeCloseTo(
        p.closingDebt,
        10,
      );
    }
  });
  it("does not accept unverified earnings adjustments", () => {
    expect(
      normalizedEbitda(
        200,
        [
          {
            id: "a",
            year: 2026,
            label: "one-off",
            amount: 20,
            quote: "cost 20",
            page: 1,
            filingId: "f",
            status: "review",
          },
        ],
        2026,
      ),
    ).toBe(200);
  });
  it("limits debt by both leverage and coverage", () => {
    expect(debtCapacity(100, 5, 0.2, 2.5).maxDebt).toBe(200);
    expect(debtCapacity(100, 3.5, 0.11, 2.5).maxDebt).toBe(350);
  });
  it("solves conventional IRR including total loss", () => {
    expect(irr([-100, 0, 0, 0, 0, 200])).toBeCloseTo(0.148698354997, 10);
    expect(irr([-100, 0, 0])).toBe(-1);
    expect(irr([100, 200])).toBeNull();
    expect(irr([-100, 230, -132])).toBeNull();
  });
  it("flags cash shortfalls instead of manufacturing cash", () => {
    const m = runLbo(base, [], { ...DEFAULT_ASSUMPTIONS, capexRate: 0.8 });
    expect(m.fundingGap).toBeGreaterThan(0);
    expect(m.investable).toBe(false);
  });
  it("solves backward to the hurdle", () => {
    const root = solveHurdle(base, [], DEFAULT_ASSUMPTIONS, "exitMultiple");
    expect(root).not.toBeNull();
    expect(
      runLbo(base, [], { ...DEFAULT_ASSUMPTIONS, exitMultiple: root! }).irr,
    ).toBeCloseTo(0.2, 6);
  });
  it("computes FCF from the increase in working capital", () => {
    const previous = { ...base, year: 2025, receivables: 100 };
    expect(cashMetrics([previous, base]).years[1].freeCashFlow).toBe(100);
  });
  it("builds a sensitivity grid whose center is the base model", () => {
    const g = sensitivity(base, [], DEFAULT_ASSUMPTIONS, "multiples");
    expect(g.cells[2][2]).toBeCloseTo(
      runLbo(base, [], DEFAULT_ASSUMPTIONS).irr!,
      10,
    );
  });
  it("rejects nonfinite and out of range inputs", () => {
    expect(() =>
      runLbo(base, [], { ...DEFAULT_ASSUMPTIONS, growthRate: NaN }),
    ).toThrow();
    expect(() =>
      runLbo(base, [], { ...DEFAULT_ASSUMPTIONS, holdYears: 2.5 }),
    ).toThrow();
    expect(() =>
      runLbo({ ...base, ebitda: 0 }, [], DEFAULT_ASSUMPTIONS),
    ).toThrow();
  });
});
