# Independent paper LBO

Fictional training case. Not a real company or reviewed investment. All money is INR crore.

Entry EBITDA 200 at 8× gives EV 1,600. No acquisition debt or fees, so sponsor equity is 1,600. Revenue and EBITDA do not grow. No forward taxes, capex or working-capital changes: cash generation is 200 a year, or 1,000 across five years. Exit EV remains 1,600; retained cash makes exit equity 2,600.

MOIC = 2,600 / 1,600 = 1.625×. IRR = (1.625)^(1/5) - 1 = 10.197229%. The equity gain is 1,000, entirely from retained operating cash. Sources less uses and the value-creation bridge both reconcile to zero.

The workbook contains live formulas and cached results. The reference is independently calculable on paper, and the test suite pins these exact expected values. It is not a replacement for the plan's real-company hand-built LBO.

Regenerate with `npx tsx pipeline/reference.ts`. Dry-run the sample importer with `npm run pipeline -- validate docs/examples/demo-manifest.json`.
