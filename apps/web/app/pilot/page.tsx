import Link from "next/link";
import {
  PILOT_COMPANIES,
  PILOT_DOCUMENTS,
  pilotFacts,
  pilotGrowth,
} from "../../lib/pilot";
import { crore, pct } from "../../lib/format";
import { PilotExport } from "../../components/pilot-workspace";
import { Glyph } from "../../components/icons";
import { SHANTHI_ID, SHANTHI_MODEL_PATH } from "../../lib/shanthi-underwriting";
export const metadata = {
  title: "Official filing pilot",
  description:
    "Three real Indian businesses, five years of reported financial facts and direct official filing evidence. Independent transaction review remains pending.",
};
export default function PilotPage() {
  return (
    <div className="page pilot-page">
      <header className="page-heading">
        <div>
          <h1>Filing pilot</h1>
          <p>
            Three real businesses. Five years of reported facts. One clear
            review boundary.
          </p>
        </div>
        <Link className="button tonal" href="/">
          Back to Radar
        </Link>
      </header>
      <div className="pilot-status">
        <strong>Source facts checked. Independent review pending.</strong>
        <p>
          Reported revenue and profit have been checked against official company
          reports. Shanthi Gears also has a retrospective underwriting scenario.
          Independent model sign-off remains open.
        </p>
      </div>
      <section className="summary-grid" aria-label="Pilot evidence summary">
        <div>
          <span>Real companies</span>
          <strong>
            {PILOT_COMPANIES.length}
            <small>profiles</small>
          </strong>
          <p>Standalone reporting basis throughout</p>
        </div>
        <div>
          <span>Official documents</span>
          <strong>
            {PILOT_DOCUMENTS.length}
            <small>reports</small>
          </strong>
          <p>Original PDFs remain with the publishers</p>
        </div>
        <div>
          <span>Source facts checked</span>
          <strong>
            30<small>observations</small>
          </strong>
          <p>Revenue and PAT across five years</p>
        </div>
        <div>
          <span>Independent model sign-offs</span>
          <strong>
            0<small>completed</small>
          </strong>
          <p>Review status is never inferred from a task</p>
        </div>
      </section>
      <section aria-labelledby="pilot-companies">
        <h2 id="pilot-companies">Research questions</h2>
        <div className="pilot-directory">
          {PILOT_COMPANIES.map((c) => (
            <article key={c.id}>
              <div>
                <span className="pilot-ticker">
                  {c.ticker} · {c.sector}
                </span>
                <h3>
                  <Link href={`/pilot/${c.id}`}>
                    {c.name}
                    <Glyph name="arrow" size={20} />
                  </Link>
                </h3>
                <p>{c.question}</p>
              </div>
              <dl>
                <div>
                  <dt>FY2026 revenue</dt>
                  <dd>{crore(pilotFacts(c).at(-1)!.revenue)}</dd>
                </div>
                <div>
                  <dt>Revenue change</dt>
                  <dd>{pct(pilotGrowth(c).revenueYoY)}</dd>
                </div>
              </dl>
              <Link
                className="text-button"
                href={
                  c.id === SHANTHI_ID ? SHANTHI_MODEL_PATH : `/pilot/${c.id}`
                }
              >
                {c.id === SHANTHI_ID
                  ? "Open underwriting model"
                  : "Inspect the research"}{" "}
                <Glyph name="arrow" size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="work-section">
        <div className="work-section-heading">
          <h2>Reported comparison</h2>
          <PilotExport companies={PILOT_COMPANIES} />
        </div>
        <p className="section-explainer">
          Every column uses FY2026 standalone figures in INR crore. These are
          historical facts, not acquisition recommendations.
        </p>
        <div
          className="table-scroll"
          role="region"
          aria-label="Official filing company comparison"
          tabIndex={0}
        >
          <table className="workflow-table company-comparison">
            <thead>
              <tr>
                <th scope="col">Reported metric</th>
                {PILOT_COMPANIES.map((c) => (
                  <th scope="col" key={c.id}>
                    <Link href={`/pilot/${c.id}`}>{c.name}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Revenue (₹ Cr)</th>
                {PILOT_COMPANIES.map((c) => (
                  <td key={c.id}>{crore(pilotFacts(c).at(-1)!.revenue)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Profit after tax (₹ Cr)</th>
                {PILOT_COMPANIES.map((c) => (
                  <td key={c.id}>{crore(pilotFacts(c).at(-1)!.pat)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Revenue CAGR, FY2022–2026</th>
                {PILOT_COMPANIES.map((c) => (
                  <td key={c.id}>{pct(pilotGrowth(c).revenueCagr)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Market valuation</th>
                {PILOT_COMPANIES.map((c) => (
                  <td key={c.id}>Not sourced</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Published IRR / MOIC</th>
                {PILOT_COMPANIES.map((c) => (
                  <td key={c.id}>Unavailable</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Independent review</th>
                {PILOT_COMPANIES.map((c) => (
                  <td key={c.id}>Pending</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="table-hint">Scroll sideways to compare every company.</p>
      </section>
      <section className="pilot-research-boundary">
        <h2>Publication boundaries</h2>
        <p>
          Radar contains the fictional screening universe. This pilot keeps
          reported facts separate from hypothetical transaction scenarios and
          reserves published return metrics for independently reviewed models.
        </p>
        <Link className="text-button" href="/methodology">
          Read the evidence and model contract <Glyph name="arrow" size={15} />
        </Link>
      </section>
    </div>
  );
}
