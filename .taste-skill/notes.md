# Buyout Radar finance application redesign

29 October 2026. App screen run, not a marketing-page run.

## Data and job inventory

1. Buyout investors and acquisition analysts screen Indian mid-cap businesses; desktop is the primary research surface and mobile supports follow-up.
2. The model universe contains 50 explicitly fictional companies, two sectors and five annual financial periods, FY2022–2026.
3. Market capitalization, sponsor equity, cash flows and financial history use INR crore. Multiples use ×; growth, returns and ownership use %.
4. Base-case model readiness: 39 funded, nine funding shortfalls, two incomplete evidence records. These sum to 50. The summary and readiness panel use the same research calculations.
5. Nine companies meet the initial Buy Box; the initial median funded model IRR is 18.5%. Both recalculate from the current repository and criteria.
6. The signature is the actual cash-conversion versus modeled-IRR opportunity plot, with an explicit hurdle region and exact company selector.
7. The frequent job is to filter, compare and open a company, then change assumptions and inspect what prevents conviction.
8. The official filing pilot contains three real companies, seven official reports and 30 sourced revenue/PAT facts. Acquisition returns remain unavailable pending full inputs and independent review.
9. Saved companies, notes, scenarios, screens, stages, tasks and next actions remain browser-private and retain their existing storage identities.
10. Backups, CSV, Excel and printable memos are working research handoffs; storage failures and incomplete-data gates must remain clear.

## Direction

Achromatic ledger, seed 1655257208. The draw offered pastel consumer and achromatic ledger; the latter suits prolonged financial research. No redraw. Kept the brand's palette and type assets, mapped to neutral chrome, paper-like green-tinted ground, and a single forest data hue. Sentient is actually self-hosted and used only in the wordmark; the OS text face carries the dense working UI. No external imagery or fabricated customer marks.

Idea: the research itself is the artifact, and evidence readiness sits beside modeled opportunity rather than being buried behind the return.

## Screen questions

- Opportunity radar: which businesses deserve a closer look under my Buy Box?
- Company underwriting: what return do my assumptions imply, and which coverage or evidence gate can break it?
- Financial history: what reported values and adjustments support this model?
- Sources & notes: what needs to be checked and what should I do next?
- Comparison: how do the same measures differ across two to four companies?
- Saved research: which saved case or dated action needs attention?
- Filing pilot: which reported facts have source support and what remains unreviewed?
- Methodology: what does the engine calculate, assume and withhold?

## Geometry

1440 - 208 sidebar - 2 × 32 gutters = 1168 canvas.
Overview: 880 map + 16 gap + 272 readiness = 1168.
Workbench: 872 main + 16 gap + 280 assumptions = 1168.
At 1100 and below, the sidebar folds into a real menu dialog. Tablet gutters are 24px; phone gutters are 16px. Mobile headings are 23px; desktop titles are 26px. Reading text and controls use 13–14px, with tabular numeric values. Tables and long plots scroll only in their own containers.

## ROUND 1

Seen in one second: a finance workspace instead of a marketing heading.
Idea: evidence readiness and cash quality frame the acquisition return.
Live thing: filtered plotted points, model dials and private workflow controls.
Layout words: shell=workspace / summary=ledger / opportunity=plot+readiness / results=table.
Scores: design 7.4 · usability 7.2 · creativity 7.0 · content 8.2 → overall 7.3.
Caps applied: none from page imagery or motion requirements; this is an app run.
Top problems:

1. Tablet/mobile screenshots still inherited 49/40px titles. Fixed selector specificity and mobile title scale.
2. Readiness stretched around an 87px gap. Removed automatic spacer and tightened the content.
3. Map and header pushed the company table out of the first screen. Reduced chart framing and summary spacing.

## ROUND 2

Seen in one second: opportunity, model readiness and a clear path into ranked companies.
Idea and live thing unchanged.
Layout words: shell=workspace / summary=ledger / opportunity=plot+readiness / results=table.
Scores: design 7.8 · usability 7.8 · creativity 7.2 · content 8.2 → overall 7.7.
Top problems:

1. Mobile pilot header spilled 5px beyond the viewport. Let the save action wrap and retain a readable company title.
2. Mobile menu links lost their labels under an old compact-sidebar rule. Explicit visible labels now work through the Radix portal; browser test covers reopen, Escape and route selection.
3. Underwriting labels were mostly 12px; a selected sensitivity cell used an inset shadow. Raised working text to 13px and changed selection to an outline with a separate keyboard focus state.

## ROUND 3

Seen in one second: an acquisition research desk with a real model and explicit evidence boundaries.
Idea: opportunity is useful only beside a visible statement of readiness.
Live thing: map selection and axis expansion, underwriting dials, sensitivity, persisted research and source drill-down.
Layout words: neutral shell / ledger summary / plotted opportunity / aligned results / evidence-led model.
Scores: design 8.0 · usability 8.2 · creativity 7.3 · content 8.4 → overall 8.0 (self-assessment, not an independent jury).
Caps applied: no failed app checks. Long detailed underwriting is deliberately visible rather than collapsed to fit all twelve blocks into one viewport.
Final corrections: chart axes centered in their updated viewBox; projection chart retains 13px labels in a focusable scroll region; pilot research question is body text under a short heading; source precision and return gates unchanged. Removed the table's artificial vertical cap so complete rows remain available as the page scrolls. The pilot breadcrumb now shares one row on mobile.

Limitations: financial tables need sideways scrolling on phones; underwriting remains a long detailed screen. This redesign does not convert fictional model inputs into verified investment data. Pilot transaction underwriting and independent sign-off are still incomplete.
