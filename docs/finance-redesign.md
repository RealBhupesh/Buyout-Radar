# Finance workspace redesign

29 October 2026. Audience: buyout investors and acquisition analysts.

## Result

The whole research application now uses the Achromatic ledger direction, seed **1655257208**: an open neutral sidebar, compact noun headings, white financial reading surfaces, tabular numbers and forest-colored financial marks. Existing self-hosted Sentient remains in the wordmark; system text supports prolonged analytical work. The live opportunity plot, explicit model readiness and financial workbench are the signature, rather than a promotional hero.

Radar, company underwriting, financial history, sources, private notes, diligence, comparison, saved research, filing pilot, methodology, dialogs and print inherit the same system. The sidebar folds below 1100px into a labeled Radix menu. Phone gutters are 16px; tablet gutters are 24px; desktop gutters are 32px. Financial tables and long plots scroll within their containers. Complete table rows stay in the page flow rather than being cut off by an artificial vertical cap.

The initial model universe remains 50 fictional companies: 39 funded models, nine funding gaps, two evidence failures. The readiness counts and summary use the existing engine results. All three real pilot companies keep the original reported facts and source precision. Their acquisition returns remain unavailable pending complete transaction inputs and independent review.

## Measured before and after

| Measurement                  | Before                   | Released design                           |
| ---------------------------- | ------------------------ | ----------------------------------------- |
| Desktop title                | 55px                     | 26px                                      |
| Tablet title                 | 49px                     | 26px                                      |
| Phone title                  | 40px                     | 23px                                      |
| Smallest common working text | 9–10px existed           | 13px                                      |
| Desktop navigation           | Saturated forest spine   | Neutral 208px workspace                   |
| Mobile navigation            | Compact icon links       | Labeled modal menu with focus restoration |
| Company figures              | Partial tabular coverage | Tabular figures throughout the workbench  |
| Radar inspector              | 1 failure, 2 warnings    | 0 failures, 0 warnings                    |

Read the [direction and critique notes](../.taste-skill/notes.md) for the data inventory, screen questions, grid arithmetic and three critique rounds. The last self-assessment was design 8.0, usability 8.2, creativity 7.3 and content 8.4, weighted 8.0; this is a documented self-review, not an independent score.

## Verification

- TypeScript, 65 unit tests and optimized production build pass.
- All 21 Playwright workflows pass against the production build, including the ten workflow features, reload persistence, cross-tab updates, backup conflict choices, CSV and Excel downloads, withholding invalid returns, print, source-dialog focus, reduced motion and server-rendered content without JavaScript.
- The added mobile navigation regression opens the menu, closes with Escape, verifies returned focus, reopens it, follows Filing pilot, and verifies the dialog closes after navigation.
- Root and seven application screens were captured at 1440, 768 and 390px. All page scroll widths stay within the viewport. Long charts/tables intentionally scroll within their own region.
- Company, pilot and methodology inspectors report zero failures. The pilot has no warnings. Underwriting retains one `below-fold` warning: its twelve detailed research blocks intentionally stay visible through scrolling, with the decision brief, modeled returns, debt chart and live assumptions first. Collapsing financial evidence solely to fit one viewport would harm the research task. The methodology guide has the same intentional `below-fold` warning: formulas and limitations remain fully readable as a document rather than being reduced to dashboard summaries.
- Source lint flags the financial term “leverage”, the real SHA-256 code display, explicit `box-shadow: none` / `backdrop-filter: none` resets, and the shadow on an actual modal overlay. These are intentional; no resting glow, glass, generic icon tiles or shadow was introduced.
- Final law review: every row in [the design-law matrix](design-audit.md) was rechecked. Images and motion quotas from marketing-page rules do not apply to this working finance app. No external pictures, logos, footage or new font assets were added.

Both browser memos were printed to A4 PDF and every page inspected. Private notes, assumptions, facts and publication gates remain readable without application chrome.

## Evidence

- [Radar desktop](screenshots/finance-redesign/radar-desktop.jpg)
- [Radar phone](screenshots/finance-redesign/radar-mobile.jpg)
- [Underwriting desktop](screenshots/finance-redesign/company-desktop.jpg)
- [Pilot desktop](screenshots/finance-redesign/pilot-desktop.jpg)
- [Mobile menu](screenshots/finance-redesign/mobile-navigation.png)
- [Model memo](screenshots/finance-redesign/model-memo.pdf)
- [Pilot memo](screenshots/finance-redesign/pilot-memo.pdf)

Phone financial tables still require sideways scrolling. The detailed underwriting screen remains long. This release improves the research interface; it does not turn the fictional universe into live investment coverage or establish independent model sign-off for the real pilot.
