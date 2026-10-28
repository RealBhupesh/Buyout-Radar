import { readFile,mkdir,writeFile } from "node:fs/promises";
import { parseManifest } from "./ingest/manifest";
import { fetchFiling } from "./ingest/fetch";
import { parseXbrl } from "./ingest/xbrl";
import { validateCompany } from "./ingest/checks";
import { storeCompany } from "./ingest/store";
import { readPdfPages } from "./ai/pages";
import { processReport } from "./ai/run";
import { toCrore } from "./ai/schema";
async function main(){
 const [command,path,...flags]=process.argv.slice(2);
 if(!path||!["ingest","extract","validate"].includes(command))throw new Error("Usage: npm run pipeline -- ingest|validate manifest.json [--write] [--publish], or extract annual-report.pdf");
 if(command==="extract"){
  const rows=await processReport(await readPdfPages(new Uint8Array(await readFile(path))));
  await mkdir("pipeline/output",{recursive:true});await writeFile("pipeline/output/extractions.json",JSON.stringify(rows,null,2));
  console.log(JSON.stringify({accepted:rows.filter(r=>r.status==="accepted").length,review:rows.filter(r=>r.status==="review").length,rejected:rows.filter(r=>r.status==="rejected").length,output:"pipeline/output/extractions.json",note:"Extraction does not write earnings. Merge reviewed one-offs into a company manifest; disclosures never adjust EBITDA."}));
  return;
 }
 const manifest=parseManifest(JSON.parse(await readFile(path,"utf8"))),c=manifest.company;
 if(command==="ingest")for(const filing of manifest.filings){
  const fetched=await fetchFiling(filing.url);const parsed=parseXbrl(fetched.bytes.toString("utf8"),filing);
  const year=c.financials.find(f=>f.year===filing.year);if(!year)throw new Error(`Manifest missing FY${filing.year}`);
  Object.assign(year,parsed);
  for(const field of Object.keys(filing.fields)){c.sources=c.sources.filter(s=>!(s.year===filing.year&&s.field===field));c.sources.push({year:filing.year,field:field as keyof typeof year,filingId:fetched.sha256,page:filing.page,url:filing.url,title:`Annual filing FY${filing.year}`,kind:"filing"});}
 }
 c.qualityIssues=validateCompany(c,manifest.accountingChecks);
 if(flags.includes("--publish")&&!flags.includes("--write"))throw new Error("--publish requires --write");
 if(flags.includes("--write")){console.log(JSON.stringify(await storeCompany(c,manifest.accountingChecks,flags.includes("--publish"))));}
 else{await mkdir("pipeline/output",{recursive:true});await writeFile("pipeline/output/company.json",JSON.stringify(c,null,2));console.log(JSON.stringify({id:c.id,issues:c.qualityIssues,output:"pipeline/output/company.json",dryRun:true}));}
}
main().catch(e=>{console.error((e as Error).message);process.exitCode=1;});
