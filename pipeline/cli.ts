import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseManifest } from "./ingest/manifest";
import { applyFilings } from "./ingest/filings";
import { validateCompany } from "./ingest/checks";
import { storeCompany } from "./ingest/store";
import { readPdfPages } from "./ai/pages";
import { processReport } from "./ai/run";
async function main() {
  const [command, path, ...flags] = process.argv.slice(2);
  if (!path || !["ingest", "extract", "validate"].includes(command))
    throw new Error(
      "Usage: npm run pipeline -- ingest|validate manifest.json [--write] [--publish], or extract annual-report.pdf",
    );
  const unknownFlag = flags.find(
    (flag) => !["--write", "--publish"].includes(flag),
  );
  if (unknownFlag) throw new Error(`Unknown flag: ${unknownFlag}`);
  const write = flags.includes("--write");
  const publish = flags.includes("--publish");
  if (command !== "ingest" && flags.length)
    throw new Error("Only ingest accepts --write and --publish");
  if (publish && !write) throw new Error("--publish requires --write");
  if (command === "extract") {
    const rows = await processReport(
      await readPdfPages(new Uint8Array(await readFile(path))),
    );
    await mkdir("pipeline/output", { recursive: true });
    await writeFile(
      "pipeline/output/extractions.json",
      JSON.stringify(rows, null, 2),
    );
    console.log(
      JSON.stringify({
        accepted: rows.filter((r) => r.status === "accepted").length,
        review: rows.filter((r) => r.status === "review").length,
        rejected: rows.filter((r) => r.status === "rejected").length,
        output: "pipeline/output/extractions.json",
        note: "Extraction does not write earnings. Merge reviewed one-offs into a company manifest; disclosures never adjust EBITDA.",
      }),
    );
    return;
  }
  const manifest = parseManifest(JSON.parse(await readFile(path, "utf8"))),
    c = command === "ingest" ? await applyFilings(manifest) : manifest.company;
  if (write) {
    console.log(
      JSON.stringify(await storeCompany(c, manifest.accountingChecks, publish)),
    );
  } else {
    c.qualityIssues = validateCompany(c, manifest.accountingChecks);
    await mkdir("pipeline/output", { recursive: true });
    await writeFile("pipeline/output/company.json", JSON.stringify(c, null, 2));
    console.log(
      JSON.stringify({
        id: c.id,
        issues: c.qualityIssues,
        output: "pipeline/output/company.json",
        dryRun: true,
      }),
    );
  }
}
main().catch((e) => {
  console.error((e as Error).message);
  process.exitCode = 1;
});
