import { parseExtractions, toCrore, type Extraction, type Page } from "./schema";
export function verifyExtraction(x:Extraction,pages:Page[]) {
  try{parseExtractions([x]);}catch{return {valid:false,reason:"Schema violation"};}
  const page=pages.find(p=>p.page===x.page);
  if(!page || !page.text.includes(x.quote)) return {valid:false,reason:"Exact quote absent on cited page"};
  const numbers=x.quote.match(/(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d+)?/g)??[];
  if(!numbers.some(n=>Number(n.replaceAll(",",""))===x.amount)) return {valid:false,reason:"Amount absent from quote"};
  const unitPattern=x.unit==="crore"?/\bcrores?\b/i:x.unit==="lakh"?/\blakhs?\b/i:/(?:\bINR\b|₹|\bRs\.?)/i;
  if(!unitPattern.test(x.quote)) return {valid:false,reason:"Unit absent from quote"};
  return {valid:true,reason:"Exact page, quote, amount and unit verified"};
}
export interface RoutedItem {answer:Extraction;alternatives:Extraction[];status:"accepted"|"review"|"rejected";reason:string;}
export function routeExtractions(a:Extraction[],b:Extraction[],pages:Page[]):RoutedItem[] {
  const used=new Set<number>();
  const rows:RoutedItem[]=a.map(answer=>{
    const index=b.findIndex((x,i)=>!used.has(i) && x.item.toLowerCase().trim()===answer.item.toLowerCase().trim());
    const other=index<0?undefined:b[index];if(index>=0)used.add(index);
    const verification=verifyExtraction(answer,pages);
    const match=other && verifyExtraction(other,pages).valid && Math.abs(toCrore(answer)-toCrore(other))<1e-9 && answer.category===other.category && answer.direction===other.direction && answer.page===other.page;
    return {answer,alternatives:other?[other]:[],status:!verification.valid?"rejected":match?"accepted":"review",reason:!verification.valid?verification.reason:match?"Independent models agree with verified evidence":"Models disagree or one model omitted the item"};
  });
  b.forEach((answer,i)=>{if(!used.has(i)){const v=verifyExtraction(answer,pages);rows.push({answer,alternatives:[],status:v.valid?"review":"rejected",reason:v.valid?"Only second model found this item":v.reason});}});
  return rows;
}
