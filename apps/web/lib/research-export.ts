import type { Research } from "./research";
import { csvCell } from "./csv";
export { csvCell } from "./csv";
import { pilotFacts, type PilotCompany } from "./pilot";
export function researchCsv(
  rows: Research[],
  pilots: PilotCompany[] = [],
): string {
  const header = [
    "Company",
    "Ticker",
    "Sector",
    "Market cap (INR crore)",
    "Entry EV / EBITDA (x)",
    "Cash conversion (%)",
    "Model IRR (%)",
    "Promoter ownership (%)",
    "Pledged shares (%)",
    "Data kind",
    "Research status",
    "Financial year",
    "Revenue (INR crore)",
    "PAT (INR crore)",
    "Reporting basis",
    "Source URL",
    "Evidence review",
  ];
  const lines: (string | number | null)[][] = rows.map((r) => [
    r.company.name,
    r.company.ticker,
    r.company.sector,
    r.company.marketCap,
    r.assumptions.entryMultiple,
    r.cash.averageConversion === null ? null : r.cash.averageConversion * 100,
    r.valid && r.irr !== null ? r.irr * 100 : null,
    r.company.promoterPct,
    r.company.pledgedPct,
    r.company.dataKind,
    r.status,
    r.latest?.year ?? null,
    r.latest?.revenue ?? null,
    r.latest?.pat ?? null,
    r.company.dataKind === "demo" ? "Synthetic" : "See original filing",
    null,
    r.company.dataKind === "demo"
      ? "Fictional financials"
      : "Source-linked; independent review required",
  ]);
  for (const c of pilots) {
    const f = pilotFacts(c).at(-1)!;
    lines.push([
      c.name,
      c.ticker,
      c.sector,
      null,
      null,
      null,
      null,
      null,
      null,
      "official-filing-pilot",
      "Transaction inputs incomplete",
      f.year,
      f.revenue,
      f.pat,
      c.basis,
      f.source.url,
      "Source facts checked; independent review pending",
    ]);
  }
  return (
    "\ufeff" +
    [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n")
  );
}
export function downloadText(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
