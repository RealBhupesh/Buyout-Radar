import ExcelJS from "exceljs";
import { runLbo, type Assumptions, type Company } from "@buyout/engine";
const formula = (expression: string, result: number | string) => ({
  formula: expression,
  result,
});
export function addModel(
  workbook: ExcelJS.Workbook,
  c: Company,
  a: Assumptions,
) {
  const base = c.financials.at(-1)!,
    model = runLbo(base, c.adjustments, a);
  const i = workbook.getWorksheet("Inputs")!;
  i.addRow(["Editable assumptions", c.name]);
  i.addRow(["Amounts in INR crore", "Rates are decimal percentages"]);
  const inputs: [string, number][] = [
    ["Entry multiple", a.entryMultiple],
    ["Exit multiple", a.exitMultiple],
    ["Leverage cap", a.leverage],
    ["Interest rate", a.interestRate],
    ["Tax rate", a.taxRate],
    ["Cash sweep", a.cashSweep],
    ["Hold years", a.holdYears],
    ["Transaction fees", a.feesRate],
    ["Revenue growth", a.growthRate],
    ["Total margin expansion", a.marginExpansion],
    ["Capex / revenue", a.capexRate],
    ["Depreciation / revenue", a.depreciationRate],
    ["Working capital / revenue", a.workingCapitalRate],
    ["Mandatory amortization", a.amortizationRate],
    ["Interest cover floor", a.coverageFloor],
    ["Hurdle IRR", a.hurdleRate],
  ];
  for (const row of inputs) i.addRow(row);
  i.addRow(["Base financials", "Source: Historical and Evidence"]);
  i.addRow([
    "Normalized entry EBITDA",
    formula(`Historical!F4+SUM(Historical!F19:F35)`, model.entryEbitda),
  ]);
  i.addRow(["Base revenue", formula("Historical!F3", base.revenue)]);
  i.addRow(["Existing debt", formula("Historical!F16", base.debt)]);
  i.addRow(["Existing cash", formula("Historical!F15", base.cash)]);
  i.addRow(["Base year", base.year]);
  for (let row = 3; row <= 18; row++) {
    i.getCell(row, 2).font = { color: { argb: "FF3159A5" } };
    i.getCell(row, 2).dataValidation = {
      type: "decimal",
      operator: "between",
      formulae: [
        row === 11 ? -0.99 : 0,
        row === 9
          ? 10
          : row === 3 || row === 4
            ? 30
            : row === 5
              ? 10
              : row === 17
                ? 20
                : row === 18
                  ? 2
                  : 1,
      ],
      showErrorMessage: true,
      errorTitle: "Invalid assumption",
      error: "Use a value in the permitted range.",
    };
  }
  i.getCell("B9").dataValidation = {
    type: "whole",
    operator: "between",
    formulae: [1, 10],
    showErrorMessage: true,
    error: "Hold must be a whole year from 1 to 10",
  };
  const su = workbook.addWorksheet("Sources & uses");
  su.addRow(["Transaction funding", "INR crore"]);
  su.addRow([
    "No double-counting target cash",
    "Existing debt fully refinanced",
  ]);
  su.addRow([
    "Entry enterprise value",
    formula("Inputs!B20*Inputs!B3", model.entryEV),
  ]);
  su.addRow(["Transaction fees", formula("B3*Inputs!B10", model.fees)]);
  su.addRow([
    "New debt",
    formula(
      "MIN(Inputs!B20*Inputs!B5,Inputs!B20/(Inputs!B6*Inputs!B17))",
      model.initialDebt,
    ),
  ]);
  su.addRow([
    "Purchase equity",
    formula("B3-Inputs!B22+Inputs!B23", model.purchaseEquity),
  ]);
  su.addRow(["Refinanced existing debt", formula("Inputs!B22", base.debt)]);
  su.addRow(["Target cash funding", formula("Inputs!B23", base.cash)]);
  su.addRow(["Total uses", formula("B6+B7+B4", model.totalUses)]);
  su.addRow(["Sponsor equity", formula("B9-B5-B8", model.sponsorEquity)]);
  su.addRow(["Sources less uses", formula("B5+B8+B10-B9", 0)]);
  const p = workbook.addWorksheet("Projection");
  p.addRow([
    "Cash and debt schedule",
    "All ten years recalculate; hold selects the exit year",
  ]);
  p.addRow([
    "Financial year",
    ...Array.from({ length: 10 }, (_, n) => base.year + n + 1),
  ]);
  const labels = [
    "Revenue",
    "EBITDA",
    "Depreciation",
    "Opening debt",
    "Cash interest",
    "Cash tax",
    "Capex",
    "Increase in working capital",
    "Free cash flow after interest",
    "Mandatory repayment",
    "Cash sweep",
    "Closing debt",
    "Opening cash",
    "Funding shortfall",
    "Closing cash",
    "Interest coverage",
  ];
  labels.forEach((label) => p.addRow([label]));
  const all = runLbo(base, c.adjustments, {
    ...a,
    holdYears: 10,
    marginExpansion: (a.marginExpansion * 10) / a.holdYears,
  });
  for (let n = 0; n < 10; n++) {
    const col = String.fromCharCode(66 + n),
      prev = String.fromCharCode(65 + n),
      v = all.projections[n];
    const f = (row: number, s: string, result: number | string) =>
      (p.getCell(`${col}${row}`).value = formula(s, result));
    f(3, `Inputs!B21*(1+Inputs!B11)^${n + 1}`, v.revenue);
    f(
      4,
      `${col}3*(Inputs!B20/Inputs!B21+Inputs!B12*${n + 1}/Inputs!B9)`,
      v.ebitda,
    );
    f(5, `${col}3*Inputs!B14`, v.depreciation);
    f(6, n ? `${prev}14` : "'Sources & uses'!B5", v.openingDebt);
    f(7, `${col}6*Inputs!B6`, v.interest);
    f(8, `MAX(0,${col}4-${col}5-${col}7)*Inputs!B7`, v.tax);
    f(9, `${col}3*Inputs!B13`, v.capex);
    f(10, `(${col}3-${n ? `${prev}3` : "Inputs!B21"})*Inputs!B15`, v.deltaWC);
    f(11, `${col}4-${col}7-${col}8-${col}9-${col}10`, v.freeCashFlow);
    f(12, `MIN(${col}6,'Sources & uses'!B5*Inputs!B16)`, v.mandatory);
    f(13, `MIN(${col}6-${col}12,MAX(0,${col}11-${col}12)*Inputs!B8)`, v.sweep);
    f(14, `MAX(0,${col}6-${col}12-${col}13)`, v.closingDebt);
    f(15, n ? `${prev}17` : "0", n ? all.projections[n - 1].cash : 0);
    f(16, `MAX(0,${col}12-${col}11-${col}15)`, v.fundingGap);
    f(
      17,
      `MAX(0,${col}15-MAX(0,${col}12-${col}11))+MAX(0,${col}11-${col}12-${col}13)`,
      v.cash,
    );
    f(
      18,
      `IF(${col}7=0,"Unlevered",${col}4/${col}7)`,
      v.coverage ?? "Unlevered",
    );
  }
  const r = workbook.addWorksheet("Returns");
  r.addRow(["Sponsor returns", "INR crore"]);
  r.addRow([
    "Exit selected by hold years",
    "Unfunded models have no investment return",
  ]);
  r.addRow([
    "Exit EBITDA",
    formula(
      "INDEX(Projection!B4:K4,1,Inputs!B9)",
      model.projections.at(-1)!.ebitda,
    ),
  ]);
  r.addRow(["Exit enterprise value", formula("B3*Inputs!B4", model.exitEV)]);
  r.addRow([
    "Exit debt",
    formula(
      "INDEX(Projection!B14:K14,1,Inputs!B9)",
      model.projections.at(-1)!.closingDebt,
    ),
  ]);
  r.addRow([
    "Exit cash",
    formula(
      "INDEX(Projection!B17:K17,1,Inputs!B9)",
      model.projections.at(-1)!.cash,
    ),
  ]);
  r.addRow(["Exit equity", formula("MAX(0,B4-B5+B6)", model.exitEquity)]);
  r.addRow([
    "Sponsor IRR",
    formula(
      `IF(B14>0,"Unfunded",IF(B7=0,-1,(B7/'Sources & uses'!B10)^(1/Inputs!B9)-1))`,
      model.investable ? (model.irr ?? "Unavailable") : "Unfunded",
    ),
  ]);
  r.addRow([
    "MOIC",
    formula(
      `IF(B14>0,"Unfunded",B7/'Sources & uses'!B10)`,
      model.moic ?? "Unfunded",
    ),
  ]);
  r.addRow([
    "EBITDA growth contribution",
    formula("(B3-Inputs!B20)*Inputs!B3", model.bridge.growth),
  ]);
  r.addRow([
    "Multiple contribution",
    formula("(Inputs!B4-Inputs!B3)*B3", model.bridge.multiple),
  ]);
  r.addRow([
    "Net debt reduction",
    formula("'Sources & uses'!B5-B5+B6", model.bridge.deleveraging),
  ]);
  r.addRow([
    "Fees contribution",
    formula("-'Sources & uses'!B4", model.bridge.fees),
  ]);
  r.addRow([
    "Total funding shortfall",
    formula(
      "SUM(Projection!B16:INDEX(Projection!B16:K16,1,Inputs!B9))",
      model.fundingGap,
    ),
  ]);
  r.addRow([
    "Bridge reconciliation",
    formula("SUM(B10:B13)+B16-(B7-'Sources & uses'!B10)", 0),
  ]);
  r.addRow([
    "Limited liability floor",
    formula("MAX(0,-(B4-B5+B6))", model.bridge.equityFloor),
  ]);
  return model;
}
