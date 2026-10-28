import { mkdir, writeFile } from "node:fs/promises";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
import { buildWorkbook } from "../packages/excel/src/index";
import {
  DEFAULT_ASSUMPTIONS,
  runLbo,
  type Company,
} from "../packages/engine/src/index";
const directory = "docs/examples";
await mkdir(directory, { recursive: true });
const sample = DEMO_COMPANIES[0];
await writeFile(
  `${directory}/demo-manifest.json`,
  JSON.stringify(
    { termsReviewed: true, company: sample, filings: [], accountingChecks: [] },
    null,
    2,
  ) + "\n",
);
const financials = Array.from({ length: 5 }, (_, i) => ({
  year: 2022 + i,
  revenue: 1000,
  ebitda: 200,
  depreciation: 25,
  interest: 12,
  taxPaid: 40,
  pat: 123,
  receivables: 120,
  inventory: 130,
  payables: 70,
  capex: 40,
  cash: 50,
  debt: 100,
  equity: 500,
  shares: 100000000,
}));
const c: Company = {
  ...sample,
  id: "paper-lbo",
  name: "Paper LBO: independent reference",
  ticker: "PAPER",
  description:
    "Fictional constant-earnings reference with zero leverage, fees, tax, growth and capex in the forward scenario.",
  marketCap: 1550,
  financials,
  adjustments: [],
  qualityIssues: [],
  sources: sample.sources.map((s) => ({
    ...s,
    filingId: `paper-${s.year}`,
    title: "Fictional paper LBO reference",
    url: "/methodology",
  })),
};
const a = {
  ...DEFAULT_ASSUMPTIONS,
  leverage: 0,
  growthRate: 0,
  feesRate: 0,
  taxRate: 0,
  capexRate: 0,
  workingCapitalRate: 0,
};
const m = runLbo(financials.at(-1)!, [], a);
if (m.sponsorEquity !== 1600 || m.exitEquity !== 2600 || m.moic !== 1.625)
  throw new Error("Independent reference failed");
await writeFile(`${directory}/paper-lbo.xlsx`, await buildWorkbook(c, a));
await writeFile(
  `${directory}/paper-lbo.md`,
  `# Independent paper LBO\n\nFictional training case. Not a real company or reviewed investment. All money is INR crore.\n\nEntry EBITDA 200 at 8× gives EV 1,600. No acquisition debt or fees, so sponsor equity is 1,600. Revenue and EBITDA do not grow. No forward taxes, capex or working-capital changes: cash generation is 200 a year, or 1,000 across five years. Exit EV remains 1,600; retained cash makes exit equity 2,600.\n\nMOIC = 2,600 / 1,600 = 1.625×. IRR = (1.625)^(1/5) - 1 = ${(m.irr! * 100).toFixed(6)}%. The equity gain is 1,000, entirely from retained operating cash. Sources less uses and the value-creation bridge both reconcile to zero.\n\nThe workbook contains live formulas and cached results. The reference is independently calculable on paper, and the test suite pins these exact expected values. It is not a replacement for the plan's real-company hand-built LBO.\n\nRegenerate with \`npx tsx pipeline/reference.ts\`. Dry-run the sample importer with \`npm run pipeline -- validate docs/examples/demo-manifest.json\`.\n`,
);
console.log(
  "Generated sample manifest and independently checkable paper LBO workbook.",
);
