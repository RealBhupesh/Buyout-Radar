# Calculation review

## Findings

- **R1 — fixed:** `solveHurdle` previously rejected a reachable growth hurdle when the upper endpoint was unfunded. It now scans 100 intervals for a sign change between consecutive funded points, then bisects that bracket. Invalid points break the bracket; invalid midpoints return `null`. The regression in `tests/review-calculations.test.ts` is now a normal passing test.
- **Excel Invalid guards — addressed in the existing changes:** Recalculated IRR and MOIC display `Invalid` for nonpositive entry or forecast EBITDA, nonpositive sponsor equity, or negative purchase equity. Funding gaps use the engine's `1e-8` tolerance. Calc regressions cover nonpositive forecast EBITDA, an edited entry price below new debt, and a shortfall below that tolerance.
- **Docs fix — addressed in the existing changes:** `docs/design.md` now states `Sponsor equity + new debt = entry EV + fees`. Target cash appears in both purchase equity and funding, is consumed at close, and is not counted twice.

## Checked and found fine

- Core sources-and-uses identities, existing-debt refinancing, and target-cash treatment.
- Opening-debt interest, cash taxes, working-capital changes, mandatory repayment before sweep, retained cash, and funding-shortfall handling.
- Conventional terminal-value IRR, total loss, the limited-liability floor, and value-bridge reconciliation.
- Leverage and interest-coverage debt limits; accepted, current-year earnings adjustments.
- Workbook funding/projection/return formulas and the targeted independent LibreOffice Calc recalculation cases. The focused engine and review suites passed: 16 tests.

## Scope limits

This is a bounded software calculation review, **not an independent financial review**, investment recommendation, or model sign-off. It does not validate source filings, commercial assumptions, financing availability, legal feasibility, or all possible spreadsheet edits. Calc checks do not certify Microsoft Excel behavior.

**PR1 returns, take-private, and headroom code was not reviewed**, including `packages/engine/src/returns.ts`, `packages/engine/src/takeprivate.ts`, and the associated analysis/UI paths. Passing their tests does not imply review coverage.

The hurdle search retains its existing ranges (growth −50% to +50%; exit multiple 0–30). A finite grid can miss narrow feasible intervals or roots without a sampled sign change; it does not establish uniqueness or find every possible root.
