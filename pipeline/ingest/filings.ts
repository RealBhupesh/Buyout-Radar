import { fetchFiling } from "./fetch";
import { parseXbrl } from "./xbrl";
import type { FilingSelection, IngestManifest } from "./manifest";

export async function applyFilings(manifest: IngestManifest) {
  const company = structuredClone(manifest.company);
  const byURL = new Map<string, FilingSelection[]>();
  for (const filing of manifest.filings) {
    const selections = byURL.get(filing.url);
    if (selections) selections.push(filing);
    else byURL.set(filing.url, [filing]);
  }

  for (const [url, selections] of byURL) {
    const { bytes, sha256 } = await fetchFiling(url);
    const expected = selections.find((filing) => filing.sha256)?.sha256;
    if (expected && sha256 !== expected.toLowerCase())
      throw new Error(
        `Filing fingerprint mismatch for ${url}. Review the current document before updating its fingerprint.`,
      );

    const xml = bytes.toString("utf8");
    for (const filing of selections) {
      const year = company.financials.find((f) => f.year === filing.year);
      if (!year) throw new Error(`Manifest missing FY${filing.year}`);
      Object.assign(year, parseXbrl(xml, filing));
      company.sources = company.sources.filter(
        (source) =>
          source.year !== filing.year ||
          !Object.hasOwn(filing.fields, source.field),
      );
      const fields = Object.keys(filing.fields) as Array<
        keyof typeof filing.fields
      >;
      for (const field of fields) {
        company.sources.push({
          field,
          year: filing.year,
          filingId: sha256,
          page: filing.page,
          url,
          title: `Annual filing FY${filing.year}`,
          kind: "filing",
        });
      }
    }
  }
  return company;
}
