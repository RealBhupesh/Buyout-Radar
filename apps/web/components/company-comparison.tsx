import Link from "next/link";
import type { Company } from "@buyout/engine";
import { analyze } from "../lib/research";
import { scenarioAnalysis } from "../lib/workflow";
import { pct, crore, multiple } from "../lib/format";
export function CompanyComparison({ companies }: { companies: Company[] }) {
  const rows = companies.map(analyze),
    results = rows.map((r) => scenarioAnalysis(r.company, r.assumptions));
  const metrics: { label: string; values: string[] }[] = [
    {
      label: "Data kind",
      values: companies.map((c) =>
        c.dataKind === "demo"
          ? "Fictional / sample data"
          : "Published financials",
      ),
    },
    { label: "Sector", values: companies.map((c) => c.sector) },
    {
      label: "Latest annual period",
      values: companies.map((c) =>
        c.financials.length ? `FY${c.financials.at(-1)!.year}` : "Unavailable",
      ),
    },
    {
      label: "Market cap (INR crore)",
      values: companies.map((c) => crore(c.marketCap)),
    },
    {
      label: "Entry EV / EBITDA",
      values: rows.map((r) => multiple(r.assumptions.entryMultiple)),
    },
    {
      label: "Cash conversion",
      values: rows.map((r) => pct(r.cash.averageConversion)),
    },
    {
      label: "Promoter ownership",
      values: companies.map((c) => `${c.promoterPct.toFixed(1)}%`),
    },
    {
      label: "Pledged shares",
      values: companies.map((c) => `${c.pledgedPct.toFixed(1)}%`),
    },
    {
      label: "Evidence status",
      values: rows.map((r) =>
        r.issues.length
          ? r.issues.join("; ")
          : r.company.dataKind === "demo"
            ? "Complete sample ledger; not verified filings"
            : "Complete published evidence",
      ),
    },
    { label: "Research status", values: results.map((r) => r.status) },
    { label: "Model IRR", values: results.map((r) => pct(r.irr)) },
    { label: "Sponsor MOIC", values: results.map((r) => multiple(r.moic)) },
    {
      label: "Sponsor equity (INR crore)",
      values: results.map((r) =>
        r.model ? crore(r.model.sponsorEquity) : "Unavailable",
      ),
    },
    {
      label: "Hold period",
      values: rows.map((r) => `${r.assumptions.holdYears} years`),
    },
  ];
  return (
    <section aria-label="Company comparison">
      <p className="section-explainer">
        INR crore throughout. Incomplete evidence and funding shortfalls
        withhold returns. Different annual periods are identified below.
      </p>
      <p className="fine-print table-hint">
        Scroll sideways to compare all columns.
      </p>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Scrollable company comparison"
      >
        <table className="workflow-table company-comparison">
          <caption className="sr-only">
            Company comparison at base assumptions
          </caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              {companies.map((c) => (
                <th key={c.id} scope="col">
                  <Link href={`/company/${c.id}`}>{c.name}</Link>
                  <span>{c.ticker}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.label}>
                <th scope="row">{m.label}</th>
                {m.values.map((v, i) => (
                  <td key={companies[i].id}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
