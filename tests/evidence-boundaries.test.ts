import { expect, it } from "vitest";
import { verifyExtraction, routeExtractions } from "../pipeline/ai/verify";
import { parseExtractions, type Extraction } from "../pipeline/ai/schema";
const page = {
  page: 3,
  text: "Relocation expense was INR 12.50 lakh, equivalent to INR 0.125 crore.",
};
const a: Extraction = {
  item: "relocation",
  amount: 12.5,
  unit: "crore",
  quote: page.text,
  page: 3,
  category: "one-off",
  direction: "add",
};
it("binds an amount to its adjacent unit rather than another number's unit", () => {
  expect(verifyExtraction(a, [page]).valid).toBe(false);
  expect(verifyExtraction({ ...a, amount: 0.125 }, [page]).valid).toBe(true);
});
it("preserves a valid second-model answer when the first has bad evidence", () => {
  const valid = { ...a, amount: 0.125 };
  const row = routeExtractions(
    [{ ...valid, quote: "Fabricated charge of INR 0.125 crore." }],
    [valid],
    [page],
  )[0];
  expect(row.status).toBe("review");
  expect(row.answer.quote).toBe(page.text);
});
it("rejects duplicate extraction identities and unknown schema fields", () => {
  expect(() => parseExtractions([a, a])).toThrow();
  expect(() => parseExtractions([{ ...a, confidence: 1 }])).toThrow();
});
