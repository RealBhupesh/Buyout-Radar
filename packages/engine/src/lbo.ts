import type {
  Adjustment,
  Assumptions,
  FinancialYear,
  LboResult,
  Projection,
} from "./types";
import { projectCashFlows } from "./projections";
import { normalizedEbitda } from "./earnings";
import { debtCapacity } from "./debt";
import { irr } from "./irr";
import { validateAssumptions } from "./validation";
export function runLbo(
  base: FinancialYear,
  adjustments: Adjustment[],
  a: Assumptions,
): LboResult {
  const errors = validateAssumptions(a);
  if (
    Object.values(base).some((v) => !Number.isFinite(v)) ||
    base.revenue <= 0 ||
    base.debt < 0 ||
    base.cash < 0
  )
    errors.push("Invalid base financials");
  const entryEbitda = normalizedEbitda(base.ebitda, adjustments, base.year);
  if (entryEbitda <= 0) errors.push("Positive normalized EBITDA required");
  if (errors.length) throw new Error(errors.join("; "));
  const entryEV = entryEbitda * a.entryMultiple,
    fees = entryEV * a.feesRate;
  const initialDebt = debtCapacity(
    entryEbitda,
    a.leverage,
    a.interestRate,
    a.coverageFloor,
  ).maxDebt;
  const purchaseEquity = entryEV - base.debt + base.cash;
  const totalUses = purchaseEquity + base.debt + fees;
  const sponsorEquity = totalUses - initialDebt - base.cash;
  if (sponsorEquity <= 0 || purchaseEquity < 0)
    throw new Error(
      "Transaction requires positive sponsor and purchase equity",
    );
  const projections = projectCashFlows(base, entryEbitda, initialDebt, a);
  const { closingDebt: debt, cash } = projections.at(-1)!;
  const exitEbitda = projections.at(-1)!.ebitda;
  const exitEV = exitEbitda * a.exitMultiple;
  const exitEquity = Math.max(0, exitEV - debt + cash);
  const growth = (exitEbitda - entryEbitda) * a.entryMultiple;
  const multiple = (a.exitMultiple - a.entryMultiple) * exitEbitda;
  const deleveraging = initialDebt - debt + cash;
  const fundingGap = projections.reduce((sum, p) => sum + p.fundingGap, 0);
  const investable =
    fundingGap < 1e-8 && projections.every((p) => p.ebitda > 0);
  const wipeoutAdjustment = Math.max(0, -(exitEV - debt + cash));
  return {
    entryEbitda,
    entryEV,
    purchaseEquity,
    refinancedDebt: base.debt,
    existingCash: base.cash,
    fees,
    initialDebt,
    sponsorEquity,
    totalUses,
    projections,
    exitEV,
    exitEquity,
    moic: investable ? exitEquity / sponsorEquity : null,
    irr: investable
      ? irr([-sponsorEquity, ...Array(a.holdYears - 1).fill(0), exitEquity])
      : null,
    fundingGap,
    investable,
    bridge: {
      growth,
      multiple,
      deleveraging,
      fees: -fees,
      equityFloor: wipeoutAdjustment,
      total: exitEquity - sponsorEquity,
    },
  };
}
