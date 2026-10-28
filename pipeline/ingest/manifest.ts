import type { Company,FinancialYear } from "../../packages/engine/src/types";
export interface FilingSelection {url:string;year:number;contextId:string;page:number;fields:Partial<Record<keyof FinancialYear,string>>;}
export interface IngestManifest {termsReviewed:boolean;company:Company;filings:FilingSelection[];accountingChecks:{label:string;actual:number;expected:number;tolerance?:number}[];}
export function parseManifest(input:unknown):IngestManifest {
 if(!input||typeof input!=="object")throw new Error("Manifest object required");
 const m=input as IngestManifest;
 if(m.termsReviewed!==true)throw new Error("Review source terms and set termsReviewed before fetching filings");
 if(!m.company||!m.company.id||!Array.isArray(m.company.financials)||!Array.isArray(m.company.sources)||!Array.isArray(m.company.adjustments)||!Array.isArray(m.company.qualityIssues)||!Array.isArray(m.filings)||!Array.isArray(m.accountingChecks))throw new Error("Incomplete manifest structure");
 for(const f of m.filings)if(!f.url||!Number.isInteger(f.year)||!f.contextId||!Number.isInteger(f.page)||f.page<1||!f.fields||typeof f.fields!=="object")throw new Error("Invalid filing selection");
 if(m.company.dataKind!=="verified"&&m.company.dataKind!=="demo")throw new Error("Explicit data kind required");
 if(m.company.dataKind==="verified"&&m.filings.length===0)throw new Error("Verified imports require an explicit filing manifest");
 return m;
}
