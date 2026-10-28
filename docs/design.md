# Buyout Radar

An underwriting workspace for Indian mid-cap buyout research. The supplied build plan is the product specification; its outreach messages and multi-week milestones are reference material, not permission to contact anyone or claim research has happened.

## Scope

Deliver v1: Radar ranking and Buy Box, five-year company histories, quality of earnings, debt capacity, live LBO assumptions, cash/debt projections, bridge, sensitivity, reverse hurdle solving, source inspection, investment notes and formula-driven Excel. Include v1.5 truth/coverage/promoter/bear-case panels where supported by the same facts. V2 deal databases, alerts and SEC expansion remain roadmap.

## Architecture

Next.js App Router in apps/web, dependency-free finance functions in packages/engine, ExcelJS in packages/excel. Ingest and AI packages accept explicit source manifests. PostgreSQL migrations enforce provenance and deny public mutation. Server data adapter chooses Supabase only when configured; otherwise a deterministic fictional demonstration universe runs the complete workflow.

## Visual direction

An investment desk, not a marketing page. White paper, deep forest ink, tonal sage and tabular numbers. A compact vertical navigation spine and oversized, self-hosted Sentient title establish identity. The signature is a genuine interactive opportunity constellation: cash conversion against model IRR, with hurdle bands and company selection. Dense, readable financial tables support the same language. No invented customer marks, promotional filler or hidden entrance states.

## Correctness

INR crore throughout; rates stored as decimals. Entry EV plus fees is funded by debt, sponsor equity and existing cash; existing debt is refinanced inside EV-to-equity uses. Cash remains on balance sheet only after entry funding. End-of-period mandatory repayments precede sweep; deficits accumulate as a funding gap and invalidate the investment case. Bridge reconciles fees, growth, multiple change and net debt reduction. Invalid data never receives a confident return.

## Delivery limits

Fictional demo data is never presented as exchange data. Real universe coverage, provider accuracy and hand-labeled answer keys stay explicitly unmeasured until independently sourced and reviewed. No model training or external outreach. A deployable app, code, migrations, runbooks and tests are delivered. Production ingestion requires data rights and provider credentials.
