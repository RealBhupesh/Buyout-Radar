import records from "../data/pilot.json";
import { csvCell } from "./csv";
export interface PilotDocument {
  id: string;
  url: string;
  pdfPage: number;
  printedPage: string;
  units: string;
  title: string;
  sha256: string;
  checkedAt: string;
}
export interface PilotYear {
  year: number;
  sourceId: string;
  rawRevenue: number;
  rawPat: number;
}
export interface PilotCompany {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  description: string;
  question: string;
  observations: string[];
  basis: string;
  reviewStatus: string;
  lboReady: boolean;
  history: PilotYear[];
}
export const PILOT_DOCUMENTS: PilotDocument[] = records.documents;
export const PILOT_COMPANIES: PilotCompany[] = records.companies;
export const PILOT_CHECKED_AT = records.checkedAt;
export const PILOT_REVIEW_GATES = [
  "Map cash taxes, maintenance capex, working capital, cash and borrowings across all five years.",
  "Review recurring earnings and reconcile the acquisition perimeter to consolidated accounts where applicable.",
  "Source dated valuation, ownership, pledges and control feasibility. No live price or market capitalisation is supplied.",
  "Obtain financing terms and reconcile an independently reviewed transaction model before publishing returns.",
];
const officialHosts = [
  "www.shanthigears.com",
  "www.raclgeartech.com",
  "www.mayuruniquoters.com",
];
export function validatePilot(
  companies: PilotCompany[],
  documents: PilotDocument[],
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const d of documents) {
    if (ids.has(d.id)) issues.push(`Duplicate source: ${d.id}`);
    ids.add(d.id);
    try {
      const u = new URL(d.url);
      if (u.protocol !== "https:" || !officialHosts.includes(u.hostname))
        issues.push(`Unofficial source: ${d.id}`);
    } catch {
      issues.push(`Invalid URL: ${d.id}`);
    }
    if (
      !Number.isInteger(d.pdfPage) ||
      d.pdfPage < 1 ||
      !/^[a-f0-9]{64}$/.test(d.sha256)
    )
      issues.push(`Invalid document evidence: ${d.id}`);
    if (!["INR crore", "INR lakh"].includes(d.units))
      issues.push(`Unsupported units: ${d.id}`);
  }
  const companyIds = new Set<string>();
  for (const c of companies) {
    if (companyIds.has(c.id)) issues.push(`Duplicate company: ${c.id}`);
    companyIds.add(c.id);
    if (
      c.basis !== "Standalone" ||
      c.lboReady ||
      c.reviewStatus !== "independent-review-pending"
    )
      issues.push(`Unsupported review claim: ${c.id}`);
    if (c.history.length !== 5 || c.history.some((h, i) => h.year !== 2022 + i))
      issues.push(`Incomplete five-year record: ${c.id}`);
    for (const h of c.history) {
      if (
        !ids.has(h.sourceId) ||
        !Number.isFinite(h.rawRevenue) ||
        h.rawRevenue <= 0 ||
        !Number.isFinite(h.rawPat)
      )
        issues.push(`Invalid fact: ${c.id} FY${h.year}`);
    }
  }
  return issues;
}
const issues = validatePilot(PILOT_COMPANIES, PILOT_DOCUMENTS);
if (issues.length)
  throw new Error(`Pilot publication failed: ${issues.join("; ")}`);
export function pilotDocument(id: string) {
  const source = PILOT_DOCUMENTS.find((d) => d.id === id);
  if (!source) throw new Error("Missing pilot source");
  return source;
}
export function pilotFacts(c: PilotCompany) {
  return c.history.map((h) => {
    const source = pilotDocument(h.sourceId),
      divisor = source.units === "INR lakh" ? 100 : 1;
    return {
      ...h,
      source,
      revenue: h.rawRevenue / divisor,
      pat: h.rawPat / divisor,
    };
  });
}
export function pilotGrowth(c: PilotCompany) {
  const facts = pilotFacts(c),
    latest = facts.at(-1)!,
    prior = facts.at(-2)!;
  return {
    revenueYoY: latest.revenue / prior.revenue - 1,
    revenueCagr:
      (latest.revenue / facts[0].revenue) **
        (1 / (latest.year - facts[0].year)) -
      1,
  };
}
export function pilotCsv(companies: PilotCompany[]) {
  const rows: (string | number | null)[][] = [
    [
      "Company",
      "Ticker",
      "Basis",
      "Financial year ended 31 March",
      "Revenue (INR crore)",
      "PAT (INR crore)",
      "Original revenue",
      "Original PAT",
      "Original units",
      "Document",
      "PDF page",
      "Printed page",
      "Source URL",
      "SHA-256",
      "Source checked",
      "Review status",
      "Model IRR (%)",
    ],
  ];
  for (const c of companies)
    for (const f of pilotFacts(c))
      rows.push([
        c.name,
        c.ticker,
        c.basis,
        f.year,
        f.revenue,
        f.pat,
        f.rawRevenue,
        f.rawPat,
        f.source.units,
        f.source.title,
        f.source.pdfPage,
        f.source.printedPage,
        f.source.url,
        f.source.sha256,
        f.source.checkedAt,
        "Independent review pending",
        null,
      ]);
  return "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
export function pilotDraft(c: PilotCompany) {
  const latest = pilotFacts(c).at(-1)!;
  return `${c.name} | ${c.ticker}\nOfficial filing pilot. Standalone, INR crore.\nFY${latest.year} revenue: ${latest.revenue.toFixed(2)}. PAT: ${latest.pat.toFixed(2)}.\nSource: ${latest.source.url}#page=${latest.source.pdfPage}\nSource checked: ${latest.source.checkedAt}. Independent review pending.\n\nInvestment question\n${c.question}\n\nDisconfirming evidence\n\nDiligence required\n${PILOT_REVIEW_GATES.map((x) => "- " + x).join("\n")}\n\nReturns unavailable until the full transaction inputs and independent model review are complete.`;
}
