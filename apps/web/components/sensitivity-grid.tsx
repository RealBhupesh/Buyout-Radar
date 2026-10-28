"use client";
import { useState } from "react";
import { sensitivity, type Company, type Assumptions } from "@buyout/engine";
import { pct, multiple } from "../lib/format";
export function SensitivityGrid({
  company,
  assumptions,
  onChange,
}: {
  company: Company;
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
}) {
  const [kind, setKind] = useState<"multiples" | "operating">("multiples");
  const grid = sensitivity(
    company.financials.at(-1)!,
    company.adjustments,
    assumptions,
    kind,
  );
  return (
    <section className="work-section">
      <div className="work-section-heading">
        <h2>How much room for error?</h2>
      </div>
      <div className="segmented" aria-label="Sensitivity dimensions">
        <button
          aria-pressed={kind === "multiples"}
          onClick={() => setKind("multiples")}
        >
          Entry × exit multiple
        </button>
        <button
          aria-pressed={kind === "operating"}
          onClick={() => setKind("operating")}
        >
          Leverage × growth
        </button>
      </div>
      <p className="section-explainer">
        {kind === "multiples"
          ? "Rows: entry multiple. Columns: exit multiple."
          : "Rows: leverage. Columns: revenue growth."}{" "}
        Select a cell to use that scenario.
      </p>
      <div className="table-scroll">
        <table className="sensitivity-table">
          <caption className="sr-only">
            IRR sensitivity grid; center cell is the current model
          </caption>
          <thead>
            <tr>
              <th scope="col">
                {kind === "multiples" ? "Entry / exit" : "Debt / growth"}
              </th>
              {grid.columns.map((v) => (
                <th key={v} scope="col">
                  {kind === "multiples" ? multiple(v) : pct(v, 0)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((v, i) => (
              <tr key={v}>
                <th scope="row">{multiple(v)}</th>
                {grid.cells[i].map((irr, j) => (
                  <td key={j}>
                    <button
                      className={`${irr !== null && irr >= assumptions.hurdleRate ? "above-hurdle" : ""} ${i === 2 && j === 2 ? "base-cell" : ""}`}
                      aria-label={`${kind === "multiples" ? "Entry" : "Leverage"} ${multiple(v)}, ${kind === "multiples" ? `exit ${multiple(grid.columns[j])}` : `growth ${pct(grid.columns[j])}`}, IRR ${pct(irr)}`}
                      disabled={irr === null}
                      onClick={() =>
                        onChange({
                          ...assumptions,
                          ...(kind === "multiples"
                            ? {
                                entryMultiple: v,
                                exitMultiple: grid.columns[j],
                              }
                            : { leverage: v, growthRate: grid.columns[j] }),
                        })
                      }
                    >
                      {irr === null ? "Unfunded" : pct(irr)}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine-print">
        Darker cells meet your {pct(assumptions.hurdleRate, 0)} hurdle. Unfunded
        and invalid scenarios are unavailable.
      </p>
    </section>
  );
}
