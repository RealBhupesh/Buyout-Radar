import type { Assumptions, Company } from "./types";
export const DEFAULT_ASSUMPTIONS: Readonly<Assumptions> = Object.freeze({
  entryMultiple: 8, exitMultiple: 8, leverage: 3.5, interestRate: 0.11,
  taxRate: 0.2517, cashSweep: 0.75, holdYears: 5, feesRate: 0.02,
  hurdleRate: 0.20, growthRate: 0.08, marginExpansion: 0,
  capexRate: 0.04, depreciationRate: 0.025, workingCapitalRate: 0.18,
  amortizationRate: 0.05, coverageFloor: 2.5
});
export function companyAssumptions(company: Company): Assumptions {
  const f = company.financials.at(-1);
  if(!f || !(f.revenue>0)) return {...DEFAULT_ASSUMPTIONS,entryMultiple:company.entryMultiple,exitMultiple:company.entryMultiple,growthRate:company.growthRate};
  return { ...DEFAULT_ASSUMPTIONS, entryMultiple: company.entryMultiple,
    exitMultiple: company.entryMultiple, growthRate: company.growthRate,
    capexRate: f.capex / f.revenue, depreciationRate: f.depreciation / f.revenue,
    workingCapitalRate: (f.receivables + f.inventory - f.payables) / f.revenue };
}
