"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  cashMetrics,
  companyAssumptions,
  debtCapacity,
  normalizedEbitda,
  runLbo,
  solveHurdle,
  stressTest,
  type Company,
  type Assumptions,
} from "@buyout/engine";
import { analyze } from "../lib/research";
import { pct, crore, multiple, num } from "../lib/format";
import { scenarioQuery } from "../lib/scenario";
import { useStored, isStringArray } from "../lib/storage";
import { Glyph } from "./icons";
import { AssumptionDials } from "./assumption-dials";
import {
  SourceInspector,
  EvidenceRegister,
  type SourceSelection,
} from "./source-inspector";
import { FinancialHistory } from "./financial-history";
import { DebtChart, ValueBridge } from "./model-charts";
import { SensitivityGrid } from "./sensitivity-grid";
import { ResearchNotes } from "./research-notes";
import { ScenarioLibrary } from "./scenario-library";
import { CompanyWorkflow } from "./company-workflow";
import { PrintableMemo } from "./printable-memo";
import { DecisionSummary } from "./decision-summary";
export function CompanyWorkbench({
  company,
  initial,
  linkError,
  initialTab = "Underwriting",
}: {
  company: Company;
  initial: Assumptions;
  linkError: string | null;
  initialTab?: string;
}) {
  const [a, setA] = useState(initial),
    [tab, setTab] = useState(initialTab),
    [source, setSource] = useState<SourceSelection | null>(null),
    [exporting, setExporting] = useState(false),
    [message, setMessage] = useState("");
  const saved = useStored<string[]>("buyout:saved:v1", [], isStringArray);
  const baseline = useMemo(() => analyze(company), [company]);
  const base = company.financials.at(-1)!;
  const computation = useMemo(() => {
    try {
      return { model: runLbo(base, company.adjustments, a), error: null };
    } catch (e) {
      return { model: null, error: (e as Error).message };
    }
  }, [a, company, base]);
  const model = computation.model,
    complete = baseline.issues.length === 0,
    valid = complete && model?.investable;
  const capacity = model
    ? debtCapacity(
        model.entryEbitda,
        a.leverage,
        a.interestRate,
        a.coverageFloor,
      )
    : null;
  const stress = model ? stressTest(base, company.adjustments, a) : null;
  const neededGrowth = valid
    ? solveHurdle(base, company.adjustments, a, "growthRate")
    : null;
  const neededExit = valid
    ? solveHurdle(base, company.adjustments, a, "exitMultiple")
    : null;
  const cash = cashMetrics(company.financials),
    isSaved = saved.value.includes(company.id);
  const exportModel = async () => {
    setExporting(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/companies/${company.id}/export?${scenarioQuery(a)}`,
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Export failed");
      }
      const blob = await response.blob(),
        url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${company.ticker}-buyout.xlsx`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "Excel downloaded with your current assumptions and live formulas.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setExporting(false);
    }
  };
  const share = async () => {
    const url = `${location.origin}/company/${company.id}?${scenarioQuery(a)}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(
        "Scenario link copied. It includes assumptions, never your private notes.",
      );
    } catch {
      setMessage(`Copy this scenario link: ${url}`);
    }
  };
  return (
    <div className="page company-page">
      <div className="company-breadcrumb">
        <Link href="/">Radar</Link>
        <span>/</span>
        <span>{company.sector}</span>
        <span>/</span>
        <span>{company.ticker}</span>
      </div>
      <header className="company-header">
        <div>
          <h1>{company.name}</h1>
          <p>{company.description}</p>
        </div>
        <button
          className={`button tonal ${isSaved ? "is-saved" : ""}`}
          onClick={() =>
            saved.setValue((prev) =>
              isSaved
                ? prev.filter((x) => x !== company.id)
                : [...prev, company.id],
            )
          }
          aria-pressed={isSaved}
        >
          <Glyph name="save" size={16} />
          {isSaved ? "Saved" : "Save research"}
        </button>
      </header>
      <div className="company-meta">
        <span>
          {company.dataKind === "demo"
            ? "Fictional company / sample data"
            : "Published financials"}
        </span>
        <span>Market cap {crore(company.marketCap)}</span>
        <span>FY{base.year} latest annual</span>
      </div>
      {linkError && (
        <p className="error-text" role="status">
          {linkError}
        </p>
      )}
      {!complete && (
        <p className="error-text" role="alert">
          Data incomplete: {baseline.issues.join("; ")}. Returns and exports are
          withheld.
        </p>
      )}
      {computation.error && (
        <p role="alert" className="error-text">
          Model unavailable: {computation.error}. Reset the assumptions or
          correct the input.
        </p>
      )}
      {model && !model.investable && (
        <p className="error-text" role="alert">
          This scenario needs {crore(model.fundingGap)} of additional funding.
          Sponsor returns are withheld because that funding is not modeled.
        </p>
      )}
      <div className="workbench-tabs" aria-label="Company research view">
        {["Underwriting", "Financial history", "Sources & notes"].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
        <div className="workbench-actions">
          <ScenarioLibrary company={company} value={a} onLoad={setA} />
          <PrintableMemo company={company} assumptions={a} />
          <button className="text-button" onClick={share}>
            Copy scenario link <Glyph name="arrow" size={14} />
          </button>
          <button
            className="button primary"
            onClick={exportModel}
            disabled={!complete || !model || exporting}
          >
            <Glyph name="download" size={15} />
            {exporting ? "Building Excel…" : "Export Excel"}
          </button>
        </div>
      </div>
      <p className="action-feedback" role="status">
        {message || saved.error}
      </p>
      <div className="workbench-grid">
        <div className="workbench-main">
          {tab === "Underwriting" && model && (
            <>
              <DecisionSummary
                company={company}
                assumptions={a}
                model={model}
                complete={complete}
                onEvidence={() => setTab("Sources & notes")}
              />
              <section
                className="returns-surface"
                aria-label="Live scenario returns"
              >
                <div>
                  <span>
                    {valid && model.irr !== null && model.irr >= a.hurdleRate
                      ? "A case worth investigating"
                      : valid
                        ? "The price needs a closer look"
                        : "Resolve the funding or evidence gap"}
                  </span>
                  <h2>
                    {valid ? pct(model.irr) : "Unavailable"}
                    <small>model IRR</small>
                  </h2>
                  <p>
                    {multiple(a.entryMultiple)} entry.{" "}
                    {multiple(a.exitMultiple)} exit. {a.holdYears} years to earn
                    the return.
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>Sponsor MOIC</dt>
                    <dd>{valid ? multiple(model.moic) : "Unavailable"}</dd>
                  </div>
                  <div>
                    <dt>Entry equity</dt>
                    <dd>{crore(model.sponsorEquity)}</dd>
                  </div>
                  <div>
                    <dt>Exit net debt</dt>
                    <dd>
                      {crore(
                        model.projections.at(-1)!.closingDebt -
                          model.projections.at(-1)!.cash,
                      )}
                    </dd>
                  </div>
                </dl>
              </section>
              <DebtChart model={model} />
              <div className="quality-cash">
                <section className="work-section">
                  <h2>Earnings, with the noise removed.</h2>
                  <p className="section-explainer">
                    Only accepted adjustments change the model.
                  </p>
                  <dl className="earnings-list">
                    <div>
                      <dt>Reported EBITDA</dt>
                      <dd>
                        <button
                          className="financial-source"
                          onClick={() =>
                            setSource({ year: base.year, field: "ebitda" })
                          }
                        >
                          {crore(base.ebitda)}
                        </button>
                      </dd>
                    </div>
                    {company.adjustments
                      .filter((x) => x.year === base.year)
                      .map((x) => (
                        <div key={x.id}>
                          <dt>
                            {x.label}
                            <small>
                              {x.status} · p. {x.page}
                            </small>
                          </dt>
                          <dd>
                            {x.status === "accepted"
                              ? (x.amount >= 0 ? "+" : "") + num(x.amount)
                              : "Excluded"}
                          </dd>
                        </div>
                      ))}
                    <div className="total-row">
                      <dt>Normalized EBITDA</dt>
                      <dd>{crore(model.entryEbitda)}</dd>
                    </div>
                  </dl>
                  <div className="truth-summary">
                    <Glyph name="check" size={17} />
                    <p>
                      {company.dataKind === "demo"
                        ? "Sample evidence, not an extraction accuracy claim."
                        : `${company.adjustments.filter((x) => x.status === "accepted").length} adjustments accepted with evidence.`}
                    </p>
                  </div>
                </section>
                <section className="work-section">
                  <h2>Follow the cash.</h2>
                  <div className="cash-number">
                    {pct(cash.averageConversion, 0)}
                    <span>average cash conversion</span>
                  </div>
                  <p className="section-explainer">
                    {cash.years.filter((y) => y.conversion !== null).length}{" "}
                    year-on-year periods from five annual statements.
                  </p>
                  <dl className="earnings-list">
                    <div>
                      <dt>Latest pre-interest FCF</dt>
                      <dd>{crore(cash.years.at(-1)!.freeCashFlow ?? 0)}</dd>
                    </div>
                    <div>
                      <dt>Working capital days</dt>
                      <dd>{num(cash.years.at(-1)!.workingCapitalDays ?? 0)}</dd>
                    </div>
                    <div>
                      <dt>Capex / revenue</dt>
                      <dd>{pct(base.capex / base.revenue)}</dd>
                    </div>
                  </dl>
                  <button
                    className="text-button"
                    onClick={() => setTab("Financial history")}
                  >
                    Open the full cash history <Glyph name="arrow" size={14} />
                  </button>
                </section>
              </div>
              <section className="work-section debt-capacity">
                <div className="work-section-heading">
                  <h2>How much debt can it carry?</h2>
                  <span>{capacity?.binding} binds</span>
                </div>
                <div className="capacity-number">
                  <strong>{crore(capacity!.maxDebt)}</strong>
                  <span>maximum debt at your assumptions</span>
                </div>
                <div className="capacity-track">
                  <div
                    style={{
                      width: `${Math.min(100, (capacity!.maxDebt / Math.max(capacity!.leverageLimit, capacity!.coverageLimit, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="capacity-limits">
                  <span>Leverage limit {crore(capacity!.leverageLimit)}</span>
                  <span>Coverage limit {crore(capacity!.coverageLimit)}</span>
                </div>
                <p
                  className={
                    stress?.firstBreach
                      ? "stress-result caution"
                      : "stress-result"
                  }
                >
                  <strong>20% EBITDA stress</strong>
                  {stress?.firstBreach
                    ? `Coverage first breaches ${multiple(a.coverageFloor)} in FY${stress.firstBreach}.`
                    : `No coverage breach in the ${a.holdYears}-year modeled hold.`}
                  {stress && stress.fundingGap > 0
                    ? ` Additional funding needed: ${crore(stress.fundingGap)}.`
                    : ""}
                </p>
              </section>
              <ValueBridge model={model} />
              <section className="work-section hurdle-section">
                <h2>What has to be true?</h2>
                <p className="section-explainer">
                  Holding everything else constant, to reach your{" "}
                  {pct(a.hurdleRate, 0)} IRR hurdle:
                </p>
                <div className="hurdle-answers">
                  <div>
                    <strong>{valid ? pct(neededGrowth) : "Unavailable"}</strong>
                    <span>annual revenue growth</span>
                    {neededGrowth !== null && (
                      <button
                        className="text-button"
                        onClick={() => setA({ ...a, growthRate: neededGrowth })}
                      >
                        Use this growth
                      </button>
                    )}
                  </div>
                  <span className="hurdle-or">or</span>
                  <div>
                    <strong>
                      {valid && neededExit !== null
                        ? multiple(neededExit)
                        : "Unavailable"}
                    </strong>
                    <span>exit EV / EBITDA</span>
                    {neededExit !== null && (
                      <button
                        className="text-button"
                        onClick={() => setA({ ...a, exitMultiple: neededExit })}
                      >
                        Use this multiple
                      </button>
                    )}
                  </div>
                </div>
                <p className="fine-print">
                  Solutions are bounded to -50% to +50% growth and 0× to 30×
                  exit. A solution is a mathematical requirement, not a
                  forecast.
                </p>
              </section>
              {complete && (
                <SensitivityGrid
                  company={company}
                  assumptions={a}
                  onChange={setA}
                />
              )}
              <section className="work-section promoter-section">
                <h2>The promoter lens.</h2>
                <div className="promoter-data">
                  <div>
                    <strong>{company.promoterPct.toFixed(1)}%</strong>
                    <span>promoter ownership</span>
                  </div>
                  <div>
                    <strong>{company.pledgedPct.toFixed(1)}%</strong>
                    <span>promoter shares pledged</span>
                  </div>
                </div>
                <p className="section-explainer">
                  {company.pledgedPct > 5
                    ? "Pledged holdings deserve a separate liquidity and enforcement review."
                    : "Low modeled pledging removes one risk flag; it does not establish control feasibility."}{" "}
                  Delisting, control and acquisition finance require separate
                  legal and financing diligence.
                </p>
              </section>
              <section className="work-section bear-case">
                <h2>Argue against the deal.</h2>
                <p className="section-explainer">
                  Rule-based challenges drawn from this scenario, with no
                  AI-generated claims.
                </p>
                <ul>
                  <li>
                    {stress?.firstBreach
                      ? `A 20% EBITDA decline breaks coverage in FY${stress.firstBreach}.`
                      : "A 20% EBITDA decline passes modeled coverage. Test a deeper recession and customer losses."}
                  </li>
                  <li>
                    {a.exitMultiple > a.entryMultiple
                      ? `The case assumes ${multiple(a.exitMultiple - a.entryMultiple)} of multiple expansion. Re-run it at a flat exit.`
                      : "The base case assumes no help from multiple expansion. Check whether the entry price still compensates for cyclicality."}
                  </li>
                  <li>
                    Capex is {pct(a.capexRate)} of sales. Verify maintenance
                    needs before treating the remaining cash as debt repayment.
                  </li>
                  <li>
                    {company.dataKind === "demo"
                      ? "All figures are fictional. Replace the sample ledger with verified filings before using this thesis."
                      : "Source-linked facts still require human review of accounting policies and recurring adjustments."}
                  </li>
                </ul>
              </section>
            </>
          )}
          {tab === "Financial history" && (
            <FinancialHistory company={company} onSelect={setSource} />
          )}{" "}
          {tab === "Sources & notes" && (
            <>
              <nav className="research-jumps" aria-label="Research sections">
                <a href="#company-diligence">Diligence & next action</a>
                <a href="#company-notes">Private notes</a>
                <a href="#company-evidence">Filing evidence</a>
              </nav>
              <div id="company-diligence">
                <CompanyWorkflow companyId={company.id} />
              </div>
              <div id="company-notes">
                <ResearchNotes company={company} assumptions={a} />
              </div>
              <div id="company-evidence">
                <EvidenceRegister company={company} onSelect={setSource} />
              </div>
            </>
          )}
        </div>
        <AssumptionDials
          value={a}
          onChange={setA}
          onReset={() => setA(companyAssumptions(company))}
        />
      </div>
      <SourceInspector
        company={company}
        selection={source}
        onClose={() => setSource(null)}
      />
    </div>
  );
}
