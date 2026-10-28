import { writeFile } from "node:fs/promises";
import { verifyExtraction } from "../ai/verify";
import type { Extraction } from "../ai/schema";
const page = {
  page: 4,
  text: "A non-recurring relocation expense of INR 12.50 crore was recorded.",
};
const base: Extraction = {
  item: "relocation",
  amount: 12.5,
  unit: "crore",
  quote: page.text,
  page: 4,
  category: "one-off",
  direction: "add",
};
const cases = [
  { name: "exact evidence", answer: base, expected: true },
  {
    name: "invented quote",
    answer: {
      ...base,
      quote: "A made-up charge of INR 12.50 crore was recorded.",
    },
    expected: false,
  },
  { name: "missing page", answer: { ...base, page: 5 }, expected: false },
  { name: "wrong amount", answer: { ...base, amount: 2.5 }, expected: false },
  {
    name: "wrong unit",
    answer: { ...base, unit: "lakh" as const },
    expected: false,
  },
  { name: "no quote", answer: { ...base, quote: "" }, expected: false },
];
const results = cases.map((c) => ({
  name: c.name,
  expected: c.expected,
  actual: verifyExtraction(c.answer, [page]).valid,
}));
const report = {
  datasetKind: "synthetic-fixture",
  promptVersion: "notes-v1.0",
  sampleCount: results.length,
  passed: results.filter((r) => r.expected === r.actual).length,
  realWorldAccuracy: null,
  results,
};
await writeFile(
  "pipeline/eval/latest.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (report.passed !== report.sampleCount) process.exitCode = 1;
