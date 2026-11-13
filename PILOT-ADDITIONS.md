# Official filing pilot additions

Checked 13 November 2026. This checkout adds **Igarashi Motors India** and **Sirca Paints India**: 20 new reported observations, bringing the pilot to **five companies, 13 pinned PDFs and 50 revenue/PAT observations**. Existing company records and their seven source records are unchanged.

Both additions use **standalone** statements for fiscal years ended 31 March. Revenue means revenue from operations, excluding other income; PAT means profit for the year / profit after tax, excluding other comprehensive income. All new source amounts are **INR lakh**; the app divides by 100 once for INR crore. FY2022 comes from the FY2022 report, FY2023/FY2024 from the FY2024 report, and FY2025/FY2026 from the FY2026 report. No figures are estimated.

The exact additional allowlisted hosts are `www.igarashimotors.com` and `www.sircapaints.com`. New entries remain `lboReady: false` and `reviewStatus: independent-review-pending`. Source text checks and software tests do not constitute independent financial review.

## Igarashi Motors India (IGARASHI)

Official discovery: [annual reports](https://www.igarashimotors.com/investor-list.php?invescatid=17). The company statements are standalone; the FY2022, FY2024 and FY2026 directors’ reports say the company has no subsidiary, associate or joint venture (PDF pages 48, 59 and 73 respectively).

| Report | Company-hosted PDF | PDF page (1-based) | Printed page | Units | Years mapped |
| --- | --- | --- | --- | --- | --- |
| igarashi-2022 | [Igarashi Motors India annual report FY2022](https://www.igarashimotors.com/uploads/investor/pdf/16577034429IMIL-30thAGM-AR-13072022.pdf#page=106) | 106 | 104 | INR lakh | FY2022 |
| igarashi-2024 | [Igarashi Motors India annual report FY2024](https://www.igarashimotors.com/uploads/investor/pdf/17210426776Igarashi_Motors_AR_Narrative-Hires-19mb_150724.pdf#page=154) | 154 | 152 | INR lakh | FY2023, FY2024 |
| igarashi-2026 | [Igarashi Motors India annual report FY2026](https://www.igarashimotors.com/uploads/investor/pdf/17871172169IMIL-34th-Annual_Report-IMIL.pdf#page=162) | 162 | 160 | INR lakh | FY2025, FY2026 |

| FY | Revenue from operations (INR lakh) | PAT (INR lakh) | Source |
| --- | ---: | ---: | --- |
| 2022 | 55,640.46 | 119.00 | igarashi-2022 |
| 2023 | 65,624.58 | 523.77 | igarashi-2024 |
| 2024 | 72,504.46 | 957.31 | igarashi-2024 |
| 2025 | 83,842.11 | 2,416.83 | igarashi-2026 |
| 2026 | 86,591.89 | 1,214.66 | igarashi-2026 |

SHA-256 fingerprints of the original PDF bytes:

- `igarashi-2022`: `acf5072a2694f02f110e7413cb93b0c6581e62b15958083cb2b435ee61708b7d` (checked 2026-11-13).
- `igarashi-2024`: `93bb812fa7b10b00dcef1d24de3537cf7dafffd2320ef5d53ea87f14256af448` (checked 2026-11-13).
- `igarashi-2026`: `faf859ce53be6178e3dd8b23c373b1e10d9796b0f2230c7716cd60b9e4767b1a` (checked 2026-11-13).

All ten mapped amounts, their year columns and units were located in `pdftotext -layout` output on the pinned statement pages. FY2026 revenue rises while PAT falls; cash conversion and recurring earnings remain diligence questions.

## Sirca Paints India (SIRCA)

Official discovery: [investor annual reports](https://www.sircapaints.com/investors/). Each selected profit-and-loss statement is explicitly headed standalone. Consolidated statements are excluded.

| Report | Company-hosted PDF | PDF page (1-based) | Printed page | Units | Years mapped |
| --- | --- | --- | --- | --- | --- |
| sirca-2022 | [Sirca Paints India annual report FY2022](https://www.sircapaints.com/wp-content/uploads/2022/06/Annual-Report-FY-21-22-1.pdf#page=103) | 103 | 122 | INR lakh | FY2022 |
| sirca-2024 | [Sirca Paints India annual report FY2024](https://www.sircapaints.com/wp-content/uploads/2024/07/ANNUAL-REPORT-23-24.pdf#page=146) | 146 | 146 | INR lakh | FY2023, FY2024 |
| sirca-2026 | [Sirca Paints India annual report FY2026](https://www.sircapaints.com/wp-content/uploads/2026/07/SIRCA_2026-AR.pdf#page=108) | 108 | 215 | INR lakh | FY2025, FY2026 |

| FY | Revenue from operations (INR lakh) | PAT (INR lakh) | Source |
| --- | ---: | ---: | --- |
| 2022 | 20,002.49 | 2,772.72 | sirca-2022 |
| 2023 | 26,774.94 | 4,611.08 | sirca-2024 |
| 2024 | 31,172.03 | 5,143.72 | sirca-2024 |
| 2025 | 37,367.93 | 4,910.41 | sirca-2026 |
| 2026 | 49,248.41 | 6,505.33 | sirca-2026 |

SHA-256 fingerprints of the original PDF bytes:

- `sirca-2022`: `7da1405880ef25fda82585d5dee03c82b63322daf6845f62492caa75b1f700a1` (checked 2026-11-13).
- `sirca-2024`: `3187b16c5eb11bbd6e6d559da2f1e2d05add21c07e2c14c2ba280b20a71debb8` (checked 2026-11-13).
- `sirca-2026`: `48ce1eebd62ad3f41c1191dd38651c885b086a7640111cc85520d5d5c4b168b3` (checked 2026-11-13).

All ten mapped amounts, their year columns and units were located in `pdftotext -layout` output on the pinned statement pages. PDF page 108 of FY2026 is a two-page spread: the standalone balance sheet is printed page 214 and the profit-and-loss statement is printed page **215**. FY2022 PDF page 103 is printed page **122**.

**Unresolved comparative difference:** FY2025 revenue in the FY2026 standalone comparative is **37,367.93 lakh**. The [company-hosted FY2025 report](https://www.sircapaints.com/wp-content/uploads/2025/08/Annual-Report_-FY-2024-25.pdf#page=150), PDF/printed page 150, reports **37,399.52 lakh**. Both figures were located in their respective PDF text. FY2025 PAT is **4,910.41 lakh** on both pages. The reason for the revenue difference could not be confirmed; no restatement or economic explanation is asserted. The pilot consistently records the requested FY2026 comparative and exposes this discrepancy in the company observations. The FY2025 cross-check document is not an additional mapped pilot source.

## Exclusions and limits

- No mapped revenue/PAT amount remains unconfirmed. Sirca’s explanation for the comparative difference remains unconfirmed as described above.
- No additional candidate was rejected in this resumed run. The surviving interrupted work contained two candidates, both retained after source checks. No evidence of other candidates or rejection reasons was available; none are invented. Work stopped at two companies to prioritize source quality.
- Full transaction inputs (cash-flow normalization, maintenance capex, working capital, cash/borrowings, valuation, ownership/control feasibility and financing) and independent review remain incomplete. No LBO or investment-return claim is added.
- PDFs and extracted text remain ignored under `pipeline/output/pilot/`; only amounts, page references, URLs and fingerprints ship in the repository. No dependencies, remotes, push or deployment are added.

## Verification

For each new mapped document, `pdftotext -layout -f PAGE -l PAGE pipeline/output/pilot/SOURCE_ID.pdf -` was used to read the complete statement page, including revenue/PAT labels, year columns and original units. SHA-256 and numeric-token location checks are also run by the pilot verifier; those checks alone do not establish accounting meaning or independent review.

Final-tree results (13 Nov 2026, 13:56-14:01 IST): `npm run typecheck` clean; `npm test` 14 files / 82 tests pass; `npm run verify:pilot -- --download` refetched all 13 PDFs, every SHA-256 matched and all 50 observations were located. All 20 new amounts were then inspected visually on the rendered original PDF pages (including comparative columns). Playwright e2e was not run. This is source verification, not independent financial review.
