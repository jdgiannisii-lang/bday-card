# Stage 0 ledger - Google Sheet setup

Three CSVs, one per tab. Import them in THIS ORDER (the Dashboard formulas point at a
tab literally named `Ledger`, so that tab must exist and be named exactly that).

1. New Google Sheet. Rename the first tab to `Commit`.
   File > Import > Upload `1-Commit.csv` > Import location: **Replace current sheet** >
   keep **Convert text to numbers, dates, and formulas** checked > Import.
2. Add a tab, rename it `Ledger`. Import `2-Ledger.csv` into it (Replace current sheet).
3. Add a tab, rename it `Dashboard`. Import `3-Dashboard.csv` into it (Replace current sheet).

Then:

- On `Commit`: fill in **Committed by**, **Committed at (UTC)**, set the checkbox to yes.
  Do this BEFORE you ship card #1. The timestamp is the commitment.
- On `Ledger`: delete the `EXAMPLE_delete_me` row. Add one row per card you send.
- On `Dashboard`: everything computes itself except **Distinct verified chains** (B9),
  which you fill by hand after walking `request_card_id` back to a gen-0 card. The
  VERDICT cell reads KEEP RECRUITING / KILL / ITERATE / CONTINUE mechanically.

If the formulas import as plain text (the convert checkbox was off), re-import with it on,
or copy each formula from `3-Dashboard.csv`.

Source of truth for the column meanings and the rule: `../Stage-0-Decision-Ledger.md`.
ZERO em-dashes in any card content or these files (project rule).
