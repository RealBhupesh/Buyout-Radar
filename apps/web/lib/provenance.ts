import type { Company } from "@buyout/engine";
export function provenanceIssues(c: Company): string[] {
  if (c.dataKind === "demo") return [];
  const issues: string[] = [];
  for (const f of c.financials)
    for (const field of Object.keys(f).filter((k) => k !== "year")) {
      const ref = c.sources.find((s) => s.field === field && s.year === f.year);
      if (
        !ref ||
        ref.kind !== "filing" ||
        !Number.isInteger(ref.page) ||
        ref.page < 1 ||
        !/^https:\/\//.test(ref.url)
      )
        issues.push(`FY${f.year}: missing ${field} provenance`);
    }
  return issues;
}
