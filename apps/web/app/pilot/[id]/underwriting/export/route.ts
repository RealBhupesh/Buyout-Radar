import { buildWorkbook } from "@buyout/excel";
import type { SourceRef } from "@buyout/engine";
import {
  DEFAULT_PREMIUM,
  MAX_PREMIUM,
  SHANTHI,
  SHANTHI_ID,
  filing,
  isShanthiCase,
  shanthiCases,
  shanthiHistory,
  shanthiScenario,
  type ReportSection,
} from "../../../../../lib/shanthi-underwriting";

export const runtime = "nodejs";

const sections = {
  revenue: "income",
  ebitda: "income",
  depreciation: "income",
  pat: "income",
  taxPaid: "cashFlow",
  capex: "cashFlow",
  cash: "cashFlow",
  receivables: "balance",
  inventory: "balance",
  payables: "balance",
  equity: "balance",
  debt: "balance",
  shares: "shares",
} as const satisfies Partial<Record<SourceRef["field"], ReportSection>>;

const sources: SourceRef[] = shanthiHistory.flatMap(({ reported }) => {
  const refs = Object.entries(sections).map(([field, section]) => {
    const source = filing(reported, section);
    return {
      field: field as keyof typeof sections,
      year: reported.year,
      filingId: source.sha256,
      page: source.pdf,
      url: source.url,
      title: source.title,
      kind: "filing" as const,
    };
  });
  const doc = SHANTHI.documents.fy26;
  const extra = (field: SourceRef["field"], page: number): SourceRef => ({
    field,
    year: reported.year,
    filingId: doc.sha256,
    page,
    url: `${doc.url}#page=${page}`,
    title: doc.title,
    kind: "filing",
  });
  return [
    ...refs,
    extra("interest", doc.pages.highlights.pdf),
    ...(reported.year === 2026
      ? [
          extra("debt", doc.pages.supplierFinance.pdf),
          extra("payables", doc.pages.supplierFinance.pdf),
        ]
      : []),
  ];
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = { "Cache-Control": "no-store" };
  if ((await params).id !== SHANTHI_ID)
    return Response.json(
      { error: "Underwriting model not found" },
      { status: 404, headers },
    );
  const query = new URL(request.url).searchParams;
  const scenario = query.get("case") ?? "base";
  const rawPremium = query.get("premium");
  const premium = rawPremium === null ? DEFAULT_PREMIUM : Number(rawPremium);
  if (
    !isShanthiCase(scenario) ||
    rawPremium?.trim() === "" ||
    !Number.isFinite(premium) ||
    premium < 0 ||
    premium > MAX_PREMIUM
  )
    return Response.json(
      { error: "Invalid operating case or offer premium" },
      { status: 400, headers },
    );
  const { assumptions } = shanthiScenario(scenario, premium);
  const buffer = await buildWorkbook(
    {
      name: "Shanthi Gears Limited",
      dataKind: "verified",
      qualityIssues: [],
      financials: shanthiHistory.map((h) => h.financial),
      adjustments: [],
      sources,
    },
    assumptions,
    {
      status:
        "Filing-backed hypothetical scenario. Independent review pending.",
      notes: [
        [
          "Case",
          `${shanthiCases[scenario].label}. ${premium}% premium to the 30 March 2026 NSE close of INR 431.30 per share.`,
        ],
        ["Exchange source", SHANTHI.market.url],
        ["Ownership source", `${SHANTHI.ownership.url}#page=2`],
        [
          "Timing",
          "Retrospective FY2026 snapshot. The annual financial statements were authorized on 5 May 2026.",
        ],
        [
          "Operating EBITDA",
          "Profit before tax plus D&A less other income. The FY2026 INR 4.78 crore labour-code charge remains in operating earnings.",
        ],
        [
          "Debt and working capital",
          "FY2026 INR 0.48 crore supplier finance is debt-like and is deducted from operating trade payables.",
        ],
        [
          "Operating inputs",
          scenario === "downside"
            ? "Capex uses FY2026 cash capex divided by revenue. D&A and operating working capital use FY2026 ratios."
            : "Capex uses five-year aggregate cash capex divided by aggregate revenue. D&A and operating working capital use FY2026 ratios.",
        ],
        [
          "Tax source",
          `${SHANTHI.documents.fy26.url}#page=${SHANTHI.documents.fy26.pages.tax.pdf}`,
        ],
        [
          "Treasury",
          "Only cash equivalents are used at close. Separate fixed deposits, restricted dividend cash and treasury investments are excluded from funding and terminal equity.",
        ],
        [
          "Execution",
          "The model assumes 100% equity ownership and illustrative financing. Seller willingness, approvals and lender terms are unresolved.",
        ],
      ],
    },
  );
  return new Response(buffer as BodyInit, {
    headers: {
      ...headers,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="SHANTIGEAR-underwriting.xlsx"',
    },
  });
}
