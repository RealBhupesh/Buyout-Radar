import type { Adjustment, Assumptions, FinancialYear } from "./types";
import { runLbo } from "./lbo";
export function sensitivity(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
  kind: "multiples" | "operating",
) {
  const offsets = [-2, -1, 0, 1, 2];
  const rows = offsets.map((n) =>
    kind === "multiples" ? a.entryMultiple + n : a.leverage + n * 0.5,
  );
  const columns = offsets.map((n) =>
    kind === "multiples" ? a.exitMultiple + n : a.growthRate + n * 0.02,
  );
  const cells = rows.map((row) =>
    columns.map((col) => {
      try {
        const m = runLbo(base, adjustments, {
          ...a,
          ...(kind === "multiples"
            ? { entryMultiple: row, exitMultiple: col }
            : { leverage: row, growthRate: col }),
        });
        return m.investable ? m.irr : null;
      } catch {
        return null;
      }
    }),
  );
  return { rows, columns, cells };
}
export function solveHurdle(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
  variable: "growthRate" | "exitMultiple",
): number | null {
  let low = variable === "growthRate" ? -0.5 : 0,
    high = variable === "growthRate" ? 0.5 : 30;
  const evaluate = (v: number) => {
    try {
      const m = runLbo(base, adjustments, { ...a, [variable]: v });
      return m.investable ? m.irr : null;
    } catch {
      return null;
    }
  };
  const upper = evaluate(high);
  if (upper === null || upper < a.hurdleRate) return null;
  const lower = evaluate(low);
  if (lower !== null && lower >= a.hurdleRate) return low;
  for (let i = 0; i < 90; i++) {
    const mid = (low + high) / 2,
      r = evaluate(mid);
    if (r === null || r < a.hurdleRate) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
export function stressTest(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
) {
  const model = runLbo(base, adjustments, a);
  // Same opening acquisition debt; operating margin is 20% below each base year.
  // Reproject with a parallel 20% EBITDA shock, rather than a cumulative growth shock.
  let debt = model.initialDebt,
    cash = 0,
    breach: number | null = null;
  const years = model.projections.map((p) => {
    const ebitda = p.ebitda * 0.8,
      interest = debt * a.interestRate;
    const coverage = interest > 0 ? ebitda / interest : null;
    if (breach === null && coverage !== null && coverage < a.coverageFloor)
      breach = p.year;
    const tax = Math.max(0, ebitda - p.depreciation - interest) * a.taxRate;
    const fcf = ebitda - interest - tax - p.capex - p.deltaWC;
    const mandatory = Math.min(debt, model.initialDebt * a.amortizationRate);
    const sweep = Math.min(
      debt - mandatory,
      Math.max(0, fcf - mandatory) * a.cashSweep,
    );
    const gap = Math.max(0, mandatory - fcf - cash);
    cash = Math.max(0, cash + fcf - mandatory - sweep);
    debt = Math.max(0, debt - mandatory - sweep);
    return { year: p.year, ebitda, coverage, debt, fundingGap: gap };
  });
  return {
    years,
    firstBreach: breach,
    fundingGap: years.reduce((s, y) => s + y.fundingGap, 0),
  };
}
