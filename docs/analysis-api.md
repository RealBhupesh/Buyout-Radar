# Analysis API

Read-only, uncached, no credentials. Use it to build screens and company views on top of the engine without re-deriving anything in the browser. The same data is available in-process from `diligencePack` in `apps/web/lib/diligence.ts`.

## `GET /api/companies/{id}/analysis`

| Query               | Default         | Meaning                                                           |
| ------------------- | --------------- | ----------------------------------------------------------------- |
| `scenario`          | company default | URL-encoded JSON of assumption overrides, as for the Excel export |
| `premium`           | `0.2`           | Premium to recorded market value, decimal, -0.5 to 2              |
| `promoterStakeSold` | `1`             | Fraction of the promoter holding bought, 0 to 1                   |
| `acceptance`        | `1`             | Fraction of the open offer tendered, 0 to 1                       |

Returns 404 for an unknown company, 422 while data-quality issues are open, 400 for an invalid scenario or deal term and 503 if the research database is unavailable.

| Field         | Contents                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `assumptions` | The resolved scenario                                                                           |
| `model`       | Full engine result. Each projection year now includes `netLeverage` and `dscr`                  |
| `exitYears`   | IRR, MOIC, exit equity and net leverage for a sale at the end of each year                      |
| `hurdlePrice` | Entry multiple, EV and equity value that earn the hurdle; `headroom` against the scenario price |
| `headroom`    | Largest EBITDA shortfall before a funding gap, a coverage breach and loss of capital            |
| `stress`      | The 20% EBITDA stress                                                                           |
| `cases`       | Downside, Base and Upside around the scenario                                                   |
| `market`      | `impliedPremium` of the scenario, and its returns repriced at market plus `premium`             |
| `structure`   | Open offer size, stake and cost by tender outcome, delisting gap and `flags`                    |
| `quality`     | Historical operating metrics                                                                    |
| `fit`         | Screening score, coverage and the seven weighted components                                     |

Amounts are INR crore, rates and premiums are decimals and holdings are percentages of total shares. `structure` is null when the company has no usable market value. `structure.flags[].code` is stable for display logic: `open-offer`, `no-control`, `public-float-breach`, `listed-minorities`, `squeeze-out`, `pledge-release`, `below-market`.

## `GET /api/companies`

Each row adds `fitScore` (null while data is incomplete) and `impliedPremium`.

Definitions and limits are in the [methodology](methodology.md).

The delisting gap assumes the buyer acts alone. Retained promoters count toward non-public ownership, and the model does not count them toward the buyer's 90% threshold. `shareOfRemainingPublic` is null when the remaining public float cannot cover the gap. The `control` field measures a simple majority of shares.
