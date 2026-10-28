import { notFound } from "next/navigation";
import { companyAssumptions } from "@buyout/engine";
import { getCompany } from "../../../lib/repository";
import { scenarioFromQuery } from "../../../lib/scenario";
import { CompanyWorkbench } from "../../../components/company-workbench";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const c=await getCompany((await params).id);return {title:c?.name??"Company not found"};}
export default async function CompanyPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{scenario?:string}>}) {
 const c=await getCompany((await params).id);if(!c)notFound();
 const initial=scenarioFromQuery((await searchParams).scenario,companyAssumptions(c));
 return <CompanyWorkbench company={c} initial={initial.assumptions} linkError={initial.error}/>;
}
