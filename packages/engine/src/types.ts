export interface FinancialYear {
  year: number; revenue: number; ebitda: number; depreciation: number;
  interest: number; taxPaid: number; pat: number; receivables: number;
  inventory: number; payables: number; capex: number; cash: number;
  debt: number; equity: number; shares: number;
}
export interface Adjustment {
  id: string; year: number; label: string; amount: number; quote: string;
  page: number; filingId: string; status: "accepted" | "review" | "rejected";
}
export interface Assumptions {
  entryMultiple: number; exitMultiple: number; leverage: number;
  interestRate: number; taxRate: number; cashSweep: number;
  holdYears: number; feesRate: number; hurdleRate: number;
  growthRate: number; marginExpansion: number; capexRate: number;
  depreciationRate: number; workingCapitalRate: number;
  amortizationRate: number; coverageFloor: number;
}
export interface Projection {
  year: number; revenue: number; ebitda: number; depreciation: number;
  interest: number; tax: number; capex: number; deltaWC: number;
  freeCashFlow: number; openingDebt: number; mandatory: number;
  sweep: number; closingDebt: number; cash: number; fundingGap: number;
  coverage: number | null;
}
export interface LboResult {
  entryEbitda: number; entryEV: number; purchaseEquity: number;
  refinancedDebt: number; existingCash: number; fees: number;
  initialDebt: number; sponsorEquity: number; totalUses: number;
  projections: Projection[]; exitEV: number; exitEquity: number;
  moic: number; irr: number | null; fundingGap: number;
  investable: boolean;
  bridge: { growth: number; multiple: number; deleveraging: number; fees: number; total: number };
}
export interface SourceRef {
  field: keyof FinancialYear; year: number; filingId: string;
  page: number; url: string; title: string; kind: "demo" | "filing";
}
export interface Company {
  id: string; name: string; ticker: string; sector: string;
  description: string; marketCap: number; promoterPct: number;
  pledgedPct: number; entryMultiple: number; growthRate: number;
  financials: FinancialYear[]; adjustments: Adjustment[];
  sources: SourceRef[]; dataKind: "demo" | "verified";
  qualityIssues: string[];
}
