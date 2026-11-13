import type { Adjustment, Assumptions, FinancialYear } from "./types";
import { runLbo } from "./lbo";
import { projectCashFlows } from "./projections";
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
  const start = low,
    end = high,
    steps = 100;
  // Find a funded sign change without requiring either search endpoint to work.
  let previous: { value: number; delta: number } | null = null;
  let lowDelta: number | null = null;
  for (let i = 0; i <= steps; i++) {
    const value = start + ((end - start) * i) / steps,
      r = evaluate(value);
    if (r === null) {
      previous = null;
      continue;
    }
    const delta = r - a.hurdleRate;
    if (delta === 0 || (i === 0 && delta > 0)) return value;
    if (previous !== null && previous.delta * delta < 0) {
      low = previous.value;
      high = value;
      lowDelta = previous.delta;
      break;
    }
    previous = { value, delta };
  }
  if (lowDelta === null) return null;
  for (let i = 0; i < 90; i++) {
    const mid = (low + high) / 2,
      r = evaluate(mid);
    if (r === null) return null;
    const delta = r - a.hurdleRate;
    if (delta === 0) return mid;
    if (lowDelta * delta > 0) {
      low = mid;
      lowDelta = delta;
    } else high = mid;
  }
  return (low + high) / 2;
}
export function stressTest(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
  /** Parallel EBITDA shock as a fraction of each base-case year. */
  shock = 0.2,
) {
  if (!Number.isFinite(shock) || shock < 0 || shock >= 1)
    throw new Error("Shock must be at least 0 and below 1");
  const model = runLbo(base, adjustments, a);
  // Same opening acquisition debt and reinvestment; only EBITDA is shocked, so
  // taxes, repayments and cash are recalculated by the shared schedule.
  const years = projectCashFlows(
    base,
    model.entryEbitda,
    model.initialDebt,
    a,
    a.holdYears,
    1 - shock,
  ).map((p) => ({
    year: p.year,
    ebitda: p.ebitda,
    coverage: p.coverage,
    debt: p.closingDebt,
    fundingGap: p.fundingGap,
  }));
  return {
    years,
    firstBreach:
      years.find((y) => y.coverage !== null && y.coverage < a.coverageFloor)
        ?.year ?? null,
    fundingGap: years.reduce((s, y) => s + y.fundingGap, 0),
  };
}
