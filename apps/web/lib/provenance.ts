import type { Company, SourceRef } from "@buyout/engine";
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
  const latest = c.financials.at(-1)?.year;
  for (const field of ["marketCap", "promoterPct", "pledgedPct"] as const)
    if (
      !c.sources.some(
        (s) =>
          s.field === field &&
          s.year === latest &&
          s.kind === "filing" &&
          s.page > 0 &&
          /^https:\/\//.test(s.url),
      )
    )
      issues.push(`Missing ${field} provenance`);
  return issues;
}

export function sourceValue(
  c: Company,
  field: SourceRef["field"],
  year: number,
): number | undefined {
  if (
    field === "marketCap" ||
    field === "promoterPct" ||
    field === "pledgedPct"
  )
    return c[field];
  return c.financials.find((f) => f.year === year)?.[field];
}
