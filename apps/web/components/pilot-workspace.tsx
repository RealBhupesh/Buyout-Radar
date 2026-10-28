"use client";
import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  PILOT_REVIEW_GATES,
  pilotFacts,
  pilotGrowth,
  pilotCsv,
  pilotDraft,
  type PilotCompany,
} from "../lib/pilot";
import { crore, num, pct } from "../lib/format";
import { downloadText } from "../lib/research-export";
import { useStored, isStringArray, isString } from "../lib/storage";
import { CompanyWorkflow, useWorkflow } from "./company-workflow";
import { ResearchNoteEditor } from "./research-notes";
import { PanelDialog } from "./dialog";
import { Glyph } from "./icons";

export function PilotExport({ companies }: { companies: PilotCompany[] }) {
  const [message, setMessage] = useState("");
  return (
    <div className="pilot-export">
      <button
        className="button tonal"
        onClick={() => {
          downloadText(
            "buyout-radar-official-filing-pilot.csv",
            pilotCsv(companies),
            "text/csv;charset=utf-8",
          );
          setMessage(
            "Reported facts and source references exported. Unavailable returns remain unavailable.",
          );
        }}
      >
        <Glyph name="download" size={16} />
        Export sourced facts
      </button>
      <span role="status">{message}</span>
    </div>
  );
}

export function PilotWorkspace({ company }: { company: PilotCompany }) {
  const saved = useStored<string[]>("buyout:saved:v1", [], isStringArray);
  const notes = useStored(`buyout:note:${company.id}:v1`, "", isString);
  const workflow = useWorkflow(company.id);
  const facts = pilotFacts(company),
    latest = facts.at(-1)!,
    growth = pilotGrowth(company);
  const [selection, setSelection] = useState<{
    year: number;
    field: "revenue" | "pat";
  } | null>(null);
  const [metric, setMetric] = useState<"revenue" | "pat">("revenue");
  const [memo, setMemo] = useState(false);
  const selected = facts.find((f) => f.year === selection?.year);
  const isSaved = saved.value.includes(company.id);
  const memoContent = (
    <article className="research-memo">
      <header>
        <p>Buyout Radar · Official filing pilot</p>
        <h2>{company.name}</h2>
        <p>
          Standalone facts in INR crore. Independent review pending. No current
          market valuation or transaction returns supplied.
        </p>
      </header>
      <section>
        <h3>Reported financial history</h3>
        <table className="workflow-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Revenue</th>
              <th>PAT</th>
              <th>Official document / PDF page</th>
            </tr>
          </thead>
          <tbody>
            {facts.map((f) => (
              <tr key={f.year}>
                <th>FY{f.year}</th>
                <td>{num(f.revenue, f.source.units === "INR lakh" ? 4 : 2)}</td>
                <td>{num(f.pat, f.source.units === "INR lakh" ? 4 : 2)}</td>
                <td>
                  <a href={`${f.source.url}#page=${f.source.pdfPage}`}>
                    {f.source.title}, p. {f.source.pdfPage}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3>Research question</h3>
        <p>{company.question}</p>
        <p>
          Model IRR: Unavailable. MOIC: Unavailable. Full transaction inputs and
          independent review remain outstanding.
        </p>
      </section>
      <section>
        <h3>Private notes</h3>
        <p className="memo-notes">{notes.value || "No private note yet."}</p>
      </section>
      <section>
        <h3>Diligence</h3>
        <p>
          Stage: {workflow.value.stage}.{" "}
          {workflow.value.tasks.filter((t) => t.done).length} /{" "}
          {workflow.value.tasks.length} tasks complete.
        </p>
        <ul>
          {workflow.value.tasks.map((t) => (
            <li key={t.id}>
              {t.done ? "Complete" : "Open"}: {t.text}
            </li>
          ))}
        </ul>
        <p>
          Next action:{" "}
          {workflow.value.nextAction
            ? `${workflow.value.nextAction.text}${workflow.value.nextAction.dueDate ? ` · Due ${workflow.value.nextAction.dueDate}` : ""}`
            : "No next action."}
        </p>
      </section>
      <section>
        <h3>Outstanding publication gates</h3>
        <ul>
          {PILOT_REVIEW_GATES.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>
      <footer>
        Sources checked 28 October 2026. PDF page numbers include covers.
        Company filings remain on their publishers’ websites. Private notes
        remain in this browser and in your chosen exports.
      </footer>
    </article>
  );
  const max = Math.max(...facts.map((f) => f[metric]), 1) * 1.12;
  const x = (i: number) => 70 + i * 140,
    y = (v: number) => 230 - (v / max) * 185;
  return (
    <div className="page pilot-profile">
      <div className="breadcrumb">
        <Link href="/pilot">Official filing pilot</Link>
        <span>/</span>
        <span>{company.ticker}</span>
      </div>
      <header className="company-header">
        <div>
          <h1>{company.name}</h1>
          <p>{company.description}</p>
        </div>
        <button
          className="button tonal"
          aria-pressed={isSaved}
          disabled={!saved.ready}
          onClick={() =>
            saved.setValue((v) =>
              isSaved
                ? v.filter((id) => id !== company.id)
                : [...v, company.id],
            )
          }
        >
          <Glyph name="save" size={16} />
          {isSaved ? "Saved" : "Save research"}
        </button>
      </header>
      <div className="pilot-status">
        <strong>Official source facts checked</strong>
        <p>
          Standalone · FY2022–2026 · Checked 28 October 2026 · Independent
          review pending
        </p>
        <p>
          These are reported revenue and profit facts. Transaction underwriting
          remains unavailable while cash flow, valuation, ownership and
          financing inputs are reviewed.
        </p>
      </div>
      <nav className="research-jumps" aria-label="Pilot research sections">
        <a href="#pilot-financials">Reported financials</a>
        <a href="#pilot-review">Review gates</a>
        <a href="#pilot-diligence">Diligence & next action</a>
        <a href="#pilot-notes">Private notes</a>
      </nav>
      <div className="pilot-actions">
        <PilotExport companies={[company]} />
        <PanelDialog
          title="Research memo"
          description="Preview official reported facts and your private research. Save as PDF through browser printing."
          wide
          open={memo}
          onOpenChange={setMemo}
          trigger={<button className="button tonal">Print memo</button>}
        >
          <div className="memo-preview">{memoContent}</div>
          <button
            className="button primary"
            disabled={!notes.ready || !workflow.ready}
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
        </PanelDialog>
      </div>
      {(saved.error || notes.error || workflow.error) && (
        <p className="error-text" role="status">
          {saved.error || notes.error || workflow.error}
        </p>
      )}
      <section className="pilot-question">
        <h2>{company.question}</h2>
        <dl className="decision-facts">
          <div>
            <dt>FY2026 revenue</dt>
            <dd>{crore(latest.revenue)}</dd>
            <span>{pct(growth.revenueYoY)} year on year</span>
          </div>
          <div>
            <dt>FY2026 profit after tax</dt>
            <dd>{crore(latest.pat)}</dd>
            <span>Reported standalone profit</span>
          </div>
          <div>
            <dt>Revenue CAGR</dt>
            <dd>{pct(growth.revenueCagr)}</dd>
            <span>FY2022–2026 · four annual intervals</span>
          </div>
          <div>
            <dt>Transaction IRR / MOIC</dt>
            <dd>Unavailable</dd>
            <span>Full model & independent review pending</span>
          </div>
        </dl>
      </section>
      <section className="work-section" id="pilot-financials">
        <div className="work-section-heading">
          <h2>Five years, with the source attached.</h2>
          <div className="pilot-metric">
            <button
              aria-pressed={metric === "revenue"}
              onClick={() => setMetric("revenue")}
            >
              Revenue
            </button>
            <button
              aria-pressed={metric === "pat"}
              onClick={() => setMetric("pat")}
            >
              Profit after tax
            </button>
          </div>
        </div>
        <figure
          className="pilot-history"
          tabIndex={0}
          aria-label="Scrollable reported history chart"
        >
          <svg
            viewBox="0 0 720 280"
            role="img"
            aria-label={`${company.name}: ${metric === "revenue" ? "revenue" : "profit after tax"}, FY2022 to FY2026. Exact figures are in the table below.`}
          >
            {[0, max / 2, max].map((v) => (
              <g key={v}>
                <path
                  d={`M70 ${y(v)}H630`}
                  stroke="var(--sage-deep)"
                  strokeDasharray="2 6"
                  strokeLinecap="round"
                />
                <text
                  x="58"
                  y={y(v) + 5}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize="13"
                >
                  {num(v, 0)}
                </text>
              </g>
            ))}
            <polyline
              fill="none"
              stroke="var(--forest)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={facts.map((f, i) => `${x(i)},${y(f[metric])}`).join(" ")}
            />
            {facts.map((f, i) => (
              <g key={f.year}>
                <circle
                  cx={x(i)}
                  cy={y(f[metric])}
                  r="5"
                  fill="var(--forest)"
                />
                <text
                  x={x(i)}
                  y="260"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontSize="13"
                >
                  FY{f.year}
                </text>
              </g>
            ))}
          </svg>
          <figcaption>
            Reported {metric === "revenue" ? "revenue" : "profit after tax"},
            INR crore. This is a historical series, not a forecast.
          </figcaption>
        </figure>
        <p className="section-explainer">
          Select a number for the original units, document fingerprint and
          source page. All fiscal years end 31 March. Figures retain the
          precision of their source.
        </p>
        <div
          className="table-scroll"
          role="region"
          aria-label="Pilot reported financial history"
          tabIndex={0}
        >
          <table className="workflow-table">
            <caption className="sr-only">
              {company.name}, standalone revenue and profit after tax in INR
              crore
            </caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Revenue (₹ Cr)</th>
                <th scope="col">Profit after tax (₹ Cr)</th>
                <th scope="col">Official source</th>
              </tr>
            </thead>
            <tbody>
              {facts.map((f) => (
                <tr key={f.year}>
                  <th scope="row">FY{f.year}</th>
                  <td>
                    <button
                      className="fact-button"
                      onClick={() =>
                        setSelection({ year: f.year, field: "revenue" })
                      }
                      aria-label={`Inspect FY${f.year} revenue`}
                    >
                      {num(f.revenue, f.source.units === "INR lakh" ? 4 : 2)}
                    </button>
                  </td>
                  <td>
                    <button
                      className="fact-button"
                      onClick={() =>
                        setSelection({ year: f.year, field: "pat" })
                      }
                      aria-label={`Inspect FY${f.year} profit after tax`}
                    >
                      {num(f.pat, f.source.units === "INR lakh" ? 4 : 2)}
                    </button>
                  </td>
                  <td>
                    <a
                      className="source-link"
                      href={`${f.source.url}#page=${f.source.pdfPage}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      FY{f.source.id.slice(-4)} report · PDF p.{" "}
                      {f.source.pdfPage}
                      <Glyph name="arrow" size={14} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-hint">Scroll sideways for every column.</p>
      </section>
      <section className="work-section" id="pilot-review">
        <h2>What still needs to be true.</h2>
        <p className="section-explainer">
          Source checking establishes the reported fact. It does not establish
          recurring earnings, debt capacity or an executable acquisition.
        </p>
        <ul className="pilot-observations">
          {company.observations.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <h3>Before publishing transaction returns</h3>
        <ol className="pilot-gates">
          {PILOT_REVIEW_GATES.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ol>
        <p className="fine-print">
          Completing a personal diligence task does not change the publication
          review status. No model or financial adviser has independently signed
          off this pilot.
        </p>
      </section>
      <div id="pilot-diligence">
        <CompanyWorkflow companyId={company.id} />
      </div>
      <div id="pilot-notes">
        <ResearchNoteEditor
          company={company}
          draft={pilotDraft(company)}
          draftLabel="Start from reported facts"
        />
      </div>
      <PanelDialog
        title="Filing evidence"
        description="Inspect the reported fact and its original official source."
        open={selection !== null}
        onOpenChange={(open) => {
          if (!open) setSelection(null);
        }}
      >
        {selected && selection && (
          <div className="source-details">
            <div>
              <span>
                {selection.field === "revenue" ? "Revenue" : "Profit after tax"}{" "}
                · FY{selected.year}
              </span>
              <strong>{crore(selected[selection.field])}</strong>
            </div>
            <dl>
              <div>
                <dt>Reporting basis</dt>
                <dd>Standalone</dd>
              </div>
              <div>
                <dt>Original reported amount</dt>
                <dd>
                  {num(
                    selection.field === "revenue"
                      ? selected.rawRevenue
                      : selected.rawPat,
                    2,
                  )}{" "}
                  {selected.source.units}
                </dd>
              </div>
              <div>
                <dt>Unit conversion</dt>
                <dd>
                  {selected.source.units === "INR lakh"
                    ? "Divide by 100 to convert lakh to crore"
                    : "Already in INR crore"}
                </dd>
              </div>
              <div>
                <dt>Document</dt>
                <dd>{selected.source.title}</dd>
              </div>
              <div>
                <dt>PDF / printed page</dt>
                <dd>
                  {selected.source.pdfPage} / {selected.source.printedPage}
                </dd>
              </div>
              <div>
                <dt>Checked</dt>
                <dd>
                  {selected.source.checkedAt} · Source facts checked;
                  independent review pending
                </dd>
              </div>
              <div>
                <dt>SHA-256</dt>
                <dd className="source-hash">{selected.source.sha256}</dd>
              </div>
            </dl>
            <a
              className="button tonal"
              href={`${selected.source.url}#page=${selected.source.pdfPage}`}
              target="_blank"
              rel="noreferrer"
            >
              Open original filing <Glyph name="arrow" size={16} />
            </a>
          </div>
        )}
      </PanelDialog>
      {memo &&
        createPortal(
          <div className="memo-print">{memoContent}</div>,
          document.body,
        )}
    </div>
  );
}
