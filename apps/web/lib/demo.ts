import type { Company, FinancialYear, SourceRef } from "@buyout/engine";
const stems = [
  "Aster",
  "Kaveri",
  "Northfield",
  "Meridian",
  "Sahyadri",
  "Cedar",
  "Deccan",
  "Triveni",
  "Vardhan",
  "Evergreen",
];
const makers = ["Precision", "Components", "Engineering", "Castings", "Motion"];
const chemicals = [
  "Specialty Chemicals",
  "Polymers",
  "Finechem",
  "Materials",
  "Resins",
];
/** Entirely fictional fixtures. Not market data, exchange listings, or investment recommendations. */
export const DEMO_COMPANIES: Company[] = Array.from({ length: 50 }, (_, i) => {
  const sector = i < 25 ? "Industrials" : "Specialty chemicals";
  const stem = stems[i % 10],
    suffix = (i < 25 ? makers : chemicals)[Math.floor(i / 5) % 5];
  const id = `demo-${String(i + 1).padStart(2, "0")}`;
  const baseRevenue = 720 + i * 91;
  const margin = 0.135 + (i % 9) * 0.011;
  const growth = 0.055 + (i % 8) * 0.012;
  const wcRate = 0.12 + (i % 7) * 0.022;
  const financials: FinancialYear[] = Array.from({ length: 5 }, (_, y) => {
    const revenue = baseRevenue * Math.pow(1 + growth, y);
    const ebitda = revenue * (margin + y * 0.001);
    const depreciation = revenue * 0.023;
    const interest = revenue * 0.009;
    const taxPaid = Math.max(0, ebitda - depreciation - interest) * 0.2517;
    return {
      year: 2022 + y,
      revenue,
      ebitda,
      depreciation,
      interest,
      taxPaid,
      pat: ebitda - depreciation - interest - taxPaid,
      receivables: revenue * wcRate * 0.8,
      inventory: revenue * wcRate * 0.65,
      payables: revenue * wcRate * 0.45,
      capex: revenue * (0.024 + (i % 5) * 0.006),
      cash: revenue * 0.045,
      debt: revenue * (0.09 + (i % 5) * 0.03),
      equity: revenue * 0.45,
      shares: 12 + i * 0.8,
    };
  });
  const sources: SourceRef[] = financials.flatMap((f) =>
    Object.keys(f)
      .filter((k) => k !== "year")
      .map((field, j) => ({
        field: field as keyof FinancialYear,
        year: f.year,
        filingId: `${id}-${f.year}`,
        page: 70 + j,
        url: `/api/sources/${id}?year=${f.year}&field=${field}`,
        title: `Fictional FY${f.year} reference ledger`,
        kind: "demo" as const,
      })),
  );
  const last = financials.at(-1)!;
  return {
    id,
    name: `${stem} ${suffix}`,
    ticker: `SIM${String(i + 1).padStart(3, "0")}`,
    sector,
    description:
      i < 25
        ? "Precision-manufactured components for industrial equipment and replacement markets."
        : "Specialty materials for industrial customers, with recurring formulations and technical qualification cycles.",
    marketCap: Math.round(
      last.ebitda * (6.5 + (i % 8) * 0.6) - last.debt + last.cash,
    ),
    promoterPct: 42 + (i % 12) * 2.4,
    pledgedPct: i % 11 === 0 ? 12 : 0,
    entryMultiple: 6.5 + (i % 8) * 0.6,
    growthRate: growth,
    financials,
    adjustments:
      i % 3 === 0
        ? [
            {
              id: `${id}-adj`,
              year: 2026,
              label: "Plant relocation expense",
              amount: last.ebitda * 0.018,
              quote: `Fictional exercise: plant relocation expense of INR ${(last.ebitda * 0.018).toFixed(2)} crore was recognized in FY2026.`,
              page: 112,
              filingId: `${id}-2026`,
              status: "accepted" as const,
            },
          ]
        : [],
    sources,
    dataKind: "demo" as const,
    qualityIssues:
      i === 17
        ? ["FY2024 cash-flow reconciliation pending"]
        : i === 38
          ? ["Inventory source reference awaiting review"]
          : [],
  };
});
