import { createClient } from "@supabase/supabase-js";
import type { Company } from "../../packages/engine/src/types";
import { validateCompany, type AccountingCheck } from "./checks";
export async function storeCompany(company:Company,checks:AccountingCheck[]=[],publish=false) {
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error("Configure server-only Supabase credentials");
  const issues=validateCompany(company,checks);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await db.rpc("ingest_company_bundle",{bundle:{...company,qualityIssues:issues},publish});
  if(error)throw new Error(`Ingestion transaction failed: ${error.message}`);
  return {id:company.id,issues,published:publish};
}
