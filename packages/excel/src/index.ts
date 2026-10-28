import ExcelJS from "exceljs";
import { runLbo,sensitivity,validateFinancials,type Company,type Assumptions } from "@buyout/engine";
import { addModel } from "./model";
import { styleWorkbook } from "./style";
export async function buildWorkbook(c:Company,a:Assumptions):Promise<Uint8Array> {
 if(c.qualityIssues.length || validateFinancials(c.financials).length)throw new Error("Data incomplete: export blocked until evidence checks pass");
 const w=new ExcelJS.Workbook();w.creator="Buyout Radar";w.calcProperties.fullCalcOnLoad=true;
 const read=w.addWorksheet("Read me");
 read.addRow([c.name]);read.addRow([c.dataKind==="demo"?"FICTIONAL DEMONSTRATION DATA. NOT AN EXCHANGE FILING.":"Published filing-backed research"]);
 read.addRow(["Units","All monetary values in INR crore. Shares are absolute units."]);
 read.addRow(["How to use","Edit Inputs, then recalculate in Excel. Ten forecast years support hold periods 1 to 10."]);
 read.addRow(["Economics","Opening debt interest; mandatory repayment then cash sweep; no interim dividends."]);
 read.addRow(["Risk","Funding shortfalls invalidate returns. No assumption is a financing offer."]);
 read.addRow(["Sensitivity","Current scenario snapshots. Re-export after changing browser assumptions."]);
 read.addRow(["Caveats","Revenue denominator used for inventory/payable days. Tax rate is an editable scenario."]);
 const history=w.addWorksheet("History");history.addRow(["Historical financials","INR crore"]);history.addRow(["Financial year",...c.financials.map(f=>f.year)]);
 const fields=["revenue","ebitda","depreciation","interest","taxPaid","pat","receivables","inventory","payables","capex","cash","debt","equity","shares"] as const;
 // Fixed source locations keep the model readable and auditable.
 const historyRows:Record<string,number>={revenue:3,ebitda:4,depreciation:5,interest:6,taxPaid:7,pat:8,receivables:9,inventory:10,payables:11,capex:12,cash:15,debt:16,equity:17,shares:18};
 for(const field of fields){const row=historyRows[field];history.getCell(row,1).value=field;for(let j=0;j<c.financials.length;j++)history.getCell(row,j+2).value=c.financials[j][field];}
 const accepted=c.adjustments.filter(x=>x.status==="accepted"&&x.year===c.financials.at(-1)!.year);
 if(accepted.length>17)throw new Error("Export supports at most 17 current-year adjustments; consolidate reviewed items first");
 accepted.forEach((x,j)=>{history.getCell(19+j,1).value=x.label;history.getCell(19+j,6).value=x.amount;});
 addModel(w,c,a);
 // Put the history before funding in the reading order.
 const s=w.addWorksheet("Sensitivity");s.addRow(["Entry vs exit multiple","IRR snapshots at export assumptions"]);
 const grid=sensitivity(c.financials.at(-1)!,c.adjustments,a,"multiples");s.addRow(["Entry / exit",...grid.columns]);grid.rows.forEach((row,j)=>s.addRow([row,...grid.cells[j].map(v=>v??"Unfunded")]));
 const e=w.addWorksheet("Evidence");e.addRow(["Field-level evidence",c.dataKind]);e.addRow(["Field","Year","Filing","Page","Source","Kind"]);
 c.sources.forEach(ref=>e.addRow([ref.field,ref.year,ref.filingId,ref.page,ref.url,ref.kind]));
 e.addRow(["Accepted normalization adjustments"]);accepted.forEach(x=>e.addRow([x.label,x.year,x.filingId,x.page,x.quote,x.amount]));
 // The input sheet must precede history in the visible workbook ordering.
 const order=["Read me","Inputs","History","Sources & uses","Projection","Returns","Sensitivity","Evidence"];
 for(const sheet of w.worksheets)sheet.orderNo=order.indexOf(sheet.name);
 styleWorkbook(w);
 for(const row of [6,7,8,10,11,12,13,14,15,16,18])w.getWorksheet("Inputs")!.getCell(row,2).numFmt="0.0%";
 w.getWorksheet("Returns")!.getCell("B8").numFmt="0.0%";
 w.getWorksheet("Sensitivity")!.eachRow((row,n)=>{if(n>2)for(let j=2;j<=6;j++)row.getCell(j).numFmt="0.0%";});
 w.getWorksheet("Evidence")!.getColumn(5).width=85;
 w.getWorksheet("Read me")!.getColumn(2).width=100;
 const buffer=await w.xlsx.writeBuffer();return new Uint8Array(buffer);
}
