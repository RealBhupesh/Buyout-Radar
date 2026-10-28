"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { Company, Assumptions } from "@buyout/engine";
import { useStored, isString } from "../lib/storage";
import { scenarioAnalysis, type Workflow } from "../lib/workflow";
import { crore, pct, multiple } from "../lib/format";
import { useWorkflow } from "./company-workflow";
import { assumptionLabel, assumptionValue } from "./scenario-library";
import { PanelDialog } from "./dialog";
export function PrintableMemo({
  company,
  assumptions,
}: {
  company: Company;
  assumptions: Assumptions;
}) {
  const [open, setOpen] = useState(false),
    notes = useStored(`buyout:note:${company.id}:v1`, "", isString),
    workflow = useWorkflow(company.id);
  const content = (
    <MemoContent
      company={company}
      assumptions={assumptions}
      notes={notes.value}
      workflow={workflow.value}
    />
  );
  return (
    <>
      <PanelDialog
        wide
        open={open}
        onOpenChange={setOpen}
        title="Research memo"
        description="Preview your private research before printing. Your browser can save the printed document as a PDF."
        trigger={<button className="button tonal">Print memo</button>}
      >
        <div className="memo-preview">{content}</div>
        <p role="status" className="error-text">
          {notes.error || workflow.error}
        </p>
        <button
          className="button primary"
          disabled={!notes.ready || !workflow.ready}
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </PanelDialog>
      {open &&
        createPortal(
          <div className="memo-print">{content}</div>,
          document.body,
        )}
    </>
  );
}
function MemoContent({
  company,
  assumptions,
  notes,
  workflow,
}: {
  company: Company;
  assumptions: Assumptions;
  notes: string;
  workflow: Workflow;
}) {
  const result = scenarioAnalysis(company, assumptions);
  return (
    <article className="research-memo">
      <header>
        <p>
          Buyout Radar · Private research · {new Date().toLocaleDateString()}
        </p>
        <h2>{company.name}</h2>
        <p>
          {company.ticker} · {company.sector} · {workflow.stage}
        </p>
        <strong>
          {company.dataKind === "demo"
            ? "Fictional company / sample data"
            : "Published financials"}{" "}
          · INR crore
        </strong>
      </header>
      <p>{company.description}</p>
      <section>
        <h3>Current model facts</h3>
        <p>{result.status}. Returns recalculate against current financials.</p>
        <dl>
          <div>
            <dt>Model IRR</dt>
            <dd>{pct(result.irr)}</dd>
          </div>
          <div>
            <dt>Sponsor MOIC</dt>
            <dd>{multiple(result.moic)}</dd>
          </div>
          <div>
            <dt>Sponsor equity</dt>
            <dd>
              {result.model ? crore(result.model.sponsorEquity) : "Unavailable"}
            </dd>
          </div>
          <div>
            <dt>Funding gap</dt>
            <dd>
              {result.model ? crore(result.model.fundingGap) : "Unavailable"}
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>Current assumptions</h3>
        <table className="workflow-table">
          <tbody>
            {(Object.keys(assumptions) as (keyof Assumptions)[]).map((k) => (
              <tr key={k}>
                <th scope="row">{assumptionLabel(k)}</th>
                <td>{assumptionValue(k, assumptions[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3>Research notes</h3>
        <p className="memo-notes">{notes || "No private notes recorded."}</p>
      </section>
      <section>
        <h3>
          Diligence · {workflow.tasks.filter((t) => t.done).length}/
          {workflow.tasks.length} complete
        </h3>
        {workflow.tasks.length ? (
          <ul>
            {workflow.tasks.map((t) => (
              <li key={t.id}>
                {t.done ? "Complete" : "Open"}: {t.text}
              </li>
            ))}
          </ul>
        ) : (
          <p>No checklist recorded.</p>
        )}
      </section>
      <section>
        <h3>Next action</h3>
        <p>
          {workflow.nextAction
            ? `${workflow.nextAction.text}${workflow.nextAction.dueDate ? ` · Due ${workflow.nextAction.dueDate}` : ""}`
            : "No next action recorded."}
        </p>
      </section>
      <footer>
        Research scenario, not a forecast. Review sources and assumptions before
        using this memo.{" "}
        {company.dataKind === "demo"
          ? "No real company or filing is represented."
          : ""}
      </footer>
    </article>
  );
}
