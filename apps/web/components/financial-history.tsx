"use client";
import { cashMetrics, type Company, type FinancialYear } from "@buyout/engine";
import { num, pct } from "../lib/format";
import type { SourceSelection } from "./source-inspector";
const rows: [keyof FinancialYear, string][] = [
  ["revenue", "Revenue"],
  ["ebitda", "Reported EBITDA"],
  ["depreciation", "Depreciation"],
  ["interest", "Interest expense"],
  ["taxPaid", "Tax paid"],
  ["pat", "Profit after tax"],
  ["receivables", "Receivables"],
  ["inventory", "Inventory"],
  ["payables", "Payables"],
  ["capex", "Capital expenditure"],
  ["cash", "Cash & equivalents"],
  ["debt", "Total debt"],
  ["equity", "Equity"],
  ["shares", "Shares outstanding"],
];
export function FinancialHistory({
  company,
  onSelect,
}: {
  company: Company;
  onSelect: (s: SourceSelection) => void;
}) {
  const cash = cashMetrics(company.financials);
  return (
    <section className="work-section">
      <div className="work-section-heading">
        <h2>Five years. Every number.</h2>
        <span>₹ Cr, except shares</span>
      </div>
      <p className="section-explainer">
        Select a figure to inspect its source. Cash conversion uses four
        year-on-year changes from five annual statements.
      </p>
      <div className="table-scroll">
        <table className="financial-table">
          <caption className="sr-only">
            Historical financial statements for {company.name}
          </caption>
          <thead>
            <tr>
              <th scope="col">Financial year</th>
              {company.financials.map((f) => (
                <th key={f.year} scope="col">
                  FY{f.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([field, label]) => (
              <tr key={field}>
                <th scope="row">{label}</th>
                {company.financials.map((f) => (
                  <td key={f.year}>
                    <button
                      className="financial-source"
                      onClick={() => onSelect({ year: f.year, field })}
                    >
                      {num(f[field], field === "shares" ? 1 : 0)}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
            <tr className="total-row">
              <th scope="row">Free cash flow before interest</th>
              {cash.years.map((f) => (
                <td key={f.year}>
                  {f.freeCashFlow === null
                    ? "Prior year needed"
                    : num(f.freeCashFlow)}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Cash conversion</th>
              {cash.years.map((f) => (
                <td key={f.year}>{pct(f.conversion, 0)}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Working capital days</th>
              {cash.years.map((f) => (
                <td key={f.year}>
                  {f.workingCapitalDays === null
                    ? "Unavailable"
                    : num(f.workingCapitalDays)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="fine-print">
        Inventory and payable days use revenue as a proxy because cost-of-goods
        data is outside the v1 field set. Historical FCF is before interest; LBO
        cash flow is after interest.
      </p>
    </section>
  );
}
