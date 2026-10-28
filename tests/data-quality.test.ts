import { expect, it } from "vitest";
import { validateCompany, accountingChecks } from "../pipeline/ingest/checks";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
import { score } from "../pipeline/eval/score";
it("does not approve a verified company without supplied reconciliation evidence", () => {
  const c = {
    ...DEMO_COMPANIES[0],
    dataKind: "verified" as const,
    sources: DEMO_COMPANIES[0].sources.map((s) => ({
      ...s,
      kind: "filing" as const,
      url: "https://www.bseindia.com/sample.pdf",
    })),
  };
  expect(
    validateCompany(c).some((issue) => /reconciliation/i.test(issue)),
  ).toBe(true);
});
it("rejects nonfinite accounting checks and negative tolerance", () => {
  expect(
    accountingChecks([{ label: "balance", actual: NaN, expected: 0 }]),
  ).toHaveLength(1);
  expect(
    accountingChecks([
      { label: "balance", actual: 0, expected: 0, tolerance: -1 },
    ]),
  ).toHaveLength(1);
});
it("matches labels one to one so duplicate predictions cannot inflate accuracy", () => {
  const report = score(
    [{ key: "a", amount: 12 }],
    [
      { key: "a", amount: 12 },
      { key: "a", amount: 12 },
    ],
  );
  expect(report.truePositive).toBe(1);
  expect(report.precision).toBe(0.5);
  expect(report.recall).toBe(1);
  expect(score([], []).precision).toBeNull();
});
