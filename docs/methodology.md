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

## Analysis layer

These functions sit on top of the model above and never change its cash-flow arithmetic, so the workbook and the engine still agree line for line.

Exit-year returns hold the operating plan and debt schedule fixed and move only the sale date. The margin path stays anchored to the scenario hold. Every exit from the first unfunded year onward is withheld.

The hurdle price is the entry EV that earns the target IRR exactly. New debt is sized on EBITDA, so a higher price is paid entirely in sponsor equity: hurdle EV = (exit equity / (1 + target)^hold + new debt) / (1 + fee rate). Headroom is that price against the scenario price.

EBITDA headroom is the largest parallel shortfall against plan before each of three tests fails: an interim funding gap, interest cover below the scenario floor, and exit equity below the sponsor cheque. Capex and working capital stay at plan. A null result means the test already fails with no shock. The 20% stress is the same schedule at a fixed shock.

Each forecast year reports closing net debt / EBITDA and debt service cover: (EBITDA less tax, capex and working capital) over (interest plus mandatory repayment).

Cases are named assumption overrides on one base year. With probabilities that sum to one, the expected multiple weights each case's MOIC and counts an unfunded or invalid case as a total loss. Expected IRR annualizes that multiple; it is not an average of IRRs.

## Market price and deal structure

Radar's stored entry multiple is close to the trading multiple, so its headline IRR assumes no control premium. `impliedPremium` states the scenario's equity price against recorded market value, and the analysis reprices the same scenario at market plus a premium (20% by default) so both returns can be read together.

The structuring screen assumes a promoter purchase triggers an open offer and models 26% of shares, capped at the available public float. It tests the 75% non-public ownership ceiling using the buyer and retained promoters. It measures the gap to 90% using the buyer's stake alone, assuming no persons acting in concert. Reaching 90% in the model does not establish completion of delisting. Offer-price floors, reverse book building, exemptions, creeping acquisitions and tax are outside this calculation. [SEBI takeover regulations](https://www.sebi.gov.in/legal/regulations/dec-2025/securities-and-exchange-board-of-india-substantial-acquisition-of-shares-and-takeovers-regulations-2011-last-amended-on-december-5-2025-_98643.html) · [SEBI delisting regulations](https://www.sebi.gov.in/sebi_data/attachdocs/sep-2025/1757504840794.pdf)

The LBO assumes 100% ownership with acquisition debt serviced by target cash flows. Any structure with outside shareholders requires a separate financing and cash access analysis. Per-share prices are quoted only for verified companies, whose share counts are absolute.

## Screening score

Historical quality uses reported statements only: revenue CAGR, average EBITDA margin and its standard deviation, EBIT over closing equity plus borrowings, net debt / EBITDA, capex / revenue, average cash conversion and the drift in working-capital days.

The fit score maps seven of those onto 0 to 1 between a worst and best threshold and weights them: cash conversion 25, margin stability 15, margin level 15, growth 15, capital intensity 10, existing leverage 10, return on capital 10. Missing factors are dropped and the rest renormalized, with coverage reported. The thresholds are judgment calls for mid-cap industrial companies and have not been validated against outcomes. The score ranks businesses, not prices; read it beside IRR.
