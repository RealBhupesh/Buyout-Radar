import type { SourceRef } from "@buyout/engine";
import {
  emptyWorkflow,
  localDate,
  actionMatches,
  type Workflow,
} from "./workflow";

export const FIELD_LABELS: Record<SourceRef["field"], string> = {
  year: "Financial year",
  revenue: "Revenue",
  ebitda: "EBITDA",
  depreciation: "Depreciation & amortisation",
  interest: "Finance costs",
  taxPaid: "Cash taxes paid",
  pat: "Profit after tax",
  receivables: "Trade receivables",
  inventory: "Inventory",
  payables: "Trade payables",
  capex: "Capital expenditure",
  cash: "Cash & equivalents",
  debt: "Borrowings",
  equity: "Shareholders’ equity",
  shares: "Shares outstanding",
  marketCap: "Market capitalisation",
  promoterPct: "Promoter ownership",
  pledgedPct: "Promoter shares pledged",
};
export const EVIDENCE_GROUPS = [
  {
    name: "Earnings",
    fields: ["revenue", "ebitda", "depreciation", "interest", "pat"],
  },
  {
    name: "Cash & working capital",
    fields: ["taxPaid", "capex", "receivables", "inventory", "payables"],
  },
  {
    name: "Balance sheet & ownership",
    fields: [
      "cash",
      "debt",
      "equity",
      "shares",
      "marketCap",
      "promoterPct",
      "pledgedPct",
    ],
  },
] as const;

export function researchWorkload(
  ids: string[],
  workflows: Workflow[],
  today = localDate(),
) {
  const rows = [...new Set(ids)].map(
    (id) => workflows.find((w) => w.companyId === id) ?? emptyWorkflow(id),
  );
  return {
    saved: rows.length,
    reviewing: rows.filter(
      (w) => w.stage === "Reviewing" || w.stage === "Diligence",
    ).length,
    overdue: rows.filter(
      (w) => w.nextAction?.dueDate && w.nextAction.dueDate < today,
    ).length,
    upcoming: rows.filter(
      (w) => w.nextAction?.dueDate && w.nextAction.dueDate >= today,
    ).length,
    stages: Object.fromEntries(
      ["Inbox", "Reviewing", "Diligence", "Passed", "Archived"].map((stage) => [
        stage,
        rows.filter((w) => w.stage === stage).length,
      ]),
    ),
  };
}

export function screenPilotResearch<
  T extends { id: string; name: string; ticker: string; sector: string },
>(
  companies: T[],
  saved: string[],
  filters: { search: string; sector: string; onlyQualified: boolean },
  workflows: Workflow[],
  stage: string,
  dueFilter: string,
): T[] {
  return companies.filter((c) => {
    const w =
      workflows.find((w) => w.companyId === c.id) ?? emptyWorkflow(c.id);
    return (
      saved.includes(c.id) &&
      !filters.onlyQualified &&
      `${c.name} ${c.ticker}`
        .toLowerCase()
        .includes(filters.search.toLowerCase()) &&
      (filters.sector === "All sectors" || filters.sector === c.sector) &&
      (stage === "All stages" || stage === w.stage) &&
      actionMatches(w, dueFilter)
    );
  });
}
