import type { FinancialYear } from "./types";
import { cashMetrics } from "./earnings";

const mean = (values: number[]) =>
  values.reduce((s, v) => s + v, 0) / values.length;

/** Historical operating quality from the reported statement set. No forecasts. */
export function qualityMetrics(financials: FinancialYear[]) {
  const years = [...financials].sort((a, b) => a.year - b.year);
  if (!years.length) throw new Error("Financial history required");
  const first = years[0],
    last = years.at(-1)!,
    span = last.year - first.year;
  const margins = years.flatMap((f) =>
    f.revenue > 0 ? [f.ebitda / f.revenue] : [],
  );
  const averageMargin = margins.length ? mean(margins) : null;
  const cash = cashMetrics(years);
  const capital = last.equity + last.debt;
  const days = cash.years.map((y) => y.workingCapitalDays);
  return {
    years: years.length,
    revenueCagr:
      span > 0 && first.revenue > 0 && last.revenue > 0
        ? (last.revenue / first.revenue) ** (1 / span) - 1
        : null,
    ebitdaMargin: last.revenue > 0 ? last.ebitda / last.revenue : null,
    averageMargin,
    /** Population standard deviation of annual EBITDA margin. */
    marginVolatility:
      margins.length > 1
        ? Math.sqrt(mean(margins.map((m) => (m - averageMargin!) ** 2)))
        : null,
    /** EBIT over closing equity plus borrowings. */
    roce: capital > 0 ? (last.ebitda - last.depreciation) / capital : null,
    netDebtToEbitda:
      last.ebitda > 0 ? (last.debt - last.cash) / last.ebitda : null,
    interestCover: last.interest > 0 ? last.ebitda / last.interest : null,
    capexIntensity: mean(
      years.flatMap((f) => (f.revenue > 0 ? [f.capex / f.revenue] : [0])),
    ),
    cashConversion: cash.averageConversion,
    workingCapitalDays: days.at(-1) ?? null,
    /** Change in working-capital days across the history; positive absorbs cash. */
    workingCapitalDrift:
      years.length > 1 && days[0] !== null && days.at(-1)! !== null
        ? days.at(-1)! - days[0]
        : null,
    revenueDeclines: years.filter(
      (f, i) => i > 0 && f.revenue < years[i - 1].revenue,
    ).length,
  };
}
export type QualityMetrics = ReturnType<typeof qualityMetrics>;

type Factor = {
  key: keyof QualityMetrics;
  label: string;
  weight: number;
  /** Value scoring zero and value scoring one; linear in between. */
  worst: number;
  best: number;
};
/**
 * Screening heuristic for how well a business carries acquisition debt.
 * Thresholds are judgment calls for mid-cap industrial companies, not validated.
 */
export const LBO_FIT_FACTORS: readonly Factor[] = Object.freeze([
  {
    key: "cashConversion",
    label: "Cash conversion",
    weight: 25,
    worst: 0.2,
    best: 0.8,
  },
  {
    key: "marginVolatility",
    label: "Margin stability",
    weight: 15,
    worst: 0.05,
    best: 0.005,
  },
  {
    key: "averageMargin",
    label: "EBITDA margin",
    weight: 15,
    worst: 0.08,
    best: 0.22,
  },
  {
    key: "revenueCagr",
    label: "Revenue growth",
    weight: 15,
    worst: 0,
    best: 0.12,
  },
  {
    key: "capexIntensity",
    label: "Capital intensity",
    weight: 10,
    worst: 0.1,
    best: 0.02,
  },
  {
    key: "netDebtToEbitda",
    label: "Existing leverage",
    weight: 10,
    worst: 3,
    best: 0,
  },
  {
    key: "roce",
    label: "Return on capital",
    weight: 10,
    worst: 0.08,
    best: 0.25,
  },
]);

export function lboFitScore(metrics: QualityMetrics) {
  const components = LBO_FIT_FACTORS.map((f) => {
    const value = metrics[f.key];
    return {
      key: f.key,
      label: f.label,
      weight: f.weight,
      value,
      score:
        value === null
          ? null
          : Math.min(1, Math.max(0, (value - f.worst) / (f.best - f.worst))),
    };
  });
  const scored = components.filter((c) => c.score !== null);
  const weight = scored.reduce((s, c) => s + c.weight, 0);
  return {
    /** 0 to 100 over the factors that could be measured; null if none could. */
    score: weight
      ? (100 * scored.reduce((s, c) => s + c.score! * c.weight, 0)) / weight
      : null,
    /** Share of total weight backed by data. */
    coverage: weight / LBO_FIT_FACTORS.reduce((s, f) => s + f.weight, 0),
    components,
  };
}
