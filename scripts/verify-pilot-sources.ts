import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  PILOT_COMPANIES,
  PILOT_DOCUMENTS,
  pilotDocument,
  validatePilot,
} from "../apps/web/lib/pilot";
import { readPdfPages } from "../pipeline/ai/pages";

const errors = validatePilot(PILOT_COMPANIES, PILOT_DOCUMENTS);
if (errors.length) throw new Error(errors.join("; "));
await mkdir("pipeline/output/pilot", { recursive: true });
let facts = 0;
for (const source of PILOT_DOCUMENTS) {
  const path = `pipeline/output/pilot/${source.id}.pdf`;
  let bytes: Uint8Array;
  if (process.argv.includes("--download")) {
    const response = await fetch(source.url, {
      redirect: "error",
      signal: AbortSignal.timeout(55000),
    });
    if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status}`);
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (!response.body) throw new Error("No document body");
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 25 * 1024 * 1024) throw new Error("Document exceeds 25 MB");
      chunks.push(chunk);
    }
    bytes = Buffer.concat(chunks);
    await writeFile(path, bytes);
  } else bytes = await readFile(path);
  if (createHash("sha256").update(bytes).digest("hex") !== source.sha256)
    throw new Error(
      `${source.id}: document changed; re-check the facts before updating its fingerprint`,
    );
  const pages = await readPdfPages(bytes),
    page = pages.find((p) => p.page === source.pdfPage);
  if (!page)
    throw new Error(`${source.id}: missing PDF page ${source.pdfPage}`);
  const tokens = page.text.replaceAll(",", "");
  for (const c of PILOT_COMPANIES)
    for (const h of c.history.filter((h) => h.sourceId === source.id)) {
      if (pilotDocument(h.sourceId).id !== source.id)
        throw new Error("Source mismatch");
      for (const value of [h.rawRevenue, h.rawPat]) {
        // Match complete numeric tokens, not a substring of a larger value.
        const pattern = new RegExp(
          `(?<![\\d.])${value.toFixed(2).replace(".", "\\.")}(?![\\d.])`,
        );
        if (!pattern.test(tokens))
          throw new Error(
            `${source.id}, PDF p.${source.pdfPage}: ${c.ticker} FY${h.year} fact ${value} not found`,
          );
        facts++;
      }
    }
  console.log(
    `${source.id}: SHA-256 matches; mapped source amounts located on PDF p.${source.pdfPage}`,
  );
}
console.log(
  `${PILOT_DOCUMENTS.length} official documents and ${facts} reported observations checked. This is a source-location regression, not independent financial review.`,
);
