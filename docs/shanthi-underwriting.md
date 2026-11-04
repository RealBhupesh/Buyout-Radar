# Shanthi Gears FY2026 underwriting

4 November 2026. This is a retrospective scenario for a hypothetical acquisition of 100% of Shanthi Gears Limited. The model pairs a 30 March NSE close of ₹431.30 with standalone FY2026 accounts authorized on 5 May. The exact year-end share count implies ₹3,308.75 crore of historical equity value. The 31 March ownership filing shows 70.4729% promoter-group ownership and zero pledged or otherwise encumbered promoter shares. [NSE cash-market archive](https://archives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_20260330_F_0000.csv.zip) · [FY2026 annual report](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=138) · [March ownership filing](https://www.shanthigears.com/wp-content/uploads/2026/04/Q4-1.pdf#page=2)

## Sourced operating base

Five annual observations cover revenue, profit, cash tax, cash capex, operating cash flow, receivables, inventory, payables, cash, equity and shares. FY2023 and FY2025 use comparative columns in the FY2024 and FY2026 reports. The source register records original PDF and printed page numbers, file fingerprints and each period's reported inputs. [FY2022 annual report](https://www.shanthigears.com/wp-content/uploads/2022/10/Annual-Report-2022-2.pdf#page=43) · [FY2024 annual report](https://www.shanthigears.com/wp-content/uploads/2025/07/Shanthi-Gears_Annual-Report_2024.pdf#page=134) · [FY2026 annual report](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=138)

FY2026 operating EBITDA is ₹99.13 crore. The model starts from ₹102.70 crore of profit before tax, adds ₹16.06 crore of depreciation and amortization and removes ₹19.63 crore of other income. The ₹4.78 crore labour-code charge stays in earnings. Reported operating cash flow of ₹70.10 crore less ₹52.98 crore of cash capex leaves ₹17.12 crore. The model uses the five-year aggregate capex intensity of 4.84% in Base and Recovery and the FY2026 intensity of 10.21% in Downside. The maintenance and expansion split requires diligence. [FY2026 profit and loss](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=139) · [Cash flow](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=141) · [Labour-code note](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=167)

₹0.48 crore of supplier finance is included in reported payables. Reclassifying it as debt-like lowers operating payables to ₹71.97 crore and yields ₹156.49 crore of operating working capital. The model credits only ₹1.33 crore of reported cash equivalents at close. Longer deposits, restricted cash, investments and other non-operating assets are outside the funding and terminal equity calculation. [Supplier-finance note](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=164) · [Cash and deposits](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=158) · [Current investments](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=157)

## Scenario at a 20% illustrative premium

| Case     | Revenue growth | Cumulative margin change | Exit EV / EBITDA | Sponsor IRR |        MOIC | Funding gap |
| -------- | -------------: | -----------------------: | ---------------: | ----------: | ----------: | ----------: |
| Base     |           5.0% |                   0.0 pp |            20.0× |       -8.6% |       0.64× |    ₹0.00 Cr |
| Downside |          -2.0% |                  -3.0 pp |            15.0× | Unavailable | Unavailable |   ₹83.08 Cr |
| Recovery |          10.0% |                   2.0 pp |            28.0× |        5.2% |       1.29× |    ₹0.00 Cr |

A ₹517.56 offer implies ₹3,969.66 crore of entry EV and ₹3,751.66 crore of sponsor equity. The 20% IRR hurdle implies ₹161.15 per share under the Base case with unchanged operating and debt terms. A parallel 20% EBITDA stress creates a ₹12.37 crore funding gap in that case. The model assumes a five-year hold, 3.0× maximum opening leverage, 11% interest, 5% annual original-principal amortization, a 75% cash sweep and fees of 2% of entry EV. These are analyst inputs. The 25.168% cash tax assumption uses the issuer's FY2026 statutory tax reconciliation. [Tax reconciliation](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf#page=170)

The acquisition structure, seller willingness, approvals, lender terms and availability of cash at close require diligence. Independent human sign-off remains pending. The filing-pilot fact CSV and comparison continue to reserve published returns for independently reviewed models.

## Reproduce

- Open `/pilot/pilot-shanthi-gears/underwriting`, select an operating case, adjust the offer premium and export Excel. The workbook carries the chosen assumptions, live formulas, funding and projection schedules, sources and its review status.
- Run `npm run verify:shanthi -- --download` to retrieve the pinned primary documents and NSE archive. It requires `unzip`. Run without the download flag to verify the local files in `pipeline/output/pilot`.
- The verifier checks page locations, fingerprints, the NSE equity row and the ownership disclosure. The unit suite separately checks balance sheets, cash roll-forwards, sources and uses, first-year cash flow, hurdle price and workbook results. Primary-source and mechanical checks are complete for the mapped fields. Independent financial review remains open.
