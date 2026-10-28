import { expect, it } from "vitest";
import { parseXbrl } from "../pipeline/ingest/xbrl";
function instance(period: string, fact: string, entity = "") {
  return `<xbrl><context id="C"><entity><identifier>A</identifier>${entity}</entity><period>${period}</period></context><unit id="INR"><measure>iso4217:INR</measure></unit>${fact}</xbrl>`;
}
const annual = "<startDate>2025-04-01</startDate><endDate>2026-03-31</endDate>";
const select = { year: 2026, contextId: "C", fields: { revenue: "Revenue" } };
it("never treats an instant balance as annual revenue", () => {
  expect(() =>
    parseXbrl(
      instance(
        "<instant>2026-03-31</instant>",
        '<Revenue contextRef="C" unitRef="INR">100</Revenue>',
      ),
      select,
    ),
  ).toThrow(/duration/i);
});
it("rejects a duration context for balance-sheet stock data", () => {
  expect(() =>
    parseXbrl(
      instance(annual, '<Cash contextRef="C" unitRef="INR">100</Cash>'),
      { ...select, fields: { cash: "Cash" } },
    ),
  ).toThrow(/instant/i);
});
it("rejects nil=1 and malformed numeric lexical values", () => {
  for (const fact of [
    '<Revenue contextRef="C" unitRef="INR" nil="1">0</Revenue>',
    '<Revenue contextRef="C" unitRef="INR">1,2,3</Revenue>',
  ])
    expect(() => parseXbrl(instance(annual, fact), select)).toThrow();
});
it("rejects malformed XML and dimensional subtotals", () => {
  expect(() => parseXbrl("<xbrl><Revenue></xbrl>", select)).toThrow();
  expect(() =>
    parseXbrl(
      instance(
        annual,
        '<Revenue contextRef="C" unitRef="INR">100</Revenue>',
        "<segment><member>Export</member></segment>",
      ),
      select,
    ),
  ).toThrow(/dimensional/i);
});
