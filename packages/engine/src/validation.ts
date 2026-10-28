import type { Assumptions, FinancialYear } from "./types";
export function validateAssumptions(a:Assumptions):string[] {
  const errors:string[]=[];
  for(const [k,v] of Object.entries(a)) if(!Number.isFinite(v)) errors.push(`${k} must be finite`);
  for(const k of ["interestRate","taxRate","cashSweep","feesRate","capexRate","depreciationRate","workingCapitalRate","amortizationRate"] as const)
    if(a[k]<0 || a[k]>1) errors.push(`${k} must be between 0 and 1`);
  if(a.interestRate<=0) errors.push("Interest rate must be positive");
  if(a.entryMultiple<=0 || a.entryMultiple>100 || a.exitMultiple<0 || a.exitMultiple>100) errors.push("Invalid valuation multiple");
  if(a.leverage<0 || a.leverage>10) errors.push("Leverage must be between 0 and 10");
  if(!Number.isInteger(a.holdYears) || a.holdYears<1 || a.holdYears>10) errors.push("Hold period must be 1 to 10 whole years");
  if(a.growthRate<=-1 || a.growthRate>1) errors.push("Growth must be greater than -100% and at most 100%");
  if(a.marginExpansion< -1 || a.marginExpansion>1) errors.push("Invalid margin expansion");
  if(a.coverageFloor<=0 || a.hurdleRate<=-1 || a.hurdleRate>2) errors.push("Invalid hurdle or coverage floor");
  return errors;
}
export function validateFinancials(years:FinancialYear[]):string[] {
  const errors:string[]=[];
  if(years.length<5) errors.push("Five financial years required");
  const sorted=[...years].sort((a,b)=>a.year-b.year);
  if(new Set(years.map(f=>f.year)).size!==years.length) errors.push("Duplicate financial year");
  for(const [i,f] of sorted.entries()) {
    if((["year","revenue","ebitda","depreciation","interest","taxPaid","pat","receivables","inventory","payables","capex","cash","debt","equity","shares"] as const).some(k=>typeof f[k]!=="number"||!Number.isFinite(f[k]))) errors.push(`FY${f.year}: nonfinite financial value`);
    if(f.revenue<=0 || f.shares<=0 || f.capex<0 || f.cash<0 || f.debt<0 || f.inventory<0 || f.receivables<0 || f.payables<0 || f.depreciation<0 || !Number.isInteger(f.year)) errors.push(`FY${f.year}: invalid financial values`);
    if(i>0 && f.year!==sorted[i-1].year+1) errors.push("Financial history has a year gap");
  }
  if(years.filter(f=>f.ebitda>0).length<4) errors.push("Positive EBITDA in fewer than four years");
  return [...new Set(errors)];
}
