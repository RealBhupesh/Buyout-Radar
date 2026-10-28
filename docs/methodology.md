# Model methodology

Money: INR crore. Data: fictional fixtures at launch. Shares: absolute units in production imports. Sample share counts are illustrative only. Rates: decimal fractions.

Normalized EBITDA includes only accepted items for the current year. Historical FCF excludes interest: EBITDA less tax paid, capex and delta net working capital. Five annual statements support four changes, not five. Working capital days use revenue for all components; COGS-based inventory and payable days are not available in this field set.

The acquisition refinances existing debt. Uses = (entry EV - old debt + old cash) + old debt + fees. Sources = new debt + sponsor equity + target cash. Therefore sponsor equity = EV + fees - new debt. Target cash is consumed at close, not added again to year-one cash. Acquisition debt is limited by both leverage and initial interest coverage. Positive sponsor and purchase equity are required.

Revenue grows geometrically. Margin shifts linearly to the total margin change over the hold. Cash taxes apply to positive EBITDA less depreciation and interest. Interest uses opening debt, a conservative convention. Mandatory repayments are a fraction of initial debt, capped by remaining debt. Sweep applies after mandatory repayment. Unswept cash accumulates and can cover future shortfalls. Unfunded balances invalidate a scenario because additional equity or financing is not modeled.

Exit equity is floored at zero. No interim sponsor distributions. Standard conventional cash flows have one initial negative and nonnegative subsequent flows. The IRR solver deliberately rejects multiple sign changes. For a single terminal distribution, the annualized MOIC formula agrees with IRR.

The bridge is EBITDA growth at entry multiple, multiple change on exit EBITDA, net debt reduction including retained cash, and negative transaction fees. If terminal equity is underwater the equity floor must be identified separately from true debt repayment. The engine identities and export regressions enforce reconciliation.

A 20% EBITDA stress is a parallel annual EBITDA shock with fixed opening acquisition debt, recalculated taxes, debt repayments and cash. It reports first coverage breach and funding shortfall separately. No claim is made about legal covenant definitions.

Sensitivity cells recalculate the full engine. Reverse solving is bounded and holds all other assumptions constant. An unreachable hurdle returns no result. The workbook contains ten years and selects exit by hold years; changing a browser assumption produces a new workbook. Sensitivities are labeled snapshots; they are not Excel data tables.

Defaults follow the supplied plan and are not independently validated Indian financing or tax advice. No financing offer, take-private feasibility or investment recommendation is implied.
