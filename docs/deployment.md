# Deployment and database runbook

Target GitHub repository: RealBhupesh/Buyout-Radar. Production branch: main. Target Vercel team: workbhupesh-7635s-projects. Next.js root directory: apps/web, source files outside root enabled. Root npm lockfile includes workspace dependencies. Build with `npm run build` in the app or `npm run build -w @buyout/web` from the root.

## Environment

- `DATA_MODE=demo` runs offline fixtures. `DATA_MODE=supabase` reads published rows only.
- `SUPABASE_URL=https://rkozqqngurkjlofiihav.supabase.co`
- `SUPABASE_ANON_KEY`: publishable API key, provided privately to the host environment.
- `GROQ_API_KEY`: local pipeline only unless a private worker is introduced. The web app never calls Groq for public visitors.
- `SUPABASE_SERVICE_ROLE_KEY`: local ingestion and review commands only. Not needed by the public deployed site.

Do not commit local env files. The deploy does not need the service role key. Public database roles cannot mutate financials, adjustments, evaluations or review queue rows. Notes in the launch UI use browser storage; database memo ownership policies support a future authenticated sync flow.

## Database

Dedicated Mumbai project: `rkozqqngurkjlofiihav`, Buyout Radar, RealBhupesh's Org. Apply migrations 001, 002, 003 in order. Only use the dedicated project. The seed generator writes explicit fictional company bundles; applying them again updates the same IDs. Never convert demo rows to verified by changing a label.

The `review_queue` deliberately has RLS enabled with no public policy. Supabase may issue an informational notice; the intended behavior is complete public denial and service-only processing. Unused-index informational notices are expected on a new database. They are not a reason to remove foreign-key indexes before there is workload evidence.

## Release checks

Run typecheck, unit tests, fixture evaluation, production build and browser tests before pushing. Confirm `/api/health`, home, company, methodology, model POST and Excel download after deployment. Compare the remote branch SHA to the tested local commit. Keep the 100-commit history; do not squash it when merging or resetting this repository.

## Recovery

A DB outage produces a recoverable error, never an unlabeled fallback. Retry the page after the database recovers. Revert a code regression with a normal Git revert, test, then push. For emergency traffic rollback, use Vercel's prior ready deployment. Data migrations are additive; take a backup before any future destructive schema change.
