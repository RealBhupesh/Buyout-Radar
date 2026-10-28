# Research workflow tools

All ten additions work with the existing demonstration universe and published-company repository. Financial calculations still use the existing engine. Amounts are INR crore and sample companies remain explicitly fictional.

## Find, compare and export

- Select two to four companies using the comparison checkboxes in Radar or Saved Research, then choose **Compare companies**. Selections survive filter changes during the visit. The comparison uses each company's base assumptions and identifies its latest annual period. Duplicate selections are removed; unavailable companies and selections beyond four produce a notice. Fewer than two available companies produces instructions to select again.
- **Saved screens** saves all current Buy Box criteria, including search, sector, sorting and the qualification filter. Load replaces the current criteria. Rename and delete manage individual presets.
- **Export CSV** includes all rows matching the current filters and ordering, including rows beyond pagination. On Saved Research, stage and next-action filters also apply. Values include units, data kind and research status. String values that could be interpreted as spreadsheet formulas are escaped.

## Underwrite and track diligence

- **Scenarios** in a company workspace saves a named copy of current assumptions. Load updates the live model. Rename and delete manage individual scenarios. Select up to three saved scenarios to compare with the base case, including all assumptions, sponsor equity, returns, funding gap and minimum interest coverage. Changed assumptions use heavier type.
- Scenarios store assumptions, not historical financial snapshots. Reopening recalculates against the currently published financials. Incomplete evidence, invalid models and funding shortfalls withhold returns in comparison and memo output.
- **Sources & notes** includes the editable diligence checklist and next-action form. Add your own tasks or the optional five starter checks; repeated starter insertion does not duplicate existing checks. Tasks can be edited, completed and deleted.
- Research stages are Inbox, Reviewing, Diligence, Passed and Archived. New saved companies default to Inbox. Change the stage in the company workspace or directly in Saved Research. Unsaving preserves notes, scenarios, stage, checklist and next action.
- Save a company to see its stage and next action in Saved Research. Dates use your local calendar. Overdue means before today; upcoming includes today and all later dates. Undated actions appear only in the unfiltered view. Completing a next action clears its text and due date. There are no background reminders.

## Print and back up private research

**Print memo** previews current model facts and assumptions alongside private notes, stage, checklist progress and next action. Choose **Print / Save as PDF** and use the browser's print destination. The navigation and underlying workspace are excluded; the print layout uses page margins and avoids splitting table rows. This uses browser printing rather than a server-generated PDF service.

**Backup & restore** is in Saved Research. Backups contain saved companies, the active Buy Box, named screens, scenarios, notes and workflow records, including records for companies you have unsaved. Backups include private notes.

Choose a JSON file to validate and preview it before restoring. Only supported version 1 records are accepted; the import/export limit is 5 MB. Saved company lists combine. Screens and scenarios merge by their record ID, workflow records by company ID, and notes by company-specific storage key. Conflicts keep local values by default; explicitly choose **Replace conflicts with imported records** to overwrite them. Records outside the import are preserved. If local research changes after preview, a refreshed preview requires another review before restore.

Invalid files cause no changes. A write failure attempts to roll back only writes already completed and reports whether recovery succeeded. When normal browser writes fail, the shared in-memory store keeps changes available during the visit and reports that they are session-only. All mounted views and other tabs in the same browser profile receive storage updates. There is no account-based synchronization or database migration.

## Verification

The workflow suite covers CRUD, persistence, company and scenario comparison limits, incomplete and unfunded return gates, full-result CSV downloads, printed memo content, import conflicts, fresh-browser backup round trips, invalid imports, storage failures, cross-tab synchronization, mobile overflow and reduced motion. Unit tests additionally exercise schema validation, CSV formula protection and partial-restore rollback. Existing model, source inspection, scenario-link and Excel workflows remain in the browser regression suite.
