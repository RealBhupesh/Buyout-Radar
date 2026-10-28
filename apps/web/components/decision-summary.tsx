"use client";
import type { Assumptions, Company, LboResult } from "@buyout/engine";
import { stressTest } from "@buyout/engine";
import { pct, crore, multiple } from "../lib/format";
import { DEFAULT_BUY_BOX } from "../lib/research";
import { isBuyBox } from "../lib/workflow";
import { useStored } from "../lib/storage";

export function DecisionSummary({
  company,
  assumptions,
  model,
  complete,
  onEvidence,
}: {
  company: Company;
  assumptions: Assumptions;
  model: LboResult | null;
  complete: boolean;
  onEvidence: () => void;
}) {
  const box = useStored("buyout:buybox:v1", DEFAULT_BUY_BOX, isBuyBox);
  const coverage =
    model?.projections.flatMap((p) =>
      p.coverage === null ? [] : [p.coverage],
    ) ?? [];
  const stress =
    complete && model
      ? stressTest(company.financials.at(-1)!, company.adjustments, assumptions)
      : null;
  return (
    <section className="decision-summary" aria-label="Decision brief">
      <div className="work-section-heading">
        <h2>Before you build conviction.</h2>
        <button className="text-button" onClick={onEvidence}>
          Inspect evidence & diligence
        </button>
      </div>
      <dl className="decision-facts">
        <div>
          <dt>Minimum interest coverage</dt>
          <dd>
            {!complete || !model
              ? "Unavailable"
              : coverage.length
                ? multiple(Math.min(...coverage))
                : "No modeled interest"}
          </dd>
          <span>Floor {multiple(assumptions.coverageFloor)}</span>
        </div>
        <div>
          <dt>Additional funding needed</dt>
          <dd>{complete && model ? crore(model.fundingGap) : "Unavailable"}</dd>
          <span>
            {model?.fundingGap
              ? "Resolve before using returns"
              : "Under current assumptions"}
          </span>
        </div>
        <div>
          <dt>20% EBITDA stress</dt>
          <dd>
            {!stress
              ? "Unavailable"
              : stress.firstBreach
                ? `Breach in FY${stress.firstBreach}`
                : "No coverage breach"}
          </dd>
          <span>Coverage test, not a forecast</span>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>
            {company.dataKind === "demo"
              ? "Fictional financials"
              : complete
                ? "Sources linked"
                : "Evidence incomplete"}
          </dd>
          <span>
            {company.dataKind === "demo"
              ? "Workflow demonstration only"
              : "Independent review required"}
          </span>
        </div>
      </dl>
      <p className="hurdle-context">
        Screening hurdle: {pct(box.value.minIrr, 0)}. This scenario’s hurdle:{" "}
        {pct(assumptions.hurdleRate, 0)}. Screening sets shortlist criteria; the
        scenario hurdle drives its solver and sensitivity. Change it under all
        operating & transaction assumptions.
      </p>
      {box.error && (
        <p role="status" className="error-text">
          {box.error}
        </p>
      )}
    </section>
  );
}
