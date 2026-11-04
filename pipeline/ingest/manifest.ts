import type { Company, FinancialYear } from "../../packages/engine/src/types";
export interface FilingSelection {
  url: string;
  year: number;
  contextId: string;
  page: number;
  sha256?: string;
  fields: Partial<Record<Exclude<keyof FinancialYear, "year">, string>>;
}
export interface IngestManifest {
  termsReviewed: boolean;
  company: Company;
  filings: FilingSelection[];
  accountingChecks: {
    label: string;
    actual: number;
    expected: number;
    tolerance?: number;
  }[];
}
export function parseManifest(input: unknown): IngestManifest {
  if (!input || typeof input !== "object")
    throw new Error("Manifest object required");
  const m = input as IngestManifest;
  if (m.termsReviewed !== true)
    throw new Error(
      "Review source terms and set termsReviewed before fetching filings",
    );
  if (
    !m.company ||
    !m.company.id ||
    !Array.isArray(m.company.financials) ||
    !Array.isArray(m.company.sources) ||
    !Array.isArray(m.company.adjustments) ||
    !Array.isArray(m.company.qualityIssues) ||
    !Array.isArray(m.filings) ||
    !Array.isArray(m.accountingChecks)
  )
    throw new Error("Incomplete manifest structure");
  const mappings = new Set<string>();
  const fingerprints = new Map<string, string>();
  for (const f of m.filings) {
    if (
      !f ||
      typeof f.url !== "string" ||
      !f.url.trim() ||
      !Number.isInteger(f.year) ||
      typeof f.contextId !== "string" ||
      !f.contextId.trim() ||
      !Number.isInteger(f.page) ||
      f.page < 1 ||
      !f.fields ||
      typeof f.fields !== "object" ||
      Array.isArray(f.fields)
    )
      throw new Error("Invalid filing selection");
    const fields = Object.entries(f.fields);
    if (
      !fields.length ||
      fields.some(([, tag]) => typeof tag !== "string" || !tag.trim())
    )
      throw new Error("Filing selection requires explicit field tags");
    for (const [field] of fields) {
      const key = `${f.year}:${field}`;
      if (mappings.has(key))
        throw new Error(`Duplicate mapping for ${field} in FY${f.year}`);
      mappings.add(key);
    }
    if (f.sha256 !== undefined) {
      if (typeof f.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(f.sha256))
        throw new Error("Expected a 64-character SHA-256 fingerprint");
      const fingerprint = f.sha256.toLowerCase();
      if (fingerprints.has(f.url) && fingerprints.get(f.url) !== fingerprint)
        throw new Error(`Conflicting fingerprints for ${f.url}`);
      fingerprints.set(f.url, fingerprint);
    }
  }
  if (m.company.dataKind !== "verified" && m.company.dataKind !== "demo")
    throw new Error("Explicit data kind required");
  if (m.company.dataKind === "verified" && m.filings.length === 0)
    throw new Error("Verified imports require an explicit filing manifest");
  return m;
}
