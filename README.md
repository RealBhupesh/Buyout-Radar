# Buyout Radar

An Indian mid-cap buyout research workspace with a dependency-free TypeScript finance engine, Groq evidence pipeline, Supabase provenance store and formula-driven Excel export.

**Release data is fictional.** The 50-company sample universe demonstrates the full workflow. No company, filing, share price or real-world extraction accuracy is represented as verified. See [Methodology](docs/methodology.md).

## Run

Node 22 or newer (Node 24 recommended), npm 11+.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No credentials required in demo mode.

```sh
npm run typecheck
npm test
npm run eval
npm run build
npm run test:e2e
```

Playwright needs `npx playwright install chromium` once. Tests use a local production server on port 3100.

## Workspace

- `apps/web`: Next.js research UI, public read-only model/export APIs, source inspection.
- `packages/engine`: Pure finance functions, no web, database or AI dependencies.
- `packages/excel`: Eight-sheet Excel model with editable assumptions and provenance.
- `pipeline/ingest`: Explicit filing manifests, XBRL parser, validation, atomic writer.
- `pipeline/ai`: Groq dual extraction, quote checks, judging, cache and review routing.
- `pipeline/eval`: Synthetic verifier fixtures and a reusable precision/recall scorer.
- `db/migrations`: Ordered PostgreSQL schema, RLS and service-only ingestion RPC.

## Features

Radar ranking, search, sector filters, saved research and editable Buy Box. Company histories, quality of earnings, working capital, debt capacity, stress case, live five-year LBO, return attribution, two sensitivity grids, hurdle solver, promoter lens, rule-based bear case, private notes, scenario links and Excel export.

## Connect Supabase

Apply `db/migrations/*.sql` in order to a dedicated project. Configure server environment variables `DATA_MODE=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Public reads use a publishable key. Administrative ingestion requires `SUPABASE_SERVICE_ROLE_KEY` only in the local pipeline environment. Never expose that key to the web client.

Generate clearly marked sample seed SQL with `npx tsx pipeline/seed.ts`. Each file calls an atomic RPC. Seed only the dedicated project. Existing company IDs make repeated seeding idempotent.

## Use Groq

Set `GROQ_API_KEY` in your local environment. Defaults are `openai/gpt-oss-20b` and `openai/gpt-oss-120b` at `https://api.groq.com/openai/v1`. Check Groq model availability before large runs. `EXTRACTOR_A_*` and `EXTRACTOR_B_*` override the endpoints and models.

```sh
npm run pipeline -- extract /absolute/path/to/report.pdf
npm run pipeline -- validate /absolute/path/to/manifest.json
npm run pipeline -- ingest /absolute/path/to/manifest.json
npm run pipeline -- ingest /absolute/path/to/manifest.json --write --publish
```

Extraction is never triggered by an anonymous website visitor. The app does not have or require a public AI endpoint. See [Pipeline runbook](docs/pipeline.md), [deployment](docs/deployment.md), and [scope status](docs/scope-status.md).

## Product boundaries

No real 500-company database, manually verified LBO, 20-company human answer key, customer outreach or market-data license is claimed. V2 comparable deals, alerts, SEC filings and PDF one-pagers remain roadmap. Financial assumptions are research scenarios. Notes are local to one browser; no multi-user authentication is implied.

## License

Code: MIT. Sentient font files retain their ITF Free Font License. See `apps/web/public/fonts/README.md`.
