# Migrations

Run these in the Supabase SQL Editor. The app is written so a missing migration
never breaks the recipient's open; it hides or downgrades a feature instead.

## Order

Primary chain (each supersedes the previous insert policy, so run in order):

1. `0001_cards.sql` - the `cards` table, RLS, storage upload policy.
2. `0002_secure_cards.sql` - reads move behind `get_card(token)` so the table
   cannot be enumerated with the public anon key; anonymous inserts constrained;
   photo bucket capped.
3. `0003_more_occasions.sql` - insert allowlist widened to all six occasions.
4. `0005_fireflies.sql` - insert allowlist widened to include the Fireflies
   effect.

Independent (run any time):

- `0004_reactions.sql` - the `reactions` table and `get_reactions(token)`.

## What happens before each is applied

- Before `0002`: reads use a direct select. Works, but the table is enumerable.
- Before `0003` / `0005`: inserts with the newer occasions or the Fireflies
  effect are rejected by the policy. Run these before letting senders pick them.
- Before `0004`: the recipient reaction pill stays hidden. Not a bug.

Also create a public Storage bucket named `card-photos` (directory listing off).
