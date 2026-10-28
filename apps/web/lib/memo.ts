import {
  runLbo,
  cashMetrics,
  normalizedEbitda,
  stressTest,
  type Company,
  type Assumptions,
} from "@buyout/engine";
import { crore, pct, multiple } from "./format";
/** Deterministic research prompts. These are not AI opinions or reviewed investment advice. */
export function researchMemo(c: Company, a: Assumptions): string {
  const b = c.financials.at(-1)!,
    m = runLbo(b, c.adjustments, a),
    cash = cashMetrics(c.financials),
    stress = stressTest(b, c.adjustments, a);
  return `${c.name} | ${c.dataKind === "demo" ? "Fictional research exercise" : "Research draft"}

Business: ${c.description}

Underwriting: ${multiple(a.entryMultiple)} entry, ${multiple(a.exitMultiple)} exit, ${pct(a.growthRate)} growth, ${multiple(a.leverage)} leverage cap. Sponsor equity ${crore(m.sponsorEquity)}. ${m.investable && !c.qualityIssues.length ? `Model return ${pct(m.irr)} / ${multiple(m.moic)} MOIC.` : "Return withheld: incomplete data or funding shortfall."}

Cash: normalized EBITDA ${crore(normalizedEbitda(b.ebitda, c.adjustments, b.year))}; historical conversion ${pct(cash.averageConversion)}.

What could break: ${stress.firstBreach ? `A 20% EBITDA stress breaches coverage in ${stress.firstBreach}.` : "Coverage survives the modeled 20% EBITDA stress; financing still needs diligence."} Promoter ownership ${c.promoterPct.toFixed(1)}%, pledge ${c.pledgedPct.toFixed(1)}%.

Diligence: Validate maintenance capex, customer concentration, recurring adjustments, control feasibility and debt terms. Confirm every source before presenting a conclusion.

Evidence: open Financial history and Sources in this company workspace. All figures are INR crore. ${c.dataKind === "demo" ? "No real company or annual report is represented." : "This draft contains no outside claims."}`;
}
