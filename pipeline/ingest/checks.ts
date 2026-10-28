import {
  validateFinancials,
  type Company,
} from "../../packages/engine/src/index";
import { provenanceIssues } from "../../apps/web/lib/provenance";
export interface AccountingCheck {
  label: string;
  kind?: "balance-sheet" | "cash-rollforward" | "segments";
  actual: number;
  expected: number;
  tolerance?: number;
}
export function accountingChecks(checks: AccountingCheck[]): string[] {
  return checks
    .filter(
      (c) =>
        (c.tolerance !== undefined &&
          (!Number.isFinite(c.tolerance) || c.tolerance < 0)) ||
        !Number.isFinite(c.actual) ||
        !Number.isFinite(c.expected) ||
        Math.abs(c.actual - c.expected) > (c.tolerance ?? 0.01),
    )
    .map((c) => `${c.label}: reconciliation failed`);
}
export function validateCompany(
  c: Company,
  checks: AccountingCheck[] = [],
): string[] {
  return [
    ...new Set([
      ...c.qualityIssues,
      ...(c.dataKind === "verified" &&
      (!checks.some((x) => x.kind === "balance-sheet") ||
        !checks.some((x) => x.kind === "cash-rollforward"))
        ? [
            "Balance sheet and cash rollforward reconciliation evidence required",
          ]
        : []),
      ...validateFinancials(c.financials),
      ...provenanceIssues(c),
      ...accountingChecks(checks),
    ]),
  ];
}
