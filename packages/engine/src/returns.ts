import type { Adjustment, Assumptions, FinancialYear } from "./types";
import { runLbo } from "./lbo";
import { projectCashFlows } from "./projections";

const FUNDED = 1e-8;

/**
 * Sponsor returns if the same operating plan is sold at the end of each year.
 * The plan (margin path, debt schedule) is the base model's; only exit timing moves.
 */
export function exitYearReturns(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
) {
  const model = runLbo(base, adjustments, a);
  let gap = 0;
  return model.projections.map((p, i) => {
    gap += p.fundingGap;
    const years = i + 1,
      funded = gap < FUNDED && p.ebitda > 0;
    const exitEV = p.ebitda * a.exitMultiple;
    const exitEquity = Math.max(0, exitEV - p.closingDebt + p.cash);
    const moic = funded ? exitEquity / model.sponsorEquity : null;
    return {
      year: p.year,
      holdYears: years,
      exitEV,
      exitEquity,
      moic,
      irr: moic === null ? null : moic === 0 ? -1 : moic ** (1 / years) - 1,
      netLeverage: p.netLeverage,
    };
  });
}

/**
 * Highest entry price that still earns the target IRR with unchanged operating
 * and debt terms. New debt is sized on EBITDA, so only the equity cheque moves.
 */
export function maxEntryPrice(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
  targetIrr = a.hurdleRate,
) {
  if (!Number.isFinite(targetIrr) || targetIrr <= -1)
    throw new Error("Target IRR must be greater than -100%");
  const model = runLbo(base, adjustments, a);
  if (!model.investable || model.exitEquity <= 0) return null;
  const sponsorEquity = model.exitEquity / (1 + targetIrr) ** a.holdYears;
  const entryEV = (sponsorEquity + model.initialDebt) / (1 + a.feesRate);
  const entryMultiple = entryEV / model.entryEbitda;
  const equityValue = entryEV - base.debt + base.cash;
  if (equityValue < 0 || entryMultiple <= 0 || entryMultiple > 100) return null;
  return {
    targetIrr,
    entryMultiple,
    entryEV,
    equityValue,
    sponsorEquity,
    /** Positive when the scenario pays less than the hurdle price. */
    headroom: entryMultiple / a.entryMultiple - 1,
  };
}

function shocked(
  base: FinancialYear,
  a: Assumptions,
  model: ReturnType<typeof runLbo>,
  shock: number,
) {
  const years = projectCashFlows(
    base,
    model.entryEbitda,
    model.initialDebt,
    a,
    a.holdYears,
    1 - shock,
  );
  const last = years.at(-1)!;
  const funded = years.reduce((s, p) => s + p.fundingGap, 0) < FUNDED;
  return {
    funded,
    covered: years.every(
      (p) => p.coverage === null || p.coverage >= a.coverageFloor,
    ),
    capitalPreserved:
      funded &&
      years.every((p) => p.ebitda > 0) &&
      last.ebitda * a.exitMultiple - last.closingDebt + last.cash >=
        model.sponsorEquity,
  };
}

/**
 * Largest parallel EBITDA shortfall against plan that the structure absorbs.
 * `null` means the test already fails with no shock; 0.99 means no break within range.
 */
export function ebitdaHeadroom(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
) {
  const model = runLbo(base, adjustments, a);
  const solve = (test: keyof ReturnType<typeof shocked>) => {
    if (!shocked(base, a, model, 0)[test]) return null;
    let low = 0,
      high = 0.99;
    if (shocked(base, a, model, high)[test]) return high;
    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      if (shocked(base, a, model, mid)[test]) low = mid;
      else high = mid;
    }
    return low;
  };
  return {
    /** Before any interim funding shortfall. */
    funding: solve("funded"),
    /** Before interest cover falls below the scenario floor in any year. */
    coverage: solve("covered"),
    /** Before exit equity falls below the sponsor cheque (MOIC 1.0x). */
    capital: solve("capitalPreserved"),
  };
}

export interface CaseDefinition {
  name: string;
  /** Optional weight. Weighted results are produced only when all cases sum to 1. */
  probability?: number;
  overrides: Partial<Assumptions>;
}

/** Named operating cases on one base year, with probability-weighted outcomes. */
export function runCases(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
  cases: CaseDefinition[],
) {
  if (!cases.length) throw new Error("At least one case is required");
  if (new Set(cases.map((c) => c.name)).size !== cases.length)
    throw new Error("Case names must be unique");
  const results = cases.map((c) => {
    if (
      c.probability !== undefined &&
      !(Number.isFinite(c.probability) && c.probability >= 0)
    )
      throw new Error(`Invalid probability for ${c.name}`);
    const assumptions = { ...a, ...c.overrides };
    try {
      const model = runLbo(base, adjustments, assumptions);
      return {
        name: c.name,
        probability: c.probability ?? null,
        assumptions,
        irr: model.irr,
        moic: model.moic,
        fundingGap: model.fundingGap,
        investable: model.investable,
        error: null as string | null,
      };
    } catch (e) {
      return {
        name: c.name,
        probability: c.probability ?? null,
        assumptions,
        irr: null,
        moic: null,
        fundingGap: null,
        investable: false,
        error: (e as Error).message,
      };
    }
  });
  const weights = results.map((r) => r.probability);
  const weighted =
    weights.every((p): p is number => p !== null) &&
    Math.abs(weights.reduce((s, p) => s + p, 0) - 1) < 1e-6;
  const sameHold = results.every(
    (r) => r.assumptions.holdYears === results[0].assumptions.holdYears,
  );
  // An unfunded or invalid case is carried as a total loss, never dropped.
  const expectedMoic = weighted
    ? results.reduce((s, r) => s + r.probability! * (r.moic ?? 0), 0)
    : null;
  return {
    cases: results,
    expectedMoic,
    /** Annualized return on the expected multiple, not an average of IRRs. */
    expectedIrr:
      expectedMoic === null || !sameHold
        ? null
        : expectedMoic === 0
          ? -1
          : expectedMoic ** (1 / results[0].assumptions.holdYears) - 1,
    lossProbability: weighted
      ? results.reduce(
          (s, r) => s + (r.moic === null || r.moic < 1 ? r.probability! : 0),
          0,
        )
      : null,
  };
}
