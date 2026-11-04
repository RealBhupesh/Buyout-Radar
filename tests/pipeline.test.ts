import { expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
import { verifyExtraction, routeExtractions } from "../pipeline/ai/verify";
import { parseXbrl } from "../pipeline/ingest/xbrl";
import { storeCompany } from "../pipeline/ingest/store";

it.each([
  ["validate", "--write", "--publish"],
  ["extract", "--write"],
  ["ingest", "--publsih"],
  ["ingest", "--publish"],
])("rejects invalid CLI flags before reading files (%s %s)", (...args) => {
  const [command, ...flags] = args;
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "pipeline/cli.ts",
      command,
      "missing-input.json",
      ...flags,
    ],
    { encoding: "utf8", timeout: 10000 },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/only ingest|unknown flag|requires --write/i);
  expect(result.stderr).not.toContain("ENOENT");
});

it("refuses to publish verified research with unresolved quality checks", async () => {
  await expect(
    storeCompany({ ...DEMO_COMPANIES[0], dataKind: "verified" }, [], true),
  ).rejects.toThrow(/publication blocked.*reconciliation/i);
});
const pages = [
  {
    page: 112,
    text: "Exceptional plant relocation expense was INR 12.50 crore during the year.",
  },
];
const answer = {
  item: "relocation",
  amount: 12.5,
  unit: "crore" as const,
  quote: pages[0].text,
  page: 112,
  category: "one-off" as const,
  direction: "add" as const,
};
it("accepts exact evidence and rejects invented evidence", () => {
  expect(verifyExtraction(answer, pages).valid).toBe(true);
  expect(
    verifyExtraction(
      { ...answer, quote: "Imagined expense 12.50 crore" },
      pages,
    ).valid,
  ).toBe(false);
});
it("rejects amount substring matches, unit mismatches and missing pages", () => {
  expect(verifyExtraction({ ...answer, amount: 2.5 }, pages).valid).toBe(false);
  expect(verifyExtraction({ ...answer, unit: "lakh" }, pages).valid).toBe(
    false,
  );
  expect(verifyExtraction({ ...answer, page: 113 }, pages).valid).toBe(false);
});
it("agreement includes category and adjustment direction", () => {
  expect(routeExtractions([answer], [answer], pages)[0].status).toBe(
    "accepted",
  );
  expect(
    routeExtractions([answer], [{ ...answer, direction: "subtract" }], pages)[0]
      .status,
  ).toBe("review");
});
it("never drops facts found by just one model", () => {
  expect(routeExtractions([], [answer], pages)[0].status).toBe("review");
});
it("requires dimensionless context and scales INR to crore", () => {
  const xml = `<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:i="test"><xbrli:context id="FY"><xbrli:entity><xbrli:identifier scheme="x">A</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:startDate>2025-04-01</xbrli:startDate><xbrli:endDate>2026-03-31</xbrli:endDate></xbrli:period></xbrli:context><xbrli:unit id="INR"><xbrli:measure>iso4217:INR</xbrli:measure></xbrli:unit><i:RevenueFromOperations contextRef="FY" unitRef="INR" decimals="0">1000000000</i:RevenueFromOperations></xbrli:xbrl>`;
  expect(
    parseXbrl(xml, {
      year: 2026,
      contextId: "FY",
      fields: { revenue: "RevenueFromOperations" },
    }).revenue,
  ).toBe(100);
  expect(() =>
    parseXbrl(xml, {
      year: 2025,
      contextId: "FY",
      fields: { revenue: "RevenueFromOperations" },
    }),
  ).toThrow();
});
