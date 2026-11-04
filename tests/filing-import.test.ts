import { createHash } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
import { applyFilings } from "../pipeline/ingest/filings";
import { parseManifest } from "../pipeline/ingest/manifest";

const xml = `<xbrl>
  <context id="flow"><entity><identifier>A</identifier></entity><period><startDate>2025-04-01</startDate><endDate>2026-03-31</endDate></period></context>
  <context id="stock"><entity><identifier>A</identifier></entity><period><instant>2026-03-31</instant></period></context>
  <unit id="INR"><measure>iso4217:INR</measure></unit>
  <Revenue contextRef="flow" unitRef="INR">1000000000</Revenue>
  <Cash contextRef="stock" unitRef="INR">50000000</Cash>
</xbrl>`;
const hash = createHash("sha256").update(xml).digest("hex");
const url = "https://archives.nseindia.com/fixture.xml";
const flow = {
  url,
  year: 2026,
  page: 8,
  contextId: "flow",
  fields: { revenue: "Revenue" },
};
const stock = {
  url,
  year: 2026,
  page: 9,
  contextId: "stock",
  fields: { cash: "Cash" },
};
const company = DEMO_COMPANIES[0];
const manifest = {
  termsReviewed: true,
  company,
  accountingChecks: [],
  filings: [flow, stock],
};

afterEach(() => vi.unstubAllGlobals());

it("reads both contexts from one download and assigns one evidence fingerprint", async () => {
  const fetch = vi.fn(() => new Response(xml));
  vi.stubGlobal("fetch", fetch);
  const result = await applyFilings(parseManifest(manifest));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.financials.at(-1)).toMatchObject({ revenue: 100, cash: 5 });
  expect(result.sources.filter((source) => source.filingId === hash)).toEqual([
    expect.objectContaining({ field: "revenue", page: 8 }),
    expect.objectContaining({ field: "cash", page: 9 }),
  ]);
  expect(company.financials.at(-1)?.revenue).not.toBe(100);
});

it("rejects changed bytes even when the fingerprint is on a later selection", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Response(xml + "\n")),
  );
  const pinned = parseManifest({
    ...manifest,
    filings: [flow, { ...stock, sha256: hash }],
  });
  await expect(applyFilings(pinned)).rejects.toThrow(/fingerprint mismatch/i);
});

it("rejects duplicate fact mappings and contradictory fingerprints before download", () => {
  expect(() => parseManifest({ ...manifest, filings: [flow, flow] })).toThrow(
    /duplicate.*revenue.*2026/i,
  );
  expect(() =>
    parseManifest({
      ...manifest,
      filings: [
        { ...flow, sha256: hash },
        { ...stock, sha256: "0".repeat(64) },
      ],
    }),
  ).toThrow(/conflicting fingerprints/i);
});
