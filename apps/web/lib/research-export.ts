import type { Research } from "./research";
export function csvCell(value: string | number | null): string {
  let s = value === null ? "Unavailable" : String(value);
  if (typeof value === "string" && /^[\s\u0000-\u001f]*[=+\-@]/.test(s))
    s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function researchCsv(rows: Research[]): string {
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
  ];
  const lines = rows.map((r) => [
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
  ]);
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
