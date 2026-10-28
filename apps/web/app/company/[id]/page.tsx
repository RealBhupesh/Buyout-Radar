import { notFound } from "next/navigation";
import { companyAssumptions } from "@buyout/engine";
import { getCompany } from "../../../lib/repository";
import { scenarioFromQuery } from "../../../lib/scenario";
import { CompanyWorkbench } from "../../../components/company-workbench";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const c=await getCompany((await params).id);return {title:c?.name??"Company not found"};}
export default async function CompanyPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{scenario?:string}>}) {
 const c=await getCompany((await params).id);if(!c)notFound();
 if(c.financials.length===0)return <div className="page error-page"><h1>{c.name}</h1><p role="alert">Data incomplete: no financial history is available. Returns are withheld until the required statements and sources are published.</p></div>;
 const initial=scenarioFromQuery((await searchParams).scenario,companyAssumptions(c));
 return <CompanyWorkbench company={c} initial={initial.assumptions} linkError={initial.error}/>;
}
