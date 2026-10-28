import type { Assumptions, FinancialYear, Projection } from "./types";
export function projectCashFlows(
  base: FinancialYear,
  entryEbitda: number,
  initialDebt: number,
  a: Assumptions,
  projectionYears = a.holdYears,
): Projection[] {
  const projections: Projection[] = [];
  let debt = initialDebt,
    cash = 0,
    prevRevenue = base.revenue;
  for (let year = 1; year <= projectionYears; year++) {
    const revenue = base.revenue * Math.pow(1 + a.growthRate, year);
    const ebitda =
      revenue *
      (entryEbitda / base.revenue + (a.marginExpansion * year) / a.holdYears);
    const depreciation = revenue * a.depreciationRate;
    const interest = debt * a.interestRate;
    const tax = Math.max(0, ebitda - depreciation - interest) * a.taxRate;
    const capex = revenue * a.capexRate;
    const deltaWC = (revenue - prevRevenue) * a.workingCapitalRate;
    const freeCashFlow = ebitda - interest - tax - capex - deltaWC;
    const mandatory = Math.min(debt, initialDebt * a.amortizationRate);
    const afterMandatory = freeCashFlow - mandatory;
    const sweep = Math.min(
      debt - mandatory,
      Math.max(0, afterMandatory) * a.cashSweep,
    );
    const shortfall = Math.max(0, -afterMandatory);
    const fundingGap = Math.max(0, shortfall - cash);
    cash = Math.max(0, cash - shortfall) + Math.max(0, afterMandatory - sweep);
    const closingDebt = Math.max(0, debt - mandatory - sweep);
    projections.push({
      year: base.year + year,
      revenue,
      ebitda,
      depreciation,
      interest,
      tax,
      capex,
      deltaWC,
      freeCashFlow,
      openingDebt: debt,
      mandatory,
      sweep,
      closingDebt,
      cash,
      fundingGap,
      coverage: interest > 0 ? ebitda / interest : null,
    });
    debt = closingDebt;
    prevRevenue = revenue;
  }
  return projections;
}
