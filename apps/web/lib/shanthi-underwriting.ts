import {
  DEFAULT_ASSUMPTIONS,
  ebitdaHeadroom,
  exitYearReturns,
  impliedEntryMultiple,
  maxEntryPrice,
  runLbo,
  stressTest,
  validateFinancials,
  type Assumptions,
  type FinancialYear,
} from "@buyout/engine";
import data from "../data/shanthi-underwriting.json";

export const SHANTHI_ID = "pilot-shanthi-gears";
export const SHANTHI_MODEL_PATH = `/pilot/${SHANTHI_ID}/underwriting`;
export const SHANTHI = data;
export const DEFAULT_PREMIUM = 20;
export const MAX_PREMIUM = 60;

type ReportedYear = (typeof data.years)[number];
export type ReportSection = "balance" | "income" | "cashFlow" | "shares";
export const REPORTED_FIELDS = {
  balance: [
    "receivables",
    "inventory",
    "msmePayables",
    "otherPayables",
    "equity",
    "liabilities",
    "assets",
  ],
  income: ["revenue", "pbt", "otherIncome", "depreciation", "pat"],
  cashFlow: [
    "cashTax",
    "cfo",
    "investing",
    "financing",
    "capex",
    "openingCash",
    "closingCash",
    "cashChange",
  ],
  shares: ["shares"],
} as const satisfies Record<ReportSection, (keyof ReportedYear)[]>;

export function filing(year: ReportedYear, section: ReportSection) {
  const document = data.documents[year.document as keyof typeof data.documents];
  const page = document.pages[section];
  return {
    ...page,
    title: document.title,
    url: `${document.url}#page=${page.pdf}`,
    sha256: document.sha256,
  };
}

const cents = (amount: number) => Math.round(amount * 100) / 100;
export const shanthiHistory = data.years.map((year) => {
  const debt = year.year === 2026 ? data.fy26.supplierFinance : 0;
  const payables = cents(year.msmePayables + year.otherPayables - debt);
  const financial: FinancialYear = {
    year: year.year,
    revenue: year.revenue,
    ebitda: cents(year.pbt + year.depreciation - year.otherIncome),
    depreciation: year.depreciation,
    interest: 0,
    taxPaid: year.cashTax,
    pat: year.pat,
    receivables: year.receivables,
    inventory: year.inventory,
    payables,
    capex: year.capex,
    cash: year.closingCash,
    debt,
    equity: year.equity,
    shares: year.shares,
  };
  return {
    reported: year,
    financial,
    workingCapital: cents(year.receivables + year.inventory - payables),
    afterCapexCash: cents(year.cfo - year.capex),
  };
});

export function underwritingIssues() {
  const issues = validateFinancials(shanthiHistory.map((h) => h.financial));
  for (const [index, y] of data.years.entries()) {
    const checks = [
      ["Balance sheet", y.assets, y.equity + y.liabilities],
      ["Cash movement", y.cashChange, y.cfo + y.investing + y.financing],
      ["Cash roll-forward", y.closingCash, y.openingCash + y.cashChange],
    ] as const;
    for (const [label, reported, computed] of checks)
      if (Math.abs(reported - computed) > 0.010001)
        issues.push(`FY${y.year} ${label} does not reconcile`);
    if (index > 0 && y.openingCash !== data.years[index - 1].closingCash)
      issues.push(`FY${y.year} opening cash does not match prior year`);
  }
  if (
    cents(
      data.fy26.issuerEbitda -
        data.years.at(-1)!.otherIncome -
        data.fy26.labourCharge,
    ) !== shanthiHistory.at(-1)!.financial.ebitda
  )
    issues.push("FY2026 issuer EBITDA bridge does not reconcile");
  return issues;
}

const issues = underwritingIssues();
if (issues.length) throw new Error(issues.join(". "));

export const shanthiBase = shanthiHistory.at(-1)!;
export const marketEquity =
  (data.market.close * shanthiBase.financial.shares) / 1e7;
export const promoterOwnership =
  data.ownership.promoterShares / shanthiBase.financial.shares;
export const historicalCapexRate =
  data.years.reduce((total, y) => total + y.capex, 0) /
  data.years.reduce((total, y) => total + y.revenue, 0);
const recentCapexRate =
  shanthiBase.financial.capex / shanthiBase.financial.revenue;

export const shanthiCases = {
  base: {
    label: "Base",
    growthRate: 0.05,
    exitMultiple: 20,
    marginExpansion: 0,
    capexRate: historicalCapexRate,
  },
  downside: {
    label: "Downside",
    growthRate: -0.02,
    exitMultiple: 15,
    marginExpansion: -0.03,
    capexRate: recentCapexRate,
  },
  recovery: {
    label: "Recovery",
    growthRate: 0.1,
    exitMultiple: 28,
    marginExpansion: 0.02,
    capexRate: historicalCapexRate,
  },
};
export type ShanthiCase = keyof typeof shanthiCases;

export function shanthiScenario(scenario: ShanthiCase, premium: number) {
  if (!Number.isFinite(premium) || premium < 0 || premium > MAX_PREMIUM)
    throw new Error(`Premium must be between 0% and ${MAX_PREMIUM}%`);
  const f = shanthiBase.financial;
  const entrySharePrice = data.market.close * (1 + premium / 100);
  const selected = shanthiCases[scenario];
  const assumptions: Assumptions = {
    ...DEFAULT_ASSUMPTIONS,
    entryMultiple: impliedEntryMultiple(
      { marketCap: marketEquity, debt: f.debt, cash: f.cash, ebitda: f.ebitda },
      premium / 100,
    ),
    exitMultiple: selected.exitMultiple,
    growthRate: selected.growthRate,
    marginExpansion: selected.marginExpansion,
    capexRate: selected.capexRate,
    leverage: 3,
    interestRate: 0.11,
    taxRate: data.fy26.statutoryTaxRate,
    depreciationRate: f.depreciation / f.revenue,
    workingCapitalRate: shanthiBase.workingCapital / f.revenue,
  };
  const model = runLbo(f, [], assumptions);
  const stress = stressTest(f, [], assumptions);
  const hurdle = maxEntryPrice(f, [], assumptions);
  return {
    assumptions,
    model,
    stress,
    exits: exitYearReturns(f, [], assumptions),
    headroom: ebitdaHeadroom(f, [], assumptions),
    entrySharePrice,
    hurdleSharePrice:
      hurdle === null ? null : (hurdle.equityValue * 1e7) / f.shares,
  };
}

export function isShanthiCase(value: string): value is ShanthiCase {
  return Object.hasOwn(shanthiCases, value);
}
