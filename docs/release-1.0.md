# Buyout Radar v1 release record

28 October 2026. Public workspace: https://buyout-radar.vercel.app. Repository: https://github.com/RealBhupesh/Buyout-Radar. Main branch contains 100 nonempty commits; the final commit adds this release record and captures of the tested production app.

## Verified software

- Radar, sector/search filters, editable Buy Box, pagination and browser watchlist.
- Company workbench, live assumptions and presets, all advanced inputs, source inspection, financial history, earnings normalization, debt capacity, stress, bridge, selectable sensitivities and hurdle solvers.
- Promoter lens, fact-based bear-case prompts, private notes, scenario links and formula-driven Excel downloads.
- Pure finance package, eight-sheet workbook, explicit-context XBRL parser, Groq extraction/judge adapters, content cache, human review CLI and synthetic verifier evaluation.
- Dedicated Supabase schema, six applied migrations, public read-only publication gates and private review storage.

## Evidence

| Check                                | Verified result                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| Strict TypeScript                    | Passed                                                                               |
| Format check                         | Passed                                                                               |
| Unit tests                           | 42 passed in 9 files                                                                 |
| Production build                     | Passed on local machine, GitHub CI and Vercel                                        |
| Local browser tests                  | 6 passed                                                                             |
| Live Vercel + Supabase browser tests | 6 passed, including actual Excel and note downloads                                  |
| No-JavaScript content                | Research heading and table visible                                                   |
| Mobile + reduced motion              | No page overflow; controls and methodology readable                                  |
| Evidence verifier                    | 6 of 6 synthetic fixtures passed; real model accuracy unmeasured                     |
| Dependency audit                     | 0 reported vulnerabilities                                                           |
| Database                             | 50 companies, 250 financial years, 3,500 field references, 0 verified real companies |
| Public DB permissions                | No anonymous insert/update/delete, ingestion RPC or review access                    |
| Production errors                    | No error/fatal runtime log records in the checked release window                     |
| Design law                           | Detailed point-by-point review in design-audit.md                                    |

The tested runtime code is commit `ccdcf2d69416f8998ef23916156b41d9d93d641c` (commit 99). Initial production deployment `dpl_FvQxAdPByQSFPNYe3UYbzeHZk4Gb` reached READY in Vercel Mumbai. GitHub verification run `40662641799` passed. The final release record changes documentation and verification tooling only relative to that tested runtime. The final push rebuilds the same application code under the release commit.

## Reproduce

```sh
npm ci
npm run format:check
npm run typecheck
npm test
npm run eval
npm run build
npm run test:e2e
npm audit
npm run verify:release -- --remote
```

Run live browser checks with `BASE_URL=https://buyout-radar.vercel.app npm run test:e2e`. `verify:release` checks that all 100 commits change tracked files, the working tree is clean, and remote main matches local HEAD. It is a release audit, not a permanent CI restriction on future development.

## Live configuration

Vercel project `buyout-radar`, team `workbhupesh-7635s-projects`, Next.js root `apps/web`, Node 24, functions in Mumbai. Supabase project `rkozqqngurkjlofiihav`, Buyout Radar, Mumbai, RealBhupesh's Org. Production reads use the publishable key; no service-role or Groq secret is deployed.

`/api/health` reports `dataMode=supabase` and `aiConfigured=false`. That is intentional: public visitors cannot trigger paid extraction. Configure `GROQ_API_KEY` privately to run the local extraction pipeline, using GPT-OSS 20B and 120B defaults or explicit endpoint overrides.

## Remaining research, stated plainly

This release does not contain verified financials for actual listed companies. A real pilot, licensed source universe, independently hand-built company LBO, 20-company human answer key, measured model precision/recall and a 500-company production data run remain necessary. The included paper LBO is an independently calculable fictional reference. Notes and memos are demonstration research, not real investment conclusions. V2 deal feeds, alerts, PDF one-pagers and SEC expansion remain roadmap.

Watchlists, criteria and notes remain in one browser. Sensitivity sheets in Excel are labeled snapshots, while model, operating and debt cells contain live formulas. The review queue's intentional deny-all public policy produces an informational Supabase advisor notice; it is not an anonymous-access vulnerability. No outreach has been sent.
