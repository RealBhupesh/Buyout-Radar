# Analyst workflow and official filing pilot

28 October 2026. Intended audience: buyout investors and acquisition analysts.

## What changed

The existing research workspace now places a decision brief before the model return: minimum interest coverage, additional funding required, the 20% EBITDA stress outcome and evidence status. It explains the difference between the saved screening hurdle and the active scenario hurdle without changing explicit scenario assumptions.

Sources use financial labels and earnings, cash/working-capital, and balance-sheet/ownership groups. Notes and diligence have direct section links. Saved Research summarizes saved records, active reviews, overdue actions and upcoming dated actions. Empty model views link to Radar. Saved pilot profiles use the same private notes, stages, tasks, actions and backup records. CSV exports include every matching model and pilot record, preserving unavailable returns. Persisted sector selections remain visible across navigation.

The opportunity map offers a precise company selector and a clearly labeled expanded axis view. Real plotted values are preserved. A filtered-away focus no longer dims every remaining point. Chart labels retain their rendered size inside contained scroll regions on small screens.

Controlled source dialogs now restore keyboard focus to their opening financial number. The existing Radix primitives continue to handle modal focus containment and dismissal.

## Pilot publication boundary

The new `/pilot` directory and three company profiles contain 30 checked reported observations: five annual revenue and profit-after-tax pairs per company, FY2022–2026. All use standalone reporting. Lakh-denominated figures divide by 100 to reach crore; tables preserve four decimal places where required. The source inspector retains original amounts and units, PDF and printed page numbers, official document links, check dates and SHA-256 fingerprints. Only factual observations and references are included in the repository. Source PDFs and extracted report text remain in ignored local pipeline output.

| Company          | Official sources                                                                                                                                                                                                                                                                                           | Mapped PDF pages                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Shanthi Gears    | [FY2026 annual report](https://www.shanthigears.com/wp-content/uploads/2026/07/Annual-Report-2025-26.pdf)                                                                                                                                                                                                  | 24, five-year observations from ten-year highlights |
| RACL Geartech    | [FY2026](https://www.raclgeartech.com/uploads/prospectus/634ipdctfile_AnnualReportandAGMNotice.pdf), [FY2024](https://www.raclgeartech.com/uploads/prospectus/443ipdctfile_AnnualReportofyear.pdf), [FY2022](https://www.raclgeartech.com/uploads/prospectus/5ipdctfile_AnnualReportfortheYear2021-22.pdf) | 156, 137, 80                                        |
| Mayur Uniquoters | [FY2026](https://www.mayuruniquoters.com/pdf/annual-report-2025-26.pdf), [FY2024](https://www.mayuruniquoters.com/pdf/annual-report-2023-24.pdf), [FY2022](https://www.mayuruniquoters.com/pdf/annual-report-2021-22.pdf)                                                                                  | 23, 19, 15                                          |

The pilot supports inspection, reported-history charts and comparisons, sourced CSV downloads, saved research, private notes, diligence and printed memos. CAGR uses four annual intervals between five observations. Pilot financial inputs never enter the finance engine: they are a separate typed partial record rather than a Company filled with guessed values.

**This is a source-checked filing pilot, not an independently verified acquisition model.** Full cash-flow normalization, dated valuation, ownership and pledge data, financing terms, acquisition perimeter and independent model review remain outstanding. Model IRR and MOIC are unavailable in the pilot, its comparison, CSV and printed memo. Completing a personal task does not change publication status. The fictional universe remains labeled and supports complete model demonstrations.

No database schema, publication policy, finance formula, authentication or server mutation endpoint was changed. The immutable pilot fact set ships with the application; personal research remains browser-local. Backups contain personal research records and source-record identities, not copies of official filings. Hosting analytics, if configured separately, are unaffected; product usage analytics are not part of this release.

## Reproduce source checks

`npm run verify:pilot -- --download` retrieves only the seven pinned official HTTPS URLs, caps documents at 25 MB, validates fingerprints and checks that mapped numeric tokens are present on the mapped PDF pages. With the downloaded documents already in `pipeline/output/pilot`, `npm run verify:pilot` performs the same checks offline. The check does not establish reporting meaning or independent human review; selected original pages were also rendered and visually inspected during preparation.

## Verification

- TypeScript and production build pass.
- 65 unit tests pass, including source-record publication validation, unit conversion, annual growth intervals, saved-work counts, mixed CSV exports and pilot personal-research backup compatibility.
- 21 browser tests pass, covering the original research workflows and the new source profiles, precision, focus restoration, persisted filtering, CSV downloads, notes, stage/action persistence, fresh-browser restoration, print visibility, no-JavaScript visibility, reduced motion and 390px reflow.
- The seven document fingerprints and all 30 mapped observations pass the source-location regression.
- Desktop and mobile captures were inspected. Review caught and corrected source precision loss, filtered-away map dimming, disappearing sector options, undersized mobile chart labels, and source-dialog focus restoration. An empty error banner was also removed during visual review.

Release captures are in `docs/screenshots/analyst-release`. A printable pilot memo is rendered separately during release inspection. Production smoke checks and the final deployment identity are recorded in the handover.

## Design-law recheck

The supplied design law was reread before implementation and checked again before release. The existing detailed entry-by-entry matrix in `docs/design-audit.md` remains the baseline; this extension was assessed against each entry for changes and applicability.

| Law area                                          | Extension check                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonts, house voice and type                       | Existing self-hosted Sentient and quiet system body remain. No Google font or additional display family. SHA-256 alone uses mono as actual data. Financial labels replace raw keys; source precision is retained.                                                                                                                              |
| Palette, surfaces, seams and contrast             | Forest, tonal sage and existing ink remain. No purple, candy wash, blue charcoal, vivid accent system, image seams or glow. Small chart text has a minimum plotted size and contained scrolling.                                                                                                                                               |
| Template layouts and decorative copy              | No marketing hero, eyebrow badge, pricing, testimonials, CTA slab, fake product window, repeated label-over-heading section kit, ornamental quotation marks or oversized footer wordmark added. Directory rows and shared financial tables serve actual research. The acquisition question is the heading itself.                              |
| Icons, marks and silhouettes                      | Existing useful bare bespoke glyphs remain. No icon package, fake logo, customer claim, gradient tile, avatar, theme toggle or decorative icon wall. No ornamental notch or cut introduced.                                                                                                                                                    |
| Borders, shadow, glass and geometry               | No glow, glass, halo, offset shadow box, accent rail or ornamental hairline added. Plot guides represent real axes. Tonal surfaces define working areas.                                                                                                                                                                                       |
| Motion and visible content                        | No opacity-zero or translated-away entrance state. Existing map transitions respond to real filters and focus; reduced motion remains supported. Historical tables render before JavaScript. No hover lift, scale boop or underline animation.                                                                                                 |
| Alignment, centering, breathing room and clipping | Comparison metrics share table rows; missing values retain their cells. Desktop and mobile gutters, action alignment and dialog close controls inspected. Wide tables and plots scroll within focusable containers. SVG labels sit inside their viewBox.                                                                                       |
| Interaction and accessibility                     | Every added action has an implemented behavior and browser regression. Source dialogs restore their opener; modal focus is handled by Radix. Native selectors, explicit labels, table headers, visible focus and live feedback remain. Print excludes the surrounding application. Screenshots are not a claim of complete WCAG certification. |
| Specificity, signature and cohesion               | The populated financial workbench and opportunity map remain the signature. Real company names, fiscal periods, source pages and honest review boundaries provide specificity. No decorative artifacts were added to simulate investment credibility.                                                                                          |

The existing plan's independent-review requirement remains a real publication gate. This document does not count source-location checks or software tests as a completed investment review.
