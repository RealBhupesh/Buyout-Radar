import type { Adjustment, FinancialYear } from "./types";
export function normalizedEbitda(reported: number, adjustments: Adjustment[], year: number): number {
  return reported + adjustments.filter(a => a.status === "accepted" && a.year === year)
    .reduce((sum,a) => sum+a.amount,0);
}
export function cashMetrics(financials: FinancialYear[]) {
  const sorted = [...financials].sort((a,b)=>a.year-b.year);
  const years = sorted.map((f,i) => {
    const wc = f.receivables+f.inventory-f.payables;
    const prev=sorted[i-1];
    const deltaWC=prev ? wc-(prev.receivables+prev.inventory-prev.payables) : null;
    const freeCashFlow=deltaWC===null ? null : f.ebitda-f.taxPaid-f.capex-deltaWC;
    return { year:f.year, workingCapital:wc, deltaWC, freeCashFlow,
      conversion:freeCashFlow===null || f.ebitda<=0 ? null : freeCashFlow/f.ebitda,
      receivableDays:f.revenue>0?f.receivables/f.revenue*365:null,
      inventoryDays:f.revenue>0?f.inventory/f.revenue*365:null,
      payableDays:f.revenue>0?f.payables/f.revenue*365:null,
      workingCapitalDays:f.revenue>0?wc/f.revenue*365:null };
  });
  const eligible=years.flatMap(y=>y.conversion===null?[]:[y.conversion]);
  return { years, averageConversion:eligible.length?eligible.reduce((a,b)=>a+b,0)/eligible.length:null };
}
