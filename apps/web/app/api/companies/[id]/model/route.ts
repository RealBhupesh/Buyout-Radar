import { runLbo,companyAssumptions } from "@buyout/engine";
import { getCompany } from "../../../../../lib/repository";
import { analyze } from "../../../../../lib/research";
import { parseScenario } from "../../../../../lib/scenario";
import { readJson,apiError } from "../../../../../lib/api";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const c=await getCompany((await params).id);if(!c)return apiError("Company not found",404);
 const research=analyze(c);if(research.issues.length)return apiError("Data incomplete: returns are withheld",422);
 try {const a=parseScenario(await readJson(request),companyAssumptions(c)),m=runLbo(c.financials.at(-1)!,c.adjustments,a);
  if(!m.investable)return Response.json({error:"Scenario has an unmodeled funding shortfall",fundingGap:m.fundingGap,projections:m.projections},{status:422});
  return Response.json({dataKind:c.dataKind,assumptions:a,model:m},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError((e as Error).message);}
}
