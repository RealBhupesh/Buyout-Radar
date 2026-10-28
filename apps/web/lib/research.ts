import { cashMetrics, companyAssumptions, normalizedEbitda, runLbo, validateFinancials, type Company } from "@buyout/engine";
export function analyze(company:Company) {
  const issues=[...company.qualityIssues,...validateFinancials(company.financials)];
  const assumptions=companyAssumptions(company), latest=company.financials.at(-1)!;
  const model=runLbo(latest,company.adjustments,assumptions);
  const cash=cashMetrics(company.financials);
  const valid=issues.length===0 && model.investable;
  return {company,assumptions,latest,model,cash,valid,issues,
    ebitda:normalizedEbitda(latest.ebitda,company.adjustments,latest.year),
    irr:valid?model.irr:null,
    verdict:!valid?"Data incomplete":model.irr!==null && model.irr>=assumptions.hurdleRate?"Worth a closer look":"Price discipline required"};
}
export type Research=ReturnType<typeof analyze>;
export interface BuyBox {search:string;sector:string;minIrr:number;minConversion:number;maxPledge:number;minCap:number;maxCap:number;onlyQualified:boolean;sort:"irr"|"conversion"|"marketCap";}
export const DEFAULT_BUY_BOX:BuyBox={search:"",sector:"All sectors",minIrr:0.2,minConversion:0.4,maxPledge:5,minCap:1000,maxCap:20000,onlyQualified:false,sort:"irr"};
export function inBuyBox(r:Research,b:BuyBox) {return r.valid && r.irr!==null && r.irr>=b.minIrr && (r.cash.averageConversion??-1)>=b.minConversion && r.company.pledgedPct<=b.maxPledge && r.company.marketCap>=b.minCap && r.company.marketCap<=b.maxCap;}
export function screen(rows:Research[],b:BuyBox,watchIds?:string[]) {
  return rows.filter(r=>(!watchIds || watchIds.includes(r.company.id)) && `${r.company.name} ${r.company.ticker}`.toLowerCase().includes(b.search.toLowerCase()) && (b.sector==="All sectors" || r.company.sector===b.sector) && (!b.onlyQualified || inBuyBox(r,b)))
    .sort((a,z)=>b.sort==="irr"?(z.irr??-Infinity)-(a.irr??-Infinity):b.sort==="conversion"?(z.cash.averageConversion??-Infinity)-(a.cash.averageConversion??-Infinity):z.company.marketCap-a.company.marketCap);
}
