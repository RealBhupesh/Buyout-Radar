import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  REPORTED_FIELDS,
  SHANTHI,
  underwritingIssues,
} from "../apps/web/lib/shanthi-underwriting";
import { readPdfPages } from "../pipeline/ai/pages";
import { fetchFiling } from "../pipeline/ingest/fetch";

const output = "pipeline/output/pilot";
const download = process.argv.includes("--download");
await mkdir(output, { recursive: true });

async function checkedFile(filename: string, url: string, sha256: string) {
  const path = `${output}/${filename}`;
  const bytes = download
    ? (await fetchFiling(url, ["www.shanthigears.com"])).bytes
    : await readFile(path);
  if (createHash("sha256").update(bytes).digest("hex") !== sha256)
    throw new Error(`${filename} fingerprint differs from the reviewed source`);
  if (download) await writeFile(path, bytes);
  return { path, bytes };
}

function checkTokens(
  text: string,
  values: readonly number[],
  location: string,
) {
  const compact = text.replaceAll(",", "");
  const tokens = new Set(
    Array.from(compact.matchAll(/(?<![\d.])\d+(?:\.\d+)?(?![\d.])/g), (match) =>
      Number(match[0]),
    ),
  );
  for (const value of values)
    if (!tokens.has(Math.abs(value)))
      throw new Error(`${location} does not contain ${value}`);
}

let checked = 0;
for (const [key, doc] of Object.entries(SHANTHI.documents)) {
  const { bytes } = await checkedFile(
    `shanthi-20${key.slice(2)}.pdf`,
    doc.url,
    doc.sha256,
  );
  const pages = await readPdfPages(bytes);
  for (const year of SHANTHI.years.filter((y) => y.document === key)) {
    for (const section of [
      "balance",
      "income",
      "cashFlow",
      "shares",
    ] as const) {
      const n = doc.pages[section].pdf;
      const values = REPORTED_FIELDS[section].map((field) => year[field]);
      checkTokens(
        pages[n - 1]?.text ?? "",
        values,
        `FY${year.year} PDF page ${n}`,
      );
      checked += values.length;
    }
  }
  if (key === "fy26") {
    const extra = SHANTHI.fy26;
    for (const [n, values] of [
      [24, [extra.issuerEbitda]],
      [157, [extra.currentInvestments]],
      [158, [extra.fixedDeposits, extra.restrictedDividendCash]],
      [164, [extra.supplierFinance]],
      [167, [extra.labourCharge]],
      [170, [Number((extra.statutoryTaxRate * 100).toFixed(3))]],
    ] as const) {
      checkTokens(pages[n - 1]?.text ?? "", values, `FY2026 PDF page ${n}`);
      checked += values.length;
    }
  }
}

const { ownership, market } = SHANTHI;
const { bytes: ownershipBytes } = await checkedFile(
  "shanthi-ownership-20260331.pdf",
  ownership.url,
  ownership.sha256,
);
const ownershipPages = await readPdfPages(ownershipBytes);
checkTokens(
  ownershipPages[ownership.page - 1].text,
  [ownership.promoterShares, ownership.holdingCompanyShares],
  "March shareholding PDF page 2",
);
if (
  ownership.pledgedShares !== 0 ||
  !/pledge[d]? or otherwise encumbered\?\s+No\b/i.test(ownershipPages[0].text)
)
  throw new Error(
    "Promoter pledge disclosure did not match the reviewed document",
  );

const { path } = await checkedFile(
  "shanthi-nse-20260330.zip",
  market.url,
  market.sha256,
);
const [heading, ...rows] = execFileSync("unzip", ["-p", path], {
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
})
  .trim()
  .split(/\r?\n/);
const fields = heading.split(",");
const cell = (row: string[], key: string) => row[fields.indexOf(key)];
const exchangeRows = rows
  .map((row) => row.split(","))
  .filter(
    (row) =>
      cell(row, "TckrSymb") === market.symbol &&
      cell(row, "ISIN") === market.isin &&
      cell(row, "SctySrs") === market.series &&
      cell(row, "TradDt") === market.date,
  );
if (
  exchangeRows.length !== 1 ||
  Number(cell(exchangeRows[0], "ClsPric")) !== market.close
)
  throw new Error("NSE archive close did not match the reviewed equity row");

const issues = underwritingIssues();
if (issues.length) throw new Error(issues.join(". "));
console.log(
  `${checked} reported figure locations, dated ownership and NSE close checked against five pinned source files.`,
);
console.log(
  "Five years of balance sheet and cash roll-forwards reconcile. Source checks are separate from independent underwriting review.",
);
