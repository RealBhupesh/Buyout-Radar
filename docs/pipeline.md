# Filing and Groq operations

## Before importing

Confirm permission for each source, its terms and the intended publication. Prefer exchange filings or company investor-relations documents. This repository does not grant data rights. `termsReviewed: true` is an explicit operator attestation; it is not automated legal review. No automated scraping of protected exchange endpoints is implemented.

Use a manifest containing `termsReviewed`, `company` (the Company contract), `filings` (URL/year/contextId/page/field-to-XBRL-tag mappings) and `accountingChecks` (actual, expected, tolerance). Five full financial years and every field source must be present. Pass the opening prior-year balance sheet if adding a fifth year-on-year cash conversion observation.

Each filing selection identifies one undimensioned context and explicitly maps its tags. Annual flows require April 1 to March 31; balances can use March 31 instant contexts. Split flow and balance facts into separate selections. No generic tag guessing or silent quarterly-to-annual aggregation occurs. INR facts divide by 10,000,000; shares remain absolute units. PDFs are for note extraction, not structured number invention.

`npm run pipeline -- ingest manifest.json` fetches only approved HTTPS exchange hosts, blocks redirects and caps files at 25 MB. It writes a dry-run company bundle to ignored `pipeline/output`. Inspect the result before `--write --publish`. Verified company imports must include field-level original URLs and pages. Balance-sheet, cash-rollforward and segment checks must be supplied where original statements support them; missing inputs are not invented.

## Notes extraction

Set `GROQ_API_KEY` only in the terminal environment or an ignored local environment file. The pipeline does not automatically load a root .env; use `node --env-file=.env --import tsx pipeline/cli.ts ...` on Node 22+ if desired.

`npm run pipeline -- extract report.pdf` preserves PDF pages and selects exceptional, related-party and contingent notes with adjacent context. More than 18 selected pages require smaller operator-reviewed batches. OCR is outside this version; image-only PDFs require an independently verified text layer.

20B and 120B extract concurrently. Cache identity includes source text, prompt version, endpoints and model IDs. Changing a prompt or model invalidates the cache. The larger model judges disputes only against relevant source pages. Provider errors never accept unverifiable results. An unresolved item remains `review`; no database earnings row is changed by extraction alone.

Inspect `pipeline/output/extractions.json`. For accepted one-off expense add-backs use a positive crore amount; for nonrecurring income use a negative crore amount. Related-party and contingent items are disclosure-only. A qualified reviewer must confirm meaning, year, sign and recurring nature. The verifier only proves literal textual evidence. Merge reviewed facts into the company manifest, then ingest transactionally. Persist unresolved evidence into `review_queue` with service credentials if using the review CLI.

## Evaluation

`npm run eval` runs six synthetic verifier fixtures and updates `latest.json`. It is deliberately not reported as Groq extraction accuracy. Collect an independently labeled 20-company answer key before reporting real precision/recall. `score.ts` supports one-to-one matching and does not allow duplicate predictions to inflate true positives. Publish dataset size, model IDs, prompt version and both precision and recall with the result.

## Failure handling

Never swap in demo data after a live database error. The website shows a recoverable error. Never retry a charged model call indefinitely. The pipeline has bounded request timeouts; inspect and rerun deliberately. A failed database RPC rolls back the entire company bundle. Repeated IDs update existing records rather than multiplying financial years. Cache/output directories are ignored; do not publish raw report text without rights.
