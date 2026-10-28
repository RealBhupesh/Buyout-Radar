import { mkdir,writeFile } from "node:fs/promises";
import { DEMO_COMPANIES } from "../apps/web/lib/demo";
const directory=process.argv[2]||"pipeline/output/seed";await mkdir(directory,{recursive:true});
const fields=Object.keys(DEMO_COMPANIES[0].financials[0]).filter(k=>k!=="year");
for(let index=0;index<DEMO_COMPANIES.length;index++){
 const c=DEMO_COMPANIES[index];const payload={...c,sources:[]};
 const text=JSON.stringify(payload).replaceAll("'","''");
 const sql=`with base as (select '${text}'::jsonb as j), refs as (select jsonb_agg(jsonb_build_object('field',field,'year',f->>'year','filingId',j->>'id'||'-'||(f->>'year'),'page',70+ordinal-1,'url','/api/sources/'||(j->>'id')||'?year='||(f->>'year')||'&field='||field,'title','Fictional FY'||(f->>'year')||' reference ledger','kind','demo')) as list from base,jsonb_array_elements(j->'financials') f,unnest(ARRAY[${fields.map(f=>`'${f}'`).join(",")}]) with ordinality fields(field,ordinal)) select public.ingest_company_bundle(base.j||jsonb_build_object('sources',refs.list),true) from base,refs;`;
 await writeFile(`${directory}/${index}.sql`,sql);
}
console.log(`Wrote ${DEMO_COMPANIES.length} fictional company bundles. Apply only to the dedicated research project.`);
