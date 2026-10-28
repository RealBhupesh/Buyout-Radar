"use client";
import Link from "next/link";
import { PILOT_COMPANIES, pilotFacts, type PilotCompany } from "../lib/pilot";
import { useStored, isStringArray } from "../lib/storage";
import { KEYS, isWorkflows, type Workflow } from "../lib/workflow";
import { CompanyWorkflowSummary } from "./company-workflow";
import { crore } from "../lib/format";
export function PilotShortlist({ rows }: { rows: PilotCompany[] }) {
  const saved = useStored<string[]>(KEYS.saved, [], isStringArray);
  const workflows = useStored<Workflow[]>(KEYS.workflows, [], isWorkflows);
  const savedPilots = PILOT_COMPANIES.filter((c) => saved.value.includes(c.id));
  if (!savedPilots.length) return null;
  return (
    <section className="pilot-shortlist" aria-label="Saved filing pilot">
      <h2>Official filing research</h2>
      <p className="section-explainer">
        {rows.length} of {savedPilots.length} saved pilot companies match these
        filters. Transaction returns are unavailable; these companies cannot
        qualify for the modeled Buy Box.
      </p>
      {rows.length > 0 && (
        <div
          className="table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Saved pilot companies"
        >
          <table className="workflow-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>FY2026 revenue</th>
                <th>Review status</th>
                <th>Research workflow</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    <Link href={`/pilot/${c.id}`}>{c.name}</Link>
                  </th>
                  <td>{crore(pilotFacts(c).at(-1)!.revenue)}</td>
                  <td>Independent review pending</td>
                  <td>
                    <CompanyWorkflowSummary
                      companyId={c.id}
                      name={c.name}
                      href={`/pilot/${c.id}#pilot-diligence`}
                    />
                  </td>
                  <td>
                    <button
                      className="text-button"
                      aria-label={`Unsave ${c.name}`}
                      onClick={() =>
                        saved.setValue((v) => v.filter((id) => id !== c.id))
                      }
                    >
                      Unsave
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(saved.error || workflows.error) && (
        <p role="status" className="error-text">
          {saved.error || workflows.error}
        </p>
      )}
    </section>
  );
}
