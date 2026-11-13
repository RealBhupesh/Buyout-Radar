# Two-minute client demo

Purpose: show a prospective client a concrete research workflow for a paid-work trial, with the evidence and review boundaries visible. Stop at 2:00.

## Before the call

From the repository root, use Node 22+ (24 recommended) and npm 11+:

```sh
npm ci
npm run build
DATA_MODE=demo npm run start
```

Open `http://localhost:3000/pilot`. No credentials are required in demo mode. Use this local build for the demo so the five-company checkout and displayed pages agree; `/` is the separately labeled fictional Radar universe.

In a second terminal, run the evidence check before starting the clock:

```sh
npm run verify:pilot -- --download
```

Keep its actual output visible. It downloads the pinned company-hosted PDFs, checks SHA-256 fingerprints and locates mapped revenue/PAT numeric tokens on their mapped PDF pages. A complete successful run reports **5 companies, 13 official documents and 50 reported observations**. This is source-location proof, not proof of accounting interpretation or independent financial review. Downloads go to ignored `pipeline/output/pilot`; later, `npm run verify:pilot` checks those files offline. If downloads or checks fail, show the failure and do not describe the run as passed.

Pre-open the profile and underwriting URLs below in separate tabs. Leave **Offer premium** at **20%** and **Operating case** at **Base**. Have the terminal ready; do not spend the two minutes waiting for downloads.

## 0:00–2:00 script

| Time      | URL path to open                                 | What to click or show                                                                                                                                                                                           | One sentence to say                                                                                                                                                        |
| --------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:15 | `/pilot`                                         | Show the evidence summary and company directory: Shanthi Gears, RACL Geartech, Mayur Uniquoters, Igarashi Motors India and Sirca Paints India.                                                                  | “This filing pilot covers five real companies, with fifty reported revenue and profit observations across thirteen official PDFs, and independent review remains pending.” |
| 0:15–0:35 | `/pilot/pilot-shanthi-gears#pilot-financials`    | In **Reported financials**, click an FY2026 revenue number to open **Filing evidence**; point to original amount/units, PDF / printed page and SHA-256; click **Open original filing**, then return to the app. | “Each reported fact is pinned to a company PDF page, with its original units and file fingerprint available for inspection.”                                               |
| 0:35–0:50 | `/pilot`                                         | Scroll to **Reported comparison**; point to **Published IRR / MOIC: Unavailable** and **Independent review: Pending**; click **Export sourced facts**.                                                          | “The pilot comparison and fact export stay with reported history; published returns remain gated pending independent review.”                                              |
| 0:50–1:05 | `/pilot/pilot-shanthi-gears/underwriting`        | Show **Filing-backed scenario · Independent review pending**, the **Base** selection and **20%** offer premium; point to the return outputs.                                                                    | “Shanthi has a separate retrospective acquisition scenario: at this illustrative premium, Base shows minus 8.6 percent IRR and 0.64 times MOIC.”                           |
| 1:05–1:20 | `/pilot/pilot-shanthi-gears/underwriting`        | In **Operating case**, select **Recovery**; point to **Five-year sponsor IRR** and **Sponsor MOIC**.                                                                                                            | “Recovery changes the operating assumptions and shows 5.2 percent IRR and 1.29 times MOIC, as scenario outputs requiring review.”                                          |
| 1:20–1:35 | `/pilot/pilot-shanthi-gears/underwriting`        | Select **Downside**; point to unavailable IRR/MOIC and **Funding shortfall**.                                                                                                                                   | “Downside exposes an 83.08 crore funding shortfall and withholds returns, making the model’s funding failure explicit.”                                                    |
| 1:35–1:50 | `/pilot` (keep open while switching to terminal) | Show the completed `npm run verify:pilot -- --download` output, including fingerprint/page checks and its final review disclaimer; if unsuccessful, show the failure instead.                                   | “This command makes the document fingerprints and mapped page amounts reproducible; it does not establish independent financial review.”                                   |
| 1:50–2:00 | `/pilot/pilot-shanthi-gears/underwriting`        | Return to **Base** and click **Export Excel** to download the selected model.                                                                                                                                   | “For a paid trial, I’d scope one research workflow with you and hand over the implementation, reproducible checks and clear review boundaries.”                            |

## What not to claim

- **Not financial advice** or an acquisition recommendation; financing, deal terms and seller willingness are assumptions or diligence questions.
- **Not independent financial review.** Source checks and software checks do not provide model sign-off; independent review is pending.
- **Only Shanthi has LBO outputs among the five real pilot companies.** Its separate underwriting page shows hypothetical scenario returns; the pilot profiles, reported comparison, fact CSV and pilot memos keep published returns unavailable. Radar’s complete models use fictional companies.
- **The hurdle solver uses a bounded grid**, not a guaranteed global search: `solveHurdle` samples 100 intervals within −50% to +50% growth or 0× to 30× exit multiple, then bisects a funded sign-change bracket. It can miss a crossing between grid points and return unavailable. This growth/exit solver is distinct from Shanthi’s hurdle-price calculation.
- Do not claim current prices, executable financing, extraction accuracy or resolved accounting discrepancies. Shanthi is a retrospective FY2026 scenario; Sirca’s FY2025 revenue comparative discrepancy remains unresolved.

## Grounding and rehearsal

The beat paths and labels come from [pilot directory](../apps/web/app/pilot/page.tsx), [profile route](../apps/web/app/pilot/[id]/page.tsx), [profile controls and evidence dialog](../apps/web/components/pilot-workspace.tsx), [underwriting route](../apps/web/app/pilot/[id]/underwriting/page.tsx) and [underwriting controls](../apps/web/components/shanthi-underwriting.tsx). Scenario values come from [the scenario functions](../apps/web/lib/shanthi-underwriting.ts), rounded as displayed. The proof command is implemented in [the pilot verifier](../scripts/verify-pilot-sources.ts); bounded search is in [the engine](../packages/engine/src/sensitivity.ts).

Read alongside the [README](../README.md), [pilot release boundary](analyst-pilot-release.md) and [Shanthi assumptions and outputs](shanthi-underwriting.md).

Preparation check: the scenario functions reproduce the three outputs above. On the patched b0dbb2f tree the pilot browser tests pass and `verify:pilot -- --download` matched all 13 PDFs (logs in the review packet). Two unrelated e2e tests (opportunity map, research dials row count) also fail on unpatched b0dbb2f. Rehearse the clicks once on the presenting machine before the call.
