import type { Adjustment, Assumptions, FinancialYear, LboResult, Projection } from "./types";
import { normalizedEbitda } from "./earnings";
import { debtCapacity } from "./debt";
import { irr } from "./irr";
import { validateAssumptions } from "./validation";
export function runLbo(base:FinancialYear, adjustments:Adjustment[], a:Assumptions):LboResult {
  const errors=validateAssumptions(a);
  if(Object.values(base).some(v=>!Number.isFinite(v)) || base.revenue<=0 || base.debt<0 || base.cash<0) errors.push("Invalid base financials");
  const entryEbitda=normalizedEbitda(base.ebitda,adjustments,base.year);
  if(entryEbitda<=0) errors.push("Positive normalized EBITDA required");
  if(errors.length) throw new Error(errors.join("; "));
  const entryEV=entryEbitda*a.entryMultiple, fees=entryEV*a.feesRate;
  const initialDebt=debtCapacity(entryEbitda,a.leverage,a.interestRate,a.coverageFloor).maxDebt;
  const purchaseEquity=entryEV-base.debt+base.cash;
  const totalUses=purchaseEquity+base.debt+fees;
  const sponsorEquity=totalUses-initialDebt-base.cash;
  if(sponsorEquity<=0 || purchaseEquity<0) throw new Error("Transaction requires positive sponsor and purchase equity");
  const projections:Projection[]=[];
  let debt=initialDebt, cash=0, prevRevenue=base.revenue;
  for(let year=1;year<=a.holdYears;year++) {
    const revenue=base.revenue*Math.pow(1+a.growthRate,year);
    const ebitda=revenue*(entryEbitda/base.revenue+a.marginExpansion*year/a.holdYears);
    const depreciation=revenue*a.depreciationRate;
    const interest=debt*a.interestRate;
    const tax=Math.max(0,ebitda-depreciation-interest)*a.taxRate;
    const capex=revenue*a.capexRate;
    const deltaWC=(revenue-prevRevenue)*a.workingCapitalRate;
    const freeCashFlow=ebitda-interest-tax-capex-deltaWC;
    const mandatory=Math.min(debt,initialDebt*a.amortizationRate);
    const afterMandatory=freeCashFlow-mandatory;
    const sweep=Math.min(debt-mandatory,Math.max(0,afterMandatory)*a.cashSweep);
    const shortfall=Math.max(0,-afterMandatory);
    const fundingGap=Math.max(0,shortfall-cash);
    cash=Math.max(0,cash-shortfall)+Math.max(0,afterMandatory-sweep);
    const closingDebt=Math.max(0,debt-mandatory-sweep);
    projections.push({year:base.year+year,revenue,ebitda,depreciation,interest,tax,capex,deltaWC,freeCashFlow,openingDebt:debt,mandatory,sweep,closingDebt,cash,fundingGap,coverage:interest>0?ebitda/interest:null});
    debt=closingDebt;prevRevenue=revenue;
  }
  const exitEbitda=projections.at(-1)!.ebitda;
  const exitEV=exitEbitda*a.exitMultiple;
  const exitEquity=Math.max(0,exitEV-debt+cash);
  const growth=(exitEbitda-entryEbitda)*a.entryMultiple;
  const multiple=(a.exitMultiple-a.entryMultiple)*exitEbitda;
  const deleveraging=initialDebt-debt+cash;
  const fundingGap=projections.reduce((sum,p)=>sum+p.fundingGap,0);
  const wipeoutAdjustment=Math.max(0,-(exitEV-debt+cash));
  return {entryEbitda,entryEV,purchaseEquity,refinancedDebt:base.debt,existingCash:base.cash,fees,initialDebt,sponsorEquity,totalUses,projections,exitEV,exitEquity,moic:exitEquity/sponsorEquity,irr:irr([-sponsorEquity,...Array(a.holdYears-1).fill(0),exitEquity]),fundingGap,investable:fundingGap<1e-8 && projections.every(p=>p.ebitda>0),bridge:{growth,multiple,deleveraging:deleveraging+wipeoutAdjustment,fees:-fees,total:exitEquity-sponsorEquity}};
}
