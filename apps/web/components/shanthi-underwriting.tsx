"use client";

import Link from "next/link";
import { useState } from "react";
import { num, pct, multiple } from "../lib/format";
import {
  DEFAULT_PREMIUM,
  MAX_PREMIUM,
  SHANTHI,
  SHANTHI_ID,
  SHANTHI_MODEL_PATH,
  filing,
  historicalCapexRate,
  isShanthiCase,
  marketEquity,
  promoterOwnership,
  shanthiBase,
  shanthiCases,
  shanthiHistory,
  shanthiScenario,
  type ShanthiCase,
} from "../lib/shanthi-underwriting";

const rupees = (value: number) => `₹${num(value, 2)}`;
const money = (value: number) => `${rupees(value)} Cr`;
const latest = SHANTHI.documents.fy26;
const noteLink = (note: keyof typeof latest.pages) =>
  `${latest.url}#page=${latest.pages[note].pdf}`;
const headroomLabel = (value: number | null) =>
  value === null
    ? "Already fails"
    : value === 0.99
      ? "At least 99%"
      : value > 0 && value < 0.001
        ? "Below 0.1%"
        : pct(value);

export function ShanthiUnderwriting() {
  const [scenario, setScenario] = useState<ShanthiCase>("base");
  const [premium, setPremium] = useState(DEFAULT_PREMIUM);
  const {
    assumptions: a,
    model: m,
    stress,
    exits,
    headroom,
    entrySharePrice,
    hurdleSharePrice,
  } = shanthiScenario(scenario, premium);
  const summary = [
    [
      "Five-year sponsor IRR",
      pct(m.irr),
      m.investable
        ? `${pct(a.hurdleRate)} scenario hurdle`
        : "Funding shortfall",
    ],
    ["Sponsor MOIC", multiple(m.moic, 2), "Exit equity / sponsor equity"],
    [
      "Entry EV / operating EBITDA",
      multiple(a.entryMultiple, 2),
      money(m.entryEV),
    ],
    [
      "Funding shortfall",
      money(m.fundingGap),
      `${money(stress.fundingGap)} under a 20% EBITDA shock`,
    ],
  ];
  const uses = [
    ["Equity consideration", m.purchaseEquity],
    ["Supplier finance refinance", m.refinancedDebt],
    ["Transaction fees", m.fees],
    ["Total uses", m.totalUses],
  ] as const;
  const sources = [
    ["Sponsor equity", m.sponsorEquity],
    ["New acquisition debt", m.initialDebt],
    ["Target cash used at close", m.existingCash],
    ["Total sources", m.sponsorEquity + m.initialDebt + m.existingCash],
  ] as const;

  return (
    <div className="page pilot-profile shanthi-underwriting">
      <div className="breadcrumb">
        <Link href="/pilot">Filing pilot</Link>
        <span>/</span>
        <Link href={`/pilot/${SHANTHI_ID}`}>Shanthi Gears</Link>
      </div>
      <header className="page-heading">
        <div>
          <h1>Shanthi Gears underwriting</h1>
          <p>NSE SHANTIGEAR · FY2026 retrospective snapshot · INR crore</p>
        </div>
        <a
          className="button tonal"
          href={`${SHANTHI_MODEL_PATH}/export?case=${scenario}&premium=${premium}`}
        >
          Export Excel
        </a>
      </header>
      <div className="pilot-status">
        <strong>Filing-backed scenario · Independent review pending</strong>
        <p>
          The model pairs the 30 March 2026 NSE close with standalone accounts
          authorized on 5 May 2026. It assumes a hypothetical acquisition of
          100% of the equity. Seller willingness, financing terms and
          transaction approvals remain open.
        </p>
      </div>
      <section className="work-section" aria-labelledby="shanthi-transaction">
        <div className="work-section-heading">
          <h2 id="shanthi-transaction">Transaction scenario</h2>
        </div>
        <div className="shanthi-controls">
          <label>
            <span>Operating case</span>
            <select
              value={scenario}
              onChange={(event) => {
                if (isShanthiCase(event.target.value))
                  setScenario(event.target.value);
              }}
            >
              {Object.entries(shanthiCases).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
          <label className="dial">
            <span>
              Offer premium <strong>{premium}%</strong>
            </span>
            <input
              aria-label="Offer premium"
              type="range"
              min="0"
              max={MAX_PREMIUM}
              step="1"
              value={premium}
              onChange={(event) => setPremium(Number(event.target.value))}
            />
          </label>
          <div className="shanthi-offer">
            <span>Modeled offer</span>
            <strong>{rupees(entrySharePrice)} / share</strong>
          </div>
        </div>
        <dl className="decision-facts shanthi-results" aria-live="polite">
          {summary.map(([label, value, detail]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
              <dd className="shanthi-detail">{detail}</dd>
            </div>
          ))}
        </dl>
        <p className="section-explainer">
          {hurdleSharePrice === null
            ? "The current funding gap prevents a hurdle-price calculation."
            : `With the selected operating case and debt, a ${pct(a.hurdleRate)} IRR implies at most ${rupees(hurdleSharePrice)} per share.`}
        </p>
      </section>

      <section className="work-section">
        <div className="work-section-heading">
          <h2>Sources and uses</h2>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Transaction sources and uses"
          tabIndex={0}
        >
          <table className="workflow-table shanthi-funding">
            <thead>
              <tr>
                <th scope="col">Uses</th>
                <th scope="col">₹ Cr</th>
                <th scope="col">Sources</th>
                <th scope="col">₹ Cr</th>
              </tr>
            </thead>
            <tbody>
              {uses.map(([use, amount], index) => (
                <tr key={use}>
                  <th scope="row">{use}</th>
                  <td>{num(amount, 2)}</td>
                  <td>{sources[index][0]}</td>
                  <td>{num(sources[index][1], 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="section-explainer">
          <a href={SHANTHI.market.url}>NSE archive · 30 March 2026</a> records a{" "}
          {rupees(SHANTHI.market.close)} close. The filed share count of{" "}
          {num(shanthiBase.financial.shares)} implies {money(marketEquity)} of
          historical market equity.
          <span> </span>
          <a href={`${SHANTHI.ownership.url}#page=2`}>
            31 March shareholding
          </a>{" "}
          records {pct(promoterOwnership, 4)} promoter ownership and zero
          pledged shares.
        </p>
      </section>

      <section className="work-section">
        <div className="work-section-heading">
          <h2>Five-year operating and debt schedule</h2>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Projected operating and debt schedule"
          tabIndex={0}
        >
          <table className="workflow-table company-comparison">
            <thead>
              <tr>
                <th scope="col">Projected ₹ Cr</th>
                {m.projections.map((p) => (
                  <th scope="col" key={p.year}>
                    FY{p.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Revenue", "revenue"],
                  ["Operating EBITDA", "ebitda"],
                  ["Cash interest", "interest"],
                  ["Cash tax", "tax"],
                  ["Capital expenditure", "capex"],
                  ["Change in working capital", "deltaWC"],
                  ["Free cash flow before debt repayment", "freeCashFlow"],
                  ["Mandatory principal repayment", "mandatory"],
                  ["Cash sweep", "sweep"],
                  ["Closing debt", "closingDebt"],
                  ["Closing cash", "cash"],
                  ["Funding gap", "fundingGap"],
                ] as const
              ).map(([label, key]) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  {m.projections.map((p) => (
                    <td key={p.year}>{num(p[key], 2)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Debt service coverage</th>
                {m.projections.map((p) => (
                  <td key={p.year}>
                    {p.dscr === null ? "No debt service" : multiple(p.dscr, 2)}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Net debt / EBITDA</th>
                {m.projections.map((p) => (
                  <td key={p.year}>{multiple(p.netLeverage, 2)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Sponsor IRR if sold</th>
                {exits.map((exit) => (
                  <td key={exit.year}>{pct(exit.irr)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Sponsor MOIC if sold</th>
                {exits.map((exit) => (
                  <td key={exit.year}>{multiple(exit.moic, 2)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="section-explainer">
          Exit EV {money(m.exitEV)} · Ending debt{" "}
          {money(m.projections.at(-1)!.closingDebt)} · Ending cash{" "}
          {money(m.projections.at(-1)!.cash)} · Exit equity{" "}
          {money(m.exitEquity)}.
        </p>
        <p className="section-explainer">
          Exit returns assume a sale at each year-end using the same operating
          plan and exit multiple. Returns are withheld from the first funding
          shortfall onward.
        </p>
        <h3 id="shanthi-headroom" className="shanthi-headroom-heading">
          EBITDA downside headroom
        </h3>
        <p className="section-explainer">
          How far EBITDA can fall across all forecast years before each test
          fails. Opening debt stays fixed.
        </p>
        <dl
          className="decision-facts shanthi-results shanthi-headroom"
          aria-labelledby="shanthi-headroom"
        >
          {(
            [
              [
                "Funding shortfall",
                headroom.funding,
                "Cash to cover scheduled payments",
              ],
              [
                "Interest coverage",
                headroom.coverage,
                `Minimum ${multiple(a.coverageFloor)} EBITDA / interest`,
              ],
              [
                "Sponsor capital",
                headroom.capital,
                "Exit equity equal to or above invested capital",
              ],
            ] as const
          ).map(([label, value, detail]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{headroomLabel(value)}</dd>
              <dd className="shanthi-detail">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="work-section">
        <div className="work-section-heading">
          <h2>Assumptions and evidence</h2>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Model assumptions and evidence"
          tabIndex={0}
        >
          <table className="workflow-table shanthi-assumptions">
            <thead>
              <tr>
                <th scope="col">Input</th>
                <th scope="col">Selected value</th>
                <th scope="col">Basis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Revenue growth / margin change</th>
                <td>
                  {pct(a.growthRate)} / {num(a.marginExpansion * 100, 1)} pp
                </td>
                <td>Analyst case. FY2026 revenue fell 14.2% from FY2025.</td>
              </tr>
              <tr>
                <th scope="row">Exit multiple / hold</th>
                <td>
                  {multiple(a.exitMultiple)} / {a.holdYears} years
                </td>
                <td>
                  Analyst assumptions. No exit multiple expansion from the
                  modeled entry.
                </td>
              </tr>
              <tr>
                <th scope="row">Capex / revenue</th>
                <td>{pct(a.capexRate, 2)}</td>
                <td>
                  {scenario === "downside"
                    ? "FY2026 cash capex / revenue."
                    : `Five-year aggregate cash capex / revenue (${pct(historicalCapexRate, 2)}).`}{" "}
                  Maintenance capex is unresolved.
                </td>
              </tr>
              <tr>
                <th scope="row">
                  D&amp;A / revenue and working capital / revenue
                </th>
                <td>
                  {pct(a.depreciationRate, 2)} / {pct(a.workingCapitalRate, 2)}
                </td>
                <td>
                  FY2026 actuals. Operating working capital is receivables plus
                  inventories less operating payables.
                </td>
              </tr>
              <tr>
                <th scope="row">Cash tax rate</th>
                <td>{pct(a.taxRate, 3)}</td>
                <td>
                  <a href={noteLink("tax")}>
                    FY2026 statutory tax reconciliation
                  </a>
                  . Cash tax is modeled on positive pre-tax profit.
                </td>
              </tr>
              <tr>
                <th scope="row">Debt cap / interest / coverage floor</th>
                <td>
                  {multiple(a.leverage)} / {pct(a.interestRate)} /{" "}
                  {multiple(a.coverageFloor)}
                </td>
                <td>
                  Illustrative underwriting terms. Lender pricing and
                  availability are open.
                </td>
              </tr>
              <tr>
                <th scope="row">Amortization / sweep / fees</th>
                <td>
                  {pct(a.amortizationRate)} / {pct(a.cashSweep)} /{" "}
                  {pct(a.feesRate)}
                </td>
                <td>
                  Annual original-principal amortization, then cash sweep. Fees
                  apply to entry EV.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="section-explainer">
          FY2026 operating EBITDA is {money(shanthiBase.financial.ebitda)}. The
          bridge starts with {money(SHANTHI.fy26.issuerEbitda)} of{" "}
          <a href={noteLink("highlights")}>issuer EBITDA</a>, removes{" "}
          {money(shanthiBase.reported.otherIncome)} of other income and retains
          the {money(SHANTHI.fy26.labourCharge)}{" "}
          <a href={noteLink("labourCharge")}>labour-code charge</a>.
        </p>
        <p className="section-explainer">
          <a href={noteLink("supplierFinance")}>Supplier finance</a> is treated
          as debt-like and removed from operating payables. The model uses
          reported cash equivalents at close. It excludes{" "}
          {money(SHANTHI.fy26.fixedDeposits)} of longer deposits,{" "}
          {money(SHANTHI.fy26.restrictedDividendCash)} of restricted dividend
          cash and {money(SHANTHI.fy26.currentInvestments)} of current
          investments from transaction funding and terminal equity.
        </p>
      </section>

      <section className="work-section">
        <div className="work-section-heading">
          <h2>Historical inputs</h2>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Shanthi Gears historical model inputs"
          tabIndex={0}
        >
          <table className="workflow-table company-comparison">
            <thead>
              <tr>
                <th scope="col">₹ Cr unless stated</th>
                {shanthiHistory.map(({ financial: f }) => (
                  <th scope="col" key={f.year}>
                    FY{f.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Revenue", "revenue"],
                  ["Operating EBITDA (derived)", "ebitda"],
                  ["D&A", "depreciation"],
                  ["Reported PAT", "pat"],
                  ["Cash taxes paid", "taxPaid"],
                  ["Cash capex", "capex"],
                  ["Receivables", "receivables"],
                  ["Inventory", "inventory"],
                  ["Operating payables", "payables"],
                  ["Cash and cash equivalents", "cash"],
                  ["Debt-like balance", "debt"],
                  ["Book equity", "equity"],
                  ["Shares outstanding", "shares"],
                ] as const
              ).map(([label, key]) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  {shanthiHistory.map(({ financial: f }) => (
                    <td key={f.year}>
                      {num(f[key], key === "shares" ? 0 : 2)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Cash flow from operations</th>
                {shanthiHistory.map(({ reported }) => (
                  <td key={reported.year}>{num(reported.cfo, 2)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Operating cash flow less capex</th>
                {shanthiHistory.map(({ reported, afterCapexCash }) => (
                  <td key={reported.year}>{num(afterCapexCash, 2)}</td>
                ))}
              </tr>
              {(
                [
                  ["Income statement", "income"],
                  ["Balance sheet", "balance"],
                  ["Cash flow statement", "cashFlow"],
                  ["Share count", "shares"],
                ] as const
              ).map(([label, section]) => (
                <tr key={section}>
                  <th scope="row">{label}</th>
                  {shanthiHistory.map(({ reported }) => {
                    const source = filing(reported, section);
                    return (
                      <td key={reported.year}>
                        <a
                          href={source.url}
                          aria-label={`${label}, FY${reported.year}, PDF page ${source.pdf}`}
                        >
                          PDF p. {source.pdf}
                        </a>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="section-explainer">
          Balance sheets and cash roll-forwards reconcile for FY2022–2026.
          Source files were checked on 4 November 2026.
        </p>
      </section>
    </div>
  );
}
