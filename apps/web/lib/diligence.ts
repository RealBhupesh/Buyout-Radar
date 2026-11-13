import {
  DEFAULT_CONTROL_PREMIUM,
  ebitdaHeadroom,
  exitYearReturns,
  impliedEntryMultiple,
  lboFitScore,
  maxEntryPrice,
  normalizedEbitda,
  qualityMetrics,
  runCases,
  runLbo,
  stressTest,
  takePrivate,
  type Assumptions,
  type Company,
} from "@buyout/engine";

export interface DealTerms {
  /** Premium to the recorded market value, decimal. */
  premium: number;
  /** Fraction of the promoter holding bought. */
  promoterStakeSold: number;
  /** Fraction of the open offer tendered. */
  acceptance: number;
}
export const DEFAULT_DEAL_TERMS: DealTerms = {
  premium: DEFAULT_CONTROL_PREMIUM,
  promoterStakeSold: 1,
  acceptance: 1,
};

/** Reads optional deal terms from a query string; absent values use defaults. */
export function parseDealTerms(params: URLSearchParams): DealTerms {
  const read = (key: keyof DealTerms, min: number, max: number) => {
    const raw = params.get(key);
    if (raw === null || raw === "") return DEFAULT_DEAL_TERMS[key];
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max)
      throw new Error(`${key} must be between ${min} and ${max}`);
    return value;
  };
  return {
    premium: read("premium", -0.5, 2),
    promoterStakeSold: read("promoterStakeSold", 0, 1),
    acceptance: read("acceptance", 0, 1),
  };
}

const attempt = <T>(run: () => T): T | null => {
  try {
    return run();
  } catch {
    return null;
  }
};

/**
 * Everything an analyst needs behind one scenario: returns, price discipline,
 * downside headroom, deal structure and historical quality. The caller is
 * responsible for refusing companies with open data-quality issues.
 */
export function diligencePack(
  company: Company,
  a: Assumptions,
  terms: DealTerms = DEFAULT_DEAL_TERMS,
) {
  const base = company.financials.at(-1)!,
    adjustments = company.adjustments;
  const model = runLbo(base, adjustments, a);
  const ebitda = normalizedEbitda(base.ebitda, adjustments, base.year);
  const quality = qualityMetrics(company.financials);
  const structure = attempt(() =>
    takePrivate({
      marketCap: company.marketCap,
      promoterPct: company.promoterPct,
      pledgedPct: company.pledgedPct,
      debt: base.debt,
      cash: base.cash,
      ebitda,
      // Sample share counts are illustrative, so no per-share price is quoted.
      shares: company.dataKind === "verified" ? base.shares : undefined,
      ...terms,
    }),
  );
  // The scenario repriced at market plus the premium, other terms unchanged.
  const marketAssumptions = attempt(() => ({
    ...a,
    entryMultiple: impliedEntryMultiple(
      {
        marketCap: company.marketCap,
        debt: base.debt,
        cash: base.cash,
        ebitda,
      },
      terms.premium,
    ),
  }));
  const marketModel =
    marketAssumptions &&
    attempt(() => runLbo(base, adjustments, marketAssumptions));
  return {
    assumptions: a,
    terms,
    model,
    exitYears: exitYearReturns(base, adjustments, a),
    hurdlePrice: maxEntryPrice(base, adjustments, a),
    headroom: ebitdaHeadroom(base, adjustments, a),
    stress: stressTest(base, adjustments, a),
    cases: runCases(base, adjustments, a, [
      {
        name: "Downside",
        overrides: {
          growthRate: Math.max(-1 + Number.EPSILON, a.growthRate - 0.04),
          marginExpansion: Math.max(-1, a.marginExpansion - 0.02),
          exitMultiple: Math.max(0, a.exitMultiple - 1),
        },
      },
      { name: "Base", overrides: {} },
      {
        name: "Upside",
        overrides: {
          growthRate: Math.min(1, a.growthRate + 0.03),
          marginExpansion: Math.min(1, a.marginExpansion + 0.01),
          exitMultiple: Math.min(100, a.exitMultiple + 1),
        },
      },
    ]).cases.map(({ assumptions: _, ...result }) => result),
    market: {
      /** Scenario equity price against the recorded market value. */
      impliedPremium:
        company.marketCap > 0
          ? model.purchaseEquity / company.marketCap - 1
          : null,
      entryMultiple: marketAssumptions?.entryMultiple ?? null,
      irr: marketModel?.irr ?? null,
      moic: marketModel?.moic ?? null,
      investable: marketModel?.investable ?? false,
    },
    structure,
    quality,
    fit: lboFitScore(quality),
  };
}
export type DiligencePack = ReturnType<typeof diligencePack>;
