"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Company } from "@buyout/engine";
import {
  analyze,
  DEFAULT_BUY_BOX,
  inBuyBox,
  screen,
  type BuyBox,
} from "../lib/research";
import { isStringArray, useStored } from "../lib/storage";
import { pct } from "../lib/format";
import { Glyph } from "./icons";
import { BuyBoxEditor } from "./buy-box";
import { OpportunityMap } from "./opportunity-map";
import { CompanyTable } from "./company-table";
import {
  KEYS,
  isBuyBox,
  isWorkflows,
  emptyWorkflow,
  actionMatches,
  type Workflow,
  STAGES,
} from "../lib/workflow";
import { SavedScreens } from "./saved-screens";
import { ResearchBackupTools } from "./research-backup";
import { downloadText, researchCsv } from "../lib/research-export";
import { researchWorkload, screenPilotResearch } from "../lib/analyst";
import { PILOT_COMPANIES } from "../lib/pilot";
import { PilotShortlist } from "./pilot-shortlist";
export function Radar({
  companies,
  savedOnly = false,
}: {
  companies: Company[];
  savedOnly?: boolean;
}) {
  const box = useStored("buyout:buybox:v1", DEFAULT_BUY_BOX, isBuyBox),
    saved = useStored<string[]>("buyout:saved:v1", [], isStringArray);
  const workflows = useStored<Workflow[]>(KEYS.workflows, [], isWorkflows);
  const [stage, setStage] = useState("All stages"),
    [dueFilter, setDueFilter] = useState("all"),
    [selected, setSelected] = useState<string[]>([]),
    [feedback, setFeedback] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const research = useMemo(() => companies.map(analyze), [companies]);
  const rows = screen(
    research,
    box.value,
    savedOnly ? saved.value : undefined,
  ).filter((r) => {
    if (!savedOnly) return true;
    const w =
      workflows.value.find((w) => w.companyId === r.company.id) ??
      emptyWorkflow(r.company.id);
    return (
      (stage === "All stages" || w.stage === stage) &&
      actionMatches(w, dueFilter)
    );
  });
  const pilotRows = savedOnly
    ? screenPilotResearch(
        PILOT_COMPANIES,
        saved.value,
        box.value,
        workflows.value,
        stage,
        dueFilter,
      )
    : [];
  const knownIds = new Set([
    ...companies.map((c) => c.id),
    ...PILOT_COMPANIES.map((c) => c.id),
  ]);
  const workload = researchWorkload(
    saved.value.filter((id) => knownIds.has(id)),
    workflows.value,
  );
  const qualified = research.filter((r) => inBuyBox(r, box.value));
  const valid = research.filter((r) => r.valid),
    sorted = valid
      .flatMap((r) => (r.irr === null ? [] : [r.irr]))
      .sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  const demo = companies.some((c) => c.dataKind === "demo");
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const set = (next: Partial<BuyBox>) =>
    box.setValue({ ...box.value, ...next });
  return (
    <div className="page radar-page">
      <header className="page-heading">
        <div>
          <div className="breadcrumb">
            {savedOnly ? "Your research" : "The research desk"}
            <span>India / FY2022-2026</span>
          </div>
          <h1>{savedOnly ? "The second look." : "The buyout lens."}</h1>
          <p>
            {savedOnly
              ? "A working shortlist. Keep the companies that deserve another question."
              : "What if you bought the whole business? Start with the cash."}
          </p>
        </div>
        <BuyBoxEditor value={box.value} onChange={box.setValue} />
      </header>
      <div className="data-notice">
        <span className="notice-mark">
          {savedOnly
            ? "Private research"
            : demo
              ? "Sample universe"
              : "Published filings"}
        </span>
        <p>
          {savedOnly
            ? "Your saved workspace can include fictional models and official filing profiles. Each record retains its evidence and review status."
            : demo
              ? `${companies.filter((c) => c.dataKind === "demo").length} fictional companies. Real calculations. Explore the workflow with illustrative financials.`
              : `${companies.length} published companies. Open any financial figure to inspect its source.`}
        </p>
        <a href="/methodology">
          How to read this <Glyph name="arrow" size={13} />
        </a>
      </div>
      {(box.error || saved.error) && (
        <p role="status" className="error-text">
          {box.error || saved.error}
        </p>
      )}
      {!savedOnly && (
        <div className="pilot-entry">
          <div>
            <strong>Research real businesses.</strong>
            <p>
              Three official filing profiles, with five-year histories and an
              explicit review queue.
            </p>
          </div>
          <Link className="button tonal" href="/pilot">
            Open the filing pilot <Glyph name="arrow" size={16} />
          </Link>
        </div>
      )}
      {savedOnly ? (
        <section className="summary-grid" aria-label="Research workload">
          <div>
            <span>Saved research</span>
            <strong>
              {workload.saved}
              <small>companies</small>
            </strong>
            <p>
              {workload.stages.Inbox} Inbox · {workload.stages.Passed} Passed ·{" "}
              {workload.stages.Archived} Archived
            </p>
          </div>
          <div>
            <span>Active review</span>
            <strong>
              {workload.reviewing}
              <small>companies</small>
            </strong>
            <p>
              {workload.stages.Reviewing} Reviewing ·{" "}
              {workload.stages.Diligence} Diligence
            </p>
          </div>
          <div>
            <span>Overdue next actions</span>
            <strong>
              {workload.overdue}
              <small>actions</small>
            </strong>
            <p>Due before today in your local calendar</p>
          </div>
          <div>
            <span>Today & upcoming</span>
            <strong>
              {workload.upcoming}
              <small>actions</small>
            </strong>
            <p>Dated next actions for saved companies</p>
          </div>
        </section>
      ) : (
        <section className="summary-grid" aria-label="Universe summary">
          <div>
            <span>Research universe</span>
            <strong>
              {companies.length}
              <small>companies</small>
            </strong>
            <p>2 sectors · 5 financial years</p>
          </div>
          <div>
            <span>In your Buy Box</span>
            <strong>
              {qualified.length}
              <small>opportunities</small>
            </strong>
            <p>
              {pct(box.value.minIrr, 0)} IRR hurdle · ≤{box.value.maxPledge}%
              pledge
            </p>
          </div>
          <div>
            <span>Median model IRR</span>
            <strong>
              {pct(median)}
              <small>at base case</small>
            </strong>
            <p>No multiple expansion assumed</p>
          </div>
          <div>
            <span>Funded base cases</span>
            <strong>
              {valid.length}
              <small>complete models</small>
            </strong>
            <p>
              {research.filter((r) => r.status === "incomplete").length} data
              issues · {research.filter((r) => r.status === "unfunded").length}{" "}
              funding gaps
            </p>
          </div>
        </section>
      )}
      {!savedOnly && <OpportunityMap rows={rows} hurdle={box.value.minIrr} />}
      <section className="screen-section" aria-labelledby="screen-title">
        <div className="section-toolbar">
          <div>
            <h2 id="screen-title">
              {savedOnly ? "Saved companies" : "Find the next question."}
            </h2>
            <p>
              {savedOnly
                ? `${workload.saved} saved in this browser`
                : `${rows.length} companies in this view`}
            </p>
          </div>
          <label className="qualified-toggle">
            <input
              type="checkbox"
              checked={box.value.onlyQualified}
              onChange={(e) => set({ onlyQualified: e.target.checked })}
            />
            In my Buy Box only
          </label>
        </div>
        <div className="filters">
          <label className="search-field">
            <Glyph name="search" size={18} />
            <input
              ref={searchRef}
              aria-label="Search companies"
              placeholder="Search a company or ticker"
              value={box.value.search}
              onChange={(e) => set({ search: e.target.value })}
            />
            <kbd>⌘ K</kbd>
          </label>
          <label>
            <span className="sr-only">Sector</span>
            <select
              aria-label="Sector"
              value={box.value.sector}
              onChange={(e) => set({ sector: e.target.value })}
            >
              <option>All sectors</option>
              {[
                ...new Set([
                  ...companies.map((c) => c.sector),
                  ...(savedOnly ? PILOT_COMPANIES.map((c) => c.sector) : []),
                  ...(box.value.sector !== "All sectors"
                    ? [box.value.sector]
                    : []),
                ]),
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort companies</span>
            <select
              aria-label="Sort companies"
              value={box.value.sort}
              onChange={(e) => set({ sort: e.target.value as BuyBox["sort"] })}
            >
              <option value="irr">Sort: model IRR</option>
              <option value="conversion">Sort: cash conversion</option>
              <option value="marketCap">Sort: market cap</option>
            </select>
          </label>
          {(box.value.search ||
            box.value.sector !== "All sectors" ||
            box.value.onlyQualified) && (
            <button
              className="text-button"
              onClick={() =>
                set({ search: "", sector: "All sectors", onlyQualified: false })
              }
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="research-tools" aria-label="Research tools">
          <SavedScreens box={box.value} onLoad={box.setValue} />
          <button
            className="button tonal"
            disabled={!rows.length && !pilotRows.length}
            onClick={() => {
              downloadText(
                "buyout-radar-screen.csv",
                researchCsv(rows, pilotRows),
                "text/csv;charset=utf-8",
              );
              setFeedback(
                `${rows.length + pilotRows.length} companies exported, including rows beyond pagination.`,
              );
            }}
          >
            <Glyph name="download" size={15} /> Export CSV
          </button>
          {savedOnly && <ResearchBackupTools />}
          <div className="comparison-selection">
            <span>{selected.length} / 4 selected</span>
            {selected.length >= 2 ? (
              <Link
                className="button primary"
                href={`/compare?ids=${selected.map(encodeURIComponent).join(",")}`}
              >
                Compare companies
              </Link>
            ) : (
              <span className="fine-print">
                Select 2–4 companies to compare
              </span>
            )}
            {selected.length > 0 && (
              <button className="text-button" onClick={() => setSelected([])}>
                Clear selection
              </button>
            )}
          </div>
        </div>
        {savedOnly && (
          <div className="workflow-filters">
            <label>
              Research stage
              <select
                aria-label="Filter research stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option>All stages</option>
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Next actions
              <select
                aria-label="Filter next actions"
                value={dueFilter}
                onChange={(e) => setDueFilter(e.target.value)}
              >
                <option value="all">All next actions</option>
                <option value="upcoming">Due today or upcoming</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
            <p className="fine-print">
              Dates use your local calendar. No background reminders.
            </p>
          </div>
        )}
        <p className="action-feedback" role="status">
          {feedback || workflows.error}
        </p>
        {(rows.length > 0 || pilotRows.length === 0) && (
          <CompanyTable
            rows={rows}
            selected={selected}
            onCompare={(id) =>
              setSelected((p) =>
                p.includes(id)
                  ? p.filter((x) => x !== id)
                  : p.length < 4
                    ? [...p, id]
                    : p,
              )
            }
            showWorkflow={savedOnly}
            buyBox={box.value}
            saved={saved.value}
            onSave={(id) =>
              saved.setValue((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              )
            }
          />
        )}
        {savedOnly && <PilotShortlist rows={pilotRows} />}
      </section>
      <div className="research-footnote">
        <strong>A screen is a starting point.</strong>
        <p>
          Control, liquidity, delisting feasibility and financing terms require
          separate diligence. The model makes the assumptions visible; you make
          the investment judgment.
        </p>
        <a href="/methodology">
          Read the methodology <Glyph name="arrow" size={15} />
        </a>
      </div>
    </div>
  );
}
